import type { UsageRecord } from '../shared-types/usage'

interface ClaudeJsonlEntry {
  type: string
  timestamp?: string
  sessionId?: string
  uuid?: string
  cwd?: string
  message?: {
    model?: string
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
    role?: string
  }
}

export class UsageParser {
  parseJsonlContent(content: string, projectName: string): UsageRecord[] {
    const records: UsageRecord[] = []
    const lines = content.split('\n').filter((l) => l.trim())

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as ClaudeJsonlEntry

        // Only process assistant messages that have usage data
        if (entry.type !== 'assistant') continue
        if (!entry.message?.usage) continue

        const usage = entry.message.usage
        const inputTokens = usage.input_tokens ?? 0
        const outputTokens = usage.output_tokens ?? 0
        const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0
        const cacheReadTokens = usage.cache_read_input_tokens ?? 0

        // Skip entries with no actual token usage
        if (inputTokens === 0 && outputTokens === 0 && cacheWriteTokens === 0 && cacheReadTokens === 0) {
          continue
        }

        records.push({
          timestamp: entry.timestamp ?? new Date().toISOString(),
          projectName,
          sessionId: entry.sessionId ?? entry.uuid,
          model: entry.message.model ?? 'unknown',
          inputTokens,
          outputTokens,
          cacheWriteTokens,
          cacheReadTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCostUsd: undefined, // Will be calculated by PricingCalculator
          source: 'local-file',
          confidence: 'high',
        })
      } catch {
        // Skip malformed lines
      }
    }

    return records
  }
}
