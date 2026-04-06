from __future__ import annotations

from datetime import datetime
from statistics import mean
from typing import Any

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
    TrainingBlock,
    TrainingFocus,
    TrainingGoal,
    WorkoutSession,
    WorkoutSet,
)
from gym_app.paths import DB_PATH, EXPORT_DIR
from gym_app.text import sanitize_list, sanitize_text


NAV_ITEMS = [
    {"key": "dashboard", "label": "Inicio", "subtitle": "Resumen premium y foco del dia"},
    {"key": "training", "label": "Entrenar", "subtitle": "Workspace activo de sesion"},
    {"key": "exercises", "label": "Ejercicios", "subtitle": "Biblioteca curada y personalizada"},
    {"key": "history", "label": "Historial", "subtitle": "Sesiones, detalles y tendencias"},
    {"key": "plan", "label": "Plan", "subtitle": "Bloques, metas y ajustes"},
    {"key": "body", "label": "Cuerpo", "subtitle": "Perfil fitness y progreso corporal"},
    {"key": "coach", "label": "Coach", "subtitle": "Check-ins y guia contextual"},
    {"key": "settings", "label": "Configuracion", "subtitle": "Preferencias, API y exportacion"},
]


def format_number(value: float | int | None, suffix: str = "") -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return f"{value:,.1f}{suffix}".replace(",", " ")
    return f"{value}{suffix}"


def metric_delta(current: float | None, previous: float | None) -> str:
    if current is None or previous is None:
        return "Sin tendencia suficiente"
    delta = current - previous
    return f"{delta:+.1f}"


def exercise_to_summary(exercise: ExerciseDefinition) -> dict[str, Any]:
    return {
        "id": exercise.id,
        "name": sanitize_text(exercise.name),
        "canonicalName": sanitize_text(exercise.canonical_name),
        "category": sanitize_text(exercise.category),
        "modality": sanitize_text(exercise.modality),
        "movementPattern": sanitize_text(exercise.movement_pattern),
        "primaryMuscles": sanitize_list(exercise.primary_muscles),
        "secondaryMuscles": sanitize_list(exercise.secondary_muscles),
        "equipment": sanitize_text(exercise.equipment),
        "difficulty": sanitize_text(exercise.difficulty),
        "loadType": sanitize_text(exercise.load_type),
        "defaultUnit": sanitize_text(exercise.default_unit),
        "cues": sanitize_text(exercise.cues),
        "technicalNotes": sanitize_text(exercise.technical_notes),
        "variantGroup": sanitize_text(exercise.variant_group),
        "alternatives": sanitize_list(exercise.alternatives),
        "isCompound": exercise.is_compound,
        "isCustom": exercise.is_custom,
        "status": sanitize_text(exercise.status),
    }


def set_to_payload(item: WorkoutSet) -> dict[str, Any]:
    return {
        "id": item.id,
        "type": sanitize_text(item.set_type),
        "reps": item.reps,
        "weight": item.weight_kg,
        "rest": item.rest_seconds,
        "rir": item.rir,
        "rpe": item.rpe,
        "tempo": sanitize_text(item.tempo),
        "unilateral": item.unilateral,
        "pain": item.pain_flag,
        "completedStatus": sanitize_text(item.completed_status),
        "notes": sanitize_text(item.notes),
    }


def session_exercise_to_payload(item: SessionExercise, exercise_lookup: dict[str, ExerciseDefinition]) -> dict[str, Any]:
    definition = exercise_lookup.get(item.exercise_name)
    return {
        "exerciseId": item.exercise_id,
        "exerciseName": sanitize_text(item.exercise_name),
        "goal": sanitize_text(item.goal),
        "notes": sanitize_text(item.notes),
        "targetSets": item.target_sets,
        "targetReps": sanitize_text(item.target_reps),
        "targetWeight": item.target_weight_kg,
        "targetRest": item.target_rest_seconds,
        "targetRir": item.target_rir,
        "progressionRule": sanitize_text(item.progression_rule),
        "exercise": exercise_to_summary(definition) if definition else None,
        "sets": [set_to_payload(entry) for entry in item.sets],
    }


