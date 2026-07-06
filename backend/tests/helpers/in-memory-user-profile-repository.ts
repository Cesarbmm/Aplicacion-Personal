import { randomUUID } from 'node:crypto'

import type {
  CreateAccountInput,
  Gym,
  SaveOnboardingInput,
  UserProfile,
} from '../../src/types/profile.js'
import {
  GymNotFoundError,
  GymRequiredError,
  UserNotFoundError,
  type UserProfileRepository,
} from '../../src/repositories/user-profile-repository.js'

const defaultGym: Gym = {
  gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Sigma Gym Norte',
  slug: 'sigma-gym-norte',
  createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
}

export function createInMemoryUserProfileRepository(
  seedProfile?: Partial<UserProfile> | Array<Partial<UserProfile>>,
): UserProfileRepository {
  const profiles = new Map<string, UserProfile>()
  const gyms = new Map<string, Gym>([[defaultGym.gymId, defaultGym]])
  const seeds = Array.isArray(seedProfile) ? seedProfile : seedProfile ? [seedProfile] : []

  seeds.forEach((seed) => {
    if (!seed.userId) {
      return
    }

    profiles.set(seed.userId, {
      userId: seed.userId,
      email: seed.email || 'demo@sigmafit.app',
      name: seed.name || 'Demo Athlete',
      role: seed.role ?? 'athlete',
      gymId: seed.gymId === undefined ? defaultGym.gymId : seed.gymId,
      gymName: seed.gymName === undefined ? defaultGym.name : seed.gymName,
      onboardingCompleted: seed.onboardingCompleted ?? false,
      goal: seed.goal ?? null,
      experienceLevel: seed.experienceLevel ?? null,
      daysPerWeek: seed.daysPerWeek ?? null,
      createdAt: seed.createdAt || new Date('2026-01-01T00:00:00.000Z').toISOString(),
      updatedAt: seed.updatedAt || null,
    })
  })

  return {
    async getProfile(userId) {
      return profiles.get(userId) || null
    },

    async getProfileByEmail(email) {
      return Array.from(profiles.values()).find(
        (profile) => profile.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    },

    async listProfiles(filter = {}) {
      return Array.from(profiles.values())
        .filter((profile) => !filter.gymId || profile.gymId === filter.gymId)
        .filter((profile) => !filter.role || profile.role === filter.role)
        .map((profile) => structuredClone(profile))
    },

    async listGyms() {
      return Array.from(gyms.values()).map((gym) => structuredClone(gym))
    },

    async createAccount(input: CreateAccountInput) {
      let gym: Gym | undefined

      if (input.role === 'coach') {
        if (!input.gymName?.trim()) {
          throw new GymRequiredError()
        }

        gym = Array.from(gyms.values()).find(
          (candidate) => candidate.name.toLowerCase() === input.gymName?.trim().toLowerCase(),
        )

        if (!gym) {
          gym = {
            gymId: randomUUID(),
            name: input.gymName.trim(),
            slug: input.gymName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            createdAt: new Date().toISOString(),
          }
          gyms.set(gym.gymId, gym)
        }
      } else {
        if (!input.gymId) {
          throw new GymRequiredError()
        }
        gym = gyms.get(input.gymId)
        if (!gym) {
          throw new GymNotFoundError(input.gymId)
        }
      }

      const existing = Array.from(profiles.values()).find((profile) => profile.email === input.email)
      const account: UserProfile = {
        userId: existing?.userId ?? randomUUID(),
        email: input.email,
        name: input.name,
        role: input.role,
        gymId: gym.gymId,
        gymName: gym.name,
        onboardingCompleted: input.role === 'coach',
        goal: null,
        experienceLevel: null,
        daysPerWeek: null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: null,
      }
      profiles.set(account.userId, account)
      return structuredClone(account)
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
