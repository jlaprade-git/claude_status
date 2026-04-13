import type { CombinedHealthState } from '../shared-types/health'
import type { IncidentAssessment } from './types'

export type LifecycleState = 'normal' | 'detected' | 'confirmed' | 'monitoring' | 'resolved'

export type LifecycleChangeHandler = (
  state: LifecycleState,
  assessment: IncidentAssessment,
) => void

export class IncidentLifecycle {
  private state: LifecycleState = 'normal'
  private resolveTimeoutMs: number
  private normalSinceTimestamp: number | null = null
  private handlers: LifecycleChangeHandler[] = []

  constructor(resolveTimeoutMs = 15 * 60 * 1000) {
    this.resolveTimeoutMs = resolveTimeoutMs
  }

  getState(): LifecycleState {
    return this.state
  }

  onChange(handler: LifecycleChangeHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  update(assessment: IncidentAssessment): void {
    const previousState = this.state

    switch (this.state) {
      case 'normal':
        if (assessment.combinedState === 'possible_issue') {
          this.transition('detected', assessment)
        } else if (
          assessment.combinedState === 'confirmed_outage' ||
          assessment.combinedState === 'maintenance'
        ) {
          this.transition('confirmed', assessment)
        }
        break

      case 'detected':
        if (assessment.combinedState === 'confirmed_outage') {
          this.transition('confirmed', assessment)
        } else if (assessment.combinedState === 'healthy') {
          this.transition('normal', assessment)
        }
        break

      case 'confirmed':
        if (assessment.combinedState === 'recovering') {
          this.transition('monitoring', assessment)
        } else if (assessment.combinedState === 'healthy') {
          this.transition('resolved', assessment)
          // Auto-transition to normal after resolved
          setTimeout(() => {
            if (this.state === 'resolved') {
              this.transition('normal', assessment)
            }
          }, 5000)
        }
        break

      case 'monitoring':
        if (assessment.combinedState === 'healthy') {
          if (!this.normalSinceTimestamp) {
            this.normalSinceTimestamp = Date.now()
          } else if (Date.now() - this.normalSinceTimestamp >= this.resolveTimeoutMs) {
            this.transition('resolved', assessment)
          }
        } else if (assessment.combinedState === 'confirmed_outage') {
          this.normalSinceTimestamp = null
          this.transition('confirmed', assessment)
        } else {
          this.normalSinceTimestamp = null
        }
        break

      case 'resolved':
        if (assessment.combinedState !== 'healthy') {
          this.transition('detected', assessment)
        }
        break
    }

    if (this.state === previousState && this.state !== 'normal') {
      // Still in same non-normal state - notify handlers of assessment update
    }
  }

  private transition(newState: LifecycleState, assessment: IncidentAssessment): void {
    this.state = newState
    this.normalSinceTimestamp = null
    for (const handler of this.handlers) {
      handler(newState, assessment)
    }
  }
}
