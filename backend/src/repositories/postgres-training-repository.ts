import type { Pool, PoolClient } from 'pg'

import type {
  AdaptiveRecommendation,
  AdaptiveRecommendationDraft,
  AdaptiveTrainingSignals,
} from '../types/adaptive.js'
import type { MonthlyTrainingSignals } from '../types/monthly-summary.js'
import type { MonthlySessionSummary } from '../types/monthly-report.js'
import type {
  ExerciseCatalogEntry,
  Routine,
  RoutineDay,
  RoutineExercise,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionSet,
  WorkoutSessionSummary,
} from '../types/routine.js'
import {
  ExerciseNotFoundError,
  RoutineDayNotFoundError,
  RoutineNotFoundError,
  WorkoutSessionNotFoundError,
  WorkoutSessionSetNotFoundError,
  type TrainingRepository,
} from './training-repository.js'

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>

type ExerciseCatalogRow = {
  exercise_id: string
  name: string
  muscle_group: string
  movement_pattern: string
  equipment: string
  tracking_type: ExerciseCatalogEntry['trackingType']
  coaching_cue: string
  difficulty: ExerciseCatalogEntry['difficulty']
  goal_focus: ExerciseCatalogEntry['goalFocus']
}

type RoutineRow = {
  routine_id: string
  user_id: string
  routine_name: string
  goal: Routine['goal']
  days_per_week: number
  creation_mode: Routine['creationMode']
  is_active: boolean
  routine_created_at: Date
  routine_day_id: string | null
  day_number: number | null
  routine_day_title: string | null
  routine_exercise_id: string | null
  exercise_id: string | null
  exercise_name: string | null
  muscle_group: string | null
  movement_pattern: string | null
  equipment: string | null
  tracking_type: ExerciseCatalogEntry['trackingType'] | null
  coaching_cue: string | null
  exercise_order: number | null
  sets: number | null
  reps: string | null
  rest_seconds: number | null
}

type WorkoutSessionRow = {
  session_id: string
  user_id: string
  routine_id: string
  routine_day_id: string
  status: WorkoutSession['status']
  started_at: Date
  finished_at: Date | null
  day_number: number
  routine_day_title: string
  routine_exercise_id: string
  exercise_id: string
  exercise_name: string
  muscle_group: string
  equipment: string
  tracking_type: ExerciseCatalogEntry['trackingType']
  coaching_cue: string
  exercise_order: number
  sets: number
  reps: string
  rest_seconds: number
  set_id: string
  set_number: number
  target_reps: number
  actual_reps: number | null
  actual_seconds: number | null
  completed: boolean
  weight: string | null
  unit: WorkoutSessionSet['unit']
  completed_at: Date | null
}

type AdaptiveSignalsRow = {
  user_id: string
  routine_id: string | null
  sessions_analyzed: string
  completed_sets: string
  planned_sets: string
  average_fatigue: string | null
  average_pain: string | null
  max_pain: number | null
  total_volume: string
  total_reps: string
  total_seconds: string
  notes: string[] | null
}

type AdaptiveRecommendationRow = {
  id: string
  user_id: string
  routine_id: string | null
  recommendation_type: AdaptiveRecommendation['type']
  summary: string
  reasoning: string
  suggested_load_change_percent: string
  suggested_volume_change: AdaptiveRecommendation['suggestedVolumeChange']
  risk_level: AdaptiveRecommendation['riskLevel']
  created_at: Date
}

type MonthlySignalsRow = {
  user_id: string
  completed_sessions: string
  completed_sets: string
  planned_sets: string
  total_volume: string
  total_reps: string
  total_seconds: string
  average_rpe: string | null
  average_pain: string | null
}

type MonthlySessionRow = {
  session_id: string
  session_date: Date
  source: MonthlySessionSummary['source']
  completed_sets: string
  total_volume: string
  fatigue_level: number | null
  pain_level: number | null
  athlete_notes: string | null
}

