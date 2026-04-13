import { ClaudeStatusClient, StatusPoller } from '@claude-status/core'
import type { ServiceHealth } from '@claude-status/core'

export class ClaudeStatusModule {
  private client: ClaudeStatusClient
  private poller: StatusPoller
  private latestHealth: ServiceHealth | null = null

  constructor() {
    // Use Node's built-in fetch as the adapter
    this.client = new ClaudeStatusClient({
      fetch: async (url: string) => {
        const response = await fetch(url)
        return {
          ok: response.ok,
          status: response.status,
          json: () => response.json(),
        }
      },
    })
    this.poller = new StatusPoller(this.client, 60_000)
  }

  start(): void {
    this.poller.onChange((health) => {
      this.latestHealth = health
    })
    this.poller.start()
  }

  stop(): void {
    this.poller.stop()
  }

  onChange(handler: (health: ServiceHealth) => void): () => void {
    return this.poller.onChange(handler)
  }

  setPollingInterval(ms: number): void {
    this.poller.setInterval(ms)
  }

  getLatestHealth(): ServiceHealth | null {
    return this.latestHealth
  }

  async fetchNow(): Promise<ServiceHealth> {
    const health = await this.client.getSummary()
    this.latestHealth = health
    return health
  }
}
