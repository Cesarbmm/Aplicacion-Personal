export type NavItem = {
  key: string
  label: string
  subtitle: string
}

export type BootstrapPayload = {
  appName: string
  startupReport: string
  activeFocus: string
  profileName: string
  navigation: NavItem[]
  dbPath: string
  exportPath: string
  requiresOnboarding: boolean
  sidebarCollapsed: boolean
}

export type MetricCard = {
  title: string
  value: string
  caption: string
}

export type ChartPoint = {
  date: string
  value: number
}

export type DashboardPayload = {
  heroTitle: string
  heroSubtitle: string
  heroBadges: { label: string; value: string }[]
  cards: MetricCard[]
  coachInsight: string[]
  recentLoads: { exercise: string; weight: number; reps: number; date: string }[]
  musclesWorked: { name: string; count: number }[]
  nextSession: {
    title: string
    summary: string
    items: { exercise: string; sets: number; reps: string; weight: number | '' | null; rir: number | '' | null }[]
    reasons: string[]
  }
  volumeSeries: ChartPoint[]
  weightSeries: ChartPoint[]
}

export type ExerciseSummary = {
  id: number | null
  name: string
  canonicalName: string
  category: string
  modality: string
  movementPattern: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
  difficulty: string
  loadType: string
  defaultUnit: string
  cues: string
  technicalNotes: string
  variantGroup: string
  alternatives: string[]
  isCompound: boolean
  isCustom: boolean
  status: string
}

export type TrainingFocus = {
  id: number | null
  name: string
  slug: string
  description: string
  origin: string
  sortOrder: number
  isActive: boolean
}

export type TrainingSet = {
  id?: number | null
  type: string
  reps: number | null
  weight: number | null
  rest: number | null
  rir: number | null
  rpe: number | null
  tempo: string
  unilateral: boolean
  pain: boolean
  completedStatus: string
  notes: string
}

export type DraftExercise = {
  exerciseId: number | null
  exerciseName: string
  goal: string
  notes: string
  targetSets: number | null
  targetReps: string
  targetWeight: number | null
  targetRest: number | null
  targetRir: number | null
  progressionRule: string
  exercise?: ExerciseSummary | null
  sets: TrainingSet[]
}

export type TrainingDraftPayload = {
  focus: string
  summary: string
  reasons: string[]
  watchToday: string[]
  template: {
    id: number | null
    focus: string
    name: string
    description: string
    goal: string
    exercises: {
      id: number | null
      exerciseId: number | null
      exerciseName: string
      exerciseOrder: number
      setType: string
      defaultSets: number
      defaultReps: string
      defaultWeight: number | null
      defaultRest: number | null
      targetRir: number | null
      progressionRule: string
      notes: string
    }[]
  } | null
  block: {
    id: number | null
    name: string
    focus: string
    phaseType: string
    objective: string
    weeklyFrequency: number | null
    notes: string
    progressionNotes: string
  } | null
  preCheckin: CoachCheckin | null
  postCheckin: CoachCheckin | null
  recommendations: Recommendation[]
  recentSessions: HistoryItem[]
  progressCards: { exercise: string; series: ChartPoint[] }[]
  sessionDraft: {
    sessionDate: string
    title: string
    blockName: string
    plannedFocus: string
    completionStatus: string
    perceivedEnergy: number | null
    durationMinutes: number | null
    sourceTemplateId: number | null
    readinessScore: number | null
    unitSystem: string
    notes: string
    exercises: DraftExercise[]
  }
}

export type TrainingTemplatesPayload = {
  activeFocus: string
  focuses: string[]
  focusCatalog: TrainingFocus[]
  templates: TrainingDraftPayload['template'][]
}

export type ExercisesPayload = {
  filters: Record<string, string>
  options: {
    categories: string[]
    equipment: string[]
    modalities: string[]
    origins: string[]
  }
  counts: {
    total: number
    custom: number
    compound: number
  }
  items: ExerciseSummary[]
}

export type HistoryItem = {
  id: number
  sessionDate: string
  title: string
  blockName: string
  completionStatus: string
  durationMinutes: number | null
  readinessScore: number | null
  exerciseCount: number
  setCount: number
  volume: number
}

export type SessionDetail = HistoryItem & {
  notes: string
  sourceTemplateId: number | null
  unitSystem: string
  createdAt: string
  updatedAt: string
  exercises: DraftExercise[]
}

