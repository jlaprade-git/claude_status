import { BrowserWindow, session } from 'electron'

const CLAUDE_BASE = 'https://claude.ai'

export class BrowserFetcher {
  private window: BrowserWindow | null = null
  private ready = false

  async initialize(sessionKey: string): Promise<void> {
    // Set the session cookie
    await session.defaultSession.cookies.set({
      url: CLAUDE_BASE,
      name: 'sessionKey',
      value: sessionKey,
      domain: '.claude.ai',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })

    // Create hidden browser window
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    // Load claude.ai to establish Cloudflare clearance
    try {
      await this.window.loadURL(CLAUDE_BASE)
      // Wait for Cloudflare challenge to resolve
      await this.waitForCloudflare()
      this.ready = true
      console.log('[BrowserFetcher] Cloudflare clearance obtained')
    } catch (error) {
      console.error('[BrowserFetcher] Failed to establish session:', error)
    }
  }

  async fetchJson(url: string): Promise<unknown> {
    if (!this.window || !this.ready) {
      throw new Error('BrowserFetcher not initialized')
    }

    try {
      // loadURL resolves after did-finish-load; use a race with a manual timeout
      await Promise.race([
        this.window.loadURL(url),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 20000)
        ),
      ])

      // Extract page text (API endpoints return raw JSON)
      const bodyText = await this.window.webContents.executeJavaScript(
        'document.body.innerText || document.body.textContent || ""'
      )

      if (!bodyText || bodyText.includes('Just a moment')) {
        // Still on Cloudflare challenge page, wait and retry
        await new Promise(r => setTimeout(r, 3000))
        const retryText = await this.window.webContents.executeJavaScript(
          'document.body.innerText || document.body.textContent || ""'
        )
        return JSON.parse(retryText)
      }

      return JSON.parse(bodyText)
    } catch (error) {
      console.error('[BrowserFetcher] Fetch failed for', url, error)
      throw error
    }
  }

  private async waitForCloudflare(): Promise<void> {
    // Poll until Cloudflare challenge is done (page title changes or URL changes)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500))
      const title = this.window!.getTitle()
      const url = this.window!.webContents.getURL()

      // If we're past the challenge page
      if (!title.includes('Just a moment') && url.includes('claude.ai')) {
        return
      }
    }
    // Even if challenge didn't fully resolve, continue — cookies might still be set
    console.log('[BrowserFetcher] Cloudflare wait completed (may not have fully resolved)')
  }

  async updateCookie(sessionKey: string): Promise<void> {
    await session.defaultSession.cookies.set({
      url: CLAUDE_BASE,
      name: 'sessionKey',
      value: sessionKey,
      domain: '.claude.ai',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  destroy(): void {
    this.window?.close()
    this.window = null
    this.ready = false
  }
}
