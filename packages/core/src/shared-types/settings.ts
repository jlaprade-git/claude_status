export interface PollingIntervals {
  usageSeconds: number
  statusSeconds: number
  downdetectorSeconds: number
}

export interface NotificationPreferences {
  outageAlerts: boolean
  recoveryAlerts: boolean
  maintenanceAlerts: boolean
  highUsageAlerts: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:MM
    end: string   // HH:MM
  }
}

export interface BudgetSettings {
  monthlyLimitUsd: number | null
  alertAtPercent: number
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  pollingIntervals: PollingIntervals
  notifications: NotificationPreferences
  budget: BudgetSettings
  currency: string
  launchAtLogin: boolean
  showInDock: boolean
}