export type HistoryPayload = {
  filters: Record<string, string>
  items: HistoryItem[]
  focusOptions: string[]
  statusOptions: string[]
  focusBreakdown: { focus: string; count: number }[]
}

export type Recommendation = {
  id: number | null
  generatedOn: string
  title: string
  summary: string
  actionType: string
  confidence: number
  source: string
  appliesToFocus: string
  sessionId: number | null
  checkinId: number | null
  status: string
  metadata: Record<string, unknown>
}

export type TrainingGoal = {
  id: number | null
  name: string
  targetMetric: string
  startValue: number | null
  targetValue: number | null
  unit: string
  dueDate: string
  priority: string
  status: string
  notes: string
}

export type TrainingBlock = {
  id: number | null
  name: string
  focus: string
  phaseType: string
  objective: string
  weeklyFrequency: number | null
  defaultTemplateId?: number | null
  startDate: string
  endDate: string
  status: string
  notes: string
  progressionNotes: string
}

export type PlanPayload = {
  activeFocus: string
  summary: string
  reasons: string[]
  watchToday: string[]
  items: { exercise: string; sets: number; reps: string; weight: number | '' | null; rest: number | '' | null; rir: number | '' | null; notes: string }[]
  goals: TrainingGoal[]
  blocks: TrainingBlock[]
  activeBlock: TrainingBlock | null
  recommendations: Recommendation[]
}

export type FitnessProfile = {
  displayName: string
  primaryGoal: string
  experienceLevel: string
  weeklyAvailability: number
  equipmentAccess: string[]
  limitations: string
  laggingMuscles: string[]
  preferredFocus: string
  preferredUnit: string
  coachingStyle: string
  intensityPreference: string
  sex: string
  age: number | null
  heightCm: number | null
}

export type BodyCheckin = {
  id?: number | null
  checkinDate: string
  weightKg: number | null
  bodyFatPct: number | null
  waistCm: number | null
  chestCm: number | null
  hipCm: number | null
  armCm: number | null
  thighCm: number | null
  heightCm: number | null
  age: number | null
  sex: string
  activityLevel: string
  goal: string
  caloriesTarget: number | null
  basalMetabolism: number | null
  habitScore: number | null
  notes: string
}

export type BodyPayload = {
  profile: FitnessProfile
  latestCheckin: BodyCheckin | null
  checkins: BodyCheckin[]
  weightSeries: ChartPoint[]
  insights: string[]
}

export type CoachCheckin = {
  id?: number | null
  checkinDate: string
  phase: string
  focus: string
  sessionId: number | null
  sleepHours: number | null
  energy: number | null
  soreness: number | null
  fatigue: number | null
  motivation: number | null
  stress: number | null
  painPoints: string
  trainingIntent: string
  bestExercise: string
  worstExercise: string
  desiredAdjustment: string
  notes: string
}

export type CoachMessage = {
  id?: number | null
  createdAt: string
  role: string
  source: string
  content: string
  metadata: Record<string, unknown>
}

export type CoachPayload = {
  focus: string
  profile: FitnessProfile
  mode: string
  planSummary: string
  watchToday: string[]
  preCheckin: CoachCheckin | null
  postCheckin: CoachCheckin | null
  messages: CoachMessage[]
  recommendations: Recommendation[]
}

export type SettingsPayload = {
  coachApiEnabled: boolean
  coachApiModel: string
  coachApiKey: string
  displayName: string
  preferredUnit: string
  coachingStyle: string
  weeklyAvailability: number
  preferredFocus: string
  intensityPreference: string
  dbPath: string
  exportPath: string
  sidebarCollapsed: boolean
  onboardingCompletedAt: string
}

export type OnboardingStatePayload = {
  requiresOnboarding: boolean
  currentStep: string
  hasTemplates: boolean
  profileCompleteness: number
  completedAt: string
  selectedFocuses: string[]
  profile: FitnessProfile
  focusCatalog: TrainingFocus[]
}

export type CustomFocusInput = {
  name: string
  description: string
}

export type OnboardingGeneratePayload = {
  profile: FitnessProfile
  selectedFocuses: string[]
  customFocuses?: CustomFocusInput[]
  limit?: number
}

export type OnboardingCompletePayload = {
  profile: FitnessProfile
  selectedFocuses: string[]
  customFocuses?: CustomFocusInput[]
  templates: NonNullable<TrainingDraftPayload['template']>[]
}

export type ExportResult = {
  saved: boolean
  format: 'json' | 'csv'
  path?: string
  paths?: string[]
}