def session_to_summary(session: WorkoutSession) -> dict[str, Any]:
    volume = sum((item.weight_kg or 0) * (item.reps or 0) for item in session.sets)
    return {
        "id": session.id,
        "sessionDate": sanitize_text(session.session_date),
        "title": sanitize_text(session.title),
        "blockName": sanitize_text(session.block_name),
        "plannedFocus": sanitize_text(session.planned_focus or session.title),
        "completionStatus": sanitize_text(session.completion_status),
        "perceivedEnergy": session.perceived_energy,
        "durationMinutes": session.duration_minutes,
        "readinessScore": session.readiness_score,
        "exerciseCount": len(session.exercises),
        "setCount": len(session.sets),
        "volume": round(volume, 1),
    }


def session_to_detail(session: WorkoutSession, exercise_lookup: dict[str, ExerciseDefinition]) -> dict[str, Any]:
    return {
        **session_to_summary(session),
        "notes": sanitize_text(session.notes),
        "sourceTemplateId": session.source_template_id,
        "unitSystem": sanitize_text(session.unit_system),
        "createdAt": sanitize_text(session.created_at),
        "updatedAt": sanitize_text(session.updated_at),
        "exercises": [session_exercise_to_payload(item, exercise_lookup) for item in session.exercises],
    }


def template_to_payload(template: SessionTemplate | None) -> dict[str, Any] | None:
    if template is None:
        return None
    return {
        "id": template.id,
        "focus": sanitize_text(template.focus),
        "name": sanitize_text(template.name),
        "description": sanitize_text(template.description),
        "goal": sanitize_text(template.goal),
        "exercises": [
            {
                "id": item.id,
                "exerciseId": item.exercise_id,
                "exerciseName": sanitize_text(item.exercise_name),
                "exerciseOrder": item.exercise_order,
                "setType": sanitize_text(item.set_type),
                "defaultSets": item.default_sets,
                "defaultReps": sanitize_text(item.default_reps),
                "defaultWeight": item.default_weight_kg,
                "defaultRest": item.default_rest_seconds,
                "targetRir": item.target_rir,
                "progressionRule": sanitize_text(item.progression_rule),
                "notes": sanitize_text(item.notes),
            }
            for item in template.exercises
        ],
    }


def body_checkin_to_payload(checkin: BodyCheckIn) -> dict[str, Any]:
    return {
        "id": checkin.id,
        "checkinDate": sanitize_text(checkin.checkin_date),
        "weightKg": checkin.weight_kg,
        "bodyFatPct": checkin.body_fat_pct,
        "waistCm": checkin.waist_cm,
        "chestCm": checkin.chest_cm,
        "hipCm": checkin.hip_cm,
        "armCm": checkin.arm_cm,
        "thighCm": checkin.thigh_cm,
        "heightCm": checkin.height_cm,
        "age": checkin.age,
        "sex": sanitize_text(checkin.sex),
        "activityLevel": sanitize_text(checkin.activity_level),
        "goal": sanitize_text(checkin.goal),
        "caloriesTarget": checkin.calories_target,
        "basalMetabolism": checkin.basal_metabolism,
        "habitScore": checkin.habit_score,
        "notes": sanitize_text(checkin.notes),
    }


def profile_to_payload(profile: FitnessProfile) -> dict[str, Any]:
    return {
        "displayName": sanitize_text(profile.display_name),
        "primaryGoal": sanitize_text(profile.primary_goal),
        "experienceLevel": sanitize_text(profile.experience_level),
        "weeklyAvailability": profile.weekly_availability,
        "equipmentAccess": sanitize_list(profile.equipment_access),
        "limitations": sanitize_text(profile.limitations),
        "laggingMuscles": sanitize_list(profile.lagging_muscles),
        "preferredFocus": sanitize_text(profile.preferred_focus),
        "preferredUnit": sanitize_text(profile.preferred_unit),
        "coachingStyle": sanitize_text(profile.coaching_style),
        "intensityPreference": sanitize_text(profile.intensity_preference),
        "sex": sanitize_text(profile.sex),
        "age": profile.age,
        "heightCm": profile.height_cm,
    }


