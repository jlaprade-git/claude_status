import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { createTrayIcon } from './create-icons'

export type TrayState = 'normal' | 'degraded' | 'outage'

export class TrayManager {
  private tray: Tray | null = null
  private state: TrayState = 'normal'
  private onClickHandler: (() => void) | null = null

  create(): void {
    const icon = this.getIcon('normal')
    this.tray = new Tray(icon)
    this.tray.setToolTip('Claude Status')

    // On macOS, 'click' works for tray icons
    this.tray.on('click', (_event) => {
      if (this.onClickHandler) {
        this.onClickHandler()
      }
    })

    this.tray.on('right-click', () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Dashboard', click: () => this.onClickHandler?.() },
        { type: 'separator' },
        { label: 'Quit Claude Status', click: () => app.quit() },
      ])
      this.tray?.popUpContextMenu(contextMenu)
    })
  }

  onClick(handler: () => void): void {
    this.onClickHandler = handler
  }

  setState(state: TrayState): void {
    if (this.state === state) return
    this.state = state
    this.tray?.setImage(this.getIcon(state))

    const tooltips: Record<TrayState, string> = {
      normal: 'Claude Status — All systems operational',
      degraded: 'Claude Status — Service degraded',
      outage: 'Claude Status — Outage detected',
    }
    this.tray?.setToolTip(tooltips[state])
  }

  getBounds(): Electron.Rectangle | undefined {
    return this.tray?.getBounds()
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  private getIcon(state: TrayState): Electron.NativeImage {
    const iconNames: Record<TrayState, string> = {
      normal: 'tray-default.png',
      degraded: 'tray-degraded.png',
      outage: 'tray-outage.png',
    }
    const bundledPath = join(__dirname, '../../resources/icons', iconNames[state])

    if (existsSync(bundledPath)) {
      return nativeImage.createFromPath(bundledPath).resize({ width: 16, height: 16 })
    }

    // Fallback to programmatically generated icon
    return createTrayIcon(state)
  }
}
