import type { SubscriptionUsage, ExtraUsage, SubscriptionState, UsageWindow } from '@claude-status/core'
import { AuthManager } from '../auth/index'
import { BrowserFetcher } from './browser-fetcher'

const CLAUDE_BASE = 'https://claude.ai'

interface RawUsageResponse {
  five_hour?: { utilization: number; resets_at: string }
  seven_day?: { utilization: number; resets_at: string }
  seven_day_opus?: { utilization: number; resets_at: string }
  seven_day_sonnet?: { utilization: number; resets_at: string }
  seven_day_oauth_apps?: { utilization: number; resets_at: string }
}

interface RawExtraUsageResponse {
  is_enabled?: boolean
  monthly_credit_limit?: number
  used_credits?: number
  currency?: string
  out_of_credits?: boolean
  spend_limit_amount_cents?: number
  balance_cents?: number
}

export class SubscriptionManager {
  private auth: AuthManager
  private fetcher: BrowserFetcher
  private usage: SubscriptionUsage | null = null
  private extraUsage: ExtraUsage | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private onChange: ((state: SubscriptionState) => void) | null = null

  constructor(auth: AuthManager) {
    this.auth = auth
    this.fetcher = new BrowserFetcher()
  }

  onStateChange(handler: (state: SubscriptionState) => void): void {
    this.onChange = handler
  }

  getState(): SubscriptionState {
    const authState = this.auth.getState()
    return {
      organization: authState.organizationUuid
        ? {
            id: 0,
            uuid: authState.organizationUuid,
            name: authState.displayName ?? 'Personal',
            createdAt: '',
            capabilities: [],
          }
        : null,
      usage: this.usage,
      extraUsage: this.extraUsage,
      isAuthenticated: authState.isAuthenticated,
      subscriptionType: authState.subscriptionType,
      rateLimitTier: authState.rateLimitTier,
      displayName: authState.displayName,
      email: authState.email,
    }
  }

  async initialize(): Promise<void> {
    const success = await this.auth.initialize()
    if (!success) {
      this.notifyChange()
      return
    }

    const sessionKey = this.auth.getSessionKey()
    if (!sessionKey) return

    console.log('[SubscriptionManager] Initializing browser fetcher...')
    await this.fetcher.initialize(sessionKey)
    await this.fetchAll()
    this.startPolling()
  }

  openLoginPage(): void {
    this.auth.openLoginPage()
  }

  async submitSessionKey(key: string): Promise<boolean> {
    const valid = await this.auth.setSessionKey(key)
    if (!valid) {
      this.notifyChange({ lastError: 'Invalid session key. It should start with sk-ant-sid' })
      return false
    }

    // Re-initialize fetcher with new key
    this.fetcher.destroy()
    await this.fetcher.initialize(key)
    await this.fetchAll()
    this.startPolling()
    return true
  }

  async logout(): Promise<void> {
    this.stopPolling()
    await this.auth.logout()
    this.usage = null
    this.extraUsage = null
    this.fetcher.destroy()
    this.notifyChange()
  }

  startPolling(intervalMs = 120_000): void {
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => this.fetchAll(), intervalMs)
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  async refresh(): Promise<void> {
    await this.fetchAll()
  }

  destroy(): void {
    this.stopPolling()
    this.fetcher.destroy()
  }

  private async fetchAll(): Promise<void> {
    const orgUuid = this.auth.getOrganizationUuid()
    if (!orgUuid) return

    try {
      const rawUsage = await this.fetcher.fetchJson(
        `${CLAUDE_BASE}/api/organizations/${orgUuid}/usage`
      ) as RawUsageResponse

      if ((rawUsage as any)?.type === 'error') {
        const errMsg = (rawUsage as any)?.error?.message ?? 'Unknown API error'
        console.error('[SubscriptionManager] API error:', errMsg)
        if ((rawUsage as any)?.error?.details?.error_code === 'account_session_invalid') {
          this.notifyChange({ lastError: 'Session expired. Please sign in again.' })
          return
        }
        this.notifyChange({ lastError: errMsg })
        return
      }

      const mapWindow = (raw?: { utilization: number; resets_at: string }): UsageWindow => ({
        utilization: raw?.utilization ?? 0,
        resetsAt: raw?.resets_at ?? '',
      })

      this.usage = {
        fiveHour: mapWindow(rawUsage.five_hour),
        sevenDay: mapWindow(rawUsage.seven_day),
        sevenDayOpus: rawUsage.seven_day_opus ? mapWindow(rawUsage.seven_day_opus) : undefined,
        sevenDaySonnet: rawUsage.seven_day_sonnet ? mapWindow(rawUsage.seven_day_sonnet) : undefined,
        sevenDayOauthApps: rawUsage.seven_day_oauth_apps ? mapWindow(rawUsage.seven_day_oauth_apps) : undefined,
        fetchedAt: new Date().toISOString(),
      }

      console.log(`[SubscriptionManager] Usage: 5h=${this.usage.fiveHour.utilization}%, 7d=${this.usage.sevenDay.utilization}%`)

      try {
        const rawExtra = await this.fetcher.fetchJson(
          `${CLAUDE_BASE}/api/organizations/${orgUuid}/overage_spend_limit`
        ) as RawExtraUsageResponse

        if ((rawExtra as any)?.type !== 'error') {
          this.extraUsage = {
            isEnabled: rawExtra.is_enabled ?? false,
            monthlyLimitCents: rawExtra.monthly_credit_limit ?? rawExtra.spend_limit_amount_cents ?? 0,
            usedCents: rawExtra.used_credits ?? 0,
            currency: rawExtra.currency ?? 'usd',
            outOfCredits: rawExtra.out_of_credits ?? false,
          }
        }
      } catch {
        this.extraUsage = null
      }

      this.notifyChange()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[SubscriptionManager] Fetch failed:', msg)
      this.notifyChange({ lastError: msg })
    }
  }

  private notifyChange(extra?: Partial<SubscriptionState>): void {
    if (this.onChange) {
      this.onChange({ ...this.getState(), ...extra })
    }
  }
}
