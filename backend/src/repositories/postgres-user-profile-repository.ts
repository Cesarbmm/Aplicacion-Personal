import type { Pool } from 'pg'

import type { Gym, UserProfile } from '../types/profile.js'
import {
  GymNotFoundError,
  GymRequiredError,
  UserNotFoundError,
  type UserProfileRepository,
} from './user-profile-repository.js'

type UserProfileRow = {
  user_id: string
  email: string
  name: string
  role: UserProfile['role']
  gym_id: string | null
  gym_name: string | null
  goal: UserProfile['goal']
  experience_level: UserProfile['experienceLevel']
  days_per_week: number | null
  onboarding_completed: boolean
  created_at: Date
  updated_at: Date | null
}

type GymRow = {
  gym_id: string
  name: string
  slug: string
  created_at: Date
}

const profileSelect = `
  SELECT
    u.id AS user_id,
    u.email,
    u.name,
    u.role,
    u.gym_id,
    g.name AS gym_name,
    up.goal,
    up.experience_level,
    up.days_per_week,
    COALESCE(up.onboarding_completed, FALSE) AS onboarding_completed,
    u.created_at,
    up.updated_at
  FROM users u
  LEFT JOIN gyms g ON g.id = u.gym_id
  LEFT JOIN user_profiles up ON up.user_id = u.id
`

function mapRow(row: UserProfileRow): UserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    gymId: row.gym_id,
    gymName: row.gym_name,
    goal: row.goal,
    experienceLevel: row.experience_level,
    daysPerWeek: row.days_per_week,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  }
}

function mapGym(row: GymRow): Gym {
  return {
    gymId: row.gym_id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at.toISOString(),
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createPostgresUserProfileRepository(pool: Pool): UserProfileRepository {
  return {
    async getProfile(userId) {
      const result = await pool.query<UserProfileRow>(`${profileSelect} WHERE u.id = $1`, [userId])
      return result.rows[0] ? mapRow(result.rows[0]) : null
    },

    async getProfileByEmail(email) {
      const result = await pool.query<UserProfileRow>(`${profileSelect} WHERE LOWER(u.email) = LOWER($1)`, [email])
      return result.rows[0] ? mapRow(result.rows[0]) : null
    },

    async listProfiles(filter = {}) {
      const conditions: string[] = []
      const params: unknown[] = []

      if (filter.gymId) {
        params.push(filter.gymId)
        conditions.push(`u.gym_id = $${params.length}`)
      }

      if (filter.role) {
        params.push(filter.role)
        conditions.push(`u.role = $${params.length}`)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const result = await pool.query<UserProfileRow>(
        `${profileSelect} ${whereClause} ORDER BY u.created_at ASC`,
        params,
      )

      return result.rows.map(mapRow)
    },

    async listGyms() {
      const result = await pool.query<GymRow>(
        `
          SELECT id AS gym_id, name, slug, created_at
          FROM gyms
          ORDER BY name ASC
        `,
      )
      return result.rows.map(mapGym)
    },

    async createAccount(input) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')
        let gymId = input.gymId ?? null

        if (input.role === 'coach') {
          const gymName = input.gymName?.trim()
          if (!gymName) {
            throw new GymRequiredError()
          }

          const slug = slugify(gymName)
          const gymResult = await client.query<{ id: string }>(
            `
              INSERT INTO gyms (name, slug)
              VALUES ($1, $2)
              ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
              RETURNING id
            `,
            [gymName, slug],
          )
          gymId = gymResult.rows[0]?.id ?? null
        }

        if (input.role === 'athlete') {
          if (!gymId) {
            throw new GymRequiredError()
          }

          const gymExists = await client.query<{ id: string }>('SELECT id FROM gyms WHERE id = $1', [gymId])
          if (gymExists.rowCount === 0) {
            throw new GymNotFoundError(gymId)
          }
        }

        const userResult = await client.query<{ id: string }>(
          `
            INSERT INTO users (email, name, role, gym_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name, role = EXCLUDED.role, gym_id = EXCLUDED.gym_id
            RETURNING id
          `,
          [input.email.toLowerCase(), input.name, input.role, gymId],
        )
        const userId = userResult.rows[0]?.id

        if (!userId) {
          throw new UserNotFoundError(input.email)
        }

        await client.query(
          `
            INSERT INTO user_profiles (user_id, onboarding_completed)
            VALUES ($1, FALSE)
            ON CONFLICT (user_id) DO NOTHING
          `,
          [userId],
        )

        const profileResult = await client.query<UserProfileRow>(`${profileSelect} WHERE u.id = $1`, [userId])
        await client.query('COMMIT')

        const profile = profileResult.rows[0] ? mapRow(profileResult.rows[0]) : null
        if (!profile) {
          throw new UserNotFoundError(userId)
        }
        return profile
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
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

      const profileResult = await pool.query<UserProfileRow>(`${profileSelect} WHERE u.id = $1`, [userId])
      const profile = profileResult.rows[0] ? mapRow(profileResult.rows[0]) : null
      if (!profile) {
        throw new UserNotFoundError(userId)
      }
      return profile
    },
  }
}
