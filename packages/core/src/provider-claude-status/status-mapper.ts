import type {
  ServiceHealth,
  ServiceStatusIndicator,
  Incident,
  IncidentUpdate,
  IncidentStatus,
  StatusComponent,
  ScheduledMaintenance,
  MaintenanceStatus,
} from '../shared-types/health'

interface RawIncidentUpdate {
  id?: string
  status?: string
  body?: string
  created_at?: string
}

interface RawIncident {
  id?: string
  name?: string
  status?: string
  impact?: string
  created_at?: string
  updated_at?: string
  resolved_at?: string
  shortlink?: string
  components?: RawComponent[]
  incident_updates?: RawIncidentUpdate[]
}

interface RawComponent {
  id?: string
  name?: string
  status?: string
  description?: string
}

interface RawMaintenance {
  id?: string
  name?: string
  status?: string
  scheduled_for?: string
  scheduled_until?: string
  components?: RawComponent[]
  incident_updates?: RawIncidentUpdate[]
}

interface RawSummary {
  status?: { indicator?: string; description?: string }
  components?: RawComponent[]
  incidents?: RawIncident[]
  scheduled_maintenances?: RawMaintenance[]
}

export class StatusMapper {
  mapSummary(raw: unknown): ServiceHealth {
    const data = raw as RawSummary

    const indicatorMap: Record<string, ServiceStatusIndicator> = {
      none: 'operational',
      minor: 'degraded',
      major: 'major_outage',
      critical: 'major_outage',
      maintenance: 'maintenance',
    }

    return {
      indicator: indicatorMap[data.status?.indicator ?? ''] ?? 'unknown',
      description: data.status?.description ?? 'Unknown',
      lastChecked: new Date().toISOString(),
      unresolvedIncidents: (data.incidents ?? [])
        .filter((i) => i.status !== 'resolved')
        .map((i) => this.mapIncident(i)),
      recentIncidents: (data.incidents ?? []).map((i) => this.mapIncident(i)),
      scheduledMaintenances: (data.scheduled_maintenances ?? []).map((m) =>
        this.mapMaintenance(m),
      ),
      components: (data.components ?? []).map((c) => this.mapComponent(c)),
    }
  }

  mapIncident(raw: unknown): Incident {
    const data = raw as RawIncident

    const statusMap: Record<string, IncidentStatus> = {
      investigating: 'investigating',
      identified: 'identified',
      monitoring: 'monitoring',
      resolved: 'resolved',
    }

    return {
      id: data.id ?? '',
      name: data.name ?? 'Unknown incident',
      status: statusMap[data.status ?? ''] ?? 'investigating',
      impact: (data.impact as Incident['impact']) ?? 'minor',
      createdAt: data.created_at ?? new Date().toISOString(),
      updatedAt: data.updated_at ?? new Date().toISOString(),
      resolvedAt: data.resolved_at ?? undefined,
      shortlink: data.shortlink,
      components: (data.components ?? []).map((c) => this.mapComponent(c)),
      updates: (data.incident_updates ?? []).map((u) => this.mapUpdate(u)),
    }
  }

  mapComponent(raw: unknown): StatusComponent {
    const data = raw as RawComponent
    return {
      id: data.id ?? '',
      name: data.name ?? 'Unknown',
      status: data.status ?? 'unknown',
      description: data.description,
    }
  }

  mapMaintenance(raw: unknown): ScheduledMaintenance {
    const data = raw as RawMaintenance

    const statusMap: Record<string, MaintenanceStatus> = {
      scheduled: 'scheduled',
      in_progress: 'in_progress',
      completed: 'completed',
    }

    return {
      id: data.id ?? '',
      name: data.name ?? 'Unknown maintenance',
      status: statusMap[data.status ?? ''] ?? 'scheduled',
      scheduledFor: data.scheduled_for ?? '',
      scheduledUntil: data.scheduled_until ?? '',
      components: (data.components ?? []).map((c) => this.mapComponent(c)),
      updates: (data.incident_updates ?? []).map((u) => this.mapUpdate(u)),
    }
  }

  private mapUpdate(raw: RawIncidentUpdate): IncidentUpdate {
    return {
      id: raw.id ?? '',
      status: (raw.status as IncidentStatus) ?? 'investigating',
      body: raw.body ?? '',
      createdAt: raw.created_at ?? new Date().toISOString(),
    }
  }
}
