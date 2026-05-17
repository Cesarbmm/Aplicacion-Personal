import type { SaveOnboardingInput, UserProfile } from '../types/profile.js'

export interface UserProfileRepository {
  getProfile(userId: string): Promise<UserProfile | null>
  listProfiles(): Promise<UserProfile[]>
  saveOnboarding(userId: string, input: SaveOnboardingInput): Promise<UserProfile>
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`No existe un usuario con id ${userId}.`)
    this.name = 'UserNotFoundError'
  }
}
