from __future__ import annotations

import copy
import json
from collections import Counter
from datetime import date, datetime
from typing import Any

from PySide6.QtCore import QObject, Property, QUrl, Signal, Slot

from gym_app.context import AppContext
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
    TrainingGoal,
    WorkoutSession,
    WorkoutSet,
)
from gym_app.paths import DB_PATH, EXPORT_DIR, LOGO_PATH


def sanitize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    if any(token in text for token in ("Ã", "Â", "â", "�")):
        for source_encoding in ("latin-1", "cp1252"):
            try:
                fixed = text.encode(source_encoding).decode("utf-8")
                if fixed:
                    return fixed
            except Exception:
                continue
    return text


def format_number(value: float | int | None, suffix: str = "") -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return f"{value:,.1f}{suffix}".replace(",", " ")
    return f"{value}{suffix}"


def deep_jsonable(value: Any) -> Any:
    return copy.deepcopy(value)


def payload_from_json(payload_json: str) -> dict[str, Any]:
    try:
        loaded = json.loads(payload_json or "{}")
    except json.JSONDecodeError:
        return {}
    return loaded if isinstance(loaded, dict) else {}


class BasePageViewModel(QObject):
    stateChanged = Signal()
    dataChanged = Signal()

    def __init__(self, context: AppContext, shell_vm: "AppShellViewModel") -> None:
        super().__init__()
        self.context = context
        self.shell_vm = shell_vm
        self._state: dict[str, Any] = {}

    @Property("QVariantMap", notify=stateChanged)
    def state(self) -> dict[str, Any]:
        return deep_jsonable(self._state)

    def _set_state(self, payload: dict[str, Any]) -> None:
        self._state = payload
        self.stateChanged.emit()

    def _toast(self, message: str) -> None:
        self.shell_vm.show_message(message)

    def refresh(self) -> None:
        raise NotImplementedError

    def _float_value(self, value: Any) -> float | None:
        try:
            if value in ("", None, False):
                return None
            return float(str(value).replace(",", "."))
        except (TypeError, ValueError):
            return None

    def _int_value(self, value: Any) -> int | None:
        try:
            if value in ("", None, False):
                return None
            return int(float(str(value).replace(",", ".")))
        except (TypeError, ValueError):
            return None


class AppShellViewModel(QObject):
    currentPageChanged = Signal()
    activeFocusChanged = Signal()
    profileNameChanged = Signal()
    statusMessageChanged = Signal()

    NAV_ITEMS = [
        {"key": "Inicio", "label": "Inicio", "subtitle": "Resumen premium y foco del día"},
        {"key": "Entrenar", "label": "Entrenar", "subtitle": "Workspace activo de sesión"},
        {"key": "Ejercicios", "label": "Ejercicios", "subtitle": "Biblioteca curada y personalizada"},
        {"key": "Historial", "label": "Historial", "subtitle": "Sesiones, detalles y tendencias"},
        {"key": "Plan", "label": "Plan", "subtitle": "Bloques, metas y ajustes"},
        {"key": "Cuerpo", "label": "Cuerpo", "subtitle": "Perfil fitness y progreso corporal"},
        {"key": "Coach", "label": "Coach", "subtitle": "Check-ins y guía contextual"},
        {"key": "Configuración", "label": "Configuración", "subtitle": "Preferencias, API y exportación"},
    ]

    PAGE_META = {item["key"]: item for item in NAV_ITEMS}

    def __init__(self, context: AppContext, startup_report: str) -> None:
        super().__init__()
        self.context = context
        self._current_page = "Inicio"
        self._status_message = sanitize_text(startup_report)
        self._active_focus = ""
        self._profile_name = ""
        self.refresh()

    @Property("QVariantList", constant=True)
    def navigationItems(self) -> list[dict[str, str]]:
        return [
            {
                "key": sanitize_text(item["key"]),
                "label": sanitize_text(item["label"]),
                "subtitle": sanitize_text(item["subtitle"]),
            }
            for item in self.NAV_ITEMS
        ]

    @Property(str, notify=currentPageChanged)
    def currentPage(self) -> str:
        return self._current_page

    @Property(str, notify=currentPageChanged)
    def currentTitle(self) -> str:
        return sanitize_text(self.PAGE_META.get(self._current_page, {}).get("label", self._current_page))

    @Property(str, notify=currentPageChanged)
    def currentSubtitle(self) -> str:
        return sanitize_text(self.PAGE_META.get(self._current_page, {}).get("subtitle", ""))

    @Property(str, notify=activeFocusChanged)
    def activeFocus(self) -> str:
        return self._active_focus

    @Property(str, notify=profileNameChanged)
    def profileName(self) -> str:
        return self._profile_name

    @Property(str, notify=statusMessageChanged)
    def statusMessage(self) -> str:
        return self._status_message

    @Property(str, constant=True)
    def logoPath(self) -> str:
        return QUrl.fromLocalFile(str(LOGO_PATH)).toString()

    @Slot(str)
    def navigate(self, page: str) -> None:
        clean = sanitize_text(page)
        if clean and clean != self._current_page:
            self._current_page = clean
            self.currentPageChanged.emit()

    @Slot(str)
    def show_message(self, message: str) -> None:
        clean = sanitize_text(message)
        if clean != self._status_message:
            self._status_message = clean
            self.statusMessageChanged.emit()

    @Slot()
    def clear_message(self) -> None:
        self.show_message("")

    def refresh(self) -> None:
        active_focus = sanitize_text(
            self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
        )
        if active_focus != self._active_focus:
            self._active_focus = active_focus
            self.activeFocusChanged.emit()
        profile_name = sanitize_text(self.context.repository.get_fitness_profile().display_name or "Atleta")
        if profile_name != self._profile_name:
            self._profile_name = profile_name
            self.profileNameChanged.emit()


class DashboardViewModel(BasePageViewModel):
    def refresh(self) -> None:
        metrics = self.context.analytics.dashboard_metrics()
        profile = self.context.repository.get_fitness_profile()
        hour = datetime.now().hour
        greeting = "Buenos dias" if hour < 12 else "Buenas tardes" if hour < 19 else "Buenas noches"
        athlete = sanitize_text(profile.display_name or "atleta")
        plan = self.context.planner.generate_next_session_plan(metrics["active_focus"])
        readiness = metrics["average_readiness"]
        state_label = "Listo para apretar"
        if readiness is not None and readiness < 5:
            state_label = "Carga moderada recomendada"
        elif metrics["adherence"] < 60:
            state_label = "Vuelve al ritmo con una sesion solida"

        self._set_state(
            {
                "heroTitle": f"{greeting}, {athlete}",
                "heroSubtitle": (
                    f"Tu siguiente foco sugerido es {sanitize_text(metrics['next_focus'])}. "
                    f"Abre la sesion con claridad, registra bien las cargas y deja que el coach ajuste el siguiente paso."
                ),
                "heroBadges": [
                    {"label": "Foco activo", "value": sanitize_text(metrics["active_focus"])},
                    {"label": "Estado", "value": state_label},
                    {"label": "Adherencia", "value": f"{metrics['adherence']}%"},
                ],
                "focusSummary": sanitize_text(metrics["focus_summary"]),
                "cards": [
                    {
                        "title": "Sesiones ultimos 7 dias",
                        "value": format_number(metrics["sessions_7d"]),
                        "caption": sanitize_text(metrics["focus_summary"]),
                    },
                    {
                        "title": "Volumen ultimos 30 dias",
                        "value": format_number(metrics["volume_30d"], " kg"),
                        "caption": "Carga total acumulada reciente",
                    },
                    {
                        "title": "Readiness promedio",
                        "value": format_number(metrics["average_readiness"]),
                        "caption": "Promedio de energia y preparacion reciente",
                    },
                    {
                        "title": "Peso actual",
                        "value": format_number(metrics["current_weight"], " kg"),
                        "caption": (
                            f"Tendencia {metrics['weight_delta']:+.1f} kg"
                            if metrics["weight_delta"] is not None
                            else "Aun sin tendencia corporal suficiente"
                        ),
                    },
                ],
                "muscles": [
                    {"name": sanitize_text(name), "count": count, "strength": min(1.0, count / 4)}
                    for name, count in metrics["muscles_recent"]
                ],
                "coachInsight": "\n".join(sanitize_text(line) for line in plan["watch_today"][:4]),
                "planSummary": sanitize_text(plan["summary"]),
                "planReasons": [sanitize_text(item) for item in plan["reasons"][:4]],
                "todayActions": [
                    {
                        "title": sanitize_text(item["exercise"]),
                        "detail": (
                            f"{item['sets']} x {sanitize_text(item['reps'])} | "
                            f"{item['weight'] if item['weight'] not in ('', None) else 'por sensaciones'}"
                        ),
                        "note": sanitize_text(item["notes"]),
                    }
                    for item in plan["items"][:3]
                ],
                "prs": [
                    {
                        "exercise": sanitize_text(item["exercise"]),
                        "weight": item["weight"],
                        "reps": item["reps"],
                        "date": item["date"],
                    }
                    for item in metrics["prs"]
                ],
                "recentLoads": [
                    {
                        "exercise": sanitize_text(item["exercise"]),
                        "weight": item["weight"],
                        "reps": item["reps"],
                        "date": item["date"],
                    }
                    for item in metrics["recent_loads"]
                ],
                "volumeSeries": [
                    {"label": label, "value": value}
                    for label, value in self.context.analytics.volume_series(45, metrics["active_focus"])
                ],
                "weightSeries": [
                    {"label": label, "value": value} for label, value in self.context.analytics.weight_series(120)
                ],
                "activeFocus": sanitize_text(metrics["active_focus"]),
                "nextFocus": sanitize_text(metrics["next_focus"]),
                "adherence": metrics["adherence"],
                "readiness": readiness,
            }
        )


