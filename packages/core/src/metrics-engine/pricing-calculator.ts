import type { UsageRecord } from '../shared-types/usage'
import type { PricingTier, CostBreakdown, CostEstimate } from '../shared-types/pricing'
import { PRICING_DATA } from './pricing-data'

export class PricingCalculator {
  private pricingTiers: PricingTier[]

  constructor(customPricing?: PricingTier[]) {
    this.pricingTiers = customPricing ?? PRICING_DATA
  }

  calculateRecordCost(record: UsageRecord): number {
    const tier = this.findTier(record.model)
    if (!tier) return 0

    return (
      (record.inputTokens / 1_000_000) * tier.inputTokensPer1M +
      (record.outputTokens / 1_000_000) * tier.outputTokensPer1M +
      (record.cacheWriteTokens / 1_000_000) * tier.cacheWritePer1M +
      (record.cacheReadTokens / 1_000_000) * tier.cacheReadPer1M
    )
  }

  calculateCostEstimate(records: UsageRecord[], period: string): CostEstimate {
    const modelGroups = new Map<string, UsageRecord[]>()

    for (const r of records) {
      const group = modelGroups.get(r.model) ?? []
      group.push(r)
      modelGroups.set(r.model, group)
    }

    const breakdownByModel: CostBreakdown[] = [...modelGroups.entries()].map(
      ([model, modelRecords]) => {
        const tier = this.findTier(model)
        let inputCost = 0
        let outputCost = 0
        let cacheWriteCost = 0
        let cacheReadCost = 0

        for (const r of modelRecords) {
          if (tier) {
            inputCost += (r.inputTokens / 1_000_000) * tier.inputTokensPer1M
            outputCost += (r.outputTokens / 1_000_000) * tier.outputTokensPer1M
            cacheWriteCost += (r.cacheWriteTokens / 1_000_000) * tier.cacheWritePer1M
            cacheReadCost += (r.cacheReadTokens / 1_000_000) * tier.cacheReadPer1M
          }
        }

        return {
          model,
          inputCost,
          outputCost,
          cacheWriteCost,
          cacheReadCost,
          totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
        }
      },
    )

    const totalCost = breakdownByModel.reduce((sum, b) => sum + b.totalCost, 0)

    const timestamps = records.map((r) => r.timestamp).sort()

    return {
      period,
      startDate: timestamps[0] ?? new Date().toISOString(),
      endDate: timestamps[timestamps.length - 1] ?? new Date().toISOString(),
      breakdownByModel,
      totalCost,
      currency: 'USD',
      confidence: 'high',
    }
  }

  private findTier(model: string): PricingTier | undefined {
    // Exact match first
    let tier = this.pricingTiers.find((t) => t.model === model)
    if (tier) return tier

    // Partial match (e.g., "claude-sonnet-4-6" matches "claude-sonnet-4-6-xxx")
    tier = this.pricingTiers.find((t) => model.startsWith(t.model) || t.model.startsWith(model))
    if (tier) return tier

    // Fuzzy match by model family
    if (model.includes('opus')) return this.pricingTiers.find((t) => t.model.includes('opus'))
    if (model.includes('sonnet')) return this.pricingTiers.find((t) => t.model.includes('sonnet'))
    if (model.includes('haiku')) return this.pricingTiers.find((t) => t.model.includes('haiku'))

    return undefined
  }
}