function hydrateRoutine(rows: RoutineRow[]) {
  if (rows.length === 0) {
    return null
  }

  const firstRow = rows[0]
  const routine: Routine = {
    routineId: firstRow.routine_id,
    userId: firstRow.user_id,
    name: firstRow.routine_name,
    goal: firstRow.goal,
    daysPerWeek: firstRow.days_per_week,
    creationMode: firstRow.creation_mode,
    isActive: firstRow.is_active,
    createdAt: firstRow.routine_created_at.toISOString(),
    days: [],
  }

  const daysById = new Map<string, RoutineDay>()

  rows.forEach((row) => {
    if (!row.routine_day_id || !row.day_number || !row.routine_day_title) {
      return
    }

    let day = daysById.get(row.routine_day_id)
    if (!day) {
      day = {
        routineDayId: row.routine_day_id,
        dayNumber: row.day_number,
        title: row.routine_day_title,
        exercises: [],
      }
      daysById.set(row.routine_day_id, day)
      routine.days.push(day)
    }

    if (
      row.routine_exercise_id &&
      row.exercise_id &&
      row.exercise_name &&
      row.muscle_group &&
      row.movement_pattern &&
      row.equipment &&
      row.tracking_type &&
      row.coaching_cue &&
      row.exercise_order &&
      row.sets &&
      row.reps &&
      row.rest_seconds
    ) {
      const exercise: RoutineExercise = {
        routineExerciseId: row.routine_exercise_id,
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        muscleGroup: row.muscle_group,
        movementPattern: row.movement_pattern,
        equipment: row.equipment,
        trackingType: row.tracking_type,
        coachingCue: row.coaching_cue,
        exerciseOrder: row.exercise_order,
        sets: row.sets,
        reps: row.reps,
        restSeconds: row.rest_seconds,
      }

      day.exercises.push(exercise)
    }
  })

  return routine
}

function hydrateWorkoutSession(rows: WorkoutSessionRow[]) {
  if (rows.length === 0) {
    return null
  }

  const firstRow = rows[0]
  const session: WorkoutSession = {
    sessionId: firstRow.session_id,
    userId: firstRow.user_id,
    routineId: firstRow.routine_id,
    routineDayId: firstRow.routine_day_id,
    dayNumber: firstRow.day_number,
    title: firstRow.routine_day_title,
    status: firstRow.status,
    startedAt: firstRow.started_at.toISOString(),
    finishedAt: firstRow.finished_at ? firstRow.finished_at.toISOString() : null,
    exercises: [],
  }

  const exercisesById = new Map<string, WorkoutSessionExercise>()

  rows.forEach((row) => {
    let exercise = exercisesById.get(row.routine_exercise_id)

    if (!exercise) {
      exercise = {
        routineExerciseId: row.routine_exercise_id,
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        muscleGroup: row.muscle_group,
        equipment: row.equipment,
        trackingType: row.tracking_type,
        coachingCue: row.coaching_cue,
        exerciseOrder: row.exercise_order,
        sets: row.sets,
        reps: row.reps,
        restSeconds: row.rest_seconds,
        sessionSets: [],
      }
      exercisesById.set(row.routine_exercise_id, exercise)
      session.exercises.push(exercise)
    }

    exercise.sessionSets.push({
      setId: row.set_id,
      routineExerciseId: row.routine_exercise_id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      setNumber: row.set_number,
      targetReps: row.target_reps,
      actualReps: row.actual_reps,
      actualSeconds: row.actual_seconds,
      completed: row.completed,
      weight: row.weight === null ? null : Number(row.weight),
      unit: row.unit,
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    })
  })

  return session
}

function parseRepRangeToTargetReps(repRange: string) {
  const values = repRange.match(/\d+/g)?.map((value) => Number(value)) ?? []

  if (values.length === 0) {
    return 1
  }

  if (values.length === 1) {
    return values[0]
  }

  const [min, max] = values
  return Math.round((min + max) / 2)
}

function mapAdaptiveRecommendation(row: AdaptiveRecommendationRow): AdaptiveRecommendation {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id,
    type: row.recommendation_type,
    summary: row.summary,
    reasoning: row.reasoning,
    suggestedLoadChangePercent: Number(row.suggested_load_change_percent),
    suggestedVolumeChange: row.suggested_volume_change,
    riskLevel: row.risk_level,
    createdAt: row.created_at.toISOString(),
  }
}

