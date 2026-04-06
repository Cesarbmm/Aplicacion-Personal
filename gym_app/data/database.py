from __future__ import annotations

import sqlite3

from gym_app.paths import DB_PATH, ensure_app_directories


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    canonical_name TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'fuerza',
    movement_pattern TEXT NOT NULL DEFAULT '',
    primary_muscles TEXT NOT NULL DEFAULT '[]',
    secondary_muscles TEXT NOT NULL DEFAULT '[]',
    equipment TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT '',
    load_type TEXT NOT NULL DEFAULT 'peso',
    default_unit TEXT NOT NULL DEFAULT 'kg',
    cues TEXT NOT NULL DEFAULT '',
    technical_notes TEXT NOT NULL DEFAULT '',
    variant_group TEXT NOT NULL DEFAULT '',
    alternatives TEXT NOT NULL DEFAULT '[]',
    is_compound INTEGER NOT NULL DEFAULT 0,
    is_custom INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'activo',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date TEXT NOT NULL,
    title TEXT NOT NULL,
    block_name TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    planned_focus TEXT DEFAULT '',
    completion_status TEXT NOT NULL DEFAULT 'completado',
    perceived_energy INTEGER,
    duration_minutes INTEGER,
    source_template_id INTEGER REFERENCES session_templates(id),
    readiness_score INTEGER,
    pre_checkin_id INTEGER REFERENCES coach_checkins(id),
    post_checkin_id INTEGER REFERENCES coach_checkins(id),
    unit_system TEXT NOT NULL DEFAULT 'metric',
    imported_legacy_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER NOT NULL,
    goal TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    target_sets INTEGER,
    target_reps TEXT NOT NULL DEFAULT '',
    target_weight_kg REAL,
    target_rest_seconds INTEGER,
    target_rir REAL,
    progression_rule TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    session_exercise_id INTEGER REFERENCES session_exercises(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    exercise_name TEXT NOT NULL,
    set_order INTEGER NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'trabajo',
    weight_kg REAL,
    reps INTEGER,
    rir REAL,
    rpe REAL,
    tempo TEXT DEFAULT '',
    rest_seconds INTEGER,
    unilateral INTEGER NOT NULL DEFAULT 0,
    pain_flag INTEGER NOT NULL DEFAULT 0,
    completed_status TEXT NOT NULL DEFAULT 'completado',
    notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS session_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    focus TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    goal TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_focuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    origin TEXT NOT NULL DEFAULT 'preset',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES session_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'trabajo',
    default_sets INTEGER NOT NULL DEFAULT 3,
    default_reps TEXT NOT NULL DEFAULT '8-12',
    default_weight_kg REAL,
    default_rest_seconds INTEGER,
    target_rir REAL,
    progression_rule TEXT NOT NULL DEFAULT '',
    notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS body_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_date TEXT NOT NULL UNIQUE,
    weight_kg REAL,
    body_fat_pct REAL,
    waist_cm REAL,
    chest_cm REAL,
    hip_cm REAL,
    arm_cm REAL,
    thigh_cm REAL,
    height_cm REAL,
    age INTEGER,
    sex TEXT DEFAULT '',
    activity_level TEXT DEFAULT '',
    goal TEXT DEFAULT '',
    calories_target REAL,
    basal_metabolism REAL,
    habit_score INTEGER,
    notes TEXT DEFAULT '',
    imported_legacy_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coach_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_date TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'pre',
    focus TEXT NOT NULL DEFAULT '',
    session_id INTEGER REFERENCES workout_sessions(id) ON DELETE SET NULL,
    sleep_hours REAL,
    energy INTEGER,
    soreness INTEGER,
    fatigue INTEGER,
    motivation INTEGER,
    stress INTEGER,
    pain_points TEXT NOT NULL DEFAULT '',
    training_intent TEXT NOT NULL DEFAULT '',
    best_exercise TEXT NOT NULL DEFAULT '',
    worst_exercise TEXT NOT NULL DEFAULT '',
    desired_adjustment TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_metric TEXT NOT NULL,
    start_value REAL,
    target_value REAL,
    unit TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'media',
    status TEXT NOT NULL DEFAULT 'activo',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    focus TEXT DEFAULT '',
    phase_type TEXT DEFAULT '',
    objective TEXT DEFAULT '',
    weekly_frequency INTEGER,
    default_template_id INTEGER REFERENCES session_templates(id),
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'activo',
    notes TEXT DEFAULT '',
    progression_notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    context_type TEXT NOT NULL,
    context_key TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    action_type TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'engine',
    applies_to_focus TEXT NOT NULL DEFAULT '',
    session_id INTEGER,
    checkin_id INTEGER,
    status TEXT NOT NULL DEFAULT 'activa',
    metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS coach_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'local',
    content TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_key TEXT NOT NULL UNIQUE,
    source_mtime REAL,
    summary TEXT NOT NULL DEFAULT '',
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, exercise_order);
CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON body_checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_checkins_date ON coach_checkins(checkin_date DESC, phase);
CREATE INDEX IF NOT EXISTS idx_recommendations_context ON recommendations(context_type, context_key);
CREATE INDEX IF NOT EXISTS idx_templates_focus ON session_templates(focus);
CREATE INDEX IF NOT EXISTS idx_training_focuses_sort ON training_focuses(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id, exercise_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_canonical_name ON exercises(canonical_name) WHERE canonical_name != '';
"""


LEGACY_COLUMNS: dict[str, list[tuple[str, str]]] = {
    "exercises": [
        ("modality", "TEXT NOT NULL DEFAULT 'fuerza'"),
        ("movement_pattern", "TEXT NOT NULL DEFAULT ''"),
        ("load_type", "TEXT NOT NULL DEFAULT 'peso'"),
        ("default_unit", "TEXT NOT NULL DEFAULT 'kg'"),
        ("technical_notes", "TEXT NOT NULL DEFAULT ''"),
        ("variant_group", "TEXT NOT NULL DEFAULT ''"),
        ("is_custom", "INTEGER NOT NULL DEFAULT 0"),
        ("status", "TEXT NOT NULL DEFAULT 'activo'"),
    ],
    "workout_sessions": [
        ("source_template_id", "INTEGER"),
        ("readiness_score", "INTEGER"),
        ("pre_checkin_id", "INTEGER"),
        ("post_checkin_id", "INTEGER"),
        ("unit_system", "TEXT NOT NULL DEFAULT 'metric'"),
    ],
    "workout_sets": [
        ("session_exercise_id", "INTEGER"),
    ],
    "template_exercises": [
        ("target_rir", "REAL"),
        ("progression_rule", "TEXT NOT NULL DEFAULT ''"),
    ],
    "body_checkins": [
        ("body_fat_pct", "REAL"),
        ("waist_cm", "REAL"),
        ("chest_cm", "REAL"),
        ("hip_cm", "REAL"),
        ("arm_cm", "REAL"),
        ("thigh_cm", "REAL"),
        ("habit_score", "INTEGER"),
        ("notes", "TEXT NOT NULL DEFAULT ''"),
    ],
    "recommendations": [
        ("source", "TEXT NOT NULL DEFAULT 'engine'"),
        ("applies_to_focus", "TEXT NOT NULL DEFAULT ''"),
        ("session_id", "INTEGER"),
        ("checkin_id", "INTEGER"),
        ("status", "TEXT NOT NULL DEFAULT 'activa'"),
    ],
}


def get_connection() -> sqlite3.Connection:
    ensure_app_directories()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    ensure_app_directories()
    with get_connection() as connection:
        connection.executescript(SCHEMA)
        _apply_legacy_migrations(connection)


def _apply_legacy_migrations(connection: sqlite3.Connection) -> None:
    for table_name, columns in LEGACY_COLUMNS.items():
        existing = _table_columns(connection, table_name)
        for column_name, definition in columns:
            if column_name not in existing:
                connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS session_exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
            exercise_id INTEGER REFERENCES exercises(id),
            exercise_name TEXT NOT NULL,
            exercise_order INTEGER NOT NULL,
            goal TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            target_sets INTEGER,
            target_reps TEXT NOT NULL DEFAULT '',
            target_weight_kg REAL,
            target_rest_seconds INTEGER,
            target_rir REAL,
            progression_rule TEXT NOT NULL DEFAULT ''
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS training_focuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            origin TEXT NOT NULL DEFAULT 'preset',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS coach_checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checkin_date TEXT NOT NULL,
            phase TEXT NOT NULL DEFAULT 'pre',
            focus TEXT NOT NULL DEFAULT '',
            session_id INTEGER REFERENCES workout_sessions(id) ON DELETE SET NULL,
            sleep_hours REAL,
            energy INTEGER,
            soreness INTEGER,
            fatigue INTEGER,
            motivation INTEGER,
            stress INTEGER,
            pain_points TEXT NOT NULL DEFAULT '',
            training_intent TEXT NOT NULL DEFAULT '',
            best_exercise TEXT NOT NULL DEFAULT '',
            worst_exercise TEXT NOT NULL DEFAULT '',
            desired_adjustment TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_canonical_name ON exercises(canonical_name) WHERE canonical_name != ''"
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_training_focuses_sort ON training_focuses(sort_order, name)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_sets_session_exercise ON workout_sets(session_exercise_id)")


def _table_columns(connection: sqlite3.Connection, table_name: str) -> set[str]:
    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}
