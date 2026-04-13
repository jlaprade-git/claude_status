import type { ServiceHealth, CombinedHealthState } from '../shared-types/health'
import type { AnomalyResult } from '../shared-types/metrics'
import type { IncidentAssessment, SignalSource } from './types'

const CONFIDENCE_WEIGHTS: Record<string, number> = {
  'official-status': 0.9,
  'anomaly-detection': 0.5,
  downdetector: 0.3,
}

const INCIDENT_THRESHOLD = 0.6

export class IncidentCorrelator {
  assess(
    officialHealth?: ServiceHealth,
    anomalyResult?: AnomalyResult,
    downdetectorElevated?: boolean,
  ): IncidentAssessment {
    const signals: SignalSource[] = []
    const now = new Date().toISOString()

    // Official status signal
    if (officialHealth && officialHealth.indicator !== 'operational') {
      signals.push({
        type: 'official-status',
        confidence: CONFIDENCE_WEIGHTS['official-status'],
        timestamp: now,
        details: `Official status: ${officialHealth.indicator} - ${officialHealth.description}`,
      })
    }

    // Anomaly detection signal
    if (anomalyResult?.detected) {
      signals.push({
        type: 'anomaly-detection',
        confidence: CONFIDENCE_WEIGHTS['anomaly-detection'],
        timestamp: now,
        details: anomalyResult.description,
      })
    }

    // DownDetector signal
    if (downdetectorElevated) {
      signals.push({
        type: 'downdetector',
        confidence: CONFIDENCE_WEIGHTS['downdetector'],
        timestamp: now,
        details: 'Elevated user reports on DownDetector',
      })
    }

    const combinedConfidence = signals.reduce((max, s) => Math.max(max, s.confidence), 0)
    const isIncident = combinedConfidence >= INCIDENT_THRESHOLD
    const officialIncident = officialHealth?.unresolvedIncidents[0]

    let combinedState: CombinedHealthState['combinedState'] = 'healthy'
    let recommendation = 'Claude is operating normally.'

    if (officialHealth?.indicator === 'maintenance') {
      combinedState = 'maintenance'
      recommendation = 'Scheduled maintenance in progress. Some features may be unavailable.'
    } else if (officialIncident) {
      if (officialIncident.status === 'monitoring') {
        combinedState = 'recovering'
        recommendation = 'Recovery in progress. Safe to retry light usage.'
      } else {
        combinedState = 'confirmed_outage'
        recommendation = 'Confirmed outage. Avoid heavy usage until resolved.'
      }
    } else if (isIncident) {
      combinedState = 'possible_issue'
      recommendation = 'Possible issue detected. Be careful with important tasks.'
    }

    return {
      isIncident,
      confidence: combinedConfidence,
      signals,
      officialIncident,
      combinedState,
      recommendation,
    }
  }
}
