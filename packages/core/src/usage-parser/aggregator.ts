import type { UsageRecord, UsageSummary, DailyUsage } from '../shared-types/usage'

export class UsageAggregator {
  computeSummary(records: UsageRecord[]): UsageSummary {
    const now = new Date()
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Current week (Monday start)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    weekStart.setHours(0, 0, 0, 0)

    const last5h = this.filterAndSum(records, fiveHoursAgo)
    const last24h = this.filterAndSum(records, twentyFourHoursAgo)
    const last7d = this.filterAndSum(records, sevenDaysAgo)
    const week = this.filterAndSum(records, weekStart)
    const allTime = this.filterAndSum(records, new Date(0))

    const projectMap = new Map<string, { tokens: number; cost: number }>()
    const modelMap = new Map<string, { tokens: number; cost: number }>()

    for (const r of records) {
      const proj = projectMap.get(r.projectName) ?? { tokens: 0, cost: 0 }
      proj.tokens += r.totalTokens
      proj.cost += r.estimatedCostUsd ?? 0
      projectMap.set(r.projectName, proj)

      const mod = modelMap.get(r.model) ?? { tokens: 0, cost: 0 }
      mod.tokens += r.totalTokens
      mod.cost += r.estimatedCostUsd ?? 0
      modelMap.set(r.model, mod)
    }

    const topProjects = [...projectMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10)

    const topModels = [...modelMap.entries()]
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.tokens - a.tokens)

    const lastRecord = records.length > 0
      ? records.reduce((latest, r) => (r.timestamp > latest.timestamp ? r : latest))
      : undefined

    return {
      last5Hours: last5h,
      last24Hours: last24h,
      last7Days: last7d,
      currentWeek: week,
      allTime,
      topProjects,
      topModels,
      lastActivity: lastRecord?.timestamp,
    }
  }

  computeDailyUsage(records: UsageRecord[]): DailyUsage[] {
    const dayMap = new Map<string, UsageRecord[]>()

    for (const r of records) {
      const day = r.timestamp.slice(0, 10)
      const existing = dayMap.get(day) ?? []
      existing.push(r)
      dayMap.set(day, existing)
    }

    return [...dayMap.entries()].map(([date, dayRecords]) => {
      const byModel: Record<string, { tokens: number; cost: number }> = {}
      const byProject: Record<string, { tokens: number; cost: number }> = {}

      let inputTokens = 0
      let outputTokens = 0
      let cacheWriteTokens = 0
      let cacheReadTokens = 0
      let totalCostUsd = 0

      for (const r of dayRecords) {
        inputTokens += r.inputTokens
        outputTokens += r.outputTokens
        cacheWriteTokens += r.cacheWriteTokens
        cacheReadTokens += r.cacheReadTokens
        totalCostUsd += r.estimatedCostUsd ?? 0

        if (!byModel[r.model]) byModel[r.model] = { tokens: 0, cost: 0 }
        byModel[r.model].tokens += r.totalTokens
        byModel[r.model].cost += r.estimatedCostUsd ?? 0

        if (!byProject[r.projectName]) byProject[r.projectName] = { tokens: 0, cost: 0 }
        byProject[r.projectName].tokens += r.totalTokens
        byProject[r.projectName].cost += r.estimatedCostUsd ?? 0
      }

      return {
        date,
        totalTokens: inputTokens + outputTokens + cacheWriteTokens + cacheReadTokens,
        inputTokens,
        outputTokens,
        cacheWriteTokens,
        cacheReadTokens,
        totalCostUsd,
        recordCount: dayRecords.length,
        byModel,
        byProject,
      }
    }).sort((a, b) => a.date.localeCompare(b.date))
  }

  private filterAndSum(
    records: UsageRecord[],
    since: Date,
  ): { tokens: number; cost: number; records: number } {
    let tokens = 0
    let cost = 0
    let count = 0

    for (const r of records) {
      if (new Date(r.timestamp) >= since) {
        tokens += r.totalTokens
        cost += r.estimatedCostUsd ?? 0
        count++
      }
    }

    return { tokens, cost, records: count }
  }
}