def recommendation_to_payload(item: Recommendation) -> dict[str, Any]:
    return {
        "id": item.id,
        "generatedOn": sanitize_text(item.generated_on),
        "title": sanitize_text(item.title),
        "summary": sanitize_text(item.summary),
        "actionType": sanitize_text(item.action_type),
        "confidence": item.confidence,
        "source": sanitize_text(item.source),
        "appliesToFocus": sanitize_text(item.applies_to_focus),
        "sessionId": item.session_id,
        "checkinId": item.checkin_id,
        "status": sanitize_text(item.status),
        "metadata": item.metadata,
    }


def coach_checkin_to_payload(item: CoachCheckIn | None) -> dict[str, Any] | None:
    if item is None:
        return None
    return {
        "id": item.id,
        "checkinDate": sanitize_text(item.checkin_date),
        "phase": sanitize_text(item.phase),
        "focus": sanitize_text(item.focus),
        "sessionId": item.session_id,
        "sleepHours": item.sleep_hours,
        "energy": item.energy,
        "soreness": item.soreness,
        "fatigue": item.fatigue,
        "motivation": item.motivation,
        "stress": item.stress,
        "painPoints": sanitize_text(item.pain_points),
        "trainingIntent": sanitize_text(item.training_intent),
        "bestExercise": sanitize_text(item.best_exercise),
        "worstExercise": sanitize_text(item.worst_exercise),
        "desiredAdjustment": sanitize_text(item.desired_adjustment),
        "notes": sanitize_text(item.notes),
    }


def coach_message_to_payload(item: CoachMessage) -> dict[str, Any]:
    return {
        "id": item.id,
        "createdAt": sanitize_text(item.created_at),
        "role": sanitize_text(item.role),
        "source": sanitize_text(item.source),
        "content": sanitize_text(item.content),
        "metadata": item.metadata,
    }


def goal_to_payload(item: TrainingGoal) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": sanitize_text(item.name),
        "targetMetric": sanitize_text(item.target_metric),
        "startValue": item.start_value,
        "targetValue": item.target_value,
        "unit": sanitize_text(item.unit),
        "dueDate": sanitize_text(item.due_date),
        "priority": sanitize_text(item.priority),
        "status": sanitize_text(item.status),
        "notes": sanitize_text(item.notes),
    }


def block_to_payload(item: TrainingBlock) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": sanitize_text(item.name),
        "focus": sanitize_text(item.focus),
        "phaseType": sanitize_text(item.phase_type),
        "objective": sanitize_text(item.objective),
        "weeklyFrequency": item.weekly_frequency,
        "defaultTemplateId": item.default_template_id,
        "startDate": sanitize_text(item.start_date),
        "endDate": sanitize_text(item.end_date),
        "status": sanitize_text(item.status),
        "notes": sanitize_text(item.notes),
        "progressionNotes": sanitize_text(item.progression_notes),
    }


def focus_to_payload(item: TrainingFocus) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": sanitize_text(item.name),
        "slug": sanitize_text(item.slug),
        "description": sanitize_text(item.description),
        "origin": sanitize_text(item.origin),
        "sortOrder": item.sort_order,
        "isActive": item.is_active,
    }


