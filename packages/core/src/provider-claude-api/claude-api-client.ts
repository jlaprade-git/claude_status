import type { OrganizationInfo, SubscriptionUsage, ExtraUsage, UsageWindow } from '../shared-types/subscription'

export interface ClaudeApiConfig {
  accessToken: string
  userAgent?: string
}

interface RawUsageResponse {
  five_hour?: { utilization: number; resets_at: string }
  seven_day?: { utilization: number; resets_at: string }
  seven_day_opus?: { utilization: number; resets_at: string }
  seven_day_sonnet?: { utilization: number; resets_at: string }
  seven_day_oauth_apps?: { utilization: number; resets_at: string }
}

interface RawOrgResponse {
  id: number
  uuid: string
  name: string
  created_at: string
  capabilities: string[]
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

const BASE_URL = 'https://claude.ai'
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export class ClaudeApiClient {
  private accessToken: string
  private userAgent: string

  constructor(config: ClaudeApiConfig) {
    this.accessToken = config.accessToken
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT
  }

  updateAccessToken(token: string): void {
    this.accessToken = token
  }

  private getHeaders(): Record<string, string> {
    return {
      'Cookie': `sessionKey=${this.accessToken}`,
      'User-Agent': this.userAgent,
      'Origin': BASE_URL,
      'Referer': `${BASE_URL}/settings/usage`,
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'anthropic-client-platform': 'web',
      'anthropic-client-version': '1.0.0',
    }
  }

  async getOrganizations(): Promise<OrganizationInfo[]> {
    const response = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED')
    }
    if (response.status === 403) {
      throw new Error('CLOUDFLARE_CHALLENGE')
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = (await response.json()) as RawOrgResponse[]
    return data.map((org) => ({
      id: org.id,
      uuid: org.uuid,
      name: org.name,
      createdAt: org.created_at,
      capabilities: org.capabilities ?? [],
    }))
  }

  async getUsage(orgUuid: string): Promise<SubscriptionUsage> {
    const response = await fetch(`${BASE_URL}/api/organizations/${orgUuid}/usage`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED')
    }
    if (!response.ok) {
      throw new Error(`Usage API error: ${response.status}`)
    }

    const data = (await response.json()) as RawUsageResponse

    const mapWindow = (raw?: { utilization: number; resets_at: string }): UsageWindow => ({
      utilization: raw?.utilization ?? 0,
      resetsAt: raw?.resets_at ?? '',
    })

    return {
      fiveHour: mapWindow(data.five_hour),
      sevenDay: mapWindow(data.seven_day),
      sevenDayOpus: data.seven_day_opus ? mapWindow(data.seven_day_opus) : undefined,
      sevenDaySonnet: data.seven_day_sonnet ? mapWindow(data.seven_day_sonnet) : undefined,
      sevenDayOauthApps: data.seven_day_oauth_apps ? mapWindow(data.seven_day_oauth_apps) : undefined,
      modelLimits: [],
      fetchedAt: new Date().toISOString(),
    }
  }

  async getExtraUsage(orgUuid: string): Promise<ExtraUsage> {
    const response = await fetch(`${BASE_URL}/api/organizations/${orgUuid}/overage_spend_limit`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED')
    }
    if (!response.ok) {
      throw new Error(`Extra usage API error: ${response.status}`)
    }

    const data = (await response.json()) as RawExtraUsageResponse

    return {
      isEnabled: data.is_enabled ?? false,
      monthlyLimitCents: data.monthly_credit_limit ?? data.spend_limit_amount_cents ?? 0,
      usedCents: data.used_credits ?? (data.spend_limit_amount_cents != null && data.balance_cents != null
        ? data.spend_limit_amount_cents - data.balance_cents
        : 0),
      currency: data.currency ?? 'usd',
      outOfCredits: data.out_of_credits ?? false,
    }
  }
}
