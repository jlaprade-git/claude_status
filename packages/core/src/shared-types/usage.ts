export interface UsageRecord {
  timestamp: string
  projectName: string
  sessionId?: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  totalTokens: number
  estimatedCostUsd?: number
  source: 'local-file' | 'cli' | 'derived'
  confidence: 'high' | 'medium' | 'low'
}

export interface UsageSession {
  sessionId: string
  projectName: string
  startTime: string
  endTime?: string
  records: UsageRecord[]
  totalTokens: number
  totalCostUsd: number
}

export interface DailyUsage {
  date: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheWriteTokens: number
  cacheReadTokens: number
  totalCostUsd: number
  recordCount: number
  byModel: Record<string, { tokens: number; cost: number }>
  byProject: Record<string, { tokens: number; cost: number }>
}

export interface UsageSummary {
  last5Hours: { tokens: number; cost: number; records: number }
  last24Hours: { tokens: number; cost: number; records: number }
  last7Days: { tokens: number; cost: number; records: number }
  currentWeek: { tokens: number; cost: number; records: number }
  allTime: { tokens: number; cost: number; records: number }
  topProjects: Array<{ name: string; tokens: number; cost: number }>
  topModels: Array<{ model: string; tokens: number; cost: number }>
  lastActivity?: string
}
