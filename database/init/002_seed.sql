INSERT INTO users (id, email, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'demo@sigmafit.app', 'Demo Athlete')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, onboarding_completed)
VALUES ('11111111-1111-4111-8111-111111111111', FALSE)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO exercises (name, muscle_group, movement_pattern, equipment, difficulty, goal_focus)
VALUES
  ('Press de banca', 'Pecho', 'Empuje horizontal', 'Barra', 'intermediate', 'strength'),
  ('Sentadilla con barra', 'Piernas', 'Dominante de rodilla', 'Barra', 'intermediate', 'strength'),
  ('Peso muerto', 'Posterior', 'Bisagra de cadera', 'Barra', 'advanced', 'strength'),
  ('Press militar', 'Hombros', 'Empuje vertical', 'Barra', 'intermediate', 'strength'),
  ('Remo con barra', 'Espalda', 'Tiron horizontal', 'Barra', 'intermediate', 'hypertrophy'),
  ('Jalon al pecho', 'Espalda', 'Tiron vertical', 'Polea', 'beginner', 'hypertrophy'),
  ('Curl de biceps', 'Biceps', 'Aislamiento', 'Mancuernas', 'beginner', 'hypertrophy'),
  ('Extension de triceps', 'Triceps', 'Aislamiento', 'Polea', 'beginner', 'hypertrophy'),
  ('Prensa de piernas', 'Piernas', 'Dominante de rodilla', 'Maquina', 'beginner', 'weight_loss'),
  ('Plancha abdominal', 'Core', 'Estabilidad', 'Peso corporal', 'beginner', 'general')
ON CONFLICT (name) DO NOTHING;
