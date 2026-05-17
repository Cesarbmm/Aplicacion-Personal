import type { SaveOnboardingInput, UserProfile } from '../../src/types/profile.js'
import { UserNotFoundError, type UserProfileRepository } from '../../src/repositories/user-profile-repository.js'

export function createInMemoryUserProfileRepository(seedProfile?: Partial<UserProfile>): UserProfileRepository {
  const profiles = new Map<string, UserProfile>()

  if (seedProfile?.userId) {
    profiles.set(seedProfile.userId, {
      userId: seedProfile.userId,
      email: seedProfile.email || 'demo@sigmafit.app',
      name: seedProfile.name || 'Demo Athlete',
      onboardingCompleted: seedProfile.onboardingCompleted ?? false,
      goal: seedProfile.goal ?? null,
      experienceLevel: seedProfile.experienceLevel ?? null,
      daysPerWeek: seedProfile.daysPerWeek ?? null,
      createdAt: seedProfile.createdAt || new Date('2026-01-01T00:00:00.000Z').toISOString(),
      updatedAt: seedProfile.updatedAt || null,
    })
  }

  return {
    async getProfile(userId) {
      return profiles.get(userId) || null
    },
    async listProfiles() {
      return Array.from(profiles.values()).map((profile) => structuredClone(profile))
    },
    async saveOnboarding(userId, input: SaveOnboardingInput) {
      const existingProfile = profiles.get(userId)

      if (!existingProfile) {
        throw new UserNotFoundError(userId)
      }

      const nextProfile: UserProfile = {
        ...existingProfile,
        goal: input.goal,
        experienceLevel: input.experienceLevel,
        daysPerWeek: input.daysPerWeek,
        onboardingCompleted: true,
        updatedAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
      }

      profiles.set(userId, nextProfile)
      return nextProfile
    },
  }
}
