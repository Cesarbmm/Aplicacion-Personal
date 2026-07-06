import type { Pool } from 'pg'

import type {
  MonthlyReportStatus,
  StoredCoachMonthlyReport,
} from '../types/monthly-report.js'
import type { MonthlyReportRepository } from './monthly-report-repository.js'

type MonthlyReportRow = {
  report_id: string
  coach_user_id: string
  coach_name: string
  athlete_user_id: string
  gym_id: string
  month: string
  generated_summary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendation: string
  coach_notes: string
  status: MonthlyReportStatus
  created_at: Date
  updated_at: Date
}

const reportSelect = `
  SELECT
    cmr.id AS report_id,
    cmr.coach_user_id,
    coach.name AS coach_name,
    cmr.athlete_user_id,
    cmr.gym_id,
    TO_CHAR(cmr.month, 'YYYY-MM') AS month,
    cmr.generated_summary,
    cmr.strengths,
    cmr.weaknesses,
    cmr.opportunities,
    cmr.recommendation,
    cmr.coach_notes,
    cmr.status,
    cmr.created_at,
    cmr.updated_at
  FROM coach_monthly_reports cmr
  JOIN users coach ON coach.id = cmr.coach_user_id
`

function mapReport(row: MonthlyReportRow): StoredCoachMonthlyReport {
  return {
    reportId: row.report_id,
    coachUserId: row.coach_user_id,
    coachName: row.coach_name,
    athleteUserId: row.athlete_user_id,
    gymId: row.gym_id,
    month: row.month,
    generatedSummary: row.generated_summary,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    opportunities: row.opportunities,
    recommendation: row.recommendation,
    coachNotes: row.coach_notes,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export function createPostgresMonthlyReportRepository(pool: Pool): MonthlyReportRepository {
  return {
    async getReport(athleteUserId, month) {
      const result = await pool.query<MonthlyReportRow>(
        `${reportSelect}
         WHERE cmr.athlete_user_id = $1
           AND cmr.month = TO_DATE($2, 'YYYY-MM')`,
        [athleteUserId, month],
      )
      return result.rows[0] ? mapReport(result.rows[0]) : null
    },

    async getDeliveredReport(athleteUserId, month) {
      const result = await pool.query<MonthlyReportRow>(
        `${reportSelect}
         WHERE cmr.athlete_user_id = $1
           AND cmr.month = TO_DATE($2, 'YYYY-MM')
           AND cmr.status = 'delivered'`,
        [athleteUserId, month],
      )
      return result.rows[0] ? mapReport(result.rows[0]) : null
    },

    async saveReport(input) {
      const result = await pool.query<MonthlyReportRow>(
        `
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
          VALUES ($1, $2, $3, TO_DATE($4, 'YYYY-MM'), $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (athlete_user_id, month) DO UPDATE
          SET
            coach_user_id = EXCLUDED.coach_user_id,
            gym_id = EXCLUDED.gym_id,
            generated_summary = EXCLUDED.generated_summary,
            strengths = EXCLUDED.strengths,
            weaknesses = EXCLUDED.weaknesses,
            opportunities = EXCLUDED.opportunities,
            recommendation = EXCLUDED.recommendation,
            coach_notes = EXCLUDED.coach_notes,
            status = EXCLUDED.status,
            updated_at = NOW()
          RETURNING id AS report_id
        `,
        [
          input.coachUserId,
          input.athleteUserId,
          input.gymId,
          input.month,
          input.generatedSummary,
          input.strengths,
          input.weaknesses,
          input.opportunities,
          input.recommendation,
          input.coachNotes,
          input.status,
        ],
      )

      const reportId = result.rows[0]?.report_id
      const reportResult = await pool.query<MonthlyReportRow>(
        `${reportSelect} WHERE cmr.id = $1`,
        [reportId],
      )
      return mapReport(reportResult.rows[0])
    },
  }
}