def build_bootstrap_payload(context: AppContext, startup_report: str) -> dict[str, Any]:
    profile = context.repository.get_fitness_profile()
    active_focus = sanitize_text(context.repository.get_setting("active_focus") or context.analytics.suggest_next_focus())
    onboarding_state = context.onboarding.state()
    return {
        "appName": "Bapp Gym Coach",
        "startupReport": sanitize_text(startup_report),
        "activeFocus": active_focus,
        "profileName": sanitize_text(profile.display_name or "Atleta"),
        "navigation": NAV_ITEMS,
        "dbPath": str(DB_PATH),
        "exportPath": str(EXPORT_DIR),
        "requiresOnboarding": onboarding_state["requiresOnboarding"],
        "sidebarCollapsed": context.repository.get_setting("sidebar_collapsed") == "1",
    }


def build_dashboard_payload(context: AppContext) -> dict[str, Any]:
    metrics = context.analytics.dashboard_metrics()
    profile = context.repository.get_fitness_profile()
    hour = datetime.now().hour
    greeting = "Buenos dias" if hour < 12 else "Buenas tardes" if hour < 19 else "Buenas noches"
    athlete = sanitize_text(profile.display_name or "atleta")
    active_focus = sanitize_text(metrics["active_focus"])
    plan = context.planner.generate_next_session_plan(active_focus)
    recent_volume = context.analytics.volume_series(days=21, focus=active_focus)
    weight_series = context.analytics.weight_series(days=60)
    return {
        "heroTitle": f"{greeting}, {athlete}",
        "heroSubtitle": sanitize_text(
            f"Tu siguiente foco recomendado es {metrics['next_focus']}. Abre la sesion con claridad y deja que el coach ajuste el siguiente paso."
        ),
        "heroBadges": [
            {"label": "Foco activo", "value": active_focus},
            {"label": "Adherencia", "value": f"{metrics['adherence']}%"},
            {"label": "Readiness", "value": format_number(metrics["average_readiness"])},
        ],
        "cards": [
            {"title": "Sesiones 7 dias", "value": format_number(metrics["sessions_7d"]), "caption": sanitize_text(metrics["focus_summary"])},
            {"title": "Volumen 30 dias", "value": format_number(metrics["volume_30d"], " kg"), "caption": "Carga total acumulada reciente"},
            {
                "title": "Peso actual",
                "value": format_number(metrics["current_weight"], " kg"),
                "caption": metric_delta(
                    metrics["current_weight"],
                    metrics["current_weight"] - metrics["weight_delta"] if metrics["weight_delta"] is not None else None,
                ),
            },
            {"title": "PRs detectados", "value": format_number(len(metrics["prs"])), "caption": "Lectura automatica de e1RM reciente"},
        ],
        "coachInsight": [sanitize_text(item) for item in plan["watch_today"][:4]],
        "recentLoads": [{"exercise": sanitize_text(item["exercise"]), "weight": item["weight"], "reps": item["reps"], "date": sanitize_text(item["date"])} for item in metrics["recent_loads"][:6]],
        "musclesWorked": [{"name": sanitize_text(name), "count": count} for name, count in metrics["muscles_recent"]],
        "nextSession": {
            "title": sanitize_text(plan["title"]),
            "summary": sanitize_text(plan["summary"]),
            "items": [{"exercise": sanitize_text(item["exercise"]), "sets": item["sets"], "reps": sanitize_text(item["reps"]), "weight": item["weight"], "rir": item["rir"]} for item in plan["items"][:5]],
            "reasons": [sanitize_text(reason) for reason in plan["reasons"]],
        },
        "volumeSeries": [{"date": sanitize_text(day), "value": value} for day, value in recent_volume],
        "weightSeries": [{"date": sanitize_text(day), "value": value} for day, value in weight_series],
    }


def build_training_templates_payload(context: AppContext) -> dict[str, Any]:
    templates = context.repository.list_templates()
    active_focus = sanitize_text(context.repository.get_setting("active_focus") or context.analytics.suggest_next_focus())
    return {
        "activeFocus": active_focus,
        "focuses": [sanitize_text(item) for item in context.repository.list_session_titles()],
        "focusCatalog": [focus_to_payload(item) for item in context.repository.list_training_focuses()],
        "templates": [template_to_payload(template) for template in templates],
    }


