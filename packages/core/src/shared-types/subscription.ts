export interface OrganizationInfo {
  id: number
  uuid: string
  name: string
  createdAt: string
  capabilities: string[]
}

export interface UsageWindow {
  utilization: number
  resetsAt: string
}

export interface SubscriptionUsage {
  fiveHour: UsageWindow
  sevenDay: UsageWindow
  sevenDayOpus?: UsageWindow
  sevenDaySonnet?: UsageWindow
  sevenDayOauthApps?: UsageWindow
  fetchedAt: string
}

export interface ExtraUsage {
  isEnabled: boolean
  monthlyLimitCents: number
  usedCents: number
  currency: string
  outOfCredits: boolean
}

export interface SubscriptionState {
  organization: OrganizationInfo | null
  usage: SubscriptionUsage | null
  extraUsage: ExtraUsage | null
  isAuthenticated: boolean
  subscriptionType?: string | null
  rateLimitTier?: string | null
  displayName?: string | null
  email?: string | null
  lastError?: string
}
