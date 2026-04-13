import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

const POPUP_WIDTH = 380
const POPUP_HEIGHT = 520

export class PopupWindow {
  private window: BrowserWindow | null = null
  private isVisible = false

  create(): void {
    this.window = new BrowserWindow({
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: false,
      backgroundColor: '#1a1a2e',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    // Hide on blur (click outside)
    this.window.on('blur', () => {
      this.hide()
    })

    this.window.on('closed', () => {
      this.window = null
      this.isVisible = false
    })
  }

  loadURL(url: string): void {
    this.window?.loadURL(url)
  }

  loadFile(filePath: string): void {
    this.window?.loadFile(filePath)
  }

  toggle(trayBounds?: Electron.Rectangle): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show(trayBounds)
    }
  }

  show(trayBounds?: Electron.Rectangle): void {
    if (!this.window) return

    if (trayBounds) {
      const position = this.calculatePosition(trayBounds)
      this.window.setPosition(position.x, position.y, false)
    }

    this.window.show()
    this.window.focus()
    this.isVisible = true
  }

  hide(): void {
    this.window?.hide()
    this.isVisible = false
  }

  getWindow(): BrowserWindow | null {
    return this.window
  }

  isShowing(): boolean {
    return this.isVisible
  }

  send(channel: string, ...args: unknown[]): void {
    this.window?.webContents.send(channel, ...args)
  }

  private calculatePosition(trayBounds: Electron.Rectangle): { x: number; y: number } {
    const display = screen.getDisplayNearestPoint({
      x: trayBounds.x,
      y: trayBounds.y,
    })
    const workArea = display.workArea

    if (process.platform === 'darwin') {
      // macOS: position below menu bar, centered on tray icon
      const x = Math.round(trayBounds.x + trayBounds.width / 2 - POPUP_WIDTH / 2)
      const y = Math.round(trayBounds.y + trayBounds.height + 4)
      return {
        x: Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - POPUP_WIDTH)),
        y,
      }
    } else {
      // Linux: position above taskbar (usually at bottom)
      const x = Math.round(trayBounds.x + trayBounds.width / 2 - POPUP_WIDTH / 2)
      const y = Math.round(trayBounds.y - POPUP_HEIGHT - 4)
      return {
        x: Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - POPUP_WIDTH)),
        y: Math.max(workArea.y, y),
      }
    }
  }
}
