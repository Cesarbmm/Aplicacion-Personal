export const onboardingGoals = ['hypertrophy', 'strength', 'weight_loss'] as const
export const onboardingExperienceLevels = ['beginner', 'intermediate', 'advanced'] as const

export type OnboardingGoal = (typeof onboardingGoals)[number]
export type OnboardingExperienceLevel = (typeof onboardingExperienceLevels)[number]
export type UserRole = 'athlete' | 'coach' | 'admin'

export type Gym = {
  gymId: string
  name: string
  slug: string
  createdAt: string
}

export type CreateAccountInput = {
  email: string
  name: string
  role: Exclude<UserRole, 'admin'>
  gymId?: string
  gymName?: string
}

export type SaveOnboardingInput = {
  goal: OnboardingGoal
  experienceLevel: OnboardingExperienceLevel
  daysPerWeek: number
}

export type UserProfile = {
  userId: string
  email: string
  name: string
  role: UserRole
  gymId: string | null
  gymName: string | null
  onboardingCompleted: boolean
  goal: OnboardingGoal | null
  experienceLevel: OnboardingExperienceLevel | null
  daysPerWeek: number | null
  createdAt: string
  updatedAt: string | null
}
