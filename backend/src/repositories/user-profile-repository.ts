import type {
  CreateAccountInput,
  Gym,
  SaveOnboardingInput,
  UserProfile,
  UserRole,
} from '../types/profile.js'

export interface UserProfileRepository {
  getProfile(userId: string): Promise<UserProfile | null>
  getProfileByEmail(email: string): Promise<UserProfile | null>
  listProfiles(filter?: { gymId?: string; role?: UserRole }): Promise<UserProfile[]>
  listGyms(): Promise<Gym[]>
  createAccount(input: CreateAccountInput): Promise<UserProfile>
  saveOnboarding(userId: string, input: SaveOnboardingInput): Promise<UserProfile>
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`No existe un usuario con id ${userId}.`)
    this.name = 'UserNotFoundError'
  }
}

export class GymNotFoundError extends Error {
  constructor(gymId: string) {
    super(`No existe un gimnasio con id ${gymId}.`)
    this.name = 'GymNotFoundError'
  }
}

export class GymRequiredError extends Error {
  constructor() {
    super('El gimnasio es obligatorio para crear la cuenta.')
    this.name = 'GymRequiredError'
  }
}

export class CoachAccessRequiredError extends Error {
  constructor(userId: string) {
    super(`El usuario ${userId} no tiene acceso de coach.`)
    this.name = 'CoachAccessRequiredError'
  }
}