async function fetchRoutineRows(queryable: Queryable, whereClause: string, params: unknown[]) {
  const result = await queryable.query<RoutineRow>(
    `
      SELECT
        r.id AS routine_id,
        r.user_id,
        r.name AS routine_name,
        r.goal,
        r.days_per_week,
        r.creation_mode,
        r.is_active,
        r.created_at AS routine_created_at,
        rd.id AS routine_day_id,
        rd.day_number,
        rd.title AS routine_day_title,
        re.id AS routine_exercise_id,
        e.id AS exercise_id,
        e.name AS exercise_name,
        e.muscle_group,
        e.movement_pattern,
        e.equipment,
        e.tracking_type,
        e.coaching_cue,
        re.exercise_order,
        re.sets,
        re.reps,
        re.rest_seconds
      FROM routines r
      LEFT JOIN routine_days rd ON rd.routine_id = r.id
      LEFT JOIN routine_exercises re ON re.routine_day_id = rd.id
      LEFT JOIN exercises e ON e.id = re.exercise_id
      ${whereClause}
      ORDER BY rd.day_number ASC, re.exercise_order ASC
    `,
    params,
  )

  return result.rows
}

async function fetchWorkoutSessionRows(queryable: Queryable, sessionId: string) {
  const result = await queryable.query<WorkoutSessionRow>(
    `
      SELECT
        ws.id AS session_id,
        ws.user_id,
        ws.routine_id,
        ws.routine_day_id,
        ws.status,
        ws.started_at,
        ws.finished_at,
        rd.day_number,
        rd.title AS routine_day_title,
        re.id AS routine_exercise_id,
        e.id AS exercise_id,
        e.name AS exercise_name,
        e.muscle_group,
        e.equipment,
        e.tracking_type,
        e.coaching_cue,
        re.exercise_order,
        re.sets,
        re.reps,
        re.rest_seconds,
        wss.id AS set_id,
        wss.set_number,
        wss.target_reps,
        wss.actual_reps,
        wss.actual_seconds,
        wss.completed,
        wss.weight,
        wss.unit,
        wss.completed_at
      FROM workout_sessions ws
      JOIN routine_days rd ON rd.id = ws.routine_day_id
      JOIN routine_exercises re ON re.routine_day_id = rd.id
      JOIN exercises e ON e.id = re.exercise_id
      JOIN workout_session_sets wss
        ON wss.routine_exercise_id = re.id
       AND wss.workout_session_id = ws.id
      WHERE ws.id = $1
      ORDER BY re.exercise_order ASC, wss.set_number ASC
    `,
    [sessionId],
  )

  return result.rows
}