def build_training_draft_payload(context: AppContext, focus: str) -> dict[str, Any]:
    active_focus = sanitize_text(focus or context.repository.get_setting("active_focus") or context.analytics.suggest_next_focus())
    template = context.repository.get_template(active_focus)
    plan = context.planner.generate_next_session_plan(active_focus)
    recent_context = context.analytics.get_recent_focus_context(active_focus)
    recommendations = context.repository.list_recent_recommendations(limit=8, focus=active_focus)
    exercise_lookup = {exercise.name: exercise for exercise in context.repository.list_exercises()}
    progress_cards = []
    for item in plan["items"][:4]:
        series = context.analytics.exercise_progress_series(item["exercise"], active_focus)
        progress_cards.append({"exercise": sanitize_text(item["exercise"]), "series": [{"date": sanitize_text(day), "value": value} for day, value in series[-8:]]})

    template_lookup = {entry.exercise_name: entry for entry in template.exercises} if template else {}
    exercises = []
    for item in plan["items"]:
        template_item = template_lookup.get(item["exercise"])
        target_sets = template_item.default_sets if template_item else int(item["sets"] or 3)
        sets = []
        for _ in range(target_sets):
            sets.append(
                {
                    "type": sanitize_text(template_item.set_type if template_item else "trabajo"),
                    "reps": None,
                    "weight": item["weight"] if item["weight"] != "" else None,
                    "rest": template_item.default_rest_seconds if template_item else item["rest"],
                    "rir": item["rir"] if item["rir"] != "" else None,
                    "rpe": None,
                    "tempo": "",
                    "unilateral": False,
                    "pain": False,
                    "completedStatus": "completado",
                    "notes": "",
                }
            )
        exercises.append(
            {
                "exerciseId": exercise_lookup.get(item["exercise"]).id if exercise_lookup.get(item["exercise"]) else None,
                "exerciseName": sanitize_text(item["exercise"]),
                "goal": sanitize_text(template_item.notes if template_item else ""),
                "notes": sanitize_text(item["notes"]),
                "targetSets": target_sets,
                "targetReps": sanitize_text(item["reps"]),
                "targetWeight": item["weight"] if item["weight"] != "" else None,
                "targetRest": template_item.default_rest_seconds if template_item else item["rest"],
                "targetRir": item["rir"] if item["rir"] != "" else None,
                "progressionRule": sanitize_text(template_item.progression_rule if template_item else ""),
                "exercise": exercise_to_summary(exercise_lookup[item["exercise"]]) if item["exercise"] in exercise_lookup else None,
                "sets": sets,
            }
        )

    pre_checkin = recent_context["pre_checkin"]
    return {
        "focus": active_focus,
        "summary": sanitize_text(plan["summary"]),
        "reasons": [sanitize_text(item) for item in plan["reasons"]],
        "watchToday": [sanitize_text(item) for item in plan["watch_today"]],
        "template": template_to_payload(template),
        "block": block_to_payload(plan["block"]) if plan["block"] else None,
        "preCheckin": coach_checkin_to_payload(pre_checkin),
        "postCheckin": coach_checkin_to_payload(recent_context["post_checkin"]),
        "recommendations": [recommendation_to_payload(item) for item in recommendations],
        "recentSessions": [session_to_summary(item) for item in recent_context["sessions"]],
        "progressCards": progress_cards,
        "sessionDraft": {
            "sessionDate": datetime.now().date().isoformat(),
            "title": active_focus,
            "blockName": sanitize_text(plan["block"].name) if plan["block"] else "",
            "plannedFocus": active_focus,
            "completionStatus": "completado",
            "perceivedEnergy": None,
            "durationMinutes": 75,
            "sourceTemplateId": template.id if template else None,
            "readinessScore": pre_checkin.energy if pre_checkin else None,
            "unitSystem": sanitize_text(context.repository.get_fitness_profile().preferred_unit),
            "notes": "",
            "exercises": exercises,
        },
    }


