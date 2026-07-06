import type {
  SaveCoachMonthlyReportInput,
  StoredCoachMonthlyReport,
} from '../types/monthly-report.js'

export interface MonthlyReportRepository {
  getReport(athleteUserId: string, month: string): Promise<StoredCoachMonthlyReport | null>
  getDeliveredReport(athleteUserId: string, month: string): Promise<StoredCoachMonthlyReport | null>
  saveReport(input: SaveCoachMonthlyReportInput): Promise<StoredCoachMonthlyReport>
}

export class GymAccessDeniedError extends Error {
  constructor() {
    super('El coach solo puede consultar atletas de su gimnasio.')
    this.name = 'GymAccessDeniedError'
  }
}
