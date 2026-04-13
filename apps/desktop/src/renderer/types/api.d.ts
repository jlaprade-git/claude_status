import type {
  UsageSummary,
  DailyUsage,
  ServiceHealth,
  Incident,
  CostEstimate,
  UserSettings,
  SubscriptionState,
} from '@claude-status/core'

export interface ElectronAPI {
  getUsageSummary(): Promise<UsageSummary>
  getUsageHistory(range: string): Promise<DailyUsage[]>
  getCurrentStatus(): Promise<ServiceHealth>
  getActiveIncidents(): Promise<Incident[]>
  getCostEstimate(period: string): Promise<CostEstimate>
  getSettings(): Promise<UserSettings>
  updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean }>
  onStatusChange(callback: (data: ServiceHealth) => void): () => void
  onUsageUpdate(callback: (data: UsageSummary) => void): () => void
  onIncidentUpdate(callback: (data: Incident) => void): () => void
  getSubscriptionState(): Promise<SubscriptionState>
  subscriptionRefresh(): Promise<SubscriptionState | null>
  subscriptionOpenLogin(): Promise<void>
  subscriptionSubmitKey(key: string): Promise<boolean>
  subscriptionLogout(): Promise<void>
  onSubscriptionChange(callback: (data: SubscriptionState) => void): () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
