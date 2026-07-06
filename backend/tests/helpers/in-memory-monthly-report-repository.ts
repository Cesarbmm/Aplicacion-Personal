import { randomUUID } from 'node:crypto'

import type { MonthlyReportRepository } from '../../src/repositories/monthly-report-repository.js'
import type {
  SaveCoachMonthlyReportInput,
  StoredCoachMonthlyReport,
} from '../../src/types/monthly-report.js'

export function createInMemoryMonthlyReportRepository(
  seedReports: StoredCoachMonthlyReport[] = [],
): MonthlyReportRepository {
  const reports = new Map(
    seedReports.map((report) => [`${report.athleteUserId}:${report.month}`, structuredClone(report)]),
  )

  return {
    async getReport(athleteUserId, month) {
      const report = reports.get(`${athleteUserId}:${month}`)
      return report ? structuredClone(report) : null
    },

    async getDeliveredReport(athleteUserId, month) {
      const report = reports.get(`${athleteUserId}:${month}`)
      return report?.status === 'delivered' ? structuredClone(report) : null
    },

    async saveReport(input: SaveCoachMonthlyReportInput) {
      const key = `${input.athleteUserId}:${input.month}`
      const existing = reports.get(key)
      const now = new Date('2026-07-05T12:00:00.000Z').toISOString()
      const report: StoredCoachMonthlyReport = {
        reportId: existing?.reportId ?? randomUUID(),
        coachUserId: input.coachUserId,
        coachName: 'Coach Sigma',
        athleteUserId: input.athleteUserId,
        gymId: input.gymId,
        month: input.month,
        generatedSummary: input.generatedSummary,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        opportunities: input.opportunities,
        recommendation: input.recommendation,
        coachNotes: input.coachNotes,
        status: input.status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      reports.set(key, structuredClone(report))
      return report
    },
  }
}
