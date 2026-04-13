import type { ServiceHealth } from '../shared-types/health'
import type { ClaudeStatusClient } from './status-api-client'

export type StatusChangeHandler = (health: ServiceHealth) => void

export class StatusPoller {
  private client: ClaudeStatusClient
  private intervalMs: number
  private timer: ReturnType<typeof setInterval> | null = null
  private lastIndicator: string | null = null
  private lastIncidentIds: Set<string> = new Set()
  private handlers: StatusChangeHandler[] = []

  constructor(client: ClaudeStatusClient, intervalMs = 60_000) {
    this.client = client
    this.intervalMs = intervalMs
  }

  onChange(handler: StatusChangeHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  start(): void {
    if (this.timer) return
    this.poll()
    this.timer = setInterval(() => this.poll(), this.intervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  setInterval(ms: number): void {
    this.intervalMs = ms
    if (this.timer) {
      this.stop()
      this.start()
    }
  }

  private async poll(): Promise<void> {
    try {
      const health = await this.client.getSummary()
      const currentIncidentIds = new Set(health.unresolvedIncidents.map((i) => i.id))

      const hasChanged =
        health.indicator !== this.lastIndicator ||
        !this.setsEqual(currentIncidentIds, this.lastIncidentIds)

      if (hasChanged) {
        this.lastIndicator = health.indicator
        this.lastIncidentIds = currentIncidentIds
        for (const handler of this.handlers) {
          handler(health)
        }
      }
    } catch (error) {
      console.error('[StatusPoller] Poll failed:', error)
    }
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false
    for (const item of a) {
      if (!b.has(item)) return false
    }
    return true
  }
}
