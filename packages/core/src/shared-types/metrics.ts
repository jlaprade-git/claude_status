export interface MetricPoint {
  timestamp: string
  value: number
}

export interface TimeSeries {
  name: string
  points: MetricPoint[]
  unit: string
}

export interface AggregatedMetrics {
  period: string
  totalRequests: number
  totalTokens: number
  totalCostUsd: number
  avgTokensPerRequest: number
  tokensByModel: Record<string, number>
  costByModel: Record<string, number>
  tokensByProject: Record<string, number>
  costByProject: Record<string, number>
  hourlyUsage: TimeSeries
  dailyUsage: TimeSeries
}

export interface AnomalyResult {
  detected: boolean
  metric: string
  currentValue: number
  expectedRange: { min: number; max: number }
  zScore: number
  timestamp: string
  description: string
}
