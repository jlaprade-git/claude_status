import type { UsageSummary } from './usage'
import type { ServiceHealth, CombinedHealthState, Incident } from './health'
import type { CostEstimate } from './pricing'
import type { UserSettings } from './settings'

export type AppEvent =
  | { type: 'usage:updated'; payload: UsageSummary }
  | { type: 'status:changed'; payload: ServiceHealth }
  | { type: 'health:changed'; payload: CombinedHealthState }
  | { type: 'incident:created'; payload: Incident }
  | { type: 'incident:updated'; payload: Incident }
  | { type: 'incident:resolved'; payload: Incident }
  | { type: 'settings:changed'; payload: Partial<UserSettings> }
  | { type: 'notification:sent'; payload: { title: string; body: string; type: string } }
  | { type: 'error'; payload: { source: string; message: string } }

export type AppEventType = AppEvent['type']

export type AppEventPayload<T extends AppEventType> = Extract<AppEvent, { type: T }>['payload']

export interface EventEmitter {
  emit<T extends AppEventType>(type: T, payload: AppEventPayload<T>): void
  on<T extends AppEventType>(type: T, handler: (payload: AppEventPayload<T>) => void): () => void
  off<T extends AppEventType>(type: T, handler: (payload: AppEventPayload<T>) => void): void
}
