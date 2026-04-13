import { Notification, BrowserWindow } from 'electron'
import type { IncidentAssessment } from '@claude-status/core'
import type { LifecycleState } from '@claude-status/core'
import { NotificationBuilder } from './notification-builder'
import { QuietHoursManager } from './quiet-hours'

export class NotificationManager {
  private builder: NotificationBuilder
  private quietHours: QuietHoursManager
  private popupWindow: BrowserWindow | null = null
  private preferences = {
    outageAlerts: true,
    recoveryAlerts: true,
    maintenanceAlerts: true,
    highUsageAlerts: false,
  }

  constructor() {
    this.builder = new NotificationBuilder()
    this.quietHours = new QuietHoursManager()
  }

  setPopupWindow(window: BrowserWindow | null): void {
    this.popupWindow = window
  }

  updatePreferences(prefs: Partial<typeof this.preferences>): void {
    Object.assign(this.preferences, prefs)
  }

  updateQuietHours(enabled: boolean, start?: string, end?: string): void {
    this.quietHours.update(enabled, start, end)
  }

  handleLifecycleChange(state: LifecycleState, assessment: IncidentAssessment): void {
    if (this.quietHours.isActive()) return

    switch (state) {
      case 'detected':
        if (this.preferences.outageAlerts) {
          this.send(
            this.builder.build(
              'Possible Claude Issue',
              assessment.recommendation,
              'warning',
            ),
          )
        }
        break

      case 'confirmed':
        if (this.preferences.outageAlerts) {
          const title = assessment.officialIncident
            ? `Claude Outage: ${assessment.officialIncident.name}`
            : 'Claude Outage Confirmed'
          this.send(this.builder.build(title, assessment.recommendation, 'critical'))
        }
        break

      case 'monitoring':
        if (this.preferences.recoveryAlerts) {
          this.send(
            this.builder.build(
              'Claude Recovery in Progress',
              'A fix has been deployed. Monitoring for stability.',
              'info',
            ),
          )
        }
        break

      case 'resolved':
        if (this.preferences.recoveryAlerts) {
          this.send(
            this.builder.build(
              'Claude is Working Again',
              'The incident has been resolved. Safe to resume normal usage.',
              'success',
            ),
          )
        }
        break
    }
  }

  sendHighUsageAlert(costToday: number, budgetLimit: number): void {
    if (!this.preferences.highUsageAlerts || this.quietHours.isActive()) return
    const pct = Math.round((costToday / budgetLimit) * 100)
    this.send(
      this.builder.build(
        'High Usage Alert',
        `You've used ${pct}% of your monthly budget ($${costToday.toFixed(2)} / $${budgetLimit.toFixed(2)})`,
        'warning',
      ),
    )
  }

  private send(notification: Notification): void {
    notification.on('click', () => {
      this.popupWindow?.show()
      this.popupWindow?.focus()
    })
    notification.show()
  }
}
