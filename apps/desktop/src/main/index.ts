import { app } from 'electron'
import { join } from 'path'
import { TrayManager } from './tray'
import { PopupWindow } from './popup-window'
import { registerIpcHandlers, setSubscriptionManager, setUsageCollector, setPricingModule, setStatusModule, setIncidentManager } from './ipc-handlers'
import { AuthManager } from '../modules/auth/index'
import { SubscriptionManager } from '../modules/subscription/index'
import { UsageCollector } from '../modules/usage/index'
import { PricingModule } from '../modules/pricing/index'
import { ClaudeStatusModule } from '../modules/claude-status/index'
import { IncidentManager } from '../modules/incidents/index'
import { NotificationManager } from '../modules/notifications/index'
import { DatabaseManager } from '../modules/settings/database'

let trayManager: TrayManager
let popupWindow: PopupWindow
let subscriptionMgrRef: import('../modules/subscription/index').SubscriptionManager | null = null

function initialize(): void {
  console.log('[main] Initializing Claude Status...')

  // Register IPC handlers first
  registerIpcHandlers()

  // Create tray
  trayManager = new TrayManager()
  trayManager.create()
  console.log('[main] Tray created')

  // Create popup window
  popupWindow = new PopupWindow()
  popupWindow.create()
  console.log('[main] Popup window created')

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    popupWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    popupWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Wire tray click to popup toggle
  trayManager.onClick(() => {
    console.log('[main] Tray clicked')
    const bounds = trayManager.getBounds()
    popupWindow.toggle(bounds)
  })

  // Don't show in dock on macOS (menu bar app)
  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  // Initialize database and usage collector
  DatabaseManager.create().then((db) => {
    console.log('[main] Database initialized')

    const usageCollector = new UsageCollector(db)
    setUsageCollector(usageCollector)
    return usageCollector.initialize().then(() => {
      usageCollector.startPolling(30_000)
      console.log('[main] Usage collector started')
    })
  }).catch(err => {
    console.error('[main] Database/usage init failed, continuing without persistence:', err)
    const usageCollector = new UsageCollector(null)
    setUsageCollector(usageCollector)
    usageCollector.initialize().then(() => {
      usageCollector.startPolling(30_000)
      console.log('[main] Usage collector started (no persistence)')
    }).catch(e => console.error('[main] Usage collector failed:', e))
  })

  // Initialize pricing module
  const pricingModule = new PricingModule()
  setPricingModule(pricingModule)

  // Initialize Claude Status module
  const statusModule = new ClaudeStatusModule()
  setStatusModule(statusModule)
  statusModule.onChange((health) => {
    popupWindow.send('status:changed', health)
    // Update tray icon based on status
    if (health.indicator === 'major_outage') {
      trayManager.setState('outage')
    } else if (health.indicator === 'degraded') {
      trayManager.setState('degraded')
    } else {
      trayManager.setState('normal')
    }
  })
  statusModule.start()
  console.log('[main] Status monitoring started')

  // Initialize incident manager
  const incidentManager = new IncidentManager()
  setIncidentManager(incidentManager)

  // Initialize notifications
  const notificationManager = new NotificationManager()
  notificationManager.setPopupWindow(popupWindow.getWindow())
  incidentManager.onChange((state, assessment) => {
    notificationManager.handleLifecycleChange(state, assessment)
    popupWindow.send('incident:updated', assessment)
  })

  // Connect status updates to incident manager
  statusModule.onChange((health) => {
    incidentManager.processHealthUpdate(health)
  })

  // Set up subscription tracking
  const authManager = new AuthManager()
  const subscriptionMgr = new SubscriptionManager(authManager)
  subscriptionMgrRef = subscriptionMgr
  setSubscriptionManager(subscriptionMgr)

  subscriptionMgr.onStateChange((state) => {
    popupWindow.send('subscription:changed', state)
  })

  subscriptionMgr.initialize().then(() => {
    if (subscriptionMgr.getState().isAuthenticated) {
      console.log('[main] Subscription tracking active')
    } else {
      console.log('[main] Not authenticated - subscription tracking inactive')
    }
  })

  console.log('[main] Initialization complete')
}

app.whenReady().then(() => {
  initialize()
}).catch((err) => {
  console.error('[main] Failed to initialize:', err)
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

app.on('before-quit', () => {
  trayManager?.destroy()
  subscriptionMgrRef?.destroy()
})

process.on('uncaughtException', (err) => {
  console.error('[main] Uncaught exception:', err)
})
