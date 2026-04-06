from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from gym_app.api.mappers import (
    block_to_payload,
    body_checkin_to_payload,
    build_body_payload,
    build_bootstrap_payload,
    build_coach_context_payload,
    build_dashboard_payload,
    build_exercises_payload,
    build_history_payload,
    build_onboarding_state_payload,
    build_plan_payload,
    build_settings_payload,
    build_training_draft_payload,
    build_training_templates_payload,
    coach_checkin_to_payload,
    coach_message_to_payload,
    exercise_to_summary,
    goal_to_payload,
    profile_to_payload,
    session_to_detail,
    template_to_payload,
)
from gym_app.api.schemas import (
    BodyCheckInPayload,
    CoachCheckInPayload,
    CoachRespondPayload,
    CustomFocusPayload,
    ExerciseUpsertPayload,
    FitnessProfilePayload,
    OnboardingCompletePayload,
    OnboardingFocusesPayload,
    OnboardingGeneratePayload,
    SessionTemplatePayload,
    SettingsPayload,
    TrainingBlockPayload,
    TrainingGoalPayload,
    WorkoutSessionPayload,
)
from gym_app.context import AppContext
from gym_app.domain.models import (
    BodyCheckIn,
    CoachCheckIn,
    CoachMessage,
    ExerciseDefinition,
    FitnessProfile,
    SessionExercise,
    SessionTemplate,
    TemplateExercise,
    TrainingBlock,
    TrainingGoal,
    WorkoutSession,
    WorkoutSet,
)
from gym_app.runtime import build_runtime_context
from gym_app.text import sanitize_list, sanitize_text


def _exercise_from_payload(payload: ExerciseUpsertPayload) -> ExerciseDefinition:
    return ExerciseDefinition(
        id=payload.id,
        name=sanitize_text(payload.name),
        canonical_name=sanitize_text(payload.canonicalName),
        category=sanitize_text(payload.category),
        modality=sanitize_text(payload.modality),
        movement_pattern=sanitize_text(payload.movementPattern),
        primary_muscles=sanitize_list(payload.primaryMuscles),
        secondary_muscles=sanitize_list(payload.secondaryMuscles),
        equipment=sanitize_text(payload.equipment),
        difficulty=sanitize_text(payload.difficulty),
        load_type=sanitize_text(payload.loadType),
        default_unit=sanitize_text(payload.defaultUnit),
        cues=sanitize_text(payload.cues),
        technical_notes=sanitize_text(payload.technicalNotes),
        variant_group=sanitize_text(payload.variantGroup),
        alternatives=sanitize_list(payload.alternatives),
        is_compound=payload.isCompound,
        is_custom=payload.isCustom,
        status=sanitize_text(payload.status),
    )


def _template_from_payload(payload: SessionTemplatePayload) -> SessionTemplate:
    return SessionTemplate(
        id=payload.id,
        focus=sanitize_text(payload.focus),
        name=sanitize_text(payload.name),
        description=sanitize_text(payload.description),
        goal=sanitize_text(payload.goal),
        exercises=[
            TemplateExercise(
                exercise_id=item.exerciseId,
                exercise_name=sanitize_text(item.exerciseName),
                set_type=sanitize_text(item.setType),
                default_sets=item.defaultSets,
                default_reps=sanitize_text(item.defaultReps),
                default_weight_kg=item.defaultWeight,
                default_rest_seconds=item.defaultRest,
                target_rir=item.targetRir,
                progression_rule=sanitize_text(item.progressionRule),
                notes=sanitize_text(item.notes),
            )
            for item in payload.exercises
        ],
    )


