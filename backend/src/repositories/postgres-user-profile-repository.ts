import type { Pool } from 'pg'

import type { UserProfile } from '../types/profile.js'
import { UserNotFoundError, type UserProfileRepository } from './user-profile-repository.js'

type UserProfileRow = {
  user_id: string
  email: string
  name: string
  goal: UserProfile['goal']
  experience_level: UserProfile['experienceLevel']
  days_per_week: number | null
  onboarding_completed: boolean
  created_at: Date
  updated_at: Date | null
}

function mapRow(row: UserProfileRow): UserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    goal: row.goal,
    experienceLevel: row.experience_level,
    daysPerWeek: row.days_per_week,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  }
}

export function createPostgresUserProfileRepository(pool: Pool): UserProfileRepository {
  return {
    async getProfile(userId) {
      const result = await pool.query<UserProfileRow>(
        `
          SELECT
            u.id AS user_id,
            u.email,
            u.name,
            up.goal,
            up.experience_level,
            up.days_per_week,
            COALESCE(up.onboarding_completed, FALSE) AS onboarding_completed,
            u.created_at,
            up.updated_at
          FROM users u
          LEFT JOIN user_profiles up ON up.user_id = u.id
          WHERE u.id = $1
        `,
        [userId],
      )

      return result.rows[0] ? mapRow(result.rows[0]) : null
    },

    async saveOnboarding(userId, input) {
      const userExists = await pool.query<{ id: string }>('SELECT id FROM users WHERE id = $1', [userId])

      if (userExists.rowCount === 0) {
        throw new UserNotFoundError(userId)
      }

      await pool.query(
        `
          INSERT INTO user_profiles (user_id, goal, experience_level, days_per_week, onboarding_completed, updated_at)
          VALUES ($1, $2, $3, $4, TRUE, NOW())
          ON CONFLICT (user_id) DO UPDATE
          SET
            goal = EXCLUDED.goal,
            experience_level = EXCLUDED.experience_level,
            days_per_week = EXCLUDED.days_per_week,
            onboarding_completed = TRUE,
            updated_at = NOW()
        `,
        [userId, input.goal, input.experienceLevel, input.daysPerWeek],
      )

      const profileResult = await pool.query<UserProfileRow>(
        `
          SELECT
            u.id AS user_id,
            u.email,
            u.name,
            up.goal,
            up.experience_level,
            up.days_per_week,
            COALESCE(up.onboarding_completed, FALSE) AS onboarding_completed,
            u.created_at,
            up.updated_at
          FROM users u
          LEFT JOIN user_profiles up ON up.user_id = u.id
          WHERE u.id = $1
        `,
        [userId],
      )

      const profile = profileResult.rows[0] ? mapRow(profileResult.rows[0]) : null

      if (!profile) {
        throw new UserNotFoundError(userId)
      }

      return profile
    },
  }
}