export function createPostgresTrainingRepository(pool: Pool): TrainingRepository {
  return {
    async getExerciseCatalog() {
      const result = await pool.query<ExerciseCatalogRow>(
        `
          SELECT
            id AS exercise_id,
            name,
            muscle_group,
            movement_pattern,
            equipment,
            tracking_type,
            coaching_cue,
            difficulty,
            goal_focus
          FROM exercises
          ORDER BY name ASC
        `,
      )

      return result.rows.map((row) => ({
        exerciseId: row.exercise_id,
        name: row.name,
        muscleGroup: row.muscle_group,
        movementPattern: row.movement_pattern,
        equipment: row.equipment,
        trackingType: row.tracking_type,
        coachingCue: row.coaching_cue,
        difficulty: row.difficulty,
        goalFocus: row.goal_focus,
      }))
    },

    async replaceActiveRoutine(userId, routineDraft) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        await client.query(
          `
            UPDATE routines
            SET is_active = FALSE
            WHERE user_id = $1 AND is_active = TRUE
          `,
          [userId],
        )

        const routineResult = await client.query<{
          id: string
        }>(
          `
            INSERT INTO routines (user_id, name, goal, days_per_week, creation_mode, is_active)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            RETURNING id
          `,
          [
            userId,
            routineDraft.name,
            routineDraft.goal,
            routineDraft.daysPerWeek,
            routineDraft.creationMode,
          ],
        )

        const routineId = routineResult.rows[0]?.id

        if (!routineId) {
          throw new RoutineNotFoundError(userId)
        }

        for (const day of routineDraft.days) {
          const dayResult = await client.query<{ id: string }>(
            `
              INSERT INTO routine_days (routine_id, day_number, title)
              VALUES ($1, $2, $3)
              RETURNING id
            `,
            [routineId, day.dayNumber, day.title],
          )

          const routineDayId = dayResult.rows[0]?.id

          for (const exercise of day.exercises) {
            await client.query(
              `
                INSERT INTO routine_exercises (
                  routine_day_id,
                  exercise_id,
                  exercise_order,
                  sets,
                  reps,
                  rest_seconds
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `,
              [
                routineDayId,
                exercise.exerciseId,
                exercise.exerciseOrder,
                exercise.sets,
                exercise.reps,
                exercise.restSeconds,
              ],
            )
          }
        }

        const routineRows = await fetchRoutineRows(client, 'WHERE r.id = $1', [routineId])

        await client.query('COMMIT')

        const routine = hydrateRoutine(routineRows)
        if (!routine) {
          throw new RoutineNotFoundError(routineId)
        }

        return routine
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },

    async getCurrentRoutine(userId) {
      const currentRoutineResult = await pool.query<{ id: string }>(
        `
          SELECT id
          FROM routines
          WHERE user_id = $1 AND is_active = TRUE
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [userId],
      )

      const routineId = currentRoutineResult.rows[0]?.id
      if (!routineId) {
        return null
      }

      const routineRows = await fetchRoutineRows(pool, 'WHERE r.id = $1', [routineId])
      return hydrateRoutine(routineRows)
    },

    async getRoutineById(routineId) {
      const routineRows = await fetchRoutineRows(pool, 'WHERE r.id = $1', [routineId])
      return hydrateRoutine(routineRows)
    },

    async createWorkoutSession(input) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        const routineDayResult = await client.query<{
          routine_day_id: string
        }>(
          `
            SELECT rd.id AS routine_day_id
            FROM routines r
            JOIN routine_days rd ON rd.routine_id = r.id
            WHERE r.id = $1
              AND r.user_id = $2
              AND rd.id = $3
          `,
          [input.routineId, input.userId, input.routineDayId],
        )

        if (routineDayResult.rowCount === 0) {
          throw new RoutineDayNotFoundError(input.routineDayId)
        }

        const routineExercisesResult = await client.query<{
          routine_exercise_id: string
          exercise_id: string
          sets: number
          reps: string
        }>(
          `
            SELECT
              id AS routine_exercise_id,
              exercise_id,
              sets,
              reps
            FROM routine_exercises
            WHERE routine_day_id = $1
            ORDER BY exercise_order ASC
          `,
          [input.routineDayId],
        )

        const sessionResult = await client.query<{ id: string }>(
          `
            INSERT INTO workout_sessions (user_id, routine_id, routine_day_id, status)
            VALUES ($1, $2, $3, 'active')
            RETURNING id
          `,
          [input.userId, input.routineId, input.routineDayId],
        )

        const sessionId = sessionResult.rows[0]?.id

        if (!sessionId) {
          throw new WorkoutSessionNotFoundError(input.routineId)
        }

        for (const exercise of routineExercisesResult.rows) {
          const targetReps = parseRepRangeToTargetReps(exercise.reps)

          for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
            await client.query(
              `
                INSERT INTO workout_session_sets (
                  workout_session_id,
                  routine_exercise_id,
                  exercise_id,
                  set_number,
                  target_reps,
                  completed,
                  weight,
                  unit
                )
                VALUES ($1, $2, $3, $4, $5, FALSE, NULL, $6)
              `,
              [
                sessionId,
                exercise.routine_exercise_id,
                exercise.exercise_id,
                setNumber,
                targetReps,
                input.unit,
              ],
            )
          }
        }

        const sessionRows = await fetchWorkoutSessionRows(client, sessionId)

        await client.query('COMMIT')

        const workoutSession = hydrateWorkoutSession(sessionRows)
        if (!workoutSession) {
          throw new WorkoutSessionNotFoundError(sessionId)
        }

        return workoutSession
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },

    async createPostWorkoutSession(input) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        if (input.routineId && input.routineDayId) {
          const routineDay = await client.query<{ id: string }>(
            `
              SELECT rd.id
              FROM routines r
              JOIN routine_days rd ON rd.routine_id = r.id
              WHERE r.id = $1 AND r.user_id = $2 AND rd.id = $3
            `,
            [input.routineId, input.userId, input.routineDayId],
          )

          if (routineDay.rowCount === 0) {
            throw new RoutineDayNotFoundError(input.routineDayId)
          }
        }

        const sessionResult = await client.query<{ id: string }>(
          `
            INSERT INTO workout_sessions (
              user_id,
              routine_id,
              routine_day_id,
              status,
              source,
              raw_text,
              perceived_fatigue,
              pain_level,
              athlete_notes,
              finished_at
            )
            VALUES ($1, $2, $3, 'completed', 'post_workout', $4, $5, $6, $7, NOW())
            RETURNING id
          `,
          [
            input.userId,
            input.routineId ?? null,
            input.routineDayId ?? null,
            input.rawText,
            input.feedback.fatigueLevel,
            input.feedback.painLevel,
            input.feedback.athleteNotes,
          ],
        )
        const sessionId = sessionResult.rows[0]?.id

        if (!sessionId) {
          throw new WorkoutSessionNotFoundError(input.userId)
        }

        let totalVolume = 0
        let totalReps = 0
        let totalSeconds = 0
        let completedSets = 0

        for (const item of input.items) {
          const exerciseResult = await client.query<{ id: string }>(
            'SELECT id FROM exercises WHERE LOWER(name) = LOWER($1)',
            [item.exerciseName],
          )
          const exerciseId = exerciseResult.rows[0]?.id

          if (!exerciseId) {
            throw new ExerciseNotFoundError(item.exerciseName)
          }

          let routineExerciseId: string | null = null
          if (input.routineDayId) {
            const routineExerciseResult = await client.query<{ id: string }>(
              `
                SELECT id
                FROM routine_exercises
                WHERE routine_day_id = $1 AND exercise_id = $2
                LIMIT 1
              `,
              [input.routineDayId, exerciseId],
            )
            routineExerciseId = routineExerciseResult.rows[0]?.id ?? null
          }

          for (let setNumber = 1; setNumber <= item.sets; setNumber += 1) {
            const actualReps = item.reps ?? null
            const actualSeconds = item.actualSeconds ?? null
            const weight = item.weight ?? null
            await client.query(
              `
                INSERT INTO workout_session_sets (
                  workout_session_id,
                  routine_exercise_id,
                  exercise_id,
                  set_number,
                  target_reps,
                  actual_reps,
                  actual_seconds,
                  completed,
                  weight,
                  unit,
                  completed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9, NOW())
              `,
              [
                sessionId,
                routineExerciseId,
                exerciseId,
                setNumber,
                actualReps ?? 1,
                actualReps,
                actualSeconds,
                weight,
                item.unit,
              ],
            )

            completedSets += 1
            totalReps += actualReps ?? 0
            totalSeconds += actualSeconds ?? 0
            totalVolume += (weight ?? 0) * (actualReps ?? 0)
          }
        }

        await client.query('COMMIT')

        return {
          sessionId,
          status: 'completed',
          completedSets,
          totalVolume,
          totalReps,
          totalSeconds,
          fatigueLevel: input.feedback.fatigueLevel,
          painLevel: input.feedback.painLevel,
          athleteNotes: input.feedback.athleteNotes,
        }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },

    async updateWorkoutSessionSet(sessionId, setId, input) {
      const updateResult = await pool.query<{ id: string }>(
        `
          UPDATE workout_session_sets
          SET
            completed = $3,
            weight = $4,
            unit = $5,
            actual_reps = $6,
            actual_seconds = $7,
            completed_at = CASE WHEN $3 THEN NOW() ELSE NULL END
          WHERE workout_session_id = $1
            AND id = $2
          RETURNING id
        `,
        [
          sessionId,
          setId,
          input.completed,
          input.weight,
          input.unit,
          input.actualReps ?? null,
          input.actualSeconds ?? null,
        ],
      )

      if (updateResult.rowCount === 0) {
        throw new WorkoutSessionSetNotFoundError(setId)
      }

      const sessionRows = await fetchWorkoutSessionRows(pool, sessionId)
      const session = hydrateWorkoutSession(sessionRows)

      if (!session) {
        throw new WorkoutSessionNotFoundError(sessionId)
      }

      return session
    },

    async finishWorkoutSession(sessionId, input = {}) {
      const result = await pool.query<{
        session_id: string
        status: WorkoutSessionSummary['status']
        completed_sets: string
        total_volume: string
        total_reps: string
        total_seconds: string
        fatigue_level: number | null
        pain_level: number | null
        athlete_notes: string | null
      }>(
        `
          WITH updated_session AS (
            UPDATE workout_sessions
            SET
              status = 'completed',
              finished_at = COALESCE(finished_at, NOW()),
              perceived_fatigue = $2,
              pain_level = $3,
              athlete_notes = NULLIF($4, '')
            WHERE id = $1
            RETURNING id, status, perceived_fatigue, pain_level, athlete_notes
          )
          SELECT
            updated_session.id AS session_id,
            updated_session.status,
            updated_session.perceived_fatigue AS fatigue_level,
            updated_session.pain_level,
            updated_session.athlete_notes,
            COUNT(*) FILTER (WHERE wss.completed = TRUE)::text AS completed_sets,
            COALESCE(
              SUM(
                CASE
                  WHEN wss.completed = TRUE THEN COALESCE(wss.weight, 0) * COALESCE(wss.actual_reps, wss.target_reps)
                  ELSE 0
                END
              ),
              0
            )::text AS total_volume
            ,
            COALESCE(
              SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_reps, wss.target_reps) ELSE 0 END),
              0
            )::text AS total_reps,
            COALESCE(
              SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_seconds, 0) ELSE 0 END),
              0
            )::text AS total_seconds
          FROM updated_session
          LEFT JOIN workout_session_sets wss ON wss.workout_session_id = updated_session.id
          GROUP BY
            updated_session.id,
            updated_session.status,
            updated_session.perceived_fatigue,
            updated_session.pain_level,
            updated_session.athlete_notes
        `,
        [
          sessionId,
          input.fatigueLevel ?? null,
          input.painLevel ?? null,
          input.athleteNotes?.trim() ?? null,
        ],
      )

      const row = result.rows[0]

      if (!row) {
        throw new WorkoutSessionNotFoundError(sessionId)
      }

      return {
        sessionId: row.session_id,
        status: 'completed',
        completedSets: Number(row.completed_sets),
        totalVolume: Number(row.total_volume),
        totalReps: Number(row.total_reps),
        totalSeconds: Number(row.total_seconds),
        fatigueLevel: row.fatigue_level,
        painLevel: row.pain_level,
        athleteNotes: row.athlete_notes,
      }
    },

    async getAdaptiveTrainingSignals(userId) {
      const result = await pool.query<AdaptiveSignalsRow>(
        `
          WITH user_sessions AS (
            SELECT *
            FROM workout_sessions
            WHERE user_id = $1
              AND status = 'completed'
          ),
          set_stats AS (
            SELECT
              us.user_id,
              COUNT(*) FILTER (WHERE wss.completed = TRUE)::numeric AS completed_sets,
              COUNT(wss.id)::numeric AS planned_sets,
              COALESCE(
                SUM(
                  CASE
                    WHEN wss.completed = TRUE THEN COALESCE(wss.weight, 0) * COALESCE(wss.actual_reps, wss.target_reps)
                    ELSE 0
                  END
                ),
                0
              )::numeric AS total_volume,
              COALESCE(
                SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_reps, wss.target_reps) ELSE 0 END),
                0
              )::numeric AS total_reps,
              COALESCE(
                SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_seconds, 0) ELSE 0 END),
                0
              )::numeric AS total_seconds
            FROM user_sessions us
            LEFT JOIN workout_session_sets wss ON wss.workout_session_id = us.id
            GROUP BY us.user_id
          ),
          latest_routine AS (
            SELECT routine_id
            FROM user_sessions
            ORDER BY finished_at DESC NULLS LAST, started_at DESC
            LIMIT 1
          )
          SELECT
            $1::uuid AS user_id,
            (SELECT routine_id FROM latest_routine) AS routine_id,
            COUNT(us.id)::text AS sessions_analyzed,
            COALESCE(MAX(ss.completed_sets), 0)::text AS completed_sets,
            COALESCE(MAX(ss.planned_sets), 0)::text AS planned_sets,
            AVG(us.perceived_fatigue)::text AS average_fatigue,
            AVG(us.pain_level)::text AS average_pain,
            MAX(us.pain_level) AS max_pain,
            COALESCE(MAX(ss.total_volume), 0)::text AS total_volume,
            COALESCE(MAX(ss.total_reps), 0)::text AS total_reps,
            COALESCE(MAX(ss.total_seconds), 0)::text AS total_seconds,
            COALESCE(
              ARRAY_REMOVE(ARRAY_AGG(us.athlete_notes ORDER BY us.finished_at DESC), NULL),
              ARRAY[]::text[]
            ) AS notes
          FROM user_sessions us
          LEFT JOIN set_stats ss ON ss.user_id = us.user_id
        `,
        [userId],
      )

      const row = result.rows[0]
      const plannedSets = Number(row?.planned_sets ?? 0)
      const completedSets = Number(row?.completed_sets ?? 0)

      return {
        userId,
        routineId: row?.routine_id ?? null,
        sessionsAnalyzed: Number(row?.sessions_analyzed ?? 0),
        completedSets,
        plannedSets,
        completionRate: plannedSets > 0 ? completedSets / plannedSets : 0,
        averageFatigue: row?.average_fatigue === null || row?.average_fatigue === undefined
          ? null
          : Number(row.average_fatigue),
        averagePain: row?.average_pain === null || row?.average_pain === undefined
          ? null
          : Number(row.average_pain),
        maxPain: row?.max_pain ?? null,
        totalVolume: Number(row?.total_volume ?? 0),
        totalReps: Number(row?.total_reps ?? 0),
        totalSeconds: Number(row?.total_seconds ?? 0),
        notes: row?.notes ?? [],
      } satisfies AdaptiveTrainingSignals
    },

    async getMonthlyTrainingSignals(userId, month) {
      const result = await pool.query<MonthlySignalsRow>(
        `
          WITH month_bounds AS (
            SELECT
              to_date($2, 'YYYY-MM')::timestamp AS month_start,
              (to_date($2, 'YYYY-MM') + interval '1 month')::timestamp AS month_end
          ),
          month_sessions AS (
            SELECT ws.*
            FROM workout_sessions ws, month_bounds mb
            WHERE ws.user_id = $1
              AND ws.status = 'completed'
              AND COALESCE(ws.finished_at, ws.started_at) >= mb.month_start
              AND COALESCE(ws.finished_at, ws.started_at) < mb.month_end
          )
          SELECT
            $1::uuid AS user_id,
            COUNT(DISTINCT ms.id)::text AS completed_sessions,
            COUNT(wss.id) FILTER (WHERE wss.completed = TRUE)::text AS completed_sets,
            COUNT(wss.id)::text AS planned_sets,
            COALESCE(
              SUM(
                CASE
                  WHEN wss.completed = TRUE THEN COALESCE(wss.weight, 0) * COALESCE(wss.actual_reps, wss.target_reps)
                  ELSE 0
                END
              ),
              0
            )::text AS total_volume,
            COALESCE(
              SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_reps, wss.target_reps) ELSE 0 END),
              0
            )::text AS total_reps,
            COALESCE(
              SUM(CASE WHEN wss.completed = TRUE THEN COALESCE(wss.actual_seconds, 0) ELSE 0 END),
              0
            )::text AS total_seconds,
            AVG(ms.perceived_fatigue)::text AS average_rpe,
            AVG(ms.pain_level)::text AS average_pain
          FROM month_sessions ms
          LEFT JOIN workout_session_sets wss ON wss.workout_session_id = ms.id
        `,
        [userId, month],
      )

      const row = result.rows[0]

      return {
        userId,
        month,
        completedSessions: Number(row?.completed_sessions ?? 0),
        completedSets: Number(row?.completed_sets ?? 0),
        plannedSets: Number(row?.planned_sets ?? 0),
        totalVolume: Number(row?.total_volume ?? 0),
        totalReps: Number(row?.total_reps ?? 0),
        totalSeconds: Number(row?.total_seconds ?? 0),
        averageRpe: row?.average_rpe === null || row?.average_rpe === undefined ? null : Number(row.average_rpe),
        averagePain:
          row?.average_pain === null || row?.average_pain === undefined
            ? null
            : Number(row.average_pain),
      } satisfies MonthlyTrainingSignals
    },

    async getMonthlySessionSummaries(userId, month) {
      const result = await pool.query<MonthlySessionRow>(
        `
          WITH month_bounds AS (
            SELECT
              TO_DATE($2, 'YYYY-MM')::timestamp AS month_start,
              (TO_DATE($2, 'YYYY-MM') + interval '1 month')::timestamp AS month_end
          )
          SELECT
            ws.id AS session_id,
            COALESCE(ws.finished_at, ws.started_at) AS session_date,
            ws.source,
            COUNT(wss.id) FILTER (WHERE wss.completed = TRUE)::text AS completed_sets,
            COALESCE(
              SUM(
                CASE
                  WHEN wss.completed = TRUE THEN
                    COALESCE(wss.weight, 0) * COALESCE(wss.actual_reps, wss.target_reps)
                  ELSE 0
                END
              ),
              0
            )::text AS total_volume,
            ws.perceived_fatigue AS fatigue_level,
            ws.pain_level,
            ws.athlete_notes
          FROM workout_sessions ws
          LEFT JOIN workout_session_sets wss ON wss.workout_session_id = ws.id
          CROSS JOIN month_bounds mb
          WHERE ws.user_id = $1
            AND ws.status = 'completed'
            AND COALESCE(ws.finished_at, ws.started_at) >= mb.month_start
            AND COALESCE(ws.finished_at, ws.started_at) < mb.month_end
          GROUP BY ws.id
          ORDER BY session_date DESC
          LIMIT 12
        `,
        [userId, month],
      )

      return result.rows.map((row) => ({
        sessionId: row.session_id,
        date: row.session_date.toISOString(),
        source: row.source,
        completedSets: Number(row.completed_sets),
        totalVolume: Number(row.total_volume),
        fatigueLevel: row.fatigue_level,
        painLevel: row.pain_level,
        athleteNotes: row.athlete_notes,
      }))
    },

    async saveAdaptiveRecommendation(recommendation: AdaptiveRecommendationDraft) {
      const result = await pool.query<AdaptiveRecommendationRow>(
        `
          INSERT INTO adaptive_recommendations (
            user_id,
            routine_id,
            recommendation_type,
            summary,
            reasoning,
            suggested_load_change_percent,
            suggested_volume_change,
            risk_level
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING
            id,
            user_id,
            routine_id,
            recommendation_type,
            summary,
            reasoning,
            suggested_load_change_percent,
            suggested_volume_change,
            risk_level,
            created_at
        `,
        [
          recommendation.userId,
          recommendation.routineId,
          recommendation.type,
          recommendation.summary,
          recommendation.reasoning,
          recommendation.suggestedLoadChangePercent,
          recommendation.suggestedVolumeChange,
          recommendation.riskLevel,
        ],
      )

      return mapAdaptiveRecommendation(result.rows[0])
    },

    async getLatestAdaptiveRecommendation(userId) {
      const result = await pool.query<AdaptiveRecommendationRow>(
        `
          SELECT
            id,
            user_id,
            routine_id,
            recommendation_type,
            summary,
            reasoning,
            suggested_load_change_percent,
            suggested_volume_change,
            risk_level,
            created_at
          FROM adaptive_recommendations
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [userId],
      )

      const row = result.rows[0]
      return row ? mapAdaptiveRecommendation(row) : null
    },
  }
}
