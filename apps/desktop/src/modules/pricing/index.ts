import { PricingCalculator } from '@claude-status/core'
import type { UsageRecord, CostEstimate } from '@claude-status/core'

export class PricingModule {
  private calculator: PricingCalculator

  constructor() {
    this.calculator = new PricingCalculator()
  }

  estimateCost(records: UsageRecord[], period: string): CostEstimate {
    const now = new Date()
    let since: Date

    switch (period) {
      case '5h':
        since = new Date(now.getTime() - 5 * 60 * 60 * 1000)
        break
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'week': {
        since = new Date(now)
        since.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        since.setHours(0, 0, 0, 0)
        break
      }
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const filtered = records.filter((r) => new Date(r.timestamp) >= since)
    return this.calculator.calculateCostEstimate(filtered, period)
  }

  calculateRecordCost(record: UsageRecord): number {
    return this.calculator.calculateRecordCost(record)
  }
}