def _session_from_payload(payload: WorkoutSessionPayload) -> WorkoutSession:
    exercises: list[SessionExercise] = []
    for exercise_index, exercise in enumerate(payload.exercises, start=1):
        sets = []
        for set_index, item in enumerate(exercise.sets, start=1):
            sets.append(
                WorkoutSet(
                    set_order=set_index,
                    exercise_id=exercise.exerciseId,
                    exercise_name=sanitize_text(exercise.exerciseName),
                    set_type=sanitize_text(item.type),
                    weight_kg=item.weight,
                    reps=item.reps,
                    rir=item.rir,
                    rpe=item.rpe,
                    tempo=sanitize_text(item.tempo),
                    rest_seconds=item.rest,
                    unilateral=item.unilateral,
                    pain_flag=item.pain,
                    completed_status=sanitize_text(item.completedStatus),
                    notes=sanitize_text(item.notes),
                )
            )
        exercises.append(
            SessionExercise(
                exercise_id=exercise.exerciseId,
                exercise_name=sanitize_text(exercise.exerciseName),
                exercise_order=exercise_index,
                goal=sanitize_text(exercise.goal),
                notes=sanitize_text(exercise.notes),
                target_sets=exercise.targetSets,
                target_reps=sanitize_text(exercise.targetReps),
                target_weight_kg=exercise.targetWeight,
                target_rest_seconds=exercise.targetRest,
                target_rir=exercise.targetRir,
                progression_rule=sanitize_text(exercise.progressionRule),
                sets=sets,
            )
        )
    return WorkoutSession(
        id=payload.id,
        session_date=payload.sessionDate,
        title=sanitize_text(payload.title),
        block_name=sanitize_text(payload.blockName),
        notes=sanitize_text(payload.notes),
        planned_focus=sanitize_text(payload.plannedFocus or payload.title),
        completion_status=sanitize_text(payload.completionStatus),
        perceived_energy=payload.perceivedEnergy,
        duration_minutes=payload.durationMinutes,
        source_template_id=payload.sourceTemplateId,
        readiness_score=payload.readinessScore,
        unit_system=sanitize_text(payload.unitSystem),
        exercises=exercises,
    )


def _body_from_payload(payload: BodyCheckInPayload) -> BodyCheckIn:
    return BodyCheckIn(
        checkin_date=payload.checkinDate,
        weight_kg=payload.weightKg,
        body_fat_pct=payload.bodyFatPct,
        waist_cm=payload.waistCm,
        chest_cm=payload.chestCm,
        hip_cm=payload.hipCm,
        arm_cm=payload.armCm,
        thigh_cm=payload.thighCm,
        height_cm=payload.heightCm,
        age=payload.age,
        sex=sanitize_text(payload.sex),
        activity_level=sanitize_text(payload.activityLevel),
        goal=sanitize_text(payload.goal),
        calories_target=payload.caloriesTarget,
        basal_metabolism=payload.basalMetabolism,
        habit_score=payload.habitScore,
        notes=sanitize_text(payload.notes),
    )


def _profile_from_payload(payload: FitnessProfilePayload) -> FitnessProfile:
    return FitnessProfile(
        display_name=sanitize_text(payload.displayName),
        primary_goal=sanitize_text(payload.primaryGoal),
        experience_level=sanitize_text(payload.experienceLevel),
        weekly_availability=payload.weeklyAvailability,
        equipment_access=sanitize_list(payload.equipmentAccess),
        limitations=sanitize_text(payload.limitations),
        lagging_muscles=sanitize_list(payload.laggingMuscles),
        preferred_focus=sanitize_text(payload.preferredFocus),
        preferred_unit=sanitize_text(payload.preferredUnit),
        coaching_style=sanitize_text(payload.coachingStyle),
        intensity_preference=sanitize_text(payload.intensityPreference),
        sex=sanitize_text(payload.sex),
        age=payload.age,
        height_cm=payload.heightCm,
    )


def _coach_checkin_from_payload(payload: CoachCheckInPayload) -> CoachCheckIn:
    return CoachCheckIn(
        checkin_date=payload.checkinDate,
        phase=sanitize_text(payload.phase),
        focus=sanitize_text(payload.focus),
        session_id=payload.sessionId,
        sleep_hours=payload.sleepHours,
        energy=payload.energy,
        soreness=payload.soreness,
        fatigue=payload.fatigue,
        motivation=payload.motivation,
        stress=payload.stress,
        pain_points=sanitize_text(payload.painPoints),
        training_intent=sanitize_text(payload.trainingIntent),
        best_exercise=sanitize_text(payload.bestExercise),
        worst_exercise=sanitize_text(payload.worstExercise),
        desired_adjustment=sanitize_text(payload.desiredAdjustment),
        notes=sanitize_text(payload.notes),
    )


