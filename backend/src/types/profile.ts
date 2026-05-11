export const onboardingGoals = ['hypertrophy', 'strength', 'weight_loss'] as const
export const onboardingExperienceLevels = ['beginner', 'intermediate', 'advanced'] as const

export type OnboardingGoal = (typeof onboardingGoals)[number]
export type OnboardingExperienceLevel = (typeof onboardingExperienceLevels)[number]

export type SaveOnboardingInput = {
  goal: OnboardingGoal
  experienceLevel: OnboardingExperienceLevel
  daysPerWeek: number
}

export type UserProfile = {
  userId: string
  email: string
  name: string
  onboardingCompleted: boolean
  goal: OnboardingGoal | null
  experienceLevel: OnboardingExperienceLevel | null
  daysPerWeek: number | null
  createdAt: string
  updatedAt: string | null
}
