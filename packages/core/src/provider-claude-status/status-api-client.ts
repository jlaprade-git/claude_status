import type { ServiceHealth } from '../shared-types/health'
import { StatusMapper } from './status-mapper'

export interface FetchAdapter {
  fetch(url: string): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>
}

const BASE_URL = 'https://status.anthropic.com/api/v2'

export class ClaudeStatusClient {
  private fetchAdapter: FetchAdapter
  private mapper: StatusMapper

  constructor(fetchAdapter: FetchAdapter) {
    this.fetchAdapter = fetchAdapter
    this.mapper = new StatusMapper()
  }

  async getStatus(): Promise<{ indicator: string; description: string }> {
    const response = await this.fetchAdapter.fetch(`${BASE_URL}/status.json`)
    if (!response.ok) throw new Error(`Status API error: ${response.status}`)
    const data = (await response.json()) as { status: { indicator: string; description: string } }
    return data.status
  }

  async getSummary(): Promise<ServiceHealth> {
    const response = await this.fetchAdapter.fetch(`${BASE_URL}/summary.json`)
    if (!response.ok) throw new Error(`Summary API error: ${response.status}`)
    const data = await response.json()
    return this.mapper.mapSummary(data)
  }

  async getUnresolvedIncidents(): Promise<ServiceHealth['unresolvedIncidents']> {
    const response = await this.fetchAdapter.fetch(`${BASE_URL}/incidents/unresolved.json`)
    if (!response.ok) throw new Error(`Incidents API error: ${response.status}`)
    const data = (await response.json()) as { incidents: unknown[] }
    return data.incidents.map((i) => this.mapper.mapIncident(i))
  }

  async getRecentIncidents(): Promise<ServiceHealth['recentIncidents']> {
    const response = await this.fetchAdapter.fetch(`${BASE_URL}/incidents.json`)
    if (!response.ok) throw new Error(`Incidents API error: ${response.status}`)
    const data = (await response.json()) as { incidents: unknown[] }
    return data.incidents.map((i) => this.mapper.mapIncident(i))
  }

  async getComponents(): Promise<ServiceHealth['components']> {
    const response = await this.fetchAdapter.fetch(`${BASE_URL}/components.json`)
    if (!response.ok) throw new Error(`Components API error: ${response.status}`)
    const data = (await response.json()) as { components: unknown[] }
    return data.components.map((c) => this.mapper.mapComponent(c))
  }

  async getScheduledMaintenances(): Promise<ServiceHealth['scheduledMaintenances']> {
    const response = await this.fetchAdapter.fetch(
      `${BASE_URL}/scheduled-maintenances/upcoming.json`,
    )
    if (!response.ok) throw new Error(`Maintenance API error: ${response.status}`)
    const data = (await response.json()) as { scheduled_maintenances: unknown[] }
    return data.scheduled_maintenances.map((m) => this.mapper.mapMaintenance(m))
  }
}
