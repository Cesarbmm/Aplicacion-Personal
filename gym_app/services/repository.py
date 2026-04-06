from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Any

from gym_app.data.database import get_connection, initialize_database
from gym_app.data.exercise_seed import EXERCISE_SEED
from gym_app.data.template_seed import TEMPLATE_SEED
from gym_app.domain.models import (
    BodyCheckIn,
    CoachCheckIn,
    CoachMessage,
    ExerciseDefinition,
    FitnessProfile,
    Recommendation,
    SessionExercise,
    SessionTemplate,
    TemplateExercise,
    TrainingBlock,
    TrainingFocus,
    TrainingGoal,
    WorkoutSession,
    WorkoutSet,
)
from gym_app.paths import EXPORT_DIR
from gym_app.services.training_guide import FOCUS_CATALOG, focus_slug
from gym_app.text import sanitize_list, sanitize_text


class WorkoutRepository:
    DEFAULT_FOCUSES = ["Push", "Pull", "Pierna", "Upper", "Lower", "Full Body", "Cardio", "Pliometría"]
    DEFAULT_EQUIPMENT = [
        "Barra",
        "Mancuernas",
        "Polea/Cables",
        "Máquina",
        "Peso corporal",
        "Banda",
        "TRX",
        "Caja",
        "Balón medicinal",
        "Cinta",
        "Bicicleta",
        "Ergómetro",
    ]

    def initialize(self) -> None:
        initialize_database()
        self.seed_training_focuses()
        self.seed_exercises()
        self.seed_templates()
        self._seed_default_settings()

    DEFAULT_FOCUSES = [item["name"] for item in FOCUS_CATALOG]
    DEFAULT_EQUIPMENT = [
        "Barra",
        "Mancuernas",
        "Polea/Cables",
        "Maquina",
        "Peso corporal",
        "Banda",
        "TRX",
        "Caja",
        "Balon medicinal",
        "Cinta",
        "Bicicleta",
        "Ergometro",
    ]

    def _seed_default_settings(self) -> None:
        defaults = {
            "coach_api_enabled": "0",
            "coach_api_model": "gpt-5.2",
            "display_name": "",
            "primary_goal": "",
            "experience_level": "intermedio",
            "preferred_focus": "",
            "preferred_unit": "metric",
            "coaching_style": "directo",
            "weekly_availability": "3",
            "equipment_access": "[]",
            "limitations": "",
            "lagging_muscles": "[]",
            "intensity_preference": "moderada",
            "sex": "",
            "age": "",
            "height_cm": "",
            "active_focus": "",
            "selected_focuses": "[]",
            "onboarding_completed_at": "",
            "onboarding_version": "",
            "sidebar_collapsed": "0",
        }
        for key, value in defaults.items():
            if self.get_setting(key) is None:
                self.set_setting(key, value)

    def seed_training_focuses(self) -> None:
        with get_connection() as connection:
            existing = connection.execute("SELECT COUNT(*) FROM training_focuses").fetchone()[0]
            if existing:
                return
            for item in FOCUS_CATALOG:
                connection.execute(
                    """
                    INSERT INTO training_focuses (name, slug, description, origin, sort_order, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    (
                        sanitize_text(item["name"]),
                        focus_slug(str(item["slug"])),
                        sanitize_text(item["description"]),
                        sanitize_text(item.get("origin", "preset")),
                        int(item.get("sort_order", 0)),
                    ),
                )

    def seed_exercises(self) -> None:
        with get_connection() as connection:
            existing = connection.execute("SELECT COUNT(*) FROM exercises").fetchone()[0]
            if existing:
                return
            for exercise in EXERCISE_SEED:
                connection.execute(
                    """
                    INSERT INTO exercises (
                        name, canonical_name, category, modality, movement_pattern, primary_muscles,
                        secondary_muscles, equipment, difficulty, load_type, default_unit, cues,
                        technical_notes, variant_group, alternatives, is_compound, is_custom, status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sanitize_text(exercise["name"]),
                        sanitize_text(exercise["canonical_name"]),
                        sanitize_text(exercise["category"]),
                        sanitize_text(exercise.get("modality", "fuerza")),
                        sanitize_text(exercise.get("movement_pattern", "")),
                        json.dumps(sanitize_list(exercise["primary_muscles"]), ensure_ascii=False),
                        json.dumps(sanitize_list(exercise["secondary_muscles"]), ensure_ascii=False),
                        sanitize_text(exercise["equipment"]),
                        sanitize_text(exercise["difficulty"]),
                        sanitize_text(exercise.get("load_type", "peso")),
                        sanitize_text(exercise.get("default_unit", "kg")),
                        sanitize_text(exercise.get("cues", "")),
                        sanitize_text(exercise.get("technical_notes", "")),
                        sanitize_text(exercise.get("variant_group", "")),
                        json.dumps(sanitize_list(exercise.get("alternatives", [])), ensure_ascii=False),
                        int(exercise.get("is_compound", False)),
                        int(exercise.get("is_custom", False)),
                        sanitize_text(exercise.get("status", "activo")),
                    ),
                )

    def seed_templates(self) -> None:
        with get_connection() as connection:
            existing = connection.execute("SELECT COUNT(*) FROM session_templates").fetchone()[0]
            if existing:
                return
            for template in TEMPLATE_SEED:
                cursor = connection.execute(
                    """
                    INSERT INTO session_templates (focus, name, description, goal, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    (
                        sanitize_text(template["focus"]),
                        sanitize_text(template["name"]),
                        sanitize_text(template["description"]),
                        sanitize_text(template["goal"]),
                    ),
                )
                template_id = int(cursor.lastrowid)
                self.save_training_focus(
                    name=sanitize_text(template["focus"]),
                    description=sanitize_text(template["description"]),
                    origin="preset",
                    connection=connection,
                )
                for index, entry in enumerate(template["exercises"], start=1):
                    exercise_id = self.get_or_create_exercise(sanitize_text(entry["exercise_name"]), connection)
                    connection.execute(
                        """
                        INSERT INTO template_exercises (
                            template_id, exercise_id, exercise_name, exercise_order, set_type,
                            default_sets, default_reps, default_weight_kg, default_rest_seconds,
                            target_rir, progression_rule, notes
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            template_id,
                            exercise_id,
                            sanitize_text(entry["exercise_name"]),
                            index,
                            sanitize_text(entry.get("set_type", "trabajo")),
                            entry.get("default_sets", 3),
                            sanitize_text(entry.get("default_reps", "8-12")),
                            entry.get("default_weight_kg"),
                            entry.get("default_rest_seconds"),
                            entry.get("target_rir"),
                            sanitize_text(entry.get("progression_rule", "")),
                            sanitize_text(entry.get("notes", "")),
                        ),
                    )

    def list_exercises(
        self,
        search: str = "",
        category: str = "",
        equipment: str = "",
        modality: str = "",
        origin: str = "",
    ) -> list[ExerciseDefinition]:
        sql = """
            SELECT * FROM exercises
            WHERE (? = '' OR name LIKE ? OR category LIKE ? OR equipment LIKE ? OR primary_muscles LIKE ? OR movement_pattern LIKE ?)
              AND (? = '' OR category = ?)
              AND (? = '' OR equipment = ?)
              AND (? = '' OR modality = ?)
              AND (? = '' OR (CASE WHEN is_custom = 1 THEN 'personalizado' ELSE 'base' END) = ?)
            ORDER BY is_custom DESC, category, name
        """
        term = f"%{search.strip()}%"
        with get_connection() as connection:
            rows = connection.execute(
                sql,
                (
                    search.strip(),
                    term,
                    term,
                    term,
                    term,
                    term,
                    category,
                    category,
                    equipment,
                    equipment,
                    modality,
                    modality,
                    origin,
                    origin,
                ),
            ).fetchall()
        return [self._exercise_from_row(row) for row in rows]

    def get_exercise(self, exercise_id: int) -> ExerciseDefinition | None:
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM exercises WHERE id = ?", (exercise_id,)).fetchone()
        return self._exercise_from_row(row) if row else None

    def list_exercise_categories(self) -> list[str]:
        return self._list_distinct("exercises", "category")

    def list_exercise_equipments(self) -> list[str]:
        return self._list_distinct("exercises", "equipment")

    def list_exercise_modalities(self) -> list[str]:
        return self._list_distinct("exercises", "modality")

    def save_exercise(self, exercise: ExerciseDefinition) -> int:
        canonical_name = self._canonicalize(exercise.canonical_name or exercise.name)
        with get_connection() as connection:
            duplicate = connection.execute(
                "SELECT id FROM exercises WHERE canonical_name = ? AND id != COALESCE(?, -1)",
                (canonical_name, exercise.id),
            ).fetchone()
            if duplicate:
                raise ValueError("Ya existe un ejercicio con el mismo nombre canónico.")

            payload = (
                exercise.name.strip(),
                canonical_name,
                exercise.category.strip(),
                exercise.modality.strip() or "fuerza",
                exercise.movement_pattern.strip(),
                json.dumps(self._clean_list(exercise.primary_muscles), ensure_ascii=False),
                json.dumps(self._clean_list(exercise.secondary_muscles), ensure_ascii=False),
                exercise.equipment.strip(),
                exercise.difficulty.strip(),
                exercise.load_type.strip() or "peso",
                exercise.default_unit.strip() or "kg",
                exercise.cues.strip(),
                exercise.technical_notes.strip(),
                exercise.variant_group.strip(),
                json.dumps(self._clean_list(exercise.alternatives), ensure_ascii=False),
                int(exercise.is_compound),
                int(exercise.is_custom),
                exercise.status.strip() or "activo",
            )
            if exercise.id:
                connection.execute(
                    """
                    UPDATE exercises
                    SET name = ?, canonical_name = ?, category = ?, modality = ?, movement_pattern = ?,
                        primary_muscles = ?, secondary_muscles = ?, equipment = ?, difficulty = ?, load_type = ?,
                        default_unit = ?, cues = ?, technical_notes = ?, variant_group = ?, alternatives = ?,
                        is_compound = ?, is_custom = ?, status = ?
                    WHERE id = ?
                    """,
                    payload + (exercise.id,),
                )
                return int(exercise.id)
            cursor = connection.execute(
                """
                INSERT INTO exercises (
                    name, canonical_name, category, modality, movement_pattern, primary_muscles,
                    secondary_muscles, equipment, difficulty, load_type, default_unit, cues,
                    technical_notes, variant_group, alternatives, is_compound, is_custom, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            return int(cursor.lastrowid)

    def get_or_create_exercise(self, name: str, connection: Any | None = None) -> int | None:
        clean_name = sanitize_text(name).strip()
        if not clean_name:
            return None
        owns_connection = connection is None
        connection = connection or get_connection()
        try:
            row = connection.execute("SELECT id FROM exercises WHERE name = ?", (clean_name,)).fetchone()
            if row:
                return int(row["id"])
            cursor = connection.execute(
                """
                INSERT INTO exercises (
                    name, canonical_name, category, modality, movement_pattern, primary_muscles,
                    secondary_muscles, equipment, difficulty, load_type, default_unit, cues,
                    technical_notes, variant_group, alternatives, is_compound, is_custom, status
                )
                VALUES (?, ?, 'Personalizado', 'fuerza', '', '[]', '[]', 'Variable', 'Personal',
                        'peso', 'kg', '', '', '', '[]', 0, 1, 'activo')
                """,
                (clean_name, self._canonicalize(clean_name)),
            )
            return int(cursor.lastrowid)
        finally:
            if owns_connection:
                connection.close()

    def save_session(self, session: WorkoutSession) -> int:
        now = datetime.now().isoformat(timespec="seconds")
        session_exercises = self._normalize_session_exercises(session)
        with get_connection() as connection:
            if session.id:
                connection.execute(
                    """
                    UPDATE workout_sessions
                    SET session_date = ?, title = ?, block_name = ?, notes = ?, planned_focus = ?,
                        completion_status = ?, perceived_energy = ?, duration_minutes = ?, source_template_id = ?,
                        readiness_score = ?, pre_checkin_id = ?, post_checkin_id = ?, unit_system = ?, updated_at = ?,
                        imported_legacy_key = COALESCE(imported_legacy_key, ?)
                    WHERE id = ?
                    """,
                    (
                        session.session_date,
                        session.title,
                        session.block_name,
                        session.notes,
                        session.planned_focus or session.title,
                        session.completion_status,
                        session.perceived_energy,
                        session.duration_minutes,
                        session.source_template_id,
                        session.readiness_score,
                        session.pre_checkin_id,
                        session.post_checkin_id,
                        session.unit_system or "metric",
                        now,
                        session.imported_legacy_key,
                        session.id,
                    ),
                )
                connection.execute("DELETE FROM workout_sets WHERE session_id = ?", (session.id,))
                connection.execute("DELETE FROM session_exercises WHERE session_id = ?", (session.id,))
                session_id = int(session.id)
            else:
                cursor = connection.execute(
                    """
                    INSERT INTO workout_sessions (
                        session_date, title, block_name, notes, planned_focus, completion_status,
                        perceived_energy, duration_minutes, source_template_id, readiness_score,
                        pre_checkin_id, post_checkin_id, unit_system, imported_legacy_key, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session.session_date,
                        session.title,
                        session.block_name,
                        session.notes,
                        session.planned_focus or session.title,
                        session.completion_status,
                        session.perceived_energy,
                        session.duration_minutes,
                        session.source_template_id,
                        session.readiness_score,
                        session.pre_checkin_id,
                        session.post_checkin_id,
                        session.unit_system or "metric",
                        session.imported_legacy_key,
                        now,
                        now,
                    ),
                )
                session_id = int(cursor.lastrowid)

            for exercise_order, exercise in enumerate(session_exercises, start=1):
                exercise_id = exercise.exercise_id or self.get_or_create_exercise(exercise.exercise_name, connection)
                exercise_cursor = connection.execute(
                    """
                    INSERT INTO session_exercises (
                        session_id, exercise_id, exercise_name, exercise_order, goal, notes,
                        target_sets, target_reps, target_weight_kg, target_rest_seconds, target_rir, progression_rule
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session_id,
                        exercise_id,
                        exercise.exercise_name,
                        exercise_order,
                        exercise.goal,
                        exercise.notes,
                        exercise.target_sets,
                        exercise.target_reps,
                        exercise.target_weight_kg,
                        exercise.target_rest_seconds,
                        exercise.target_rir,
                        exercise.progression_rule,
                    ),
                )
                session_exercise_id = int(exercise_cursor.lastrowid)
                for set_index, entry in enumerate(exercise.sets, start=1):
                    set_exercise_id = entry.exercise_id or exercise_id
                    connection.execute(
                        """
                        INSERT INTO workout_sets (
                            session_id, session_exercise_id, exercise_id, exercise_name, set_order, set_type,
                            weight_kg, reps, rir, rpe, tempo, rest_seconds, unilateral, pain_flag,
                            completed_status, notes
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            session_id,
                            session_exercise_id,
                            set_exercise_id,
                            entry.exercise_name or exercise.exercise_name,
                            set_index,
                            entry.set_type,
                            entry.weight_kg,
                            entry.reps,
                            entry.rir,
                            entry.rpe,
                            entry.tempo,
                            entry.rest_seconds,
                            int(entry.unilateral),
                            int(entry.pain_flag),
                            entry.completed_status,
                            entry.notes,
                        ),
                    )
        self.set_setting("active_focus", session.title)
        return session_id

    def get_session(self, session_id: int) -> WorkoutSession | None:
        sessions = self.fetch_sessions(session_id=session_id)
        return sessions[0] if sessions else None

    def fetch_sessions(
        self,
        *,
        limit: int | None = None,
        title: str = "",
        session_id: int | None = None,
        status: str = "",
        date_from: str = "",
        date_to: str = "",
    ) -> list[WorkoutSession]:
        where: list[str] = []
        params: list[Any] = []
        if title:
            where.append("title = ?")
            params.append(title)
        if session_id:
            where.append("id = ?")
            params.append(session_id)
        if status:
            where.append("completion_status = ?")
            params.append(status)
        if date_from:
            where.append("session_date >= ?")
            params.append(date_from)
        if date_to:
            where.append("session_date <= ?")
            params.append(date_to)

        sql = "SELECT * FROM workout_sessions"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY session_date DESC, id DESC"
        if limit:
            sql += " LIMIT ?"
            params.append(limit)

        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
            if not rows:
                return []
            ids = [int(row["id"]) for row in rows]
            placeholder = ",".join("?" for _ in ids)
            exercise_rows = connection.execute(
                f"SELECT * FROM session_exercises WHERE session_id IN ({placeholder}) ORDER BY session_id, exercise_order, id",
                ids,
            ).fetchall()
            set_rows = connection.execute(
                f"SELECT * FROM workout_sets WHERE session_id IN ({placeholder}) ORDER BY session_id, session_exercise_id, set_order, id",
                ids,
            ).fetchall()

        set_map: dict[int, list[WorkoutSet]] = defaultdict(list)
        for row in set_rows:
            key = int(row["session_exercise_id"]) if row["session_exercise_id"] else -int(row["session_id"])
            set_map[key].append(self._set_from_row(row))

        exercise_map: dict[int, list[SessionExercise]] = defaultdict(list)
        for row in exercise_rows:
            exercise = self._session_exercise_from_row(row)
            exercise.sets = set_map.get(int(row["id"]), [])
            exercise_map[int(row["session_id"])].append(exercise)

        sessions: list[WorkoutSession] = []
        for row in rows:
            session = self._session_from_row(row)
            session.exercises = exercise_map.get(session.id or 0, [])
            if not session.exercises:
                session.exercises = self._build_legacy_session_exercises(session.id or 0, set_rows)
            session.sets = [entry for exercise in session.exercises for entry in exercise.sets]
            sessions.append(session)
        return sessions

    def list_session_summaries(
        self,
        *,
        limit: int = 200,
        focus: str = "",
        status: str = "",
        search: str = "",
    ) -> list[dict[str, Any]]:
        where = []
        params: list[Any] = []
        if focus:
            where.append("s.title = ?")
            params.append(focus)
        if status:
            where.append("s.completion_status = ?")
            params.append(status)
        if search:
            where.append("(s.title LIKE ? OR s.block_name LIKE ? OR s.notes LIKE ?)")
            term = f"%{search}%"
            params.extend([term, term, term])
        sql = """
            SELECT
                s.id,
                s.session_date,
                s.title,
                s.block_name,
                s.completion_status,
                s.duration_minutes,
                s.readiness_score,
                COUNT(ws.id) AS set_count,
                COUNT(DISTINCT ws.exercise_name) AS exercise_count,
                COALESCE(SUM(COALESCE(ws.weight_kg, 0) * COALESCE(ws.reps, 0)), 0) AS volume
            FROM workout_sessions s
            LEFT JOIN workout_sets ws ON ws.session_id = s.id
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += """
            GROUP BY s.id
            ORDER BY s.session_date DESC, s.id DESC
            LIMIT ?
        """
        params.append(limit)
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [dict(row) for row in rows]

    def list_session_titles(self) -> list[str]:
        titles = [focus.name for focus in self.list_training_focuses()]
        with get_connection() as connection:
            rows = connection.execute("SELECT DISTINCT title FROM workout_sessions ORDER BY title").fetchall()
        for row in rows:
            title = sanitize_text(row["title"]).strip()
            if title and title not in titles:
                titles.append(title)
        return titles

    def list_training_focuses(self, active_only: bool = True) -> list[TrainingFocus]:
        sql = "SELECT * FROM training_focuses"
        params: list[Any] = []
        if active_only:
            sql += " WHERE is_active = 1"
        sql += " ORDER BY sort_order, name"
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [self._focus_from_row(row) for row in rows]

    def save_training_focus(
        self,
        *,
        name: str,
        description: str = "",
        origin: str = "custom",
        is_active: bool = True,
        connection: Any | None = None,
    ) -> int:
        clean_name = sanitize_text(name).strip()
        if not clean_name:
            raise ValueError("El foco no puede estar vacio.")
        slug = focus_slug(clean_name)
        owns_connection = connection is None
        connection = connection or get_connection()
        try:
            existing = connection.execute(
                "SELECT id, sort_order FROM training_focuses WHERE slug = ? OR name = ?",
                (slug, clean_name),
            ).fetchone()
            if existing:
                connection.execute(
                    """
                    UPDATE training_focuses
                    SET name = ?, slug = ?, description = ?, origin = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (clean_name, slug, sanitize_text(description), sanitize_text(origin), int(is_active), int(existing["id"])),
                )
                return int(existing["id"])
            sort_order = max((focus.sort_order for focus in self.list_training_focuses(active_only=False)), default=0) + 10
            cursor = connection.execute(
                """
                INSERT INTO training_focuses (name, slug, description, origin, sort_order, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                (clean_name, slug, sanitize_text(description), sanitize_text(origin), sort_order, int(is_active)),
            )
            return int(cursor.lastrowid)
        finally:
            if owns_connection:
                connection.close()

    def count_templates(self) -> int:
        with get_connection() as connection:
            row = connection.execute("SELECT COUNT(*) AS count FROM session_templates").fetchone()
        return int(row["count"] if row else 0)

    def delete_session(self, session_id: int) -> None:
        with get_connection() as connection:
            connection.execute("DELETE FROM workout_sessions WHERE id = ?", (session_id,))

    def list_templates(self) -> list[SessionTemplate]:
        with get_connection() as connection:
            rows = connection.execute("SELECT * FROM session_templates ORDER BY focus").fetchall()
            if not rows:
                return []
            ids = [row["id"] for row in rows]
            placeholder = ",".join("?" for _ in ids)
            exercise_rows = connection.execute(
                f"SELECT * FROM template_exercises WHERE template_id IN ({placeholder}) ORDER BY template_id, exercise_order, id",
                ids,
            ).fetchall()
        exercise_map: dict[int, list[TemplateExercise]] = defaultdict(list)
        for row in exercise_rows:
            exercise_map[int(row["template_id"])].append(self._template_exercise_from_row(row))
        templates: list[SessionTemplate] = []
        for row in rows:
            template = self._template_from_row(row)
            template.exercises = exercise_map.get(int(row["id"]), [])
            templates.append(template)
        return templates

    def get_template(self, focus: str) -> SessionTemplate | None:
        focus = sanitize_text(focus).strip()
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM session_templates WHERE focus = ?", (focus,)).fetchone()
            if not row:
                return None
            template_id = int(row["id"])
            exercise_rows = connection.execute(
                "SELECT * FROM template_exercises WHERE template_id = ? ORDER BY exercise_order, id",
                (template_id,),
            ).fetchall()
        template = self._template_from_row(row)
        template.exercises = [self._template_exercise_from_row(item) for item in exercise_rows]
        return template

    def save_template(self, template: SessionTemplate) -> int:
        now = datetime.now().isoformat(timespec="seconds")
        with get_connection() as connection:
            self.save_training_focus(
                name=sanitize_text(template.focus),
                description=sanitize_text(template.description),
                origin="custom" if sanitize_text(template.focus) not in self.DEFAULT_FOCUSES else "preset",
                connection=connection,
            )
            existing = connection.execute("SELECT id FROM session_templates WHERE focus = ?", (template.focus,)).fetchone()
            template_id = template.id or (int(existing["id"]) if existing else None)
            if template_id:
                connection.execute(
                    """
                    UPDATE session_templates
                    SET focus = ?, name = ?, description = ?, goal = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (template.focus, template.name, template.description, template.goal, now, template_id),
                )
                connection.execute("DELETE FROM template_exercises WHERE template_id = ?", (template_id,))
            else:
                cursor = connection.execute(
                    """
                    INSERT INTO session_templates (focus, name, description, goal, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (template.focus, template.name, template.description, template.goal, now, now),
                )
                template_id = int(cursor.lastrowid)

            for index, entry in enumerate(template.exercises, start=1):
                exercise_id = entry.exercise_id or self.get_or_create_exercise(entry.exercise_name, connection)
                connection.execute(
                    """
                    INSERT INTO template_exercises (
                        template_id, exercise_id, exercise_name, exercise_order, set_type, default_sets,
                        default_reps, default_weight_kg, default_rest_seconds, target_rir, progression_rule, notes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        template_id,
                        exercise_id,
                        entry.exercise_name,
                        index,
                        entry.set_type,
                        entry.default_sets,
                        entry.default_reps,
                        entry.default_weight_kg,
                        entry.default_rest_seconds,
                        entry.target_rir,
                        entry.progression_rule,
                        entry.notes,
                    ),
                )
        self.set_setting("active_focus", template.focus)
        return int(template_id)

    def save_body_checkin(self, checkin: BodyCheckIn) -> int:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO body_checkins (
                    checkin_date, weight_kg, body_fat_pct, waist_cm, chest_cm, hip_cm, arm_cm, thigh_cm,
                    height_cm, age, sex, activity_level, goal, calories_target, basal_metabolism,
                    habit_score, notes, imported_legacy_key
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(checkin_date) DO UPDATE SET
                    weight_kg = excluded.weight_kg,
                    body_fat_pct = excluded.body_fat_pct,
                    waist_cm = excluded.waist_cm,
                    chest_cm = excluded.chest_cm,
                    hip_cm = excluded.hip_cm,
                    arm_cm = excluded.arm_cm,
                    thigh_cm = excluded.thigh_cm,
                    height_cm = excluded.height_cm,
                    age = excluded.age,
                    sex = excluded.sex,
                    activity_level = excluded.activity_level,
                    goal = excluded.goal,
                    calories_target = excluded.calories_target,
                    basal_metabolism = excluded.basal_metabolism,
                    habit_score = excluded.habit_score,
                    notes = excluded.notes,
                    imported_legacy_key = COALESCE(body_checkins.imported_legacy_key, excluded.imported_legacy_key)
                """,
                (
                    checkin.checkin_date,
                    checkin.weight_kg,
                    checkin.body_fat_pct,
                    checkin.waist_cm,
                    checkin.chest_cm,
                    checkin.hip_cm,
                    checkin.arm_cm,
                    checkin.thigh_cm,
                    checkin.height_cm,
                    checkin.age,
                    checkin.sex,
                    checkin.activity_level,
                    checkin.goal,
                    checkin.calories_target,
                    checkin.basal_metabolism,
                    checkin.habit_score,
                    checkin.notes,
                    checkin.imported_legacy_key,
                ),
            )
            row = connection.execute("SELECT id FROM body_checkins WHERE checkin_date = ?", (checkin.checkin_date,)).fetchone()
            return int(row["id"] if row else cursor.lastrowid)

    def list_body_checkins(self, limit: int | None = None) -> list[BodyCheckIn]:
        sql = "SELECT * FROM body_checkins ORDER BY checkin_date DESC"
        params: list[Any] = []
        if limit:
            sql += " LIMIT ?"
            params.append(limit)
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [self._body_from_row(row) for row in rows]

    def save_goal(self, goal: TrainingGoal) -> int:
        with get_connection() as connection:
            if goal.id:
                connection.execute(
                    """
                    UPDATE training_goals
                    SET name = ?, target_metric = ?, start_value = ?, target_value = ?, unit = ?,
                        due_date = ?, priority = ?, status = ?, notes = ?
                    WHERE id = ?
                    """,
                    (
                        goal.name,
                        goal.target_metric,
                        goal.start_value,
                        goal.target_value,
                        goal.unit,
                        goal.due_date,
                        goal.priority,
                        goal.status,
                        goal.notes,
                        goal.id,
                    ),
                )
                return int(goal.id)
            cursor = connection.execute(
                """
                INSERT INTO training_goals (
                    name, target_metric, start_value, target_value, unit, due_date, priority, status, notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    goal.name,
                    goal.target_metric,
                    goal.start_value,
                    goal.target_value,
                    goal.unit,
                    goal.due_date,
                    goal.priority,
                    goal.status,
                    goal.notes,
                ),
            )
            return int(cursor.lastrowid)

    def list_training_goals(self) -> list[TrainingGoal]:
        with get_connection() as connection:
            rows = connection.execute("SELECT * FROM training_goals ORDER BY created_at DESC, id DESC").fetchall()
        return [TrainingGoal(**dict(row)) for row in rows]

    def save_block(self, block: TrainingBlock) -> int:
        with get_connection() as connection:
            if block.id:
                connection.execute(
                    """
                    UPDATE training_blocks
                    SET name = ?, focus = ?, phase_type = ?, objective = ?, weekly_frequency = ?,
                        default_template_id = ?, start_date = ?, end_date = ?, status = ?, notes = ?,
                        progression_notes = ?
                    WHERE id = ?
                    """,
                    (
                        block.name,
                        block.focus,
                        block.phase_type,
                        block.objective,
                        block.weekly_frequency,
                        block.default_template_id,
                        block.start_date,
                        block.end_date,
                        block.status,
                        block.notes,
                        block.progression_notes,
                        block.id,
                    ),
                )
                return int(block.id)
            cursor = connection.execute(
                """
                INSERT INTO training_blocks (
                    name, focus, phase_type, objective, weekly_frequency, default_template_id,
                    start_date, end_date, status, notes, progression_notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    block.name,
                    block.focus,
                    block.phase_type,
                    block.objective,
                    block.weekly_frequency,
                    block.default_template_id,
                    block.start_date,
                    block.end_date,
                    block.status,
                    block.notes,
                    block.progression_notes,
                ),
            )
            return int(cursor.lastrowid)

    def list_training_blocks(self) -> list[TrainingBlock]:
        with get_connection() as connection:
            rows = connection.execute("SELECT * FROM training_blocks ORDER BY created_at DESC, id DESC").fetchall()
        return [TrainingBlock(**dict(row)) for row in rows]

    def save_coach_checkin(self, checkin: CoachCheckIn) -> int:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO coach_checkins (
                    checkin_date, phase, focus, session_id, sleep_hours, energy, soreness, fatigue,
                    motivation, stress, pain_points, training_intent, best_exercise, worst_exercise,
                    desired_adjustment, notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    checkin.checkin_date,
                    checkin.phase,
                    checkin.focus,
                    checkin.session_id,
                    checkin.sleep_hours,
                    checkin.energy,
                    checkin.soreness,
                    checkin.fatigue,
                    checkin.motivation,
                    checkin.stress,
                    checkin.pain_points,
                    checkin.training_intent,
                    checkin.best_exercise,
                    checkin.worst_exercise,
                    checkin.desired_adjustment,
                    checkin.notes,
                ),
            )
            return int(cursor.lastrowid)

    def list_coach_checkins(self, phase: str = "", limit: int = 30, focus: str = "") -> list[CoachCheckIn]:
        sql = "SELECT * FROM coach_checkins WHERE 1=1"
        params: list[Any] = []
        if phase:
            sql += " AND phase = ?"
            params.append(phase)
        if focus:
            sql += " AND focus = ?"
            params.append(focus)
        sql += " ORDER BY checkin_date DESC, id DESC LIMIT ?"
        params.append(limit)
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [CoachCheckIn(**dict(row)) for row in rows]

    def get_latest_coach_checkin(self, phase: str = "", focus: str = "") -> CoachCheckIn | None:
        checkins = self.list_coach_checkins(phase=phase, focus=focus, limit=1)
        return checkins[0] if checkins else None

    def replace_recommendations(self, context_type: str, context_key: str, recommendations: list[Recommendation]) -> None:
        with get_connection() as connection:
            connection.execute(
                "DELETE FROM recommendations WHERE context_type = ? AND context_key = ?",
                (context_type, context_key),
            )
            for recommendation in recommendations:
                connection.execute(
                    """
                    INSERT INTO recommendations (
                        context_type, context_key, title, summary, action_type, confidence, source,
                        applies_to_focus, session_id, checkin_id, status, metadata_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        context_type,
                        context_key,
                        recommendation.title,
                        recommendation.summary,
                        recommendation.action_type,
                        recommendation.confidence,
                        recommendation.source,
                        recommendation.applies_to_focus,
                        recommendation.session_id,
                        recommendation.checkin_id,
                        recommendation.status,
                        json.dumps(recommendation.metadata, ensure_ascii=False),
                    ),
                )

    def list_recent_recommendations(self, limit: int = 12, focus: str = "") -> list[Recommendation]:
        sql = "SELECT * FROM recommendations"
        params: list[Any] = []
        if focus:
            sql += " WHERE applies_to_focus = ?"
            params.append(focus)
        sql += " ORDER BY generated_on DESC, id DESC LIMIT ?"
        params.append(limit)
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [self._recommendation_from_row(row) for row in rows]

    def save_coach_message(self, message: CoachMessage) -> int:
        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO coach_messages (role, source, content, metadata_json) VALUES (?, ?, ?, ?)",
                (
                    message.role,
                    message.source,
                    message.content,
                    json.dumps(message.metadata, ensure_ascii=False),
                ),
            )
            return int(cursor.lastrowid)

    def list_coach_messages(self, limit: int = 60) -> list[CoachMessage]:
        with get_connection() as connection:
            rows = connection.execute("SELECT * FROM coach_messages ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [self._coach_from_row(row) for row in reversed(rows)]

    def set_setting(self, key: str, value: str) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO app_settings (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )

    def get_setting(self, key: str) -> str | None:
        with get_connection() as connection:
            row = connection.execute("SELECT value FROM app_settings WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else None

    def get_fitness_profile(self) -> FitnessProfile:
        return FitnessProfile(
            display_name=self.get_setting("display_name") or "",
            primary_goal=self.get_setting("primary_goal") or "",
            experience_level=self.get_setting("experience_level") or "intermedio",
            weekly_availability=int(self.get_setting("weekly_availability") or 3),
            equipment_access=json.loads(self.get_setting("equipment_access") or "[]"),
            limitations=self.get_setting("limitations") or "",
            lagging_muscles=json.loads(self.get_setting("lagging_muscles") or "[]"),
            preferred_focus=self.get_setting("preferred_focus") or "",
            preferred_unit=self.get_setting("preferred_unit") or "metric",
            coaching_style=self.get_setting("coaching_style") or "directo",
            intensity_preference=self.get_setting("intensity_preference") or "moderada",
            sex=self.get_setting("sex") or "",
            age=self._safe_int(self.get_setting("age")),
            height_cm=self._safe_float(self.get_setting("height_cm")),
        )

    def save_fitness_profile(self, profile: FitnessProfile) -> None:
        self.set_setting("display_name", profile.display_name)
        self.set_setting("primary_goal", profile.primary_goal)
        self.set_setting("experience_level", profile.experience_level)
        self.set_setting("weekly_availability", str(profile.weekly_availability))
        self.set_setting("equipment_access", json.dumps(self._clean_list(profile.equipment_access), ensure_ascii=False))
        self.set_setting("limitations", profile.limitations)
        self.set_setting("lagging_muscles", json.dumps(self._clean_list(profile.lagging_muscles), ensure_ascii=False))
        self.set_setting("preferred_focus", profile.preferred_focus)
        self.set_setting("preferred_unit", profile.preferred_unit)
        self.set_setting("coaching_style", profile.coaching_style)
        self.set_setting("intensity_preference", profile.intensity_preference)
        self.set_setting("sex", profile.sex)
        self.set_setting("age", "" if profile.age is None else str(profile.age))
        self.set_setting("height_cm", "" if profile.height_cm is None else str(profile.height_cm))

    def export_json(self, output_dir: Path | None = None) -> Path:
        export_dir = output_dir or EXPORT_DIR
        export_dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "fitness_profile": asdict(self.get_fitness_profile()),
            "templates": [asdict(template) for template in self.list_templates()],
            "sessions": [asdict(session) for session in self.fetch_sessions(limit=5000)],
            "body_checkins": [asdict(body) for body in self.list_body_checkins(limit=5000)],
            "coach_checkins": [asdict(item) for item in self.list_coach_checkins(limit=5000)],
            "exercises": [asdict(exercise) for exercise in self.list_exercises()],
            "training_goals": [asdict(goal) for goal in self.list_training_goals()],
            "training_blocks": [asdict(block) for block in self.list_training_blocks()],
        }
        output_path = export_dir / f"gym_coach_export_{datetime.now():%Y%m%d_%H%M%S}.json"
        output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        return output_path

    def export_csv(self, output_dir: Path | None = None) -> list[Path]:
        export_dir = output_dir or EXPORT_DIR
        export_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sessions_path = export_dir / f"sessions_{timestamp}.csv"
        checkins_path = export_dir / f"body_checkins_{timestamp}.csv"

        with sessions_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["id", "fecha", "foco", "bloque", "estado", "sets", "ejercicios", "volumen", "readiness"])
            for row in self.list_session_summaries(limit=10000):
                writer.writerow(
                    [
                        row["id"],
                        row["session_date"],
                        row["title"],
                        row["block_name"],
                        row["completion_status"],
                        row["set_count"],
                        row["exercise_count"],
                        row["volume"],
                        row["readiness_score"],
                    ]
                )

        with checkins_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(
                [
                    "fecha",
                    "peso_kg",
                    "grasa_pct",
                    "cintura_cm",
                    "pecho_cm",
                    "cadera_cm",
                    "brazo_cm",
                    "pierna_cm",
                    "calorias",
                ]
            )
            for checkin in self.list_body_checkins(limit=10000):
                writer.writerow(
                    [
                        checkin.checkin_date,
                        checkin.weight_kg,
                        checkin.body_fat_pct,
                        checkin.waist_cm,
                        checkin.chest_cm,
                        checkin.hip_cm,
                        checkin.arm_cm,
                        checkin.thigh_cm,
                        checkin.calories_target,
                    ]
                )
        return [sessions_path, checkins_path]

    def find_session_id_by_import_key(self, import_key: str) -> int | None:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT id FROM workout_sessions WHERE imported_legacy_key = ?",
                (import_key,),
            ).fetchone()
        return int(row["id"]) if row else None

    def find_body_checkin_id_by_import_key(self, import_key: str) -> int | None:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT id FROM body_checkins WHERE imported_legacy_key = ?",
                (import_key,),
            ).fetchone()
        return int(row["id"]) if row else None

    def record_import_event(self, source_type: str, source_key: str, summary: str, source_mtime: float | None = None) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO import_history (source_type, source_key, source_mtime, summary)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(source_key) DO UPDATE SET
                    source_type = excluded.source_type,
                    source_mtime = excluded.source_mtime,
                    summary = excluded.summary,
                    imported_at = CURRENT_TIMESTAMP
                """,
                (source_type, source_key, source_mtime, summary),
            )

    def _list_distinct(self, table_name: str, column: str) -> list[str]:
        with get_connection() as connection:
            rows = connection.execute(
                f"SELECT DISTINCT {column} AS value FROM {table_name} WHERE {column} != '' ORDER BY {column}"
            ).fetchall()
        return [row["value"] for row in rows]

    def _normalize_session_exercises(self, session: WorkoutSession) -> list[SessionExercise]:
        if session.exercises:
            normalized: list[SessionExercise] = []
            for exercise_order, exercise in enumerate(session.exercises, start=1):
                copied_sets = []
                for set_order, item in enumerate(exercise.sets, start=1):
                    copied_sets.append(
                        WorkoutSet(
                            id=item.id,
                            session_id=session.id,
                            session_exercise_id=exercise.id,
                            exercise_name=item.exercise_name or exercise.exercise_name,
                            exercise_id=item.exercise_id or exercise.exercise_id,
                            set_order=set_order,
                            set_type=item.set_type,
                            weight_kg=item.weight_kg,
                            reps=item.reps,
                            rir=item.rir,
                            rpe=item.rpe,
                            tempo=item.tempo,
                            rest_seconds=item.rest_seconds,
                            unilateral=item.unilateral,
                            pain_flag=item.pain_flag,
                            completed_status=item.completed_status,
                            notes=item.notes,
                        )
                    )
                normalized.append(
                    SessionExercise(
                        id=exercise.id,
                        session_id=session.id,
                        exercise_id=exercise.exercise_id,
                        exercise_name=exercise.exercise_name,
                        exercise_order=exercise_order,
                        goal=exercise.goal,
                        notes=exercise.notes,
                        target_sets=exercise.target_sets,
                        target_reps=exercise.target_reps,
                        target_weight_kg=exercise.target_weight_kg,
                        target_rest_seconds=exercise.target_rest_seconds,
                        target_rir=exercise.target_rir,
                        progression_rule=exercise.progression_rule,
                        sets=copied_sets,
                    )
                )
            return normalized

        grouped: dict[str, list[WorkoutSet]] = defaultdict(list)
        order_map: dict[str, int] = {}
        for entry in session.sets:
            grouped[entry.exercise_name].append(entry)
            order_map.setdefault(entry.exercise_name, len(order_map) + 1)
        normalized = []
        for exercise_name, sets in grouped.items():
            normalized.append(
                SessionExercise(
                    session_id=session.id,
                    exercise_name=exercise_name,
                    exercise_order=order_map[exercise_name],
                    target_sets=len(sets),
                    target_reps=f"{sets[0].reps or ''}",
                    target_weight_kg=sets[0].weight_kg,
                    target_rest_seconds=sets[0].rest_seconds,
                    target_rir=sets[0].rir,
                    notes=sets[0].notes,
                    sets=[
                        WorkoutSet(
                            id=item.id,
                            session_id=session.id,
                            exercise_name=item.exercise_name,
                            exercise_id=item.exercise_id,
                            set_order=index,
                            set_type=item.set_type,
                            weight_kg=item.weight_kg,
                            reps=item.reps,
                            rir=item.rir,
                            rpe=item.rpe,
                            tempo=item.tempo,
                            rest_seconds=item.rest_seconds,
                            unilateral=item.unilateral,
                            pain_flag=item.pain_flag,
                            completed_status=item.completed_status,
                            notes=item.notes,
                        )
                        for index, item in enumerate(sets, start=1)
                    ],
                )
            )
        normalized.sort(key=lambda item: item.exercise_order)
        return normalized

    def _build_legacy_session_exercises(self, session_id: int, set_rows: list[Any]) -> list[SessionExercise]:
        grouped: dict[str, list[WorkoutSet]] = defaultdict(list)
        for row in set_rows:
            if int(row["session_id"]) != session_id:
                continue
            grouped[row["exercise_name"]].append(self._set_from_row(row))
        output = []
        for index, (exercise_name, sets) in enumerate(grouped.items(), start=1):
            output.append(
                SessionExercise(
                    session_id=session_id,
                    exercise_id=sets[0].exercise_id,
                    exercise_name=exercise_name,
                    exercise_order=index,
                    notes=sets[0].notes,
                    target_sets=len(sets),
                    target_reps=str(sets[0].reps or ""),
                    target_weight_kg=sets[0].weight_kg,
                    target_rest_seconds=sets[0].rest_seconds,
                    target_rir=sets[0].rir,
                    sets=sets,
                )
            )
        return output

    def _exercise_from_row(self, row: Any) -> ExerciseDefinition:
        return ExerciseDefinition(
            id=int(row["id"]),
            name=sanitize_text(row["name"]),
            canonical_name=sanitize_text(row["canonical_name"] or ""),
            category=sanitize_text(row["category"]),
            modality=sanitize_text(row["modality"] or "fuerza"),
            movement_pattern=sanitize_text(row["movement_pattern"] or ""),
            primary_muscles=sanitize_list(json.loads(row["primary_muscles"] or "[]")),
            secondary_muscles=sanitize_list(json.loads(row["secondary_muscles"] or "[]")),
            equipment=sanitize_text(row["equipment"] or ""),
            difficulty=sanitize_text(row["difficulty"] or ""),
            load_type=sanitize_text(row["load_type"] or "peso"),
            default_unit=sanitize_text(row["default_unit"] or "kg"),
            cues=sanitize_text(row["cues"] or ""),
            technical_notes=sanitize_text(row["technical_notes"] or ""),
            variant_group=sanitize_text(row["variant_group"] or ""),
            alternatives=sanitize_list(json.loads(row["alternatives"] or "[]")),
            is_compound=bool(row["is_compound"]),
            is_custom=bool(row["is_custom"]),
            status=sanitize_text(row["status"] or "activo"),
        )

    def _session_from_row(self, row: Any) -> WorkoutSession:
        return WorkoutSession(
            id=int(row["id"]),
            session_date=sanitize_text(row["session_date"]),
            title=sanitize_text(row["title"]),
            block_name=sanitize_text(row["block_name"] or ""),
            notes=sanitize_text(row["notes"] or ""),
            planned_focus=sanitize_text(row["planned_focus"] or row["title"]),
            completion_status=sanitize_text(row["completion_status"]),
            perceived_energy=row["perceived_energy"],
            duration_minutes=row["duration_minutes"],
            source_template_id=row["source_template_id"],
            readiness_score=row["readiness_score"],
            pre_checkin_id=row["pre_checkin_id"],
            post_checkin_id=row["post_checkin_id"],
            unit_system=sanitize_text(row["unit_system"] or "metric"),
            imported_legacy_key=row["imported_legacy_key"],
            created_at=sanitize_text(row["created_at"] or ""),
            updated_at=sanitize_text(row["updated_at"] or ""),
        )

    def _session_exercise_from_row(self, row: Any) -> SessionExercise:
        return SessionExercise(
            id=int(row["id"]),
            session_id=int(row["session_id"]),
            exercise_id=row["exercise_id"],
            exercise_name=sanitize_text(row["exercise_name"]),
            exercise_order=row["exercise_order"],
            goal=sanitize_text(row["goal"] or ""),
            notes=sanitize_text(row["notes"] or ""),
            target_sets=row["target_sets"],
            target_reps=sanitize_text(row["target_reps"] or ""),
            target_weight_kg=row["target_weight_kg"],
            target_rest_seconds=row["target_rest_seconds"],
            target_rir=row["target_rir"],
            progression_rule=sanitize_text(row["progression_rule"] or ""),
        )

    def _set_from_row(self, row: Any) -> WorkoutSet:
        return WorkoutSet(
            id=int(row["id"]),
            session_id=int(row["session_id"]),
            session_exercise_id=row["session_exercise_id"],
            exercise_id=row["exercise_id"],
            exercise_name=sanitize_text(row["exercise_name"]),
            set_order=row["set_order"],
            set_type=sanitize_text(row["set_type"]),
            weight_kg=row["weight_kg"],
            reps=row["reps"],
            rir=row["rir"],
            rpe=row["rpe"],
            tempo=sanitize_text(row["tempo"] or ""),
            rest_seconds=row["rest_seconds"],
            unilateral=bool(row["unilateral"]),
            pain_flag=bool(row["pain_flag"]),
            completed_status=sanitize_text(row["completed_status"]),
            notes=sanitize_text(row["notes"] or ""),
        )

    def _template_from_row(self, row: Any) -> SessionTemplate:
        return SessionTemplate(
            id=int(row["id"]),
            focus=sanitize_text(row["focus"]),
            name=sanitize_text(row["name"]),
            description=sanitize_text(row["description"] or ""),
            goal=sanitize_text(row["goal"] or ""),
            created_at=sanitize_text(row["created_at"] or ""),
            updated_at=sanitize_text(row["updated_at"] or ""),
        )

    def _template_exercise_from_row(self, row: Any) -> TemplateExercise:
        return TemplateExercise(
            id=int(row["id"]),
            template_id=int(row["template_id"]),
            exercise_id=row["exercise_id"],
            exercise_name=sanitize_text(row["exercise_name"]),
            exercise_order=row["exercise_order"],
            set_type=sanitize_text(row["set_type"]),
            default_sets=row["default_sets"],
            default_reps=sanitize_text(row["default_reps"]),
            default_weight_kg=row["default_weight_kg"],
            default_rest_seconds=row["default_rest_seconds"],
            target_rir=row["target_rir"],
            progression_rule=sanitize_text(row["progression_rule"] or ""),
            notes=sanitize_text(row["notes"] or ""),
        )

    def _body_from_row(self, row: Any) -> BodyCheckIn:
        return BodyCheckIn(
            id=int(row["id"]),
            checkin_date=sanitize_text(row["checkin_date"]),
            weight_kg=row["weight_kg"],
            body_fat_pct=row["body_fat_pct"],
            waist_cm=row["waist_cm"],
            chest_cm=row["chest_cm"],
            hip_cm=row["hip_cm"],
            arm_cm=row["arm_cm"],
            thigh_cm=row["thigh_cm"],
            height_cm=row["height_cm"],
            age=row["age"],
            sex=sanitize_text(row["sex"] or ""),
            activity_level=sanitize_text(row["activity_level"] or ""),
            goal=sanitize_text(row["goal"] or ""),
            calories_target=row["calories_target"],
            basal_metabolism=row["basal_metabolism"],
            habit_score=row["habit_score"],
            notes=sanitize_text(row["notes"] or ""),
            imported_legacy_key=row["imported_legacy_key"],
            created_at=sanitize_text(row["created_at"] or ""),
        )

    def _recommendation_from_row(self, row: Any) -> Recommendation:
        return Recommendation(
            id=int(row["id"]),
            generated_on=sanitize_text(row["generated_on"]),
            context_type=sanitize_text(row["context_type"]),
            context_key=sanitize_text(row["context_key"]),
            title=sanitize_text(row["title"]),
            summary=sanitize_text(row["summary"]),
            action_type=sanitize_text(row["action_type"]),
            confidence=float(row["confidence"] or 0),
            source=sanitize_text(row["source"] or "engine"),
            applies_to_focus=sanitize_text(row["applies_to_focus"] or ""),
            session_id=row["session_id"],
            checkin_id=row["checkin_id"],
            status=sanitize_text(row["status"] or "activa"),
            metadata=json.loads(row["metadata_json"] or "{}"),
        )

    def _coach_from_row(self, row: Any) -> CoachMessage:
        return CoachMessage(
            id=int(row["id"]),
            created_at=sanitize_text(row["created_at"]),
            role=sanitize_text(row["role"]),
            source=sanitize_text(row["source"]),
            content=sanitize_text(row["content"]),
            metadata=json.loads(row["metadata_json"] or "{}"),
        )

    def _canonicalize(self, text: str) -> str:
        return (
            text.lower()
            .strip()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
            .replace("ñ", "n")
            .replace("/", "-")
            .replace(" ", "-")
        )

    def _focus_from_row(self, row: Any) -> TrainingFocus:
        return TrainingFocus(
            id=int(row["id"]),
            name=sanitize_text(row["name"]),
            slug=sanitize_text(row["slug"]),
            description=sanitize_text(row["description"] or ""),
            origin=sanitize_text(row["origin"] or "preset"),
            sort_order=int(row["sort_order"] or 0),
            is_active=bool(row["is_active"]),
        )

    def _canonicalize(self, text: str) -> str:
        return focus_slug(sanitize_text(text))

    def _clean_list(self, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            item = sanitize_text(value).strip()
            if item and item not in cleaned:
                cleaned.append(item)
        return cleaned

    def _safe_int(self, value: object | None) -> int | None:
        try:
            if value in ("", None):
                return None
            return int(float(str(value)))
        except (TypeError, ValueError):
            return None

    def _safe_float(self, value: object | None) -> float | None:
        try:
            if value in ("", None):
                return None
            return float(str(value).replace(",", "."))
        except (TypeError, ValueError):
            return None