def build_exercises_payload(context: AppContext, search: str = "", category: str = "", equipment: str = "", modality: str = "", origin: str = "") -> dict[str, Any]:
    exercises = context.repository.list_exercises(search=search, category=category, equipment=equipment, modality=modality, origin=origin)
    counts = {"total": len(exercises), "custom": sum(1 for item in exercises if item.is_custom), "compound": sum(1 for item in exercises if item.is_compound)}
    return {
        "filters": {"search": sanitize_text(search), "category": sanitize_text(category), "equipment": sanitize_text(equipment), "modality": sanitize_text(modality), "origin": sanitize_text(origin)},
        "options": {
            "categories": [sanitize_text(item) for item in context.repository.list_exercise_categories()],
            "equipment": [sanitize_text(item) for item in context.repository.list_exercise_equipments()],
            "modalities": [sanitize_text(item) for item in context.repository.list_exercise_modalities()],
            "origins": ["", "base", "personalizado"],
        },
        "counts": counts,
        "items": [exercise_to_summary(item) for item in exercises],
    }


def build_history_payload(context: AppContext, focus: str = "", status: str = "", search: str = "") -> dict[str, Any]:
    rows = context.repository.list_session_summaries(limit=160, focus=focus, status=status, search=search)
    sessions = context.repository.fetch_sessions(limit=40, title=focus, status=status) if focus or status else context.repository.fetch_sessions(limit=40)
    breakdown: dict[str, int] = {}
    for item in sessions:
        breakdown[item.title] = breakdown.get(item.title, 0) + 1
    return {
        "filters": {"focus": sanitize_text(focus), "status": sanitize_text(status), "search": sanitize_text(search)},
        "items": [
            {
                "id": row["id"],
                "sessionDate": sanitize_text(row["session_date"]),
                "title": sanitize_text(row["title"]),
                "blockName": sanitize_text(row["block_name"]),
                "completionStatus": sanitize_text(row["completion_status"]),
                "durationMinutes": row["duration_minutes"],
                "readinessScore": row["readiness_score"],
                "exerciseCount": row["exercise_count"],
                "setCount": row["set_count"],
                "volume": round(float(row["volume"] or 0), 1),
            }
            for row in rows
        ],
        "focusOptions": [sanitize_text(item) for item in context.repository.list_session_titles()],
        "statusOptions": ["", "completado", "parcial", "omitido"],
        "focusBreakdown": [{"focus": sanitize_text(key), "count": value} for key, value in breakdown.items()],
    }


def build_plan_payload(context: AppContext) -> dict[str, Any]:
    focus = sanitize_text(context.repository.get_setting("active_focus") or context.analytics.suggest_next_focus())
    plan = context.planner.generate_next_session_plan(focus)
    goals = context.repository.list_training_goals()
    blocks = context.repository.list_training_blocks()
    active_block = next((item for item in blocks if item.focus == focus and item.status == "activo"), None)
    return {
        "activeFocus": focus,
        "summary": sanitize_text(plan["summary"]),
        "reasons": [sanitize_text(item) for item in plan["reasons"]],
        "watchToday": [sanitize_text(item) for item in plan["watch_today"]],
        "items": [{"exercise": sanitize_text(item["exercise"]), "sets": item["sets"], "reps": sanitize_text(item["reps"]), "weight": item["weight"], "rest": item["rest"], "rir": item["rir"], "notes": sanitize_text(item["notes"])} for item in plan["items"]],
        "goals": [goal_to_payload(item) for item in goals],
        "blocks": [block_to_payload(item) for item in blocks],
        "activeBlock": block_to_payload(active_block) if active_block else None,
        "recommendations": [recommendation_to_payload(item) for item in context.repository.list_recent_recommendations(limit=8, focus=focus)],
    }


