import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getUsageSummary: () => ipcRenderer.invoke('usage:get-summary'),
  getUsageHistory: (range: string) => ipcRenderer.invoke('usage:get-history', range),
  getCurrentStatus: () => ipcRenderer.invoke('status:get-current'),
  getActiveIncidents: () => ipcRenderer.invoke('incidents:get-active'),
  getCostEstimate: (period: string) => ipcRenderer.invoke('metrics:get-costs', period),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: unknown) => ipcRenderer.invoke('settings:update', settings),

  // Event subscriptions
  onStatusChange: (callback: (data: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('status:changed', listener as (...args: unknown[]) => void)
    return () => ipcRenderer.removeListener('status:changed', listener as (...args: unknown[]) => void)
  },
  onUsageUpdate: (callback: (data: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('usage:updated', listener as (...args: unknown[]) => void)
    return () => ipcRenderer.removeListener('usage:updated', listener as (...args: unknown[]) => void)
  },
  onIncidentUpdate: (callback: (data: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('incident:updated', listener as (...args: unknown[]) => void)
    return () => ipcRenderer.removeListener('incident:updated', listener as (...args: unknown[]) => void)
  },

  getSubscriptionState: () => ipcRenderer.invoke('subscription:get-state'),
  subscriptionRefresh: () => ipcRenderer.invoke('subscription:refresh'),
  subscriptionOpenLogin: () => ipcRenderer.invoke('subscription:open-login'),
  subscriptionSubmitKey: (key: string) => ipcRenderer.invoke('subscription:submit-key', key),
  subscriptionLogout: () => ipcRenderer.invoke('subscription:logout'),
  onSubscriptionChange: (callback: (data: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('subscription:changed', listener as (...args: unknown[]) => void)
    return () => ipcRenderer.removeListener('subscription:changed', listener as (...args: unknown[]) => void)
  },
}

contextBridge.exposeInMainWorld('api', api)
