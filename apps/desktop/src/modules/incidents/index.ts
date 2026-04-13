import { IncidentCorrelator, IncidentLifecycle } from '@claude-status/core'
import type { IncidentAssessment } from '@claude-status/core'
import type { LifecycleState } from '@claude-status/core'
import type { ServiceHealth } from '@claude-status/core'

export type IncidentChangeHandler = (state: LifecycleState, assessment: IncidentAssessment) => void

export class IncidentManager {
  private correlator: IncidentCorrelator
  private lifecycle: IncidentLifecycle
  private handlers: IncidentChangeHandler[] = []

  constructor() {
    this.correlator = new IncidentCorrelator()
    this.lifecycle = new IncidentLifecycle()

    this.lifecycle.onChange((state, assessment) => {
      for (const handler of this.handlers) {
        handler(state, assessment)
      }
    })
  }

  onChange(handler: IncidentChangeHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  processHealthUpdate(health: ServiceHealth): IncidentAssessment {
    const assessment = this.correlator.assess(health)
    this.lifecycle.update(assessment)
    return assessment
  }

  getState(): LifecycleState {
    return this.lifecycle.getState()
  }
}
