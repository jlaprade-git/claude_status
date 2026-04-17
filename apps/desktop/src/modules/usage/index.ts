import { readdir, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { UsageParser, UsageAggregator, PricingCalculator } from '@claude-status/core'
import type { UsageRecord, UsageSummary } from '@claude-status/core'
import type { DatabaseManager } from '../settings/database'

export type UsageChangeHandler = (summary: UsageSummary) => void

export class UsageCollector {
  private parser: UsageParser
  private aggregator: UsageAggregator
  private pricing: PricingCalculator
  private db: DatabaseManager | null
  private claudeDir: string
  private records: UsageRecord[] = []
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private handlers: UsageChangeHandler[] = []
  private fileCache: Map<string, { size: number; mtimeMs: number; records: UsageRecord[] }> = new Map()

  constructor(db?: DatabaseManager | null) {
    this.parser = new UsageParser()
    this.aggregator = new UsageAggregator()
    this.pricing = new PricingCalculator()
    this.db = db ?? null
    this.claudeDir = join(homedir(), '.claude')
  }

  onChange(handler: UsageChangeHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  private notifyHandlers(): void {
    const summary = this.getSummary()
    for (const handler of this.handlers) {
      handler(summary)
    }
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
      const seenFiles = new Set<string>()

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
            const filePath = join(projectPath, file)
            seenFiles.add(filePath)
            try {
              const fileStat = await stat(filePath)
              const cached = this.fileCache.get(filePath)

              // Skip files that haven't changed since last scan
              if (cached && cached.size === fileStat.size && cached.mtimeMs === fileStat.mtimeMs) {
                allRecords.push(...cached.records)
                continue
              }

              const content = await readFile(filePath, 'utf-8')
              const projectName = this.decodeProjectName(projectDir)
              const records = this.parser.parseJsonlContent(content, projectName)

              // Calculate cost for each record
              for (const record of records) {
                record.estimatedCostUsd = this.pricing.calculateRecordCost(record)
              }

              // Cache the parsed records with file metadata
              this.fileCache.set(filePath, {
                size: fileStat.size,
                mtimeMs: fileStat.mtimeMs,
                records,
              })

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

      // Clean up cache entries for deleted files
      for (const cachedPath of this.fileCache.keys()) {
        if (!seenFiles.has(cachedPath)) {
          this.fileCache.delete(cachedPath)
        }
      }

      this.records = allRecords
      const totalCost = allRecords.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0)
      console.log(`[UsageCollector] Loaded ${allRecords.length} records from ${projectDirs.length} projects ($${totalCost.toFixed(2)} total)`)
      this.notifyHandlers()
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
