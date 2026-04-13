import type { UserSettings } from '@claude-status/core'

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  pollingIntervals: {
    usageSeconds: 30,
    statusSeconds: 60,
    downdetectorSeconds: 300,
  },
  notifications: {
    outageAlerts: true,
    recoveryAlerts: true,
    maintenanceAlerts: true,
    highUsageAlerts: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
  },
  budget: {
    monthlyLimitUsd: null,
    alertAtPercent: 0.8,
  },
  currency: 'USD',
  launchAtLogin: false,
  showInDock: false,
}

export function mergeWithDefaults(partial: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    pollingIntervals: {
      ...DEFAULT_SETTINGS.pollingIntervals,
      ...(partial.pollingIntervals ?? {}),
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(partial.notifications ?? {}),
      quietHours: {
        ...DEFAULT_SETTINGS.notifications.quietHours,
        ...(partial.notifications?.quietHours ?? {}),
      },
    },
    budget: {
      ...DEFAULT_SETTINGS.budget,
      ...(partial.budget ?? {}),
    },
  }
}
