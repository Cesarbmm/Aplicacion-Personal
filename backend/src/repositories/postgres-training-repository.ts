import type { Pool, PoolClient } from 'pg'

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
  difficulty: ExerciseCatalogEntry['difficulty']
  goal_focus: ExerciseCatalogEntry['goalFocus']
}

type RoutineRow = {
  routine_id: string
  user_id: string
  routine_name: string
  goal: Routine['goal']
  days_per_week: number
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
  exercise_order: number
  sets: number
  reps: string
  rest_seconds: number
  set_id: string
  set_number: number
  target_reps: number
  completed: boolean
  weight: string | null
  unit: WorkoutSessionSet['unit']
  completed_at: Date | null
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
      completed: row.completed,
      weight: row.weight === null ? null : Number(row.weight),
      unit: row.unit,
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    })
  })

  return session
}

function parseRepRangeToTargetReps(repRange: string) {
  if (!repRange.includes('-')) {
    return Number(repRange)
  }

  const [min, max] = repRange.split('-').map((value) => Number(value))
  return Math.round((min + max) / 2)
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
        re.exercise_order,
        re.sets,
        re.reps,
        re.rest_seconds,
        wss.id AS set_id,
        wss.set_number,
        wss.target_reps,
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
            INSERT INTO routines (user_id, name, goal, days_per_week, is_active)
            VALUES ($1, $2, $3, $4, TRUE)
            RETURNING id
          `,
          [userId, routineDraft.name, routineDraft.goal, routineDraft.daysPerWeek],
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
          sets: number
          reps: string
        }>(
          `
            SELECT
              id AS routine_exercise_id,
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
                  set_number,
                  target_reps,
                  completed,
                  weight,
                  unit
                )
                VALUES ($1, $2, $3, $4, FALSE, NULL, $5)
              `,
              [sessionId, exercise.routine_exercise_id, setNumber, targetReps, input.unit],
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

    async updateWorkoutSessionSet(sessionId, setId, input) {
      const updateResult = await pool.query<{ id: string }>(
        `
          UPDATE workout_session_sets
          SET
            completed = $3,
            weight = $4,
            unit = $5,
            completed_at = CASE WHEN $3 THEN NOW() ELSE NULL END
          WHERE workout_session_id = $1
            AND id = $2
          RETURNING id
        `,
        [sessionId, setId, input.completed, input.weight, input.unit],
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

    async finishWorkoutSession(sessionId) {
      const result = await pool.query<{
        session_id: string
        status: WorkoutSessionSummary['status']
        completed_sets: string
        total_volume: string
      }>(
        `
          WITH updated_session AS (
            UPDATE workout_sessions
            SET
              status = 'completed',
              finished_at = COALESCE(finished_at, NOW())
            WHERE id = $1
            RETURNING id, status
          )
          SELECT
            updated_session.id AS session_id,
            updated_session.status,
            COUNT(*) FILTER (WHERE wss.completed = TRUE)::text AS completed_sets,
            COALESCE(
              SUM(
                CASE
                  WHEN wss.completed = TRUE THEN COALESCE(wss.weight, 0) * wss.target_reps
                  ELSE 0
                END
              ),
              0
            )::text AS total_volume
          FROM updated_session
          LEFT JOIN workout_session_sets wss ON wss.workout_session_id = updated_session.id
          GROUP BY updated_session.id, updated_session.status
        `,
        [sessionId],
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
      }
    },
  }
}