def _goal_from_payload(payload: TrainingGoalPayload) -> TrainingGoal:
    return TrainingGoal(
        id=payload.id,
        name=sanitize_text(payload.name),
        target_metric=sanitize_text(payload.targetMetric),
        start_value=payload.startValue,
        target_value=payload.targetValue,
        unit=sanitize_text(payload.unit),
        due_date=sanitize_text(payload.dueDate),
        priority=sanitize_text(payload.priority),
        status=sanitize_text(payload.status),
        notes=sanitize_text(payload.notes),
    )


def _block_from_payload(payload: TrainingBlockPayload) -> TrainingBlock:
    return TrainingBlock(
        id=payload.id,
        name=sanitize_text(payload.name),
        focus=sanitize_text(payload.focus),
        phase_type=sanitize_text(payload.phaseType),
        objective=sanitize_text(payload.objective),
        weekly_frequency=payload.weeklyFrequency,
        default_template_id=payload.defaultTemplateId,
        start_date=sanitize_text(payload.startDate),
        end_date=sanitize_text(payload.endDate),
        status=sanitize_text(payload.status),
        notes=sanitize_text(payload.notes),
        progression_notes=sanitize_text(payload.progressionNotes),
    )


def _update_settings(context: AppContext, payload: SettingsPayload) -> None:
    context.repository.set_setting("coach_api_enabled", "1" if payload.coachApiEnabled else "0")
    context.repository.set_setting("coach_api_model", sanitize_text(payload.coachApiModel or "gpt-5.2"))
    context.repository.set_setting("coach_api_key", sanitize_text(payload.coachApiKey))
    context.repository.set_setting("sidebar_collapsed", "1" if payload.sidebarCollapsed else "0")
    profile = context.repository.get_fitness_profile()
    profile.display_name = sanitize_text(payload.displayName)
    profile.preferred_unit = sanitize_text(payload.preferredUnit)
    profile.coaching_style = sanitize_text(payload.coachingStyle)
    profile.weekly_availability = payload.weeklyAvailability
    profile.preferred_focus = sanitize_text(payload.preferredFocus)
    profile.intensity_preference = sanitize_text(payload.intensityPreference)
    context.repository.save_fitness_profile(profile)


def _custom_focuses_to_dicts(items: list[CustomFocusPayload]) -> list[dict[str, str]]:
    return [{"name": sanitize_text(item.name), "description": sanitize_text(item.description)} for item in items]


