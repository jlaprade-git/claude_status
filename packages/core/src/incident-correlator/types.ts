import type { Incident, CombinedHealthState } from '../shared-types/health'

export type SignalSourceType = 'official-status' | 'anomaly-detection' | 'downdetector'

export interface SignalSource {
  type: SignalSourceType
  confidence: number
  timestamp: string
  details: string
}

export interface IncidentAssessment {
  isIncident: boolean
  confidence: number
  signals: SignalSource[]
  officialIncident?: Incident
  combinedState: CombinedHealthState['combinedState']
  recommendation: string
}