def build_body_payload(context: AppContext) -> dict[str, Any]:
    profile = context.repository.get_fitness_profile()
    checkins = context.repository.list_body_checkins(limit=120)
    latest = checkins[0] if checkins else None
    weight_values = [item.weight_kg for item in checkins if item.weight_kg is not None][:6]
    return {
        "profile": profile_to_payload(profile),
        "latestCheckin": body_checkin_to_payload(latest) if latest else None,
        "checkins": [body_checkin_to_payload(item) for item in checkins],
        "weightSeries": [{"date": sanitize_text(day), "value": value} for day, value in context.analytics.weight_series(days=120)],
        "insights": [
            f"Objetivo principal: {sanitize_text(profile.primary_goal or 'sin definir')}.",
            f"Disponibilidad semanal: {profile.weekly_availability} dias.",
            (
                f"Peso medio reciente: {mean([value for value in weight_values if value is not None]):.1f} kg."
                if weight_values
                else "Aun no hay suficientes check-ins corporales."
            ),
        ],
    }


def build_coach_context_payload(context: AppContext) -> dict[str, Any]:
    focus = sanitize_text(context.repository.get_setting("active_focus") or context.analytics.suggest_next_focus())
    plan = context.planner.generate_next_session_plan(focus)
    messages = context.repository.list_coach_messages(limit=40)
    pre = context.repository.get_latest_coach_checkin(phase="pre", focus=focus)
    post = context.repository.get_latest_coach_checkin(phase="post", focus=focus)
    profile = context.repository.get_fitness_profile()
    return {
        "focus": focus,
        "profile": profile_to_payload(profile),
        "mode": "api" if context.repository.get_setting("coach_api_enabled") == "1" else "local",
        "planSummary": sanitize_text(plan["summary"]),
        "watchToday": [sanitize_text(item) for item in plan["watch_today"]],
        "preCheckin": coach_checkin_to_payload(pre),
        "postCheckin": coach_checkin_to_payload(post),
        "messages": [coach_message_to_payload(item) for item in messages],
        "recommendations": [recommendation_to_payload(item) for item in context.repository.list_recent_recommendations(limit=6, focus=focus)],
    }


def build_settings_payload(context: AppContext) -> dict[str, Any]:
    profile = context.repository.get_fitness_profile()
    return {
        "coachApiEnabled": context.repository.get_setting("coach_api_enabled") == "1",
        "coachApiModel": sanitize_text(context.repository.get_setting("coach_api_model") or "gpt-5.2"),
        "coachApiKey": sanitize_text(context.repository.get_setting("coach_api_key") or ""),
        "displayName": sanitize_text(profile.display_name),
        "preferredUnit": sanitize_text(profile.preferred_unit),
        "coachingStyle": sanitize_text(profile.coaching_style),
        "weeklyAvailability": profile.weekly_availability,
        "preferredFocus": sanitize_text(profile.preferred_focus),
        "intensityPreference": sanitize_text(profile.intensity_preference),
        "dbPath": str(DB_PATH),
        "exportPath": str(EXPORT_DIR),
        "sidebarCollapsed": context.repository.get_setting("sidebar_collapsed") == "1",
        "onboardingCompletedAt": sanitize_text(context.repository.get_setting("onboarding_completed_at") or ""),
    }


def build_onboarding_state_payload(context: AppContext) -> dict[str, Any]:
    state = context.onboarding.state()
    return {
        "requiresOnboarding": state["requiresOnboarding"],
        "currentStep": sanitize_text(state["currentStep"]),
        "hasTemplates": state["hasTemplates"],
        "profileCompleteness": state["profileCompleteness"],
        "completedAt": sanitize_text(state["completedAt"]),
        "selectedFocuses": [sanitize_text(item) for item in state["selectedFocuses"]],
        "profile": profile_to_payload(state["profile"]),
        "focusCatalog": [focus_to_payload(item) for item in context.repository.list_training_focuses()],
    }
