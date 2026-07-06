CREATE TABLE IF NOT EXISTS coach_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athlete_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  generated_summary TEXT NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  weaknesses TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  opportunities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  recommendation TEXT NOT NULL,
  coach_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coach_monthly_reports_status_check
    CHECK (status IN ('draft', 'reviewed', 'delivered')),
  CONSTRAINT coach_monthly_reports_month_check
    CHECK (month = DATE_TRUNC('month', month)::DATE),
  CONSTRAINT coach_monthly_reports_unique_athlete_month
    UNIQUE (athlete_user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_coach_monthly_reports_gym_month
  ON coach_monthly_reports(gym_id, month DESC);

INSERT INTO coach_monthly_reports (
  coach_user_id,
  athlete_user_id,
  gym_id,
  month,
  generated_summary,
  strengths,
  weaknesses,
  opportunities,
  recommendation,
  coach_notes,
  status
)
VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    'Ana completo un mes consistente, con buen cumplimiento y progresion controlada.',
    ARRAY['Buena constancia durante el mes.', 'Alto cumplimiento de las series planificadas.'],
    ARRAY['La fatiga debe seguir monitoreandose al final de la semana.'],
    ARRAY['Consolidar la progresion con incrementos pequenos y controlados.'],
    'Continuar con una progresion moderada y monitorear la respuesta semanal.',
    'Buen avance general. Mantener tecnica y controlar la fatiga del tren superior.',
    'delivered'
  ),
  (
    'c0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    'Bruno mantuvo un volumen estable y necesita consolidar la regularidad semanal.',
    ARRAY['Volumen de entrenamiento estable.'],
    ARRAY['La asistencia puede mejorar.'],
    ARRAY['Ajustar horarios para facilitar la asistencia sostenida.'],
    'Priorizar adherencia antes de aumentar la carga.',
    'Revisar disponibilidad semanal antes de definir el siguiente bloque.',
    'reviewed'
  )
ON CONFLICT (athlete_user_id, month) DO NOTHING;
