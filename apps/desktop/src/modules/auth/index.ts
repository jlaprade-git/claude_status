import { session, shell } from 'electron'
import { exec } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'

const CLAUDE_USAGE_URL = 'https://claude.ai/settings/usage'

interface KeychainCredentials {
  claudeAiOauth: {
    accessToken: string
    refreshToken: string
    expiresAt: number
    scopes: string[]
    subscriptionType: string
    rateLimitTier: string
  }
}

interface ClaudeJsonConfig {
  oauthAccount?: {
    accountUuid: string
    emailAddress: string
    organizationUuid: string
    hasExtraUsageEnabled: boolean
    billingType: string
    displayName: string
    subscriptionCreatedAt: string
    organizationName: string
    organizationRole: string
  }
}

export interface AuthState {
  sessionKey: string | null
  organizationUuid: string | null
  subscriptionType: string | null
  rateLimitTier: string | null
  displayName: string | null
  email: string | null
  isAuthenticated: boolean
  error?: string
}

export class AuthManager {
  private sessionKey: string | null = null
  private organizationUuid: string | null = null
  private subscriptionType: string | null = null
  private rateLimitTier: string | null = null
  private displayName: string | null = null
  private email: string | null = null

  getSessionKey(): string | null {
    return this.sessionKey
  }

  getOrganizationUuid(): string | null {
    return this.organizationUuid
  }

  isAuthenticated(): boolean {
    return this.sessionKey !== null && this.organizationUuid !== null
  }

  getState(): AuthState {
    return {
      sessionKey: this.sessionKey,
      organizationUuid: this.organizationUuid,
      subscriptionType: this.subscriptionType,
      rateLimitTier: this.rateLimitTier,
      displayName: this.displayName,
      email: this.email,
      isAuthenticated: this.isAuthenticated(),
    }
  }

  async initialize(): Promise<boolean> {
    await this.readAccountInfo()

    const saved = await this.loadSavedSessionKey()
    if (saved) {
      this.sessionKey = saved
      await this.setCookieInSession(saved)
      console.log('[auth] Loaded saved session key')
      return true
    }

    console.log('[auth] No session key found - login required')
    return false
  }

  openLoginPage(): void {
    shell.openExternal(CLAUDE_USAGE_URL)
  }

  async setSessionKey(key: string): Promise<boolean> {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-sid')) {
      console.log('[auth] Invalid session key format')
      return false
    }

    this.sessionKey = trimmed
    await this.saveSessionKey(trimmed)
    await this.setCookieInSession(trimmed)
    console.log('[auth] Session key set successfully')
    return true
  }

  async refresh(): Promise<boolean> {
    await this.readAccountInfo()
    return this.isAuthenticated()
  }

  async logout(): Promise<void> {
    this.sessionKey = null
    try {
      await session.defaultSession.cookies.remove('https://claude.ai', 'sessionKey')
      const savePath = join(app.getPath('userData'), 'session.json')
      await writeFile(savePath, JSON.stringify({ sessionKey: null }), 'utf-8')
    } catch {
      // Ignore
    }
  }

  private async readAccountInfo(): Promise<void> {
    try {
      const credentials = await this.readKeychain()
      if (credentials) {
        this.subscriptionType = credentials.claudeAiOauth.subscriptionType
        this.rateLimitTier = credentials.claudeAiOauth.rateLimitTier
      }
    } catch { /* skip */ }

    try {
      const config = await this.readClaudeJson()
      if (config?.oauthAccount) {
        this.organizationUuid = config.oauthAccount.organizationUuid
        this.displayName = config.oauthAccount.displayName
        this.email = config.oauthAccount.emailAddress
      }
    } catch { /* skip */ }
  }

  private async setCookieInSession(key: string): Promise<void> {
    try {
      await session.defaultSession.cookies.set({
        url: 'https://claude.ai',
        name: 'sessionKey',
        value: key,
        domain: '.claude.ai',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      })
    } catch { /* skip */ }
  }

  private async saveSessionKey(key: string): Promise<void> {
    try {
      const savePath = join(app.getPath('userData'), 'session.json')
      await writeFile(savePath, JSON.stringify({ sessionKey: key }), 'utf-8')
    } catch { /* skip */ }
  }

  private async loadSavedSessionKey(): Promise<string | null> {
    try {
      const savePath = join(app.getPath('userData'), 'session.json')
      const content = await readFile(savePath, 'utf-8')
      const data = JSON.parse(content) as { sessionKey?: string }
      if (data.sessionKey && data.sessionKey.startsWith('sk-ant-sid')) {
        return data.sessionKey
      }
      return null
    } catch {
      return null
    }
  }

  private readKeychain(): Promise<KeychainCredentials | null> {
    return new Promise((resolve) => {
      exec(
        'security find-generic-password -s "Claude Code-credentials" -w',
        (error, stdout) => {
          if (error || !stdout.trim()) { resolve(null); return }
          try {
            const data = JSON.parse(stdout.trim()) as KeychainCredentials
            resolve(data.claudeAiOauth?.accessToken ? data : null)
          } catch { resolve(null) }
        },
      )
    })
  }

  private async readClaudeJson(): Promise<ClaudeJsonConfig | null> {
    try {
      const configPath = join(homedir(), '.claude.json')
      const content = await readFile(configPath, 'utf-8')
      return JSON.parse(content) as ClaudeJsonConfig
    } catch { return null }
  }
}
