import { useState } from 'react'
import './styles/global.css'
import { Header } from './components/Header'
import { StatusBanner } from './components/StatusBanner'
import { QuickStats } from './components/QuickStats'
import { UsageDashboard } from './components/UsageDashboard'
import { ModelBreakdown } from './components/ModelBreakdown'
import { IncidentTimeline } from './components/IncidentTimeline'
import { SettingsPanel } from './components/SettingsPanel'
import { SubscriptionPanel } from './components/SubscriptionPanel'
import { useUsage } from './hooks/useUsage'
import { useStatus } from './hooks/useStatus'
import { useIncidents } from './hooks/useIncidents'
import { useSubscription } from './hooks/useSubscription'

const styles = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    alignItems: 'stretch',
    padding: '0 16px',
    height: 36,
    minHeight: 36,
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-base)',
    flexShrink: 0,
    gap: 0,
  } as React.CSSProperties,
  tab: {
    flex: 'none',
    padding: '0 16px',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 0.15s ease',
    letterSpacing: '0.2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  } as React.CSSProperties,
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)',
    fontWeight: 600,
  } as React.CSSProperties,
  tabInactive: {
    color: 'var(--text-tertiary)',
    borderBottomColor: 'transparent',
  } as React.CSSProperties,
  tabContent: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  } as React.CSSProperties,
}

type Tab = 'limits' | 'usage' | 'status'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('limits')
  const { summary } = useUsage()
  const { status } = useStatus()
  const { incidents } = useIncidents()
  const { state: subscription, loading: subLoading, openLoginPage, submitKey, logout, refresh: refreshSub } = useSubscription()

  if (showSettings) {
    return (
      <div style={styles.app}>
        <SettingsPanel onBack={() => setShowSettings(false)} />
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'limits', label: 'Limits' },
    { key: 'usage', label: 'Usage' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div style={styles.app}>
      {/* Header — 36px */}
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onRefresh={refreshSub}
        loading={subLoading}
        lastActivity={summary?.lastActivity}
      />

      {/* Tab Bar — 36px */}
      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{
              ...styles.tab,
              ...(activeTab === t.key ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => setActiveTab(t.key)}
            onMouseEnter={(e) => {
              if (activeTab !== t.key) {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== t.key) {
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content — remaining height, scrollable */}
      <div style={styles.tabContent}>
        {activeTab === 'limits' && (
          <SubscriptionPanel
            state={subscription}
            onOpenLogin={openLoginPage}
            onSubmitKey={submitKey}
            onLogout={logout}
            onRefresh={refreshSub}
            loading={subLoading}
          />
        )}
        {activeTab === 'usage' && (
          <>
            <QuickStats summary={summary} />
            <UsageDashboard summary={summary} />
            <ModelBreakdown summary={summary} />
          </>
        )}
        {activeTab === 'status' && (
          <>
            <StatusBanner status={status} incidents={incidents} />
            <IncidentTimeline incidents={incidents} />
          </>
        )}
      </div>
    </div>
  )
}
