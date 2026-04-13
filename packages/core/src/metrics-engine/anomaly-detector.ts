import type { AnomalyResult } from '../shared-types/metrics'

export class AnomalyDetector {
  private windowSize: number
  private threshold: number

  constructor(windowSize = 50, threshold = 2.5) {
    this.windowSize = windowSize
    this.threshold = threshold
  }

  detect(values: number[], metric: string): AnomalyResult {
    if (values.length < 3) {
      return {
        detected: false,
        metric,
        currentValue: values[values.length - 1] ?? 0,
        expectedRange: { min: 0, max: 0 },
        zScore: 0,
        timestamp: new Date().toISOString(),
        description: 'Insufficient data for anomaly detection',
      }
    }

    const window = values.slice(-this.windowSize)
    const current = window[window.length - 1]
    const historical = window.slice(0, -1)

    const mean = historical.reduce((sum, v) => sum + v, 0) / historical.length
    const variance =
      historical.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historical.length
    const stdDev = Math.sqrt(variance)

    const zScore = stdDev > 0 ? (current - mean) / stdDev : 0
    const detected = Math.abs(zScore) > this.threshold

    return {
      detected,
      metric,
      currentValue: current,
      expectedRange: {
        min: mean - this.threshold * stdDev,
        max: mean + this.threshold * stdDev,
      },
      zScore,
      timestamp: new Date().toISOString(),
      description: detected
        ? `${metric} is ${zScore > 0 ? 'unusually high' : 'unusually low'} (z-score: ${zScore.toFixed(2)})`
        : `${metric} is within normal range`,
    }
  }
}
