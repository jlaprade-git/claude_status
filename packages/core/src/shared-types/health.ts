export type ServiceStatusIndicator = 'operational' | 'degraded' | 'major_outage' | 'maintenance' | 'unknown'

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed'

export interface StatusComponent {
  id: string
  name: string
  status: string
  description?: string
}

export interface IncidentUpdate {
  id: string
  status: IncidentStatus
  body: string
  createdAt: string
}

export interface Incident {
  id: string
  name: string
  status: IncidentStatus
  impact: 'none' | 'minor' | 'major' | 'critical'
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  shortlink?: string
  components: StatusComponent[]
  updates: IncidentUpdate[]
}

export interface ScheduledMaintenance {
  id: string
  name: string
  status: MaintenanceStatus
  scheduledFor: string
  scheduledUntil: string
  components: StatusComponent[]
  updates: IncidentUpdate[]
}

export interface ServiceHealth {
  indicator: ServiceStatusIndicator
  description: string
  lastChecked: string
  unresolvedIncidents: Incident[]
  recentIncidents: Incident[]
  scheduledMaintenances: ScheduledMaintenance[]
  components: StatusComponent[]
}

export interface CombinedHealthState {
  officialStatus: ServiceStatusIndicator
  communitySignal: 'normal' | 'elevated' | 'spike'
  combinedState: 'healthy' | 'possible_issue' | 'confirmed_outage' | 'maintenance' | 'recovering'
  confidence: number
  activeIncident?: Incident
  recommendation: string
  lastUpdated: string
}
