import type { UsageRecord } from '../shared-types/usage'
import type { TimeSeries, MetricPoint } from '../shared-types/metrics'

export class TrendCalculator {
  computeHourlyUsage(records: UsageRecord[], hours = 24): TimeSeries {
    const now = new Date()
    const points: MetricPoint[] = []

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

      const hourRecords = records.filter((r) => {
        const t = new Date(r.timestamp)
        return t >= hourStart && t < hourEnd
      })

      points.push({
        timestamp: hourStart.toISOString(),
        value: hourRecords.reduce((sum, r) => sum + r.totalTokens, 0),
      })
    }

    return { name: 'hourly-tokens', points, unit: 'tokens' }
  }

  computeDailyUsage(records: UsageRecord[], days = 7): TimeSeries {
    const now = new Date()
    const points: MetricPoint[] = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(now.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayRecords = records.filter((r) => {
        const t = new Date(r.timestamp)
        return t >= dayStart && t < dayEnd
      })

      points.push({
        timestamp: dayStart.toISOString(),
        value: dayRecords.reduce((sum, r) => sum + r.totalTokens, 0),
      })
    }

    return { name: 'daily-tokens', points, unit: 'tokens' }
  }

  computeBurnRate(records: UsageRecord[], days = 7): number {
    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const periodRecords = records.filter((r) => new Date(r.timestamp) >= periodStart)
    const totalCost = periodRecords.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0)
    return totalCost / days
  }
}