def create_api_app(context: AppContext | None = None, startup_report: str | None = None) -> FastAPI:
    if context is None:
        context, default_report = build_runtime_context()
        startup_report = startup_report or default_report
    startup_report = startup_report or "API lista."

    app = FastAPI(title="Bapp Gym Coach API", version="0.1.0", docs_url="/docs", redoc_url="/redoc")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "tauri://localhost"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.context = context
    app.state.startup_report = startup_report

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/bootstrap")
    def bootstrap() -> dict[str, object]:
        return build_bootstrap_payload(app.state.context, app.state.startup_report)

    @app.get("/onboarding/state")
    def onboarding_state() -> dict[str, object]:
        return build_onboarding_state_payload(app.state.context)

    @app.post("/onboarding/profile")
    def onboarding_profile(payload: FitnessProfilePayload) -> dict[str, object]:
        profile = app.state.context.onboarding.save_profile(_profile_from_payload(payload))
        return {
            "saved": True,
            "profile": profile_to_payload(profile),
            "state": build_onboarding_state_payload(app.state.context),
        }

    @app.post("/onboarding/focuses")
    def onboarding_focuses(payload: OnboardingFocusesPayload) -> dict[str, object]:
        selected = app.state.context.onboarding.save_focuses(
            payload.selectedFocuses,
            _custom_focuses_to_dicts(payload.customFocuses),
        )
        return {
            "saved": True,
            "selectedFocuses": selected,
            "state": build_onboarding_state_payload(app.state.context),
        }

    @app.post("/onboarding/templates/generate")
    def onboarding_generate_templates(payload: OnboardingGeneratePayload) -> dict[str, object]:
        clean_focuses = app.state.context.onboarding.save_focuses(
            payload.selectedFocuses,
            _custom_focuses_to_dicts(payload.customFocuses),
        )
        templates = app.state.context.onboarding.generate_templates(
            _profile_from_payload(payload.profile),
            clean_focuses,
            limit=payload.limit,
        )
        return {
            "saved": True,
            "templates": [template_to_payload(item) for item in templates],
            "state": build_onboarding_state_payload(app.state.context),
        }

    @app.post("/onboarding/complete")
    def onboarding_complete(payload: OnboardingCompletePayload) -> dict[str, object]:
        result = app.state.context.onboarding.complete(
            _profile_from_payload(payload.profile),
            payload.selectedFocuses,
            [_template_from_payload(item) for item in payload.templates],
        )
        if payload.customFocuses:
            app.state.context.onboarding.save_focuses(
                payload.selectedFocuses,
                _custom_focuses_to_dicts(payload.customFocuses),
            )
        return {
            "saved": True,
            "result": result,
            "bootstrap": build_bootstrap_payload(app.state.context, app.state.startup_report),
            "state": build_onboarding_state_payload(app.state.context),
        }

    @app.get("/dashboard")
    def dashboard() -> dict[str, object]:
        return build_dashboard_payload(app.state.context)

    @app.get("/training/templates")
    def training_templates() -> dict[str, object]:
        return build_training_templates_payload(app.state.context)

    @app.get("/training/session-draft")
    def training_session_draft(focus: str = Query(default="")) -> dict[str, object]:
        return build_training_draft_payload(app.state.context, focus)

    @app.post("/training/session")
    def save_training_session(payload: WorkoutSessionPayload) -> dict[str, object]:
        session_id = app.state.context.repository.save_session(_session_from_payload(payload))
        app.state.context.repository.set_setting("active_focus", sanitize_text(payload.title))
        saved = app.state.context.repository.get_session(session_id)
        exercise_lookup = {exercise.name: exercise for exercise in app.state.context.repository.list_exercises()}
        return {"saved": True, "session": session_to_detail(saved, exercise_lookup) if saved else None}

    @app.post("/training/template/save")
    def save_training_template(payload: SessionTemplatePayload) -> dict[str, object]:
        template_id = app.state.context.repository.save_template(_template_from_payload(payload))
        template = app.state.context.repository.get_template(payload.focus)
        return {"saved": True, "templateId": template_id, "template": template_to_payload(template)}

    @app.get("/exercises")
    def exercises(
        search: str = Query(default=""),
        category: str = Query(default=""),
        equipment: str = Query(default=""),
        modality: str = Query(default=""),
        origin: str = Query(default=""),
    ) -> dict[str, object]:
        return build_exercises_payload(app.state.context, search, category, equipment, modality, origin)

    @app.get("/exercises/{exercise_id}")
    def exercise_detail(exercise_id: int) -> dict[str, object]:
        exercise = app.state.context.repository.get_exercise(exercise_id)
        if exercise is None:
            raise HTTPException(status_code=404, detail="Ejercicio no encontrado.")
        return exercise_to_summary(exercise)

    @app.post("/exercises")
    def create_exercise(payload: ExerciseUpsertPayload) -> dict[str, object]:
        try:
            exercise_id = app.state.context.repository.save_exercise(_exercise_from_payload(payload))
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=sanitize_text(exc)) from exc
        saved = app.state.context.repository.get_exercise(exercise_id)
        return {"saved": True, "exerciseId": exercise_id, "exercise": exercise_to_summary(saved)}

    @app.patch("/exercises/{exercise_id}")
    def update_exercise(exercise_id: int, payload: ExerciseUpsertPayload) -> dict[str, object]:
        try:
            data = payload.model_copy(update={"id": exercise_id})
            saved_id = app.state.context.repository.save_exercise(_exercise_from_payload(data))
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=sanitize_text(exc)) from exc
        saved = app.state.context.repository.get_exercise(saved_id)
        return {"saved": True, "exerciseId": saved_id, "exercise": exercise_to_summary(saved)}

    @app.get("/history")
    def history(
        focus: str = Query(default=""),
        status: str = Query(default=""),
        search: str = Query(default=""),
    ) -> dict[str, object]:
        return build_history_payload(app.state.context, focus, status, search)

    @app.get("/history/{session_id}")
    def history_detail(session_id: int) -> dict[str, object]:
        session = app.state.context.repository.get_session(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Sesion no encontrada.")
        exercise_lookup = {exercise.name: exercise for exercise in app.state.context.repository.list_exercises()}
        return session_to_detail(session, exercise_lookup)

    @app.delete("/history/{session_id}")
    def delete_history_session(session_id: int) -> dict[str, object]:
        session = app.state.context.repository.get_session(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Sesion no encontrada.")
        app.state.context.repository.delete_session(session_id)
        return {"deleted": True, "sessionId": session_id}

    @app.get("/plan")
    def plan() -> dict[str, object]:
        return build_plan_payload(app.state.context)

    @app.post("/plan/goals")
    def save_plan_goal(payload: TrainingGoalPayload) -> dict[str, object]:
        goal_id = app.state.context.repository.save_goal(_goal_from_payload(payload))
        goal = next((item for item in app.state.context.repository.list_training_goals() if item.id == goal_id), None)
        return {"saved": True, "goalId": goal_id, "goal": goal_to_payload(goal) if goal else None}

    @app.post("/plan/blocks")
    def save_plan_block(payload: TrainingBlockPayload) -> dict[str, object]:
        block_id = app.state.context.repository.save_block(_block_from_payload(payload))
        block = next((item for item in app.state.context.repository.list_training_blocks() if item.id == block_id), None)
        return {"saved": True, "blockId": block_id, "block": block_to_payload(block) if block else None}

    @app.get("/body/profile")
    def body_profile() -> dict[str, object]:
        return profile_to_payload(app.state.context.repository.get_fitness_profile())

    @app.put("/body/profile")
    def save_body_profile(payload: FitnessProfilePayload) -> dict[str, object]:
        app.state.context.repository.save_fitness_profile(_profile_from_payload(payload))
        return {"saved": True, "profile": profile_to_payload(app.state.context.repository.get_fitness_profile())}

    @app.get("/body/checkins")
    def body_checkins() -> dict[str, object]:
        return build_body_payload(app.state.context)

    @app.post("/body/checkins")
    def save_body_checkin(payload: BodyCheckInPayload) -> dict[str, object]:
        checkin_id = app.state.context.repository.save_body_checkin(_body_from_payload(payload))
        saved = next((item for item in app.state.context.repository.list_body_checkins(limit=120) if item.id == checkin_id), None)
        return {"saved": True, "checkinId": checkin_id, "checkin": body_checkin_to_payload(saved) if saved else None}

    @app.get("/coach/context")
    def coach_context() -> dict[str, object]:
        return build_coach_context_payload(app.state.context)

    @app.post("/coach/checkins")
    def save_coach_checkin(payload: CoachCheckInPayload) -> dict[str, object]:
        checkin_id = app.state.context.repository.save_coach_checkin(_coach_checkin_from_payload(payload))
        saved = next((item for item in app.state.context.repository.list_coach_checkins(limit=60) if item.id == checkin_id), None)
        return {"saved": True, "checkinId": checkin_id, "checkin": coach_checkin_to_payload(saved)}

    @app.post("/coach/respond")
    def coach_respond(payload: CoachRespondPayload) -> dict[str, object]:
        user_message = CoachMessage(role="user", source="ui", content=sanitize_text(payload.message))
        app.state.context.repository.save_coach_message(user_message)
        response = app.state.context.coach.respond(payload.message)
        app.state.context.repository.save_coach_message(response)
        return {"saved": True, "message": coach_message_to_payload(response), "context": build_coach_context_payload(app.state.context)}

    @app.get("/settings")
    def settings() -> dict[str, object]:
        return build_settings_payload(app.state.context)

    @app.put("/settings")
    def save_settings(payload: SettingsPayload) -> dict[str, object]:
        _update_settings(app.state.context, payload)
        return {"saved": True, "settings": build_settings_payload(app.state.context)}

    @app.post("/settings/export/json")
    def export_json() -> dict[str, object]:
        output = app.state.context.repository.export_json()
        return {"saved": True, "format": "json", "path": str(output)}

    @app.post("/settings/export/csv")
    def export_csv() -> dict[str, object]:
        outputs = app.state.context.repository.export_csv()
        return {"saved": True, "format": "csv", "paths": [str(path) for path in outputs]}

    return app
