import { readdir, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { UsageParser, UsageAggregator, PricingCalculator } from '@claude-status/core'
import type { UsageRecord, UsageSummary } from '@claude-status/core'
import type { DatabaseManager } from '../settings/database'

export class UsageCollector {
  private parser: UsageParser
  private aggregator: UsageAggregator
  private pricing: PricingCalculator
  private db: DatabaseManager | null
  private claudeDir: string
  private records: UsageRecord[] = []
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(db?: DatabaseManager | null) {
    this.parser = new UsageParser()
    this.aggregator = new UsageAggregator()
    this.pricing = new PricingCalculator()
    this.db = db ?? null
    this.claudeDir = join(homedir(), '.claude')
  }

  async initialize(): Promise<void> {
    await this.scanUsageFiles()
  }

  startPolling(intervalMs = 30_000): void {
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => this.scanUsageFiles(), intervalMs)
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  getSummary(): UsageSummary {
    return this.aggregator.computeSummary(this.records)
  }

  getRecords(): UsageRecord[] {
    return this.records
  }

  private async scanUsageFiles(): Promise<void> {
    try {
      const projectsDir = join(this.claudeDir, 'projects')
      if (!existsSync(projectsDir)) return

      const projectDirs = await readdir(projectsDir)
      const allRecords: UsageRecord[] = []

      for (const projectDir of projectDirs) {
        const projectPath = join(projectsDir, projectDir)
        try {
          const dirStat = await stat(projectPath)
          if (!dirStat.isDirectory()) continue

          const files = await readdir(projectPath)
          const jsonlFiles = files.filter(
            (f) => f.endsWith('.jsonl') || f.endsWith('.json'),
          )

          for (const file of jsonlFiles) {
            try {
              const content = await readFile(join(projectPath, file), 'utf-8')
              const projectName = this.decodeProjectName(projectDir)
              const records = this.parser.parseJsonlContent(content, projectName)

              // Calculate cost for each record
              for (const record of records) {
                record.estimatedCostUsd = this.pricing.calculateRecordCost(record)
              }

              allRecords.push(...records)

              // Persist to database (if available)
              if (this.db) for (const record of records) {
                this.db.insertUsageRecord({
                  timestamp: record.timestamp,
                  projectName: record.projectName,
                  sessionId: record.sessionId,
                  model: record.model,
                  inputTokens: record.inputTokens,
                  outputTokens: record.outputTokens,
                  cacheWriteTokens: record.cacheWriteTokens,
                  cacheReadTokens: record.cacheReadTokens,
                  totalTokens: record.totalTokens,
                  estimatedCostUsd: record.estimatedCostUsd,
                  source: record.source,
                  confidence: record.confidence,
                })
              }
            } catch {
              // Skip unreadable files
            }
          }
        } catch {
          // Skip inaccessible project dirs
        }
      }

      this.records = allRecords
      const totalCost = allRecords.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0)
      console.log(`[UsageCollector] Loaded ${allRecords.length} records from ${projectDirs.length} projects ($${totalCost.toFixed(2)} total)`)
    } catch (error) {
      console.error('[UsageCollector] Scan failed:', error)
    }
  }

  private decodeProjectName(dirName: string): string {
    // Claude Code encodes project paths like -Users-mac-workspace-myproject
    return dirName
      .replace(/^-/, '/')
      .replace(/-/g, '/')
  }
}
