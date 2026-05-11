ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS tracking_type TEXT NOT NULL DEFAULT 'weight_reps';

ALTER TABLE exercises
  DROP CONSTRAINT IF EXISTS exercises_tracking_type_check;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_tracking_type_check
  CHECK (tracking_type IN ('weight_reps', 'bodyweight_reps', 'time'));

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS coaching_cue TEXT NOT NULL DEFAULT 'Controlar tecnica, rango y respiracion antes de subir carga.';

UPDATE exercises
SET
  equipment = 'Barra olimpica y banco plano',
  tracking_type = 'weight_reps',
  coaching_cue = 'Usa banco plano, pies firmes, escapulas retraidas y barra controlada al pecho.'
WHERE name = 'Press de banca';

UPDATE exercises
SET
  equipment = 'Barra olimpica y rack',
  tracking_type = 'weight_reps',
  coaching_cue = 'Ajusta altura del rack, controla profundidad y mantiene brace antes de cada repeticion.'
WHERE name = 'Sentadilla con barra';

UPDATE exercises
SET
  equipment = 'Barra olimpica y discos',
  tracking_type = 'weight_reps',
  coaching_cue = 'Barra cerca del cuerpo, espalda neutra y subida sin tirones.'
WHERE name = 'Peso muerto';

UPDATE exercises
SET
  equipment = 'Barra olimpica o mancuernas',
  tracking_type = 'weight_reps',
  coaching_cue = 'Evita hiperextender la espalda y termina cada repeticion con control arriba.'
WHERE name = 'Press militar';

UPDATE exercises
SET
  equipment = 'Barra olimpica',
  tracking_type = 'weight_reps',
  coaching_cue = 'Torso estable, codos atras y pausa corta cerca del abdomen.'
WHERE name = 'Remo con barra';

UPDATE exercises
SET
  equipment = 'Polea alta con barra o agarre neutro',
  tracking_type = 'weight_reps',
  coaching_cue = 'Inicia con escapulas, baja hacia clavicula y evita balanceo.'
WHERE name = 'Jalon al pecho';

UPDATE exercises
SET
  equipment = 'Mancuernas o barra EZ',
  tracking_type = 'weight_reps',
  coaching_cue = 'Codos quietos y recorrido completo sin usar impulso.'
WHERE name = 'Curl de biceps';

UPDATE exercises
SET
  equipment = 'Polea alta con cuerda o barra',
  tracking_type = 'weight_reps',
  coaching_cue = 'Mantiene codos fijos y extiende sin mover hombros.'
WHERE name = 'Extension de triceps';

UPDATE exercises
SET
  equipment = 'Maquina de prensa de piernas',
  tracking_type = 'weight_reps',
  coaching_cue = 'Ajusta el asiento, controla la bajada y no bloquees rodillas violentamente.'
WHERE name = 'Prensa de piernas';

UPDATE exercises
SET
  equipment = 'Colchoneta o suelo',
  tracking_type = 'time',
  coaching_cue = 'Controla por segundos: pelvis neutra, abdomen firme y respiracion constante.'
WHERE name = 'Plancha abdominal';

ALTER TABLE workout_session_sets
  ADD COLUMN IF NOT EXISTS actual_reps INTEGER;

ALTER TABLE workout_session_sets
  ADD COLUMN IF NOT EXISTS actual_seconds INTEGER;

ALTER TABLE workout_session_sets
  DROP CONSTRAINT IF EXISTS workout_session_sets_actual_reps_check;

ALTER TABLE workout_session_sets
  ADD CONSTRAINT workout_session_sets_actual_reps_check
  CHECK (actual_reps IS NULL OR actual_reps >= 0);

ALTER TABLE workout_session_sets
  DROP CONSTRAINT IF EXISTS workout_session_sets_actual_seconds_check;

ALTER TABLE workout_session_sets
  ADD CONSTRAINT workout_session_sets_actual_seconds_check
  CHECK (actual_seconds IS NULL OR actual_seconds >= 0);

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS perceived_fatigue INTEGER;

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS pain_level INTEGER;

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS athlete_notes TEXT;

ALTER TABLE workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_perceived_fatigue_check;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_perceived_fatigue_check
  CHECK (perceived_fatigue IS NULL OR perceived_fatigue BETWEEN 1 AND 10);

ALTER TABLE workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_pain_level_check;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_pain_level_check
  CHECK (pain_level IS NULL OR pain_level BETWEEN 0 AND 10);
