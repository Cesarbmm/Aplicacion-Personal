from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ExerciseDefinition:
    id: int | None = None
    name: str = ""
    canonical_name: str = ""
    category: str = ""
    modality: str = "fuerza"
    movement_pattern: str = ""
    primary_muscles: list[str] = field(default_factory=list)
    secondary_muscles: list[str] = field(default_factory=list)
    equipment: str = ""
    difficulty: str = ""
    load_type: str = "peso"
    default_unit: str = "kg"
    cues: str = ""
    technical_notes: str = ""
    variant_group: str = ""
    alternatives: list[str] = field(default_factory=list)
    is_compound: bool = False
    is_custom: bool = False
    status: str = "activo"


@dataclass(slots=True)
class WorkoutSet:
    id: int | None = None
    session_id: int | None = None
    session_exercise_id: int | None = None
    exercise_name: str = ""
    exercise_id: int | None = None
    set_order: int = 1
    set_type: str = "trabajo"
    weight_kg: float | None = None
    reps: int | None = None
    rir: float | None = None
    rpe: float | None = None
    tempo: str = ""
    rest_seconds: int | None = None
    unilateral: bool = False
    pain_flag: bool = False
    completed_status: str = "completado"
    notes: str = ""


@dataclass(slots=True)
class SessionExercise:
    id: int | None = None
    session_id: int | None = None
    exercise_id: int | None = None
    exercise_name: str = ""
    exercise_order: int = 1
    goal: str = ""
    notes: str = ""
    target_sets: int | None = None
    target_reps: str = ""
    target_weight_kg: float | None = None
    target_rest_seconds: int | None = None
    target_rir: float | None = None
    progression_rule: str = ""
    sets: list[WorkoutSet] = field(default_factory=list)


@dataclass(slots=True)
class WorkoutSession:
    id: int | None = None
    session_date: str = ""
    title: str = ""
    block_name: str = ""
    notes: str = ""
    planned_focus: str = ""
    completion_status: str = "completado"
    perceived_energy: int | None = None
    duration_minutes: int | None = None
    source_template_id: int | None = None
    readiness_score: int | None = None
    pre_checkin_id: int | None = None
    post_checkin_id: int | None = None
    unit_system: str = "metric"
    exercises: list[SessionExercise] = field(default_factory=list)
    sets: list[WorkoutSet] = field(default_factory=list)
    imported_legacy_key: str | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass(slots=True)
class TemplateExercise:
    id: int | None = None
    template_id: int | None = None
    exercise_name: str = ""
    exercise_id: int | None = None
    exercise_order: int = 1
    set_type: str = "trabajo"
    default_sets: int = 3
    default_reps: str = "8-12"
    default_weight_kg: float | None = None
    default_rest_seconds: int | None = 90
    target_rir: float | None = None
    progression_rule: str = ""
    notes: str = ""


@dataclass(slots=True)
class SessionTemplate:
    id: int | None = None
    focus: str = ""
    name: str = ""
    description: str = ""
    goal: str = ""
    created_at: str = ""
    updated_at: str = ""
    exercises: list[TemplateExercise] = field(default_factory=list)


@dataclass(slots=True)
class TrainingFocus:
    id: int | None = None
    name: str = ""
    slug: str = ""
    description: str = ""
    origin: str = "preset"
    sort_order: int = 0
    is_active: bool = True


@dataclass(slots=True)
class BodyCheckIn:
    id: int | None = None
    checkin_date: str = ""
    weight_kg: float | None = None
    body_fat_pct: float | None = None
    waist_cm: float | None = None
    chest_cm: float | None = None
    hip_cm: float | None = None
    arm_cm: float | None = None
    thigh_cm: float | None = None
    height_cm: float | None = None
    age: int | None = None
    sex: str = ""
    activity_level: str = ""
    goal: str = ""
    calories_target: float | None = None
    basal_metabolism: float | None = None
    habit_score: int | None = None
    notes: str = ""
    imported_legacy_key: str | None = None
    created_at: str = ""


@dataclass(slots=True)
class TrainingGoal:
    id: int | None = None
    name: str = ""
    target_metric: str = ""
    start_value: float | None = None
    target_value: float | None = None
    unit: str = ""
    due_date: str = ""
    priority: str = "media"
    status: str = "activo"
    notes: str = ""
    created_at: str = ""


@dataclass(slots=True)
class TrainingBlock:
    id: int | None = None
    name: str = ""
    focus: str = ""
    phase_type: str = ""
    objective: str = ""
    weekly_frequency: int | None = None
    default_template_id: int | None = None
    start_date: str = ""
    end_date: str = ""
    status: str = "activo"
    notes: str = ""
    progression_notes: str = ""
    created_at: str = ""


@dataclass(slots=True)
class FitnessProfile:
    display_name: str = ""
    primary_goal: str = ""
    experience_level: str = ""
    weekly_availability: int = 3
    equipment_access: list[str] = field(default_factory=list)
    limitations: str = ""
    lagging_muscles: list[str] = field(default_factory=list)
    preferred_focus: str = ""
    preferred_unit: str = "metric"
    coaching_style: str = "directo"
    intensity_preference: str = "moderada"
    sex: str = ""
    age: int | None = None
    height_cm: float | None = None


@dataclass(slots=True)
class CoachCheckIn:
    id: int | None = None
    checkin_date: str = ""
    phase: str = "pre"
    focus: str = ""
    session_id: int | None = None
    sleep_hours: float | None = None
    energy: int | None = None
    soreness: int | None = None
    fatigue: int | None = None
    motivation: int | None = None
    stress: int | None = None
    pain_points: str = ""
    training_intent: str = ""
    best_exercise: str = ""
    worst_exercise: str = ""
    desired_adjustment: str = ""
    notes: str = ""
    created_at: str = ""


@dataclass(slots=True)
class Recommendation:
    id: int | None = None
    generated_on: str = ""
    context_type: str = ""
    context_key: str = ""
    title: str = ""
    summary: str = ""
    action_type: str = ""
    confidence: float = 0.0
    source: str = "engine"
    applies_to_focus: str = ""
    session_id: int | None = None
    checkin_id: int | None = None
    status: str = "activa"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class CoachMessage:
    id: int | None = None
    created_at: str = ""
    role: str = "assistant"
    source: str = "local"
    content: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ImportReport:
    imported_sessions: int = 0
    updated_sessions: int = 0
    imported_body_checkins: int = 0
    updated_body_checkins: int = 0
    skipped_files: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors

    def summary(self) -> str:
        return (
            f"Sesiones nuevas: {self.imported_sessions}, "
            f"sesiones actualizadas: {self.updated_sessions}, "
            f"pesos nuevos: {self.imported_body_checkins}, "
            f"pesos actualizados: {self.updated_body_checkins}, "
            f"omitidos: {self.skipped_files}, errores: {len(self.errors)}"
        )
