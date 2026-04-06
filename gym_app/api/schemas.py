from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class SetPayload(ApiModel):
    id: int | None = None
    type: str = "trabajo"
    reps: int | None = None
    weight: float | None = None
    rest: int | None = None
    rir: float | None = None
    rpe: float | None = None
    tempo: str = ""
    unilateral: bool = False
    pain: bool = False
    completedStatus: str = "completado"
    notes: str = ""


class SessionExercisePayload(ApiModel):
    exerciseId: int | None = None
    exerciseName: str
    goal: str = ""
    notes: str = ""
    targetSets: int | None = None
    targetReps: str = ""
    targetWeight: float | None = None
    targetRest: int | None = None
    targetRir: float | None = None
    progressionRule: str = ""
    sets: list[SetPayload] = Field(default_factory=list)


class WorkoutSessionPayload(ApiModel):
    id: int | None = None
    sessionDate: str
    title: str
    blockName: str = ""
    notes: str = ""
    plannedFocus: str = ""
    completionStatus: str = "completado"
    perceivedEnergy: int | None = None
    durationMinutes: int | None = None
    sourceTemplateId: int | None = None
    readinessScore: int | None = None
    unitSystem: str = "metric"
    exercises: list[SessionExercisePayload] = Field(default_factory=list)


class TemplateExercisePayload(ApiModel):
    exerciseId: int | None = None
    exerciseName: str
    setType: str = "trabajo"
    defaultSets: int = 3
    defaultReps: str = "8-12"
    defaultWeight: float | None = None
    defaultRest: int | None = 90
    targetRir: float | None = None
    progressionRule: str = ""
    notes: str = ""


class SessionTemplatePayload(ApiModel):
    id: int | None = None
    focus: str
    name: str
    description: str = ""
    goal: str = ""
    exercises: list[TemplateExercisePayload] = Field(default_factory=list)


class ExerciseUpsertPayload(ApiModel):
    id: int | None = None
    name: str
    canonicalName: str = ""
    category: str
    modality: str = "fuerza"
    movementPattern: str = ""
    primaryMuscles: list[str] = Field(default_factory=list)
    secondaryMuscles: list[str] = Field(default_factory=list)
    equipment: str = ""
    difficulty: str = ""
    loadType: str = "peso"
    defaultUnit: str = "kg"
    cues: str = ""
    technicalNotes: str = ""
    variantGroup: str = ""
    alternatives: list[str] = Field(default_factory=list)
    isCompound: bool = False
    isCustom: bool = True
    status: str = "activo"


class BodyCheckInPayload(ApiModel):
    checkinDate: str
    weightKg: float | None = None
    bodyFatPct: float | None = None
    waistCm: float | None = None
    chestCm: float | None = None
    hipCm: float | None = None
    armCm: float | None = None
    thighCm: float | None = None
    heightCm: float | None = None
    age: int | None = None
    sex: str = ""
    activityLevel: str = ""
    goal: str = ""
    caloriesTarget: float | None = None
    basalMetabolism: float | None = None
    habitScore: int | None = None
    notes: str = ""


class FitnessProfilePayload(ApiModel):
    displayName: str = ""
    primaryGoal: str = ""
    experienceLevel: str = "intermedio"
    weeklyAvailability: int = 3
    equipmentAccess: list[str] = Field(default_factory=list)
    limitations: str = ""
    laggingMuscles: list[str] = Field(default_factory=list)
    preferredFocus: str = ""
    preferredUnit: str = "metric"
    coachingStyle: str = "directo"
    intensityPreference: str = "moderada"
    sex: str = ""
    age: int | None = None
    heightCm: float | None = None


class CoachCheckInPayload(ApiModel):
    checkinDate: str
    phase: str = "pre"
    focus: str = ""
    sessionId: int | None = None
    sleepHours: float | None = None
    energy: int | None = None
    soreness: int | None = None
    fatigue: int | None = None
    motivation: int | None = None
    stress: int | None = None
    painPoints: str = ""
    trainingIntent: str = ""
    bestExercise: str = ""
    worstExercise: str = ""
    desiredAdjustment: str = ""
    notes: str = ""


class CoachRespondPayload(ApiModel):
    message: str


class SettingsPayload(ApiModel):
    coachApiEnabled: bool = False
    coachApiModel: str = "gpt-5.2"
    coachApiKey: str = ""
    displayName: str = ""
    preferredUnit: str = "metric"
    coachingStyle: str = "directo"
    weeklyAvailability: int = 3
    preferredFocus: str = ""
    intensityPreference: str = "moderada"
    sidebarCollapsed: bool = False
    onboardingCompletedAt: str = ""


class CustomFocusPayload(ApiModel):
    name: str
    description: str = ""


class OnboardingFocusesPayload(ApiModel):
    selectedFocuses: list[str] = Field(default_factory=list)
    customFocuses: list[CustomFocusPayload] = Field(default_factory=list)


class OnboardingGeneratePayload(ApiModel):
    profile: FitnessProfilePayload = Field(default_factory=FitnessProfilePayload)
    selectedFocuses: list[str] = Field(default_factory=list)
    customFocuses: list[CustomFocusPayload] = Field(default_factory=list)
    limit: int = 4


class OnboardingCompletePayload(ApiModel):
    profile: FitnessProfilePayload = Field(default_factory=FitnessProfilePayload)
    selectedFocuses: list[str] = Field(default_factory=list)
    customFocuses: list[CustomFocusPayload] = Field(default_factory=list)
    templates: list[SessionTemplatePayload] = Field(default_factory=list)


class TrainingGoalPayload(ApiModel):
    id: int | None = None
    name: str
    targetMetric: str
    startValue: float | None = None
    targetValue: float | None = None
    unit: str = ""
    dueDate: str = ""
    priority: str = "media"
    status: str = "activo"
    notes: str = ""


class TrainingBlockPayload(ApiModel):
    id: int | None = None
    name: str
    focus: str = ""
    phaseType: str = ""
    objective: str = ""
    weeklyFrequency: int | None = None
    defaultTemplateId: int | None = None
    startDate: str = ""
    endDate: str = ""
    status: str = "activo"
    notes: str = ""
    progressionNotes: str = ""
