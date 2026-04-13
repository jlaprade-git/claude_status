import { ipcMain } from 'electron'
import type { SubscriptionState } from '@claude-status/core'

// Module references — set by main/index.ts
let subscriptionManager: {
  getState: () => SubscriptionState
  refresh: () => Promise<void>
  openLoginPage: () => void
  submitSessionKey: (key: string) => Promise<boolean>
  logout: () => Promise<void>
} | null = null
let usageCollector: { getSummary: () => unknown; getRecords: () => unknown[] } | null = null
let pricingModule: { estimateCost: (records: unknown[], period: string) => unknown } | null = null
let statusModule: { getLatestHealth: () => unknown; fetchNow: () => Promise<unknown> } | null = null
let incidentManager: { getState: () => string } | null = null

export function setSubscriptionManager(manager: typeof subscriptionManager): void {
  subscriptionManager = manager
}

export function setUsageCollector(collector: typeof usageCollector): void {
  usageCollector = collector
}

export function setPricingModule(module: typeof pricingModule): void {
  pricingModule = module
}

export function setStatusModule(module: typeof statusModule): void {
  statusModule = module
}

export function setIncidentManager(manager: typeof incidentManager): void {
  incidentManager = manager
}

export function registerIpcHandlers(): void {
  ipcMain.handle('usage:get-summary', async () => {
    if (usageCollector) {
      return usageCollector.getSummary()
    }
    return {
      last5Hours: { tokens: 0, cost: 0, records: 0 },
      last24Hours: { tokens: 0, cost: 0, records: 0 },
      last7Days: { tokens: 0, cost: 0, records: 0 },
      currentWeek: { tokens: 0, cost: 0, records: 0 },
      allTime: { tokens: 0, cost: 0, records: 0 },
      topProjects: [],
      topModels: [],
    }
  })

  ipcMain.handle('usage:get-history', async (_event, _range: string) => {
    return []
  })

  ipcMain.handle('status:get-current', async () => {
    if (statusModule) {
      const health = statusModule.getLatestHealth()
      if (health) return health
      // If no cached health, fetch now
      try {
        return await statusModule.fetchNow()
      } catch {
        // Fall through to default
      }
    }
    return {
      indicator: 'unknown',
      description: 'Status not yet checked',
      lastChecked: new Date().toISOString(),
      unresolvedIncidents: [],
      recentIncidents: [],
      scheduledMaintenances: [],
      components: [],
    }
  })

  ipcMain.handle('incidents:get-active', async () => {
    if (statusModule) {
      const health = statusModule.getLatestHealth() as { unresolvedIncidents?: unknown[] } | null
      return health?.unresolvedIncidents ?? []
    }
    return []
  })

  ipcMain.handle('metrics:get-costs', async (_event, period: string) => {
    if (pricingModule && usageCollector) {
      const records = usageCollector.getRecords()
      return pricingModule.estimateCost(records, period)
    }
    return {
      period,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      breakdownByModel: [],
      totalCost: 0,
      currency: 'USD',
      confidence: 'low',
    }
  })

  ipcMain.handle('settings:get', async () => {
    return {
      theme: 'dark',
      pollingIntervals: { usageSeconds: 30, statusSeconds: 60, downdetectorSeconds: 300 },
      notifications: {
        outageAlerts: true,
        recoveryAlerts: true,
        maintenanceAlerts: true,
        highUsageAlerts: false,
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
      },
      budget: { monthlyLimitUsd: null, alertAtPercent: 0.8 },
      currency: 'USD',
      launchAtLogin: false,
      showInDock: false,
    }
  })

  ipcMain.handle('settings:update', async (_event, _settings: unknown) => {
    return { success: true }
  })

  // Subscription handlers
  ipcMain.handle('subscription:get-state', async () => {
    return subscriptionManager?.getState() ?? {
      organization: null,
      usage: null,
      extraUsage: null,
      isAuthenticated: false,
    }
  })

  ipcMain.handle('subscription:refresh', async () => {
    await subscriptionManager?.refresh()
    return subscriptionManager?.getState() ?? null
  })

  ipcMain.handle('subscription:open-login', async () => {
    subscriptionManager?.openLoginPage()
  })

  ipcMain.handle('subscription:submit-key', async (_event, key: string) => {
    return subscriptionManager?.submitSessionKey(key) ?? false
  })

  ipcMain.handle('subscription:logout', async () => {
    await subscriptionManager?.logout()
  })
}