class TrainingWorkspaceViewModel(BasePageViewModel):
    def __init__(self, context: AppContext, shell_vm: AppShellViewModel) -> None:
        super().__init__(context, shell_vm)
        self._current_session_id: int | None = None
        self._current_template_id: int | None = None
        self._focus = ""
        self._selected_exercise_index = 0
        self._library_search = ""
        self._library_category = "Todas"
        self._meta: dict[str, Any] = {}
        self._pre_checkin: dict[str, Any] = {}
        self._session_exercises: list[dict[str, Any]] = []
        self._template_summary: dict[str, Any] = {}
        self._pre_checkin_id: int | None = None
        self._initialized = False

    def refresh(self) -> None:
        focus_options = self._focus_options()
        if not self._initialized:
            self._focus = sanitize_text(
                self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
            )
            if not self._focus and focus_options:
                self._focus = focus_options[0]
            self._meta = {
                "sessionDate": date.today().strftime("%Y-%m-%d"),
                "blockName": "",
                "status": "completado",
                "energy": 7,
                "duration": 75,
                "notes": "",
            }
            self._pre_checkin = {
                "sleepHours": 7.5,
                "energy": 7,
                "soreness": 3,
                "fatigue": 3,
                "motivation": 8,
                "intent": "moderada",
                "painPoints": "",
                "notes": "",
            }
            self._initialized = True
            self.apply_template()
        self._publish_state(focus_options)

    def _publish_state(self, focus_options: list[str]) -> None:
        category_options = ["Todas"] + [
            sanitize_text(item) for item in self.context.repository.list_exercise_categories()
        ]
        exercises = self._library_items()
        selected_name = sanitize_text(self._focus)
        exercise_series: list[dict[str, Any]] = []
        progress_summary = "Añade un ejercicio y registra tus cargas para desbloquear una lectura más precisa."
        if self._session_exercises:
            self._selected_exercise_index = max(0, min(self._selected_exercise_index, len(self._session_exercises) - 1))
            selected_name = sanitize_text(self._session_exercises[self._selected_exercise_index]["name"])
            raw_series = self.context.analytics.exercise_progress_series(selected_name, self._focus)
            exercise_series = [{"label": label, "value": value} for label, value in raw_series]
            if raw_series:
                latest = raw_series[-1][1]
                best = max(item[1] for item in raw_series)
                progress_summary = (
                    f"{selected_name}: e1RM reciente {latest:.1f} kg | mejor marca reciente {best:.1f} kg."
                )

        plan = self.context.planner.generate_next_session_plan(self._focus)
        matching_item = next(
            (item for item in plan["items"] if sanitize_text(item["exercise"]) == selected_name),
            plan["items"][0] if plan["items"] else None,
        )
        guidance_lines = [
            sanitize_text(plan["summary"]),
            sanitize_text(plan["reasons"][0]) if plan["reasons"] else "",
        ]
        if matching_item:
            weight_text = f"{matching_item['weight']} kg" if matching_item["weight"] not in ("", None) else "por sensaciones"
            guidance_lines.append(
                f"{sanitize_text(matching_item['exercise'])}: {matching_item['sets']} x {matching_item['reps']} | {weight_text}."
            )
            if matching_item.get("notes"):
                guidance_lines.append(sanitize_text(matching_item["notes"]))
        readiness_preview = self._compute_readiness()

        self._set_state(
            {
                "focus": self._focus,
                "focusOptions": focus_options,
                "meta": deep_jsonable(self._meta),
                "templateSummary": deep_jsonable(self._template_summary),
                "librarySearch": self._library_search,
                "libraryCategory": self._library_category or "Todas",
                "categoryOptions": category_options,
                "libraryExercises": exercises,
                "sessionExercises": deep_jsonable(self._session_exercises),
                "selectedExerciseIndex": self._selected_exercise_index,
                "selectedExerciseName": selected_name,
                "exerciseSeries": exercise_series,
                "focusSeries": [
                    {"label": label, "value": value}
                    for label, value in self.context.analytics.volume_series(90, self._focus)
                ],
                "progressSummary": progress_summary,
                "coachGuidance": "\n".join(line for line in guidance_lines if line),
                "preCheckin": deep_jsonable(self._pre_checkin),
                "preCheckinId": self._pre_checkin_id or 0,
                "readinessPreview": readiness_preview if readiness_preview is not None else "-",
                "emptyLibrary": not exercises,
                "sessionCount": len(self._session_exercises),
            }
        )

    def _focus_options(self) -> list[str]:
        options = [sanitize_text(item.focus) for item in self.context.repository.list_templates()]
        for focus in getattr(self.context.repository, "DEFAULT_FOCUSES", []):
            clean = sanitize_text(focus)
            if clean and clean not in options:
                options.append(clean)
        return options or ["Full Body"]

    def _library_items(self) -> list[dict[str, Any]]:
        category = "" if self._library_category in ("", "Todas") else self._library_category
        return [
            {
                "id": exercise.id,
                "name": sanitize_text(exercise.name),
                "category": sanitize_text(exercise.category),
                "equipment": sanitize_text(exercise.equipment),
                "difficulty": sanitize_text(exercise.difficulty),
            }
            for exercise in self.context.repository.list_exercises(self._library_search, category=category)
        ]

    def _template_to_summary(self, template: SessionTemplate | None) -> dict[str, Any]:
        if not template:
            return {
                "title": self._focus or "Sesión libre",
                "description": "No hay plantilla guardada para este foco.",
                "goal": "Construye la sesión aquí y luego guárdala como plantilla premium.",
            }
        return {
            "title": sanitize_text(template.name or template.focus),
            "description": sanitize_text(template.description),
            "goal": sanitize_text(template.goal),
        }

    def _exercise_dict(self, exercise: SessionExercise) -> dict[str, Any]:
        return {
            "name": sanitize_text(exercise.exercise_name),
            "goal": sanitize_text(exercise.goal),
            "notes": sanitize_text(exercise.notes),
            "targetSets": exercise.target_sets or max(len(exercise.sets), 1),
            "targetReps": sanitize_text(exercise.target_reps or ""),
            "targetWeight": exercise.target_weight_kg if exercise.target_weight_kg is not None else "",
            "targetRest": exercise.target_rest_seconds if exercise.target_rest_seconds is not None else 90,
            "targetRir": exercise.target_rir if exercise.target_rir is not None else "",
            "progressionRule": sanitize_text(exercise.progression_rule),
            "sets": [
                {
                    "type": sanitize_text(item.set_type or "trabajo"),
                    "reps": item.reps if item.reps is not None else "",
                    "weight": item.weight_kg if item.weight_kg is not None else "",
                    "rest": item.rest_seconds if item.rest_seconds is not None else "",
                    "rir": item.rir if item.rir is not None else "",
                    "rpe": item.rpe if item.rpe is not None else "",
                    "pain": bool(item.pain_flag),
                    "notes": sanitize_text(item.notes),
                }
                for item in exercise.sets
            ],
        }

    def _current_template(self) -> SessionTemplate | None:
        return self.context.repository.get_template(self._focus)

    def apply_template(self) -> None:
        template = self._current_template()
        self._current_template_id = template.id if template else None
        self._current_session_id = None
        self._pre_checkin_id = None
        self._template_summary = self._template_to_summary(template)
        self._session_exercises = []
        if template:
            for item in template.exercises:
                draft = SessionExercise(
                    exercise_name=item.exercise_name,
                    goal=item.notes,
                    notes=item.notes,
                    target_sets=item.default_sets,
                    target_reps=item.default_reps,
                    target_weight_kg=item.default_weight_kg,
                    target_rest_seconds=item.default_rest_seconds,
                    target_rir=item.target_rir,
                    progression_rule=item.progression_rule,
                    sets=[
                        WorkoutSet(
                            exercise_name=item.exercise_name,
                            set_type=item.set_type,
                            reps=self._first_rep(item.default_reps),
                            weight_kg=item.default_weight_kg,
                            rest_seconds=item.default_rest_seconds,
                            rir=item.target_rir,
                        )
                        for _ in range(item.default_sets)
                    ],
                )
                self._session_exercises.append(self._exercise_dict(draft))
        self._selected_exercise_index = 0

    def load_session(self, session_id: int) -> None:
        session = self.context.repository.get_session(session_id)
        if not session:
            return
        self._current_session_id = session.id
        self._current_template_id = session.source_template_id
        self._pre_checkin_id = session.pre_checkin_id
        self._focus = sanitize_text(session.title)
        self._meta = {
            "sessionDate": session.session_date,
            "blockName": sanitize_text(session.block_name),
            "status": sanitize_text(session.completion_status),
            "energy": session.perceived_energy or 0,
            "duration": session.duration_minutes or 0,
            "notes": sanitize_text(session.notes),
        }
        self._session_exercises = [self._exercise_dict(item) for item in session.exercises]
        pre = self.context.repository.get_latest_coach_checkin(phase="pre", focus=self._focus)
        if pre:
            self._pre_checkin = {
                "sleepHours": pre.sleep_hours or 0,
                "energy": pre.energy or 0,
                "soreness": pre.soreness or 0,
                "fatigue": pre.fatigue or 0,
                "motivation": pre.motivation or 0,
                "intent": sanitize_text(pre.training_intent or "moderada"),
                "painPoints": sanitize_text(pre.pain_points),
                "notes": sanitize_text(pre.notes),
            }
        self._template_summary = self._template_to_summary(self._current_template())
        self._selected_exercise_index = 0
        self.refresh()

    @Slot(str)
    def set_focus(self, focus: str) -> None:
        clean = sanitize_text(focus)
        if clean and clean != self._focus:
            self._focus = clean
            self.context.repository.set_setting("active_focus", clean)
            self.apply_template()
            self.shell_vm.refresh()
            self.refresh()
            self.dataChanged.emit()

    @Slot(str)
    def set_library_search(self, value: str) -> None:
        self._library_search = sanitize_text(value)
        self.refresh()

    @Slot(str)
    def set_library_category(self, value: str) -> None:
        self._library_category = sanitize_text(value)
        self.refresh()

    @Slot(int)
    def select_exercise(self, index: int) -> None:
        self._selected_exercise_index = max(0, index)
        self.refresh()

    @Slot(str)
    def add_library_exercise(self, name: str) -> None:
        clean = sanitize_text(name)
        if not clean:
            return
        self._session_exercises.append(
            {
                "name": clean,
                "goal": "",
                "notes": "",
                "targetSets": 3,
                "targetReps": "8-12",
                "targetWeight": "",
                "targetRest": 90,
                "targetRir": 2,
                "progressionRule": "",
                "sets": [
                    {
                        "type": "trabajo",
                        "reps": 8,
                        "weight": "",
                        "rest": 90,
                        "rir": 2,
                        "rpe": "",
                        "pain": False,
                        "notes": "",
                    }
                    for _ in range(3)
                ],
            }
        )
        self._selected_exercise_index = len(self._session_exercises) - 1
        self.refresh()

    @Slot()
    def add_empty_exercise(self) -> None:
        next_number = len(self._session_exercises) + 1
        self.add_library_exercise(f"Ejercicio {next_number}")

    @Slot(int)
    def remove_exercise(self, index: int) -> None:
        if 0 <= index < len(self._session_exercises):
            self._session_exercises.pop(index)
            self._selected_exercise_index = max(0, min(self._selected_exercise_index, len(self._session_exercises) - 1))
            self.refresh()

    @Slot(int)
    def duplicate_exercise(self, index: int) -> None:
        if 0 <= index < len(self._session_exercises):
            cloned = deep_jsonable(self._session_exercises[index])
            self._session_exercises.insert(index + 1, cloned)
            self._selected_exercise_index = index + 1
            self.refresh()

    @Slot(int, int)
    def move_exercise(self, index: int, delta: int) -> None:
        target = index + delta
        if 0 <= index < len(self._session_exercises) and 0 <= target < len(self._session_exercises):
            item = self._session_exercises.pop(index)
            self._session_exercises.insert(target, item)
            self._selected_exercise_index = target
            self.refresh()

    @Slot(str, "QVariant")
    def update_meta(self, field: str, value: Any) -> None:
        self._meta[field] = value
        self.refresh()

    @Slot(str, "QVariant")
    def update_pre_checkin(self, field: str, value: Any) -> None:
        self._pre_checkin[field] = value
        self.refresh()

    @Slot(int, str, "QVariant")
    def update_exercise_field(self, index: int, field: str, value: Any) -> None:
        if 0 <= index < len(self._session_exercises):
            self._session_exercises[index][field] = value
            self.refresh()

    @Slot(int, int)
    def add_set(self, exercise_index: int, after_index: int = -1) -> None:
        if 0 <= exercise_index < len(self._session_exercises):
            sets = self._session_exercises[exercise_index]["sets"]
            position = len(sets) if after_index < 0 else min(len(sets), after_index + 1)
            sets.insert(
                position,
                {"type": "trabajo", "reps": "", "weight": "", "rest": 90, "rir": "", "rpe": "", "pain": False, "notes": ""},
            )
            self.refresh()

    @Slot(int, int)
    def remove_set(self, exercise_index: int, set_index: int) -> None:
        if 0 <= exercise_index < len(self._session_exercises):
            sets = self._session_exercises[exercise_index]["sets"]
            if 0 <= set_index < len(sets):
                sets.pop(set_index)
                if not sets:
                    sets.append(
                        {"type": "trabajo", "reps": "", "weight": "", "rest": 90, "rir": "", "rpe": "", "pain": False, "notes": ""}
                    )
                self.refresh()

    @Slot(int, int)
    def duplicate_set(self, exercise_index: int, set_index: int) -> None:
        if 0 <= exercise_index < len(self._session_exercises):
            sets = self._session_exercises[exercise_index]["sets"]
            if 0 <= set_index < len(sets):
                cloned = deep_jsonable(sets[set_index])
                sets.insert(set_index + 1, cloned)
                self.refresh()

    @Slot(int, int, str, "QVariant")
    def update_set_field(self, exercise_index: int, set_index: int, field: str, value: Any) -> None:
        if 0 <= exercise_index < len(self._session_exercises):
            sets = self._session_exercises[exercise_index]["sets"]
            if 0 <= set_index < len(sets):
                sets[set_index][field] = value
                self.refresh()

    @Slot()
    def save_pre_checkin(self) -> None:
        self._pre_checkin_id = self.context.repository.save_coach_checkin(
            CoachCheckIn(
                checkin_date=sanitize_text(self._meta.get("sessionDate") or date.today().strftime("%Y-%m-%d")),
                phase="pre",
                focus=self._focus,
                sleep_hours=self._float_value(self._pre_checkin.get("sleepHours")),
                energy=self._int_value(self._pre_checkin.get("energy")),
                soreness=self._int_value(self._pre_checkin.get("soreness")),
                fatigue=self._int_value(self._pre_checkin.get("fatigue")),
                motivation=self._int_value(self._pre_checkin.get("motivation")),
                training_intent=sanitize_text(self._pre_checkin.get("intent")),
                pain_points=sanitize_text(self._pre_checkin.get("painPoints")),
                notes=sanitize_text(self._pre_checkin.get("notes")),
            )
        )
        self.refresh()
        self._toast("Check-in previo guardado.")
        self.dataChanged.emit()

    @Slot()
    def discard_session(self) -> None:
        self.apply_template()
        self.refresh()
        self._toast("Sesión restaurada desde la plantilla activa.")

    @Slot()
    def save_template(self) -> None:
        if not self._session_exercises:
            self._toast("Agrega al menos un ejercicio antes de guardar la plantilla.")
            return
        template = SessionTemplate(
            id=self._current_template_id,
            focus=self._focus,
            name=f"{self._focus} premium",
            description=f"Plantilla editable para {self._focus}.",
            goal=sanitize_text(self._meta.get("notes")) or f"Plantilla base de {self._focus}",
            exercises=[],
        )
        for index, exercise in enumerate(self._session_exercises, start=1):
            sets = exercise.get("sets", [])
            template.exercises.append(
                TemplateExercise(
                    exercise_name=sanitize_text(exercise.get("name")),
                    exercise_order=index,
                    set_type=sanitize_text(sets[0].get("type", "trabajo")) if sets else "trabajo",
                    default_sets=self._int_value(exercise.get("targetSets")) or max(len(sets), 1),
                    default_reps=sanitize_text(exercise.get("targetReps")) or "8-12",
                    default_weight_kg=self._float_value(exercise.get("targetWeight")),
                    default_rest_seconds=self._int_value(exercise.get("targetRest")) or 90,
                    target_rir=self._float_value(exercise.get("targetRir")),
                    progression_rule=sanitize_text(exercise.get("progressionRule")),
                    notes=sanitize_text(exercise.get("notes")),
                )
            )
        self._current_template_id = self.context.repository.save_template(template)
        self._template_summary = self._template_to_summary(self._current_template())
        self.refresh()
        self._toast("Plantilla guardada para el foco actual.")
        self.dataChanged.emit()

    @Slot()
    def save_session(self) -> None:
        if not self._session_exercises:
            self._toast("Agrega al menos un ejercicio antes de guardar la sesión.")
            return
        session_exercises: list[SessionExercise] = []
        for exercise in self._session_exercises:
            sets: list[WorkoutSet] = []
            for set_index, item in enumerate(exercise.get("sets", []), start=1):
                sets.append(
                    WorkoutSet(
                        exercise_name=sanitize_text(exercise.get("name")),
                        set_order=set_index,
                        set_type=sanitize_text(item.get("type")) or "trabajo",
                        reps=self._int_value(item.get("reps")),
                        weight_kg=self._float_value(item.get("weight")),
                        rest_seconds=self._int_value(item.get("rest")),
                        rir=self._float_value(item.get("rir")),
                        rpe=self._float_value(item.get("rpe")),
                        pain_flag=bool(item.get("pain")),
                        notes=sanitize_text(item.get("notes")),
                    )
                )
            session_exercises.append(
                SessionExercise(
                    exercise_name=sanitize_text(exercise.get("name")),
                    goal=sanitize_text(exercise.get("goal")),
                    notes=sanitize_text(exercise.get("notes")),
                    target_sets=self._int_value(exercise.get("targetSets")),
                    target_reps=sanitize_text(exercise.get("targetReps")),
                    target_weight_kg=self._float_value(exercise.get("targetWeight")),
                    target_rest_seconds=self._int_value(exercise.get("targetRest")),
                    target_rir=self._float_value(exercise.get("targetRir")),
                    progression_rule=sanitize_text(exercise.get("progressionRule")),
                    sets=sets,
                )
            )
        session = WorkoutSession(
            id=self._current_session_id,
            session_date=sanitize_text(self._meta.get("sessionDate") or date.today().strftime("%Y-%m-%d")),
            title=self._focus,
            block_name=sanitize_text(self._meta.get("blockName")),
            notes=sanitize_text(self._meta.get("notes")),
            planned_focus=self._focus,
            completion_status=sanitize_text(self._meta.get("status")) or "completado",
            perceived_energy=self._int_value(self._meta.get("energy")),
            duration_minutes=self._int_value(self._meta.get("duration")),
            source_template_id=self._current_template_id,
            readiness_score=self._compute_readiness(),
            pre_checkin_id=self._pre_checkin_id,
            unit_system=sanitize_text(self.context.repository.get_fitness_profile().preferred_unit or "metric"),
            exercises=session_exercises,
        )
        self._current_session_id = self.context.repository.save_session(session)
        self.context.repository.set_setting("active_focus", self._focus)
        self.shell_vm.refresh()
        self.refresh()
        self._toast("Sesión guardada correctamente.")
        self.dataChanged.emit()

    def _compute_readiness(self) -> int | None:
        values = [
            self._int_value(self._pre_checkin.get("energy")) or 0,
            self._int_value(self._pre_checkin.get("motivation")) or 0,
            min(int(self._float_value(self._pre_checkin.get("sleepHours")) or 0), 10),
        ]
        penalties = [
            self._int_value(self._pre_checkin.get("soreness")) or 0,
            self._int_value(self._pre_checkin.get("fatigue")) or 0,
        ]
        if not any(values):
            return None
        raw = ((values[0] + values[1] + values[2]) / 3) - (sum(penalties) / 10)
        return max(1, min(10, round(raw)))

    def _first_rep(self, value: str) -> int | None:
        text = sanitize_text(value).split("-")[0].replace("min", "").replace("m", "").strip()
        try:
            return int(float(text))
        except ValueError:
            return None


