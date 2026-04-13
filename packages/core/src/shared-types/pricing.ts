export interface PricingTier {
  model: string
  displayName: string
  inputTokensPer1M: number
  outputTokensPer1M: number
  cacheWritePer1M: number
  cacheReadPer1M: number
  effectiveDate: string
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  cacheWriteCost: number
  cacheReadCost: number
  totalCost: number
  model: string
}

export interface CostEstimate {
  period: string
  startDate: string
  endDate: string
  breakdownByModel: CostBreakdown[]
  totalCost: number
  currency: string
  confidence: 'high' | 'medium' | 'low'
}
