INSERT INTO users (id, email, name, role, gym_id)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'coach@sigmafit.app', 'Coach Sigma Norte', 'coach', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('c0000000-0000-4000-8000-000000000002', 'titan.coach@sigmafit.app', 'Coach Titan', 'coach', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('d0000000-0000-4000-8000-000000000001', 'atleta1@sigmafit.app', 'Ana Torres', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000002', 'atleta2@sigmafit.app', 'Bruno Vega', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000003', 'atleta3@sigmafit.app', 'Carla Ruiz', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000004', 'atleta4@sigmafit.app', 'Diego Mena', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000005', 'atleta5@sigmafit.app', 'Elena Paz', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000006', 'atleta6@sigmafit.app', 'Fabian Leon', 'athlete', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('d0000000-0000-4000-8000-000000000007', 'titan1@sigmafit.app', 'Gabriela Soto', 'athlete', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('d0000000-0000-4000-8000-000000000008', 'titan2@sigmafit.app', 'Hugo Mora', 'athlete', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('d0000000-0000-4000-8000-000000000009', 'titan3@sigmafit.app', 'Irene Luna', 'athlete', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('d0000000-0000-4000-8000-000000000010', 'titan4@sigmafit.app', 'Jorge Ortiz', 'athlete', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  gym_id = EXCLUDED.gym_id;

INSERT INTO user_profiles (user_id, onboarding_completed)
VALUES
  ('c0000000-0000-4000-8000-000000000001', FALSE),
  ('c0000000-0000-4000-8000-000000000002', FALSE)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (
  user_id,
  goal,
  experience_level,
  days_per_week,
  onboarding_completed,
  updated_at
)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'hypertrophy', 'intermediate', 4, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000002', 'strength', 'advanced', 4, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000003', 'weight_loss', 'beginner', 3, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000004', 'hypertrophy', 'intermediate', 5, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000005', 'strength', 'intermediate', 3, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000006', 'hypertrophy', 'advanced', 5, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000007', 'weight_loss', 'beginner', 3, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000008', 'strength', 'advanced', 4, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000009', 'hypertrophy', 'intermediate', 4, TRUE, NOW()),
  ('d0000000-0000-4000-8000-000000000010', 'weight_loss', 'intermediate', 3, TRUE, NOW())
ON CONFLICT (user_id) DO UPDATE
SET
  goal = EXCLUDED.goal,
  experience_level = EXCLUDED.experience_level,
  days_per_week = EXCLUDED.days_per_week,
  onboarding_completed = TRUE,
  updated_at = NOW();

DELETE FROM routines
WHERE user_id::text LIKE 'd0000000-0000-4000-8000-%';

DO $$
DECLARE
  athlete RECORD;
  exercise RECORD;
  routine_id_value UUID;
  routine_day_id_value UUID;
  session_id_value UUID;
  athlete_index INTEGER := 0;
  day_index INTEGER;
  session_index INTEGER;
  session_count INTEGER;
  set_index INTEGER;
  completed_value BOOLEAN;
  weight_value NUMERIC(10, 2);
  reps_value INTEGER;
  fatigue_value INTEGER;
  pain_value INTEGER;
BEGIN
  FOR athlete IN
    SELECT
      u.id AS user_id,
      up.goal,
      up.days_per_week
    FROM users u
    JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id::text LIKE 'd0000000-0000-4000-8000-%'
    ORDER BY u.id
  LOOP
    athlete_index := athlete_index + 1;

    INSERT INTO routines (user_id, name, goal, days_per_week, creation_mode, is_active)
    VALUES (
      athlete.user_id,
      'Bloque mensual demo',
      athlete.goal,
      athlete.days_per_week,
      'coach',
      TRUE
    )
    RETURNING id INTO routine_id_value;

    FOR day_index IN 1..athlete.days_per_week
    LOOP
      INSERT INTO routine_days (routine_id, day_number, title)
      VALUES (
        routine_id_value,
        day_index,
        CASE
          WHEN day_index % 3 = 1 THEN 'Empuje y core'
          WHEN day_index % 3 = 2 THEN 'Pierna completa'
          ELSE 'Jalon y bisagra'
        END
      )
      RETURNING id INTO routine_day_id_value;

      IF day_index % 3 = 1 THEN
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 1, 4, '8-10', 90 FROM exercises WHERE name = 'Press de banca';
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 2, 3, '45', 60 FROM exercises WHERE name = 'Plancha abdominal';
      ELSIF day_index % 3 = 2 THEN
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 1, 4, '8-10', 120 FROM exercises WHERE name = 'Sentadilla con barra';
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 2, 3, '10-12', 90 FROM exercises WHERE name = 'Prensa de piernas';
      ELSE
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 1, 4, '5-8', 150 FROM exercises WHERE name = 'Peso muerto';
        INSERT INTO routine_exercises (routine_day_id, exercise_id, exercise_order, sets, reps, rest_seconds)
        SELECT routine_day_id_value, id, 2, 3, '8-12', 90 FROM exercises WHERE name = 'Jalon al pecho';
      END IF;
    END LOOP;

    session_count := CASE
      WHEN athlete_index <= 3 THEN 12
      WHEN athlete_index <= 6 THEN 9
      WHEN athlete_index <= 8 THEN 7
      ELSE 4
    END;

    FOR session_index IN 1..session_count
    LOOP
      SELECT id
      INTO routine_day_id_value
      FROM routine_days
      WHERE routine_id = routine_id_value
      ORDER BY day_number
      OFFSET ((session_index - 1) % athlete.days_per_week)
      LIMIT 1;

      fatigue_value := CASE
        WHEN athlete_index IN (6, 9) THEN 9
        WHEN athlete_index IN (4, 8) THEN 7
        ELSE 5 + (session_index % 2)
      END;

      pain_value := CASE
        WHEN athlete_index IN (5, 10) THEN 8
        WHEN athlete_index = 6 THEN 5
        ELSE session_index % 3
      END;

      INSERT INTO workout_sessions (
        user_id,
        routine_id,
        routine_day_id,
        status,
        source,
        perceived_fatigue,
        pain_level,
        athlete_notes,
        started_at,
        finished_at
      )
      VALUES (
        athlete.user_id,
        routine_id_value,
        routine_day_id_value,
        'completed',
        'seed',
        fatigue_value,
        pain_value,
        CASE
          WHEN pain_value >= 7 THEN 'Molestia alta reportada en el bloque demo.'
          WHEN fatigue_value >= 8 THEN 'Fatiga alta al cierre de la sesion.'
          ELSE 'Sesion completada con tecnica estable.'
        END,
        date_trunc('month', CURRENT_DATE) + ((session_index * 2 - 1) || ' days')::interval + interval '18 hours',
        date_trunc('month', CURRENT_DATE) + ((session_index * 2 - 1) || ' days')::interval + interval '19 hours'
      )
      RETURNING id INTO session_id_value;

      FOR exercise IN
        SELECT
          re.id AS routine_exercise_id,
          re.exercise_id,
          re.sets,
          re.reps,
          e.name,
          e.tracking_type
        FROM routine_exercises re
        JOIN exercises e ON e.id = re.exercise_id
        WHERE re.routine_day_id = routine_day_id_value
        ORDER BY re.exercise_order
      LOOP
        reps_value := COALESCE((regexp_match(exercise.reps, '\d+'))[1]::integer, 8);
        weight_value := CASE exercise.name
          WHEN 'Press de banca' THEN 45 + athlete_index * 4 + session_index
          WHEN 'Sentadilla con barra' THEN 65 + athlete_index * 5 + session_index
          WHEN 'Peso muerto' THEN 80 + athlete_index * 6 + session_index
          WHEN 'Prensa de piernas' THEN 100 + athlete_index * 7
          WHEN 'Jalon al pecho' THEN 35 + athlete_index * 2
          ELSE 0
        END;

        FOR set_index IN 1..exercise.sets
        LOOP
          completed_value := CASE
            WHEN athlete_index <= 4 THEN TRUE
            WHEN athlete_index <= 7 THEN set_index < exercise.sets
            ELSE set_index = 1
          END;

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
          VALUES (
            session_id_value,
            exercise.routine_exercise_id,
            exercise.exercise_id,
            set_index,
            reps_value,
            CASE WHEN exercise.tracking_type = 'time' THEN NULL ELSE reps_value END,
            CASE WHEN exercise.tracking_type = 'time' THEN reps_value ELSE NULL END,
            completed_value,
            CASE WHEN exercise.tracking_type = 'time' THEN NULL ELSE weight_value END,
            'kg',
            CASE WHEN completed_value THEN NOW() ELSE NULL END
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END
$$;