class ExerciseLibraryViewModel(BasePageViewModel):
    def __init__(self, context: AppContext, shell_vm: AppShellViewModel) -> None:
        super().__init__(context, shell_vm)
        self._filters = {
            "search": "",
            "category": "Todas",
            "equipment": "Todos",
            "modality": "Todas",
            "origin": "Todos",
        }
        self._selected_exercise_id: int | None = None

    def refresh(self) -> None:
        search = sanitize_text(self._filters["search"])
        category = "" if self._filters["category"] in ("", "Todas") else self._filters["category"]
        equipment = "" if self._filters["equipment"] in ("", "Todos") else self._filters["equipment"]
        modality = "" if self._filters["modality"] in ("", "Todas") else self._filters["modality"]
        origin = "" if self._filters["origin"] == "Todos" else self._filters["origin"]
        exercises = self.context.repository.list_exercises(
            search, category=category, equipment=equipment, modality=modality, origin=origin
        )
        if self._selected_exercise_id is None and exercises:
            self._selected_exercise_id = exercises[0].id
        selected = next((item for item in exercises if item.id == self._selected_exercise_id), exercises[0] if exercises else None)
        category_counts = Counter(sanitize_text(item.category or "Sin categoria") for item in exercises)
        custom_count = sum(1 for item in exercises if item.is_custom)
        compound_count = sum(1 for item in exercises if item.is_compound)
        distinct_equipment = len({sanitize_text(item.equipment) for item in exercises if sanitize_text(item.equipment)})
        self._set_state(
            {
                "filters": deep_jsonable(self._filters),
                "filterOptions": {
                    "categories": ["Todas"] + [
                        sanitize_text(item) for item in self.context.repository.list_exercise_categories()
                    ],
                    "equipments": ["Todos"] + [
                        sanitize_text(item) for item in self.context.repository.list_exercise_equipments()
                    ],
                    "modalities": ["Todas"] + [
                        sanitize_text(item) for item in self.context.repository.list_exercise_modalities()
                    ],
                    "origins": ["Todos", "base", "personalizado"],
                },
                "items": [
                    {
                        "id": item.id,
                        "name": sanitize_text(item.name),
                        "category": sanitize_text(item.category),
                        "pattern": sanitize_text(item.movement_pattern),
                        "equipment": sanitize_text(item.equipment),
                        "difficulty": sanitize_text(item.difficulty),
                        "modality": sanitize_text(item.modality),
                        "origin": "personalizado" if item.is_custom else "base",
                    }
                    for item in exercises
                ],
                "selected": self._exercise_detail(selected),
                "summaryCards": [
                    {
                        "title": "Catalogo visible",
                        "value": format_number(len(exercises)),
                        "caption": "Resultados con el filtro actual",
                    },
                    {
                        "title": "Personalizados",
                        "value": format_number(custom_count),
                        "caption": "Ejercicios creados por ti",
                    },
                    {
                        "title": "Compuestos",
                        "value": format_number(compound_count),
                        "caption": "Buenos para progreso global",
                    },
                    {
                        "title": "Equipos activos",
                        "value": format_number(distinct_equipment),
                        "caption": "Diversidad del catalogo visible",
                    },
                ],
                "categoryHighlights": [
                    {"label": label, "count": count}
                    for label, count in category_counts.most_common(5)
                ],
                "selectedInsights": self._exercise_insights(selected),
                "emptyExercise": self._empty_exercise_payload(),
            }
        )

    def _empty_exercise_payload(self) -> dict[str, Any]:
        return {
            "id": 0,
            "name": "",
            "category": "",
            "modality": "fuerza",
            "movementPattern": "",
            "primaryMuscles": [],
            "secondaryMuscles": [],
            "equipment": "",
            "difficulty": "Intermedio",
            "loadType": "peso",
            "defaultUnit": "kg",
            "variantGroup": "",
            "cues": "",
            "technicalNotes": "",
            "alternatives": [],
            "isCustom": True,
            "status": "activo",
        }

    def _exercise_detail(self, item: ExerciseDefinition | None) -> dict[str, Any]:
        if not item:
            return self._empty_exercise_payload()
        return {
            "id": item.id,
            "name": sanitize_text(item.name),
            "category": sanitize_text(item.category),
            "modality": sanitize_text(item.modality),
            "movementPattern": sanitize_text(item.movement_pattern),
            "primaryMuscles": [sanitize_text(value) for value in item.primary_muscles],
            "secondaryMuscles": [sanitize_text(value) for value in item.secondary_muscles],
            "equipment": sanitize_text(item.equipment),
            "difficulty": sanitize_text(item.difficulty),
            "loadType": sanitize_text(item.load_type),
            "defaultUnit": sanitize_text(item.default_unit),
            "variantGroup": sanitize_text(item.variant_group),
            "cues": sanitize_text(item.cues),
            "technicalNotes": sanitize_text(item.technical_notes),
            "alternatives": [sanitize_text(value) for value in item.alternatives],
            "isCompound": bool(item.is_compound),
            "isCustom": bool(item.is_custom),
            "status": sanitize_text(item.status),
        }

    def _exercise_insights(self, item: ExerciseDefinition | None) -> list[str]:
        if not item:
            return [
                "Selecciona un ejercicio para revisar su semantica, tipo de carga y contexto tecnico.",
                "Cuando el modelo esta limpio, el tracking y las recomendaciones dejan de ser genericos.",
            ]
        lines = [
            f"{sanitize_text(item.category)} · {sanitize_text(item.modality)} · {sanitize_text(item.equipment)}",
        ]
        if item.primary_muscles:
            lines.append("Principal: " + ", ".join(sanitize_text(value) for value in item.primary_muscles[:3]))
        if item.secondary_muscles:
            lines.append("Secundario: " + ", ".join(sanitize_text(value) for value in item.secondary_muscles[:3]))
        if item.variant_group:
            lines.append("Grupo de variante: " + sanitize_text(item.variant_group))
        if item.technical_notes:
            lines.append(sanitize_text(item.technical_notes))
        elif item.cues:
            lines.append(sanitize_text(item.cues))
        else:
            lines.append("Anade cues o notas para que el coach entienda mejor como quieres ejecutar este movimiento.")
        return lines

    @Slot(str, str)
    def set_filter(self, field: str, value: str) -> None:
        self._filters[field] = sanitize_text(value)
        self.refresh()

    @Slot(int)
    def select_exercise(self, exercise_id: int) -> None:
        self._selected_exercise_id = exercise_id
        self.refresh()

    @Slot(str)
    def save_exercise(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        exercise = ExerciseDefinition(
            id=self._int_value(payload.get("id")),
            name=sanitize_text(payload.get("name")),
            canonical_name=sanitize_text(payload.get("canonical_name") or payload.get("name")),
            category=sanitize_text(payload.get("category")),
            modality=sanitize_text(payload.get("modality") or "fuerza"),
            movement_pattern=sanitize_text(payload.get("movementPattern")),
            primary_muscles=[sanitize_text(item) for item in payload.get("primaryMuscles", [])],
            secondary_muscles=[sanitize_text(item) for item in payload.get("secondaryMuscles", [])],
            equipment=sanitize_text(payload.get("equipment")),
            difficulty=sanitize_text(payload.get("difficulty") or "Intermedio"),
            load_type=sanitize_text(payload.get("loadType") or "peso"),
            default_unit=sanitize_text(payload.get("defaultUnit") or "kg"),
            cues=sanitize_text(payload.get("cues")),
            technical_notes=sanitize_text(payload.get("technicalNotes")),
            variant_group=sanitize_text(payload.get("variantGroup")),
            alternatives=[sanitize_text(item) for item in payload.get("alternatives", [])],
            is_compound=bool(payload.get("isCompound", False)),
            is_custom=bool(payload.get("isCustom", True)),
            status=sanitize_text(payload.get("status") or "activo"),
        )
        try:
            self._selected_exercise_id = self.context.repository.save_exercise(exercise)
        except ValueError as exc:
            self._toast(str(exc))
            return
        self.refresh()
        self._toast("Ejercicio guardado.")
        self.dataChanged.emit()


class HistoryViewModel(BasePageViewModel):
    editSessionRequested = Signal(int)

    def __init__(self, context: AppContext, shell_vm: AppShellViewModel) -> None:
        super().__init__(context, shell_vm)
        self._filters = {"search": "", "focus": "Todos", "status": "Todos"}
        self._selected_session_id: int | None = None

    def refresh(self) -> None:
        focus = "" if self._filters["focus"] == "Todos" else self._filters["focus"]
        status = "" if self._filters["status"] == "Todos" else self._filters["status"]
        rows = self.context.repository.list_session_summaries(
            limit=300,
            focus=focus,
            status=status,
            search=sanitize_text(self._filters["search"]),
        )
        if self._selected_session_id is None and rows:
            self._selected_session_id = rows[0]["id"]
        selected = next((item for item in rows if item["id"] == self._selected_session_id), rows[0] if rows else None)
        detail = self._session_detail(selected["id"]) if selected else {}
        focus_for_chart = sanitize_text(detail.get("title") or focus)
        readiness_values = [item["readiness_score"] for item in rows if item["readiness_score"] is not None]
        average_readiness = round(sum(readiness_values) / len(readiness_values), 1) if readiness_values else None
        total_volume = round(sum(item["volume"] for item in rows), 0) if rows else 0
        completed_count = sum(1 for item in rows if sanitize_text(item["completion_status"]) == "completado")
        focus_breakdown = Counter(sanitize_text(item["title"]) for item in rows)
        self._set_state(
            {
                "filters": deep_jsonable(self._filters),
                "focusOptions": ["Todos"] + [sanitize_text(item) for item in self.context.repository.list_session_titles()],
                "statusOptions": ["Todos", "completado", "parcial", "omitido"],
                "sessions": [
                    {
                        "id": item["id"],
                        "date": item["session_date"],
                        "title": sanitize_text(item["title"]),
                        "block": sanitize_text(item["block_name"] or ""),
                        "status": sanitize_text(item["completion_status"]),
                        "readiness": item["readiness_score"] if item["readiness_score"] is not None else "-",
                        "setCount": item["set_count"],
                        "exerciseCount": item["exercise_count"],
                        "volume": round(item["volume"], 0),
                    }
                    for item in rows
                ],
                "selected": detail,
                "summaryCards": [
                    {
                        "title": "Sesiones visibles",
                        "value": format_number(len(rows)),
                        "caption": "Resultado del filtro actual",
                    },
                    {
                        "title": "Completadas",
                        "value": format_number(completed_count),
                        "caption": "Sesiones cerradas con normalidad",
                    },
                    {
                        "title": "Readiness medio",
                        "value": format_number(average_readiness),
                        "caption": "Promedio del filtro actual",
                    },
                    {
                        "title": "Volumen total",
                        "value": format_number(total_volume, " kg"),
                        "caption": "Carga acumulada de este subconjunto",
                    },
                ],
                "focusBreakdown": [
                    {"label": label, "count": count}
                    for label, count in focus_breakdown.most_common(5)
                ],
                "selectionInsights": self._selection_insights(detail),
                "focusSeries": [
                    {"label": label, "value": value}
                    for label, value in self.context.analytics.volume_series(120, focus_for_chart)
                ],
            }
        )

    def _session_detail(self, session_id: int) -> dict[str, Any]:
        session = self.context.repository.get_session(session_id)
        if not session:
            return {}
        volume = sum((item.weight_kg or 0) * (item.reps or 0) for item in session.sets)
        return {
            "id": session.id,
            "date": session.session_date,
            "title": sanitize_text(session.title),
            "block": sanitize_text(session.block_name),
            "status": sanitize_text(session.completion_status),
            "readiness": session.readiness_score if session.readiness_score is not None else "-",
            "volume": round(volume, 0),
            "notes": sanitize_text(session.notes),
            "exercises": [
                {
                    "name": sanitize_text(exercise.exercise_name),
                    "sets": len(exercise.sets),
                    "topWeight": max((item.weight_kg or 0) for item in exercise.sets) if exercise.sets else "-",
                    "topReps": max((item.reps or 0) for item in exercise.sets) if exercise.sets else "-",
                    "notes": sanitize_text(exercise.notes or (exercise.sets[0].notes if exercise.sets else "")),
                }
                for exercise in session.exercises
            ],
        }

    def _selection_insights(self, detail: dict[str, Any]) -> list[str]:
        if not detail:
            return [
                "Selecciona una sesion para revisar volumen, readiness y calidad del registro.",
                "Esta vista funciona mejor cuando tus notas justifican cambios o decisiones de carga.",
            ]
        insights = [
            f"Sesion {sanitize_text(detail.get('status'))} con {detail.get('volume', '-')} kg de volumen total.",
        ]
        readiness = detail.get("readiness")
        if readiness not in ("-", None, ""):
            readiness_value = float(readiness)
            if readiness_value < 5:
                insights.append("El readiness fue bajo. Conviene revisar si la siguiente sesion pide menos agresividad.")
            elif readiness_value >= 8:
                insights.append("El readiness fue alto. Buen momento para detectar progresion o repetir una estructura parecida.")
        if detail.get("notes"):
            insights.append("La sesion tiene notas guardadas, asi que ya hay contexto para justificar ajustes.")
        else:
            insights.append("Faltan notas globales. Agregarlas ayuda a explicar molestias, energia o decisiones de carga.")
        if detail.get("exercises"):
            top_exercise = max(
                detail["exercises"],
                key=lambda item: float(item.get("topWeight") or 0),
            )
            insights.append(
                f"El movimiento mas pesado fue {sanitize_text(top_exercise.get('name'))} con {top_exercise.get('topWeight')} kg."
            )
        return insights

    @Slot(str, str)
    def set_filter(self, field: str, value: str) -> None:
        self._filters[field] = sanitize_text(value)
        self.refresh()

    @Slot(int)
    def select_session(self, session_id: int) -> None:
        self._selected_session_id = session_id
        self.refresh()

    @Slot(int)
    def open_session_for_edit(self, session_id: int) -> None:
        self.editSessionRequested.emit(session_id)

    @Slot(int)
    def delete_session(self, session_id: int) -> None:
        self.context.repository.delete_session(session_id)
        if self._selected_session_id == session_id:
            self._selected_session_id = None
        self.refresh()
        self._toast("Sesión eliminada.")
        self.dataChanged.emit()


class PlanViewModel(BasePageViewModel):
    def __init__(self, context: AppContext, shell_vm: AppShellViewModel) -> None:
        super().__init__(context, shell_vm)
        self._focus = ""

    def refresh(self) -> None:
        focus = self._focus or sanitize_text(
            self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
        )
        self._focus = focus
        plan = self.context.planner.generate_next_session_plan(focus)
        goals = self.context.repository.list_training_goals()
        blocks = self.context.repository.list_training_blocks()
        profile = self.context.repository.get_fitness_profile()
        active_block = next((item for item in blocks if sanitize_text(item.focus) == focus and item.status == "activo"), None)
        recent_recs = self.context.repository.list_recent_recommendations(limit=8, focus=focus)
        active_goals = [item for item in goals if sanitize_text(item.status) == "activo"]
        self._set_state(
            {
                "focus": focus,
                "focusOptions": self._focus_options(),
                "summary": sanitize_text(plan["summary"]),
                "summaryCards": [
                    {
                        "title": "Bloque activo",
                        "value": sanitize_text(active_block.name if active_block else "Sin bloque"),
                        "caption": sanitize_text(active_block.phase_type if active_block else "Define uno para orientar el foco"),
                    },
                    {
                        "title": "Metas activas",
                        "value": format_number(len(active_goals)),
                        "caption": "Prioridades que siguen abiertas",
                    },
                    {
                        "title": "Items hoy",
                        "value": format_number(len(plan["items"])),
                        "caption": "Movimientos sugeridos en esta sesion",
                    },
                    {
                        "title": "Recomendaciones",
                        "value": format_number(len(recent_recs)),
                        "caption": "Ajustes recientes del sistema",
                    },
                ],
                "reasons": [sanitize_text(item) for item in plan["reasons"]],
                "watchToday": [sanitize_text(item) for item in plan["watch_today"]],
                "items": [
                    {
                        "exercise": sanitize_text(item["exercise"]),
                        "sets": item["sets"],
                        "reps": sanitize_text(item["reps"]),
                        "weight": item["weight"] if item["weight"] not in ("", None) else "-",
                        "rest": item["rest"] if item["rest"] not in ("", None) else "-",
                        "rir": item["rir"] if item["rir"] not in ("", None) else "-",
                        "notes": sanitize_text(item["notes"]),
                    }
                    for item in plan["items"]
                ],
                "actionLanes": self._action_lanes(plan),
                "blockInsights": self._block_insights(active_block, profile),
                "goalInsights": self._goal_insights(active_goals),
                "goals": [self._goal_summary(item) for item in goals],
                "blocks": [self._block_summary(item) for item in blocks],
                "activeBlock": self._block_summary(active_block) if active_block else {},
                "recommendations": [self._recommendation_summary(item) for item in recent_recs],
                "blankGoal": self._blank_goal(),
                "blankBlock": self._blank_block(focus),
            }
        )

    def _focus_options(self) -> list[str]:
        options = [sanitize_text(item.focus) for item in self.context.repository.list_templates()]
        for focus in getattr(self.context.repository, "DEFAULT_FOCUSES", []):
            clean = sanitize_text(focus)
            if clean not in options:
                options.append(clean)
        return options or ["Full Body"]

    def _goal_summary(self, goal: TrainingGoal) -> dict[str, Any]:
        return {
            "id": goal.id,
            "name": sanitize_text(goal.name),
            "metric": sanitize_text(goal.target_metric),
            "startValue": goal.start_value if goal.start_value is not None else "-",
            "targetValue": goal.target_value if goal.target_value is not None else "-",
            "unit": sanitize_text(goal.unit),
            "dueDate": sanitize_text(goal.due_date),
            "priority": sanitize_text(goal.priority),
            "status": sanitize_text(goal.status),
            "notes": sanitize_text(goal.notes),
        }

    def _block_summary(self, block: TrainingBlock | None) -> dict[str, Any]:
        if not block:
            return {}
        return {
            "id": block.id,
            "name": sanitize_text(block.name),
            "focus": sanitize_text(block.focus),
            "phaseType": sanitize_text(block.phase_type),
            "objective": sanitize_text(block.objective),
            "weeklyFrequency": block.weekly_frequency if block.weekly_frequency is not None else "-",
            "startDate": sanitize_text(block.start_date),
            "endDate": sanitize_text(block.end_date),
            "status": sanitize_text(block.status),
            "notes": sanitize_text(block.notes),
            "progressionNotes": sanitize_text(block.progression_notes),
        }

    def _recommendation_summary(self, item: Recommendation) -> dict[str, Any]:
        return {
            "title": sanitize_text(item.title),
            "summary": sanitize_text(item.summary),
            "action": sanitize_text(item.action_type),
            "confidence": round(item.confidence * 100, 0) if item.confidence <= 1 else round(item.confidence, 0),
            "status": sanitize_text(item.status),
        }

    def _action_lanes(self, plan: dict[str, Any]) -> list[dict[str, str]]:
        lanes: list[dict[str, str]] = []
        for item in plan.get("items", [])[:4]:
            weight = item["weight"] if item["weight"] not in ("", None) else "por sensaciones"
            lanes.append(
                {
                    "title": sanitize_text(item["exercise"]),
                    "detail": (
                        f"{item['sets']} x {sanitize_text(item['reps'])} | {weight} | "
                        f"descanso {item['rest']} | RIR {item['rir']}"
                    ),
                    "note": sanitize_text(item["notes"]),
                }
            )
        if not lanes:
            lanes.append(
                {
                    "title": "Sin items sugeridos",
                    "detail": "Necesitas una plantilla o historial para generar una sesion mas precisa.",
                    "note": "Empieza por Entrenar y guarda una base reutilizable.",
                }
            )
        return lanes

    def _block_insights(self, block: TrainingBlock | None, profile: FitnessProfile) -> list[str]:
        if not block:
            return [
                "Todavia no hay un bloque activo para este foco.",
                "Crear un bloque ayuda a fijar frecuencia, objetivo y tono de progresion.",
                (
                    "Tu preferencia actual es "
                    + sanitize_text(profile.preferred_focus or "sin foco definido")
                    + ". Puedes usarla como punto de partida."
                ),
            ]
        insights = [
            f"{sanitize_text(block.phase_type)} con {block.weekly_frequency or '-'} dias por semana.",
            sanitize_text(block.objective or "Falta definir un objetivo explicito para este bloque."),
        ]
        if block.progression_notes:
            insights.append(sanitize_text(block.progression_notes))
        elif block.notes:
            insights.append(sanitize_text(block.notes))
        else:
            insights.append("Agrega notas de progresion para dejar claro que debe subir, mantenerse o bajar.")
        return insights

    def _goal_insights(self, goals: list[TrainingGoal]) -> list[str]:
        if not goals:
            return [
                "No hay metas activas todavia.",
                "Define al menos una meta de fuerza, peso o recomposicion para dar direccion al plan.",
            ]
        lines: list[str] = []
        for goal in goals[:3]:
            lines.append(
                f"{sanitize_text(goal.name)}: {goal.start_value if goal.start_value is not None else '-'} -> "
                f"{goal.target_value if goal.target_value is not None else '-'} {sanitize_text(goal.unit)}."
            )
        return lines

    def _blank_goal(self) -> dict[str, Any]:
        return {
            "id": 0,
            "name": "",
            "targetMetric": "peso",
            "startValue": "",
            "targetValue": "",
            "unit": "kg",
            "dueDate": "",
            "priority": "media",
            "status": "activo",
            "notes": "",
        }

    def _blank_block(self, focus: str) -> dict[str, Any]:
        return {
            "id": 0,
            "name": "",
            "focus": focus,
            "phaseType": "acumulación",
            "objective": "",
            "weeklyFrequency": 3,
            "startDate": date.today().strftime("%Y-%m-%d"),
            "endDate": "",
            "status": "activo",
            "notes": "",
            "progressionNotes": "",
        }

    @Slot(str)
    def set_focus(self, focus: str) -> None:
        clean = sanitize_text(focus)
        if clean:
            self._focus = clean
            self.context.repository.set_setting("active_focus", clean)
            self.shell_vm.refresh()
            self.refresh()
            self.dataChanged.emit()

    @Slot(str)
    def save_goal(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        goal = TrainingGoal(
            id=self._int_value(payload.get("id")),
            name=sanitize_text(payload.get("name")),
            target_metric=sanitize_text(payload.get("targetMetric")),
            start_value=self._float_value(payload.get("startValue")),
            target_value=self._float_value(payload.get("targetValue")),
            unit=sanitize_text(payload.get("unit")),
            due_date=sanitize_text(payload.get("dueDate")),
            priority=sanitize_text(payload.get("priority") or "media"),
            status=sanitize_text(payload.get("status") or "activo"),
            notes=sanitize_text(payload.get("notes")),
        )
        if not goal.name:
            self._toast("La meta necesita un nombre.")
            return
        self.context.repository.save_goal(goal)
        self.refresh()
        self._toast("Meta guardada.")
        self.dataChanged.emit()

    @Slot(str)
    def save_block(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        block = TrainingBlock(
            id=self._int_value(payload.get("id")),
            name=sanitize_text(payload.get("name")),
            focus=sanitize_text(payload.get("focus") or self._focus),
            phase_type=sanitize_text(payload.get("phaseType")),
            objective=sanitize_text(payload.get("objective")),
            weekly_frequency=self._int_value(payload.get("weeklyFrequency")),
            start_date=sanitize_text(payload.get("startDate")),
            end_date=sanitize_text(payload.get("endDate")),
            status=sanitize_text(payload.get("status") or "activo"),
            notes=sanitize_text(payload.get("notes")),
            progression_notes=sanitize_text(payload.get("progressionNotes")),
        )
        if not block.name:
            self._toast("El bloque necesita un nombre.")
            return
        self.context.repository.save_block(block)
        self.refresh()
        self._toast("Bloque guardado.")
        self.dataChanged.emit()


class BodyViewModel(BasePageViewModel):
    def refresh(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        checkins = self.context.repository.list_body_checkins(limit=120)
        latest = checkins[0] if checkins else None
        weight_series = [{"label": label, "value": value} for label, value in self.context.analytics.weight_series(180)]
        wizard_steps = self._wizard_steps(profile, latest)
        onboarding_complete = all(step["done"] for step in wizard_steps)
        self._set_state(
            {
                "profile": self._profile_summary(profile),
                "latestCheckin": self._body_summary(latest) if latest else {},
                "checkins": [self._body_summary(item) for item in checkins[:12]],
                "weightSeries": weight_series,
                "wizard": {
                    "steps": wizard_steps,
                    "complete": onboarding_complete,
                    "nextLabel": next((step["title"] for step in wizard_steps if not step["done"]), "Seguimiento continuo"),
                },
                "summaryCards": self._summary_cards(profile, latest),
                "blankProfile": self._profile_summary(profile),
                "blankCheckin": self._blank_checkin(profile, latest),
            }
        )

    def _wizard_steps(self, profile: FitnessProfile, latest: BodyCheckIn | None) -> list[dict[str, Any]]:
        return [
            {
                "title": "Perfil base",
                "description": "Nombre visible, sexo, edad y altura.",
                "done": bool(profile.display_name and profile.height_cm),
            },
            {
                "title": "Objetivo",
                "description": "Meta principal, experiencia y disponibilidad semanal.",
                "done": bool(profile.primary_goal and profile.experience_level and profile.weekly_availability),
            },
            {
                "title": "Contexto",
                "description": "Equipo disponible, limitaciones y estilo de intensidad.",
                "done": bool(profile.equipment_access or profile.limitations or profile.intensity_preference),
            },
            {
                "title": "Primer check-in",
                "description": "Peso, medidas y calorías objetivo para empezar a trackear.",
                "done": latest is not None and latest.weight_kg is not None,
            },
        ]

    def _profile_summary(self, profile: FitnessProfile) -> dict[str, Any]:
        return {
            "displayName": sanitize_text(profile.display_name),
            "primaryGoal": sanitize_text(profile.primary_goal),
            "experienceLevel": sanitize_text(profile.experience_level),
            "weeklyAvailability": profile.weekly_availability,
            "equipmentAccess": [sanitize_text(item) for item in profile.equipment_access],
            "limitations": sanitize_text(profile.limitations),
            "laggingMuscles": [sanitize_text(item) for item in profile.lagging_muscles],
            "preferredFocus": sanitize_text(profile.preferred_focus),
            "preferredUnit": sanitize_text(profile.preferred_unit),
            "coachingStyle": sanitize_text(profile.coaching_style),
            "intensityPreference": sanitize_text(profile.intensity_preference),
            "sex": sanitize_text(profile.sex),
            "age": profile.age if profile.age is not None else "",
            "heightCm": profile.height_cm if profile.height_cm is not None else "",
        }

    def _body_summary(self, checkin: BodyCheckIn | None) -> dict[str, Any]:
        if not checkin:
            return {}
        return {
            "id": checkin.id,
            "checkinDate": checkin.checkin_date,
            "weightKg": checkin.weight_kg if checkin.weight_kg is not None else "",
            "bodyFatPct": checkin.body_fat_pct if checkin.body_fat_pct is not None else "",
            "waistCm": checkin.waist_cm if checkin.waist_cm is not None else "",
            "chestCm": checkin.chest_cm if checkin.chest_cm is not None else "",
            "hipCm": checkin.hip_cm if checkin.hip_cm is not None else "",
            "armCm": checkin.arm_cm if checkin.arm_cm is not None else "",
            "thighCm": checkin.thigh_cm if checkin.thigh_cm is not None else "",
            "heightCm": checkin.height_cm if checkin.height_cm is not None else "",
            "age": checkin.age if checkin.age is not None else "",
            "sex": sanitize_text(checkin.sex),
            "activityLevel": sanitize_text(checkin.activity_level),
            "goal": sanitize_text(checkin.goal),
            "caloriesTarget": checkin.calories_target if checkin.calories_target is not None else "",
            "basalMetabolism": checkin.basal_metabolism if checkin.basal_metabolism is not None else "",
            "habitScore": checkin.habit_score if checkin.habit_score is not None else "",
            "notes": sanitize_text(checkin.notes),
        }

    def _blank_checkin(self, profile: FitnessProfile, latest: BodyCheckIn | None) -> dict[str, Any]:
        baseline = self._body_summary(latest) if latest else {}
        baseline.setdefault("checkinDate", date.today().strftime("%Y-%m-%d"))
        baseline.setdefault("weightKg", "")
        baseline.setdefault("bodyFatPct", "")
        baseline.setdefault("waistCm", "")
        baseline.setdefault("chestCm", "")
        baseline.setdefault("hipCm", "")
        baseline.setdefault("armCm", "")
        baseline.setdefault("thighCm", "")
        baseline.setdefault("heightCm", profile.height_cm if profile.height_cm is not None else "")
        baseline.setdefault("age", profile.age if profile.age is not None else "")
        baseline.setdefault("sex", sanitize_text(profile.sex))
        baseline.setdefault("activityLevel", "moderada")
        baseline.setdefault("goal", sanitize_text(profile.primary_goal))
        baseline.setdefault("caloriesTarget", "")
        baseline.setdefault("basalMetabolism", "")
        baseline.setdefault("habitScore", 7)
        baseline.setdefault("notes", "")
        return baseline

    def _summary_cards(self, profile: FitnessProfile, latest: BodyCheckIn | None) -> list[dict[str, str]]:
        weight = format_number(latest.weight_kg if latest else None, " kg")
        calories = format_number(latest.calories_target if latest else None)
        body_fat = format_number(latest.body_fat_pct if latest else None, "%")
        return [
            {"title": "Objetivo principal", "value": sanitize_text(profile.primary_goal or "Defínelo"), "caption": "Dirección actual"},
            {"title": "Peso actual", "value": weight, "caption": "Último check-in"},
            {"title": "Calorías objetivo", "value": calories, "caption": "Meta nutricional básica"},
            {"title": "Grasa corporal", "value": body_fat, "caption": "Si la registras, aquí la seguimos"},
        ]

    @Slot(str)
    def save_profile(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        profile = FitnessProfile(
            display_name=sanitize_text(payload.get("displayName")),
            primary_goal=sanitize_text(payload.get("primaryGoal")),
            experience_level=sanitize_text(payload.get("experienceLevel") or "intermedio"),
            weekly_availability=self._int_value(payload.get("weeklyAvailability")) or 3,
            equipment_access=[sanitize_text(item) for item in payload.get("equipmentAccess", [])],
            limitations=sanitize_text(payload.get("limitations")),
            lagging_muscles=[sanitize_text(item) for item in payload.get("laggingMuscles", [])],
            preferred_focus=sanitize_text(payload.get("preferredFocus")),
            preferred_unit=sanitize_text(payload.get("preferredUnit") or "metric"),
            coaching_style=sanitize_text(payload.get("coachingStyle") or "directo"),
            intensity_preference=sanitize_text(payload.get("intensityPreference") or "moderada"),
            sex=sanitize_text(payload.get("sex")),
            age=self._int_value(payload.get("age")),
            height_cm=self._float_value(payload.get("heightCm")),
        )
        self.context.repository.save_fitness_profile(profile)
        self.shell_vm.refresh()
        self.refresh()
        self._toast("Perfil fitness guardado.")
        self.dataChanged.emit()

    @Slot(str)
    def save_checkin(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        checkin = BodyCheckIn(
            id=self._int_value(payload.get("id")),
            checkin_date=sanitize_text(payload.get("checkinDate") or date.today().strftime("%Y-%m-%d")),
            weight_kg=self._float_value(payload.get("weightKg")),
            body_fat_pct=self._float_value(payload.get("bodyFatPct")),
            waist_cm=self._float_value(payload.get("waistCm")),
            chest_cm=self._float_value(payload.get("chestCm")),
            hip_cm=self._float_value(payload.get("hipCm")),
            arm_cm=self._float_value(payload.get("armCm")),
            thigh_cm=self._float_value(payload.get("thighCm")),
            height_cm=self._float_value(payload.get("heightCm")),
            age=self._int_value(payload.get("age")),
            sex=sanitize_text(payload.get("sex")),
            activity_level=sanitize_text(payload.get("activityLevel")),
            goal=sanitize_text(payload.get("goal")),
            calories_target=self._float_value(payload.get("caloriesTarget")),
            basal_metabolism=self._float_value(payload.get("basalMetabolism")),
            habit_score=self._int_value(payload.get("habitScore")),
            notes=sanitize_text(payload.get("notes")),
        )
        self.context.repository.save_body_checkin(checkin)
        self.refresh()
        self._toast("Check-in corporal guardado.")
        self.dataChanged.emit()


class CoachViewModel(BasePageViewModel):
    def refresh(self) -> None:
        focus = sanitize_text(
            self.context.repository.get_setting("active_focus") or self.context.analytics.suggest_next_focus()
        )
        plan = self.context.planner.generate_next_session_plan(focus)
        messages = self.context.repository.list_coach_messages(limit=80)
        pre = self.context.repository.get_latest_coach_checkin(phase="pre", focus=focus)
        post = self.context.repository.get_latest_coach_checkin(phase="post", focus=focus)
        profile = self.context.repository.get_fitness_profile()
        latest_assistant = next((item for item in reversed(messages) if sanitize_text(item.role) == "assistant"), None)
        mode_label = "API" if self.context.repository.get_setting("coach_api_enabled") == "1" else "Local"
        self._set_state(
            {
                "focus": focus,
                "planSummary": sanitize_text(plan["summary"]),
                "summaryCards": [
                    {
                        "title": "Modo coach",
                        "value": mode_label,
                        "caption": "Avanzado por API o fallback local",
                    },
                    {
                        "title": "Readiness",
                        "value": self._readiness_label(pre),
                        "caption": "Lectura desde el check-in previo",
                    },
                    {
                        "title": "Mensajes",
                        "value": format_number(len(messages)),
                        "caption": "Conversacion guardada",
                    },
                    {
                        "title": "Foco",
                        "value": focus or "-",
                        "caption": "Contexto actual del coach",
                    },
                ],
                "watchToday": [sanitize_text(item) for item in plan["watch_today"]],
                "todayActions": self._today_actions(plan),
                "preInsights": self._pre_insights(pre),
                "postInsights": self._post_insights(post),
                "profileInsights": self._profile_insights(profile),
                "latestCoachMessage": sanitize_text(latest_assistant.content if latest_assistant else ""),
                "messages": [self._message_summary(item) for item in messages],
                "quickPrompts": [
                    "Como entreno hoy segun mi plantilla actual?",
                    "Evalua mi fatiga y dime si conviene bajar el volumen.",
                    "Dame pesos tentativos para los basicos de hoy.",
                    "Resume mi progreso reciente y que vigilar.",
                ],
                "latestPre": self._checkin_summary(pre),
                "latestPost": self._checkin_summary(post),
                "blankPreCheckin": self._blank_checkin("pre", focus, pre),
                "blankPostCheckin": self._blank_checkin("post", focus, post),
            }
        )

    def _message_summary(self, item: CoachMessage) -> dict[str, Any]:
        return {
            "role": sanitize_text(item.role),
            "source": sanitize_text(item.source),
            "content": sanitize_text(item.content),
            "createdAt": sanitize_text(item.created_at),
        }

    def _checkin_summary(self, checkin: CoachCheckIn | None) -> dict[str, Any]:
        if not checkin:
            return {}
        return {
            "id": checkin.id,
            "phase": sanitize_text(checkin.phase),
            "checkinDate": sanitize_text(checkin.checkin_date),
            "focus": sanitize_text(checkin.focus),
            "sleepHours": checkin.sleep_hours if checkin.sleep_hours is not None else "",
            "energy": checkin.energy if checkin.energy is not None else "",
            "soreness": checkin.soreness if checkin.soreness is not None else "",
            "fatigue": checkin.fatigue if checkin.fatigue is not None else "",
            "motivation": checkin.motivation if checkin.motivation is not None else "",
            "stress": checkin.stress if checkin.stress is not None else "",
            "painPoints": sanitize_text(checkin.pain_points),
            "trainingIntent": sanitize_text(checkin.training_intent),
            "bestExercise": sanitize_text(checkin.best_exercise),
            "worstExercise": sanitize_text(checkin.worst_exercise),
            "desiredAdjustment": sanitize_text(checkin.desired_adjustment),
            "notes": sanitize_text(checkin.notes),
        }

    def _blank_checkin(self, phase: str, focus: str, latest: CoachCheckIn | None) -> dict[str, Any]:
        base = self._checkin_summary(latest) if latest and latest.phase == phase else {}
        base["phase"] = phase
        base["focus"] = focus
        base.setdefault("checkinDate", date.today().strftime("%Y-%m-%d"))
        base.setdefault("sleepHours", 7.0)
        base.setdefault("energy", 7)
        base.setdefault("soreness", 3)
        base.setdefault("fatigue", 3)
        base.setdefault("motivation", 8)
        base.setdefault("stress", 3)
        base.setdefault("painPoints", "")
        base.setdefault("trainingIntent", "moderada")
        base.setdefault("bestExercise", "")
        base.setdefault("worstExercise", "")
        base.setdefault("desiredAdjustment", "")
        base.setdefault("notes", "")
        return base

    def _readiness_label(self, checkin: CoachCheckIn | None) -> str:
        if not checkin:
            return "Sin dato"
        energy = checkin.energy or 0
        fatigue = checkin.fatigue or 0
        soreness = checkin.soreness or 0
        score = energy - ((fatigue + soreness) / 2)
        if score >= 5:
            return "Alto"
        if score >= 3:
            return "Medio"
        return "Cauto"

    def _today_actions(self, plan: dict[str, Any]) -> list[dict[str, str]]:
        actions: list[dict[str, str]] = []
        for item in plan.get("items", [])[:4]:
            weight = item["weight"] if item["weight"] not in ("", None) else "por sensaciones"
            actions.append(
                {
                    "title": sanitize_text(item["exercise"]),
                    "detail": f"{item['sets']} x {sanitize_text(item['reps'])} | {weight}",
                    "note": sanitize_text(item["notes"]),
                }
            )
        if not actions:
            actions.append(
                {
                    "title": "Sin acciones cargadas",
                    "detail": "No hay una sesion sugerida todavia para este foco.",
                    "note": "Abre Plan o Entrenar y guarda una estructura base.",
                }
            )
        return actions

    def _pre_insights(self, pre: CoachCheckIn | None) -> list[str]:
        if not pre:
            return [
                "Falta un check-in previo.",
                "Responder energia, sueno y fatiga hace que el coach deje de hablar en generalidades.",
            ]
        insights = [
            f"Sueno {pre.sleep_hours or '-'} h | energia {pre.energy or '-'} | fatiga {pre.fatigue or '-'}."
        ]
        if pre.pain_points:
            insights.append("Hay molestias registradas en " + sanitize_text(pre.pain_points) + ".")
        if pre.training_intent:
            insights.append("La intencion declarada para hoy es " + sanitize_text(pre.training_intent) + ".")
        if pre.notes:
            insights.append(sanitize_text(pre.notes))
        return insights

    def _post_insights(self, post: CoachCheckIn | None) -> list[str]:
        if not post:
            return [
                "Todavia no hay cierre posterior.",
                "Despues de entrenar, registra que se sintio bien y que conviene ajustar para la proxima sesion.",
            ]
        insights = [
            "Mejor ejercicio: " + sanitize_text(post.best_exercise or "-") + ".",
            "Mas duro: " + sanitize_text(post.worst_exercise or "-") + ".",
        ]
        if post.desired_adjustment:
            insights.append("Ajuste deseado: " + sanitize_text(post.desired_adjustment) + ".")
        if post.notes:
            insights.append(sanitize_text(post.notes))
        return insights

    def _profile_insights(self, profile: FitnessProfile) -> list[str]:
        return [
            "Objetivo: " + sanitize_text(profile.primary_goal or "sin definir") + ".",
            "Disponibilidad: "
            + (str(profile.weekly_availability) if profile.weekly_availability is not None else "-")
            + " dias por semana.",
            "Intensidad preferida: " + sanitize_text(profile.intensity_preference or "moderada") + ".",
        ]

    @Slot(str)
    def send_message(self, message: str) -> None:
        clean = sanitize_text(message)
        if not clean:
            return
        self.context.repository.save_coach_message(CoachMessage(role="user", source="ui", content=clean))
        response = self.context.coach.respond(clean)
        response.content = sanitize_text(response.content)
        self.context.repository.save_coach_message(response)
        self.refresh()
        self._toast("Coach actualizado.")
        self.dataChanged.emit()

    @Slot(str)
    def use_quick_prompt(self, prompt: str) -> None:
        self.send_message(prompt)

    @Slot(str)
    def save_checkin(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        checkin = CoachCheckIn(
            checkin_date=sanitize_text(payload.get("checkinDate") or date.today().strftime("%Y-%m-%d")),
            phase=sanitize_text(payload.get("phase") or "pre"),
            focus=sanitize_text(payload.get("focus") or self.context.repository.get_setting("active_focus") or ""),
            sleep_hours=self._float_value(payload.get("sleepHours")),
            energy=self._int_value(payload.get("energy")),
            soreness=self._int_value(payload.get("soreness")),
            fatigue=self._int_value(payload.get("fatigue")),
            motivation=self._int_value(payload.get("motivation")),
            stress=self._int_value(payload.get("stress")),
            pain_points=sanitize_text(payload.get("painPoints")),
            training_intent=sanitize_text(payload.get("trainingIntent")),
            best_exercise=sanitize_text(payload.get("bestExercise")),
            worst_exercise=sanitize_text(payload.get("worstExercise")),
            desired_adjustment=sanitize_text(payload.get("desiredAdjustment")),
            notes=sanitize_text(payload.get("notes")),
        )
        self.context.repository.save_coach_checkin(checkin)
        self.refresh()
        self._toast(f"Check-in {checkin.phase} guardado.")
        self.dataChanged.emit()


class SettingsViewModel(BasePageViewModel):
    def refresh(self) -> None:
        profile = self.context.repository.get_fitness_profile()
        self._set_state(
            {
                "displayName": sanitize_text(profile.display_name),
                "preferredUnit": sanitize_text(profile.preferred_unit or "metric"),
                "coachingStyle": sanitize_text(profile.coaching_style or "directo"),
                "preferredFocus": sanitize_text(profile.preferred_focus),
                "weeklyAvailability": profile.weekly_availability,
                "intensityPreference": sanitize_text(profile.intensity_preference or "moderada"),
                "coachApiEnabled": self.context.repository.get_setting("coach_api_enabled") == "1",
                "coachApiModel": sanitize_text(self.context.repository.get_setting("coach_api_model") or "gpt-5.2"),
                "coachApiKey": sanitize_text(self.context.repository.get_setting("coach_api_key") or ""),
                "activeFocus": sanitize_text(self.context.repository.get_setting("active_focus") or ""),
                "dbPath": str(DB_PATH),
                "exportDir": str(EXPORT_DIR),
                "focusOptions": [sanitize_text(item) for item in getattr(self.context.repository, "DEFAULT_FOCUSES", [])],
                "unitOptions": ["metric", "imperial"],
                "coachingOptions": ["directo", "analítico", "motivador"],
                "intensityOptions": ["suave", "moderada", "alta"],
            }
        )

    @Slot(str)
    def save_settings(self, payload_json: str) -> None:
        payload = payload_from_json(payload_json)
        profile = self.context.repository.get_fitness_profile()
        profile.display_name = sanitize_text(payload.get("displayName"))
        profile.preferred_unit = sanitize_text(payload.get("preferredUnit") or "metric")
        profile.coaching_style = sanitize_text(payload.get("coachingStyle") or "directo")
        profile.preferred_focus = sanitize_text(payload.get("preferredFocus"))
        profile.weekly_availability = self._int_value(payload.get("weeklyAvailability")) or profile.weekly_availability
        profile.intensity_preference = sanitize_text(payload.get("intensityPreference") or "moderada")
        self.context.repository.save_fitness_profile(profile)
        self.context.repository.set_setting("coach_api_enabled", "1" if payload.get("coachApiEnabled") else "0")
        self.context.repository.set_setting(
            "coach_api_model", sanitize_text(payload.get("coachApiModel") or "gpt-5.2")
        )
        self.context.repository.set_setting("coach_api_key", sanitize_text(payload.get("coachApiKey") or ""))
        self.context.repository.set_setting("active_focus", sanitize_text(payload.get("activeFocus") or ""))
        self.shell_vm.refresh()
        self.refresh()
        self._toast("Configuración guardada.")
        self.dataChanged.emit()

    @Slot()
    def export_json(self) -> None:
        output = self.context.repository.export_json()
        self._toast(f"Export JSON listo en {output}.")

    @Slot()
    def export_csv(self) -> None:
        outputs = self.context.repository.export_csv()
        label = ", ".join(str(item) for item in outputs)
        self._toast(f"Export CSV listo: {label}.")


def build_viewmodels(context: AppContext, startup_report: str) -> dict[str, QObject]:
    shell_vm = AppShellViewModel(context, startup_report)
    dashboard_vm = DashboardViewModel(context, shell_vm)
    training_vm = TrainingWorkspaceViewModel(context, shell_vm)
    exercise_vm = ExerciseLibraryViewModel(context, shell_vm)
    history_vm = HistoryViewModel(context, shell_vm)
    plan_vm = PlanViewModel(context, shell_vm)
    body_vm = BodyViewModel(context, shell_vm)
    coach_vm = CoachViewModel(context, shell_vm)
    settings_vm = SettingsViewModel(context, shell_vm)

    pages: list[BasePageViewModel] = [
        dashboard_vm,
        training_vm,
        exercise_vm,
        history_vm,
        plan_vm,
        body_vm,
        coach_vm,
        settings_vm,
    ]

    def refresh_all() -> None:
        shell_vm.refresh()
        for page in pages:
            page.refresh()

    def open_session(session_id: int) -> None:
        training_vm.load_session(session_id)
        shell_vm.navigate("Entrenar")

    history_vm.editSessionRequested.connect(open_session)
    for page in pages:
        page.dataChanged.connect(refresh_all)

    refresh_all()

    return {
        "shellVm": shell_vm,
        "dashboardVm": dashboard_vm,
        "trainingVm": training_vm,
        "exerciseVm": exercise_vm,
        "historyVm": history_vm,
        "planVm": plan_vm,
        "bodyVm": body_vm,
        "coachVm": coach_vm,
        "settingsVm": settings_vm,
    }
