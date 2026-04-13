import { useState, useEffect, type FC } from 'react'
import type { UserSettings } from '@claude-status/core'

interface SettingsPanelProps {
  onBack: () => void
}

const styles = {
  container: {
    padding: '0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 12px',
    height: 40,
    minHeight: 40,
    borderBottom: '1px solid var(--border-subtle)',
    WebkitAppRegion: 'drag',
    flexShrink: 0,
  } as React.CSSProperties,
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 6px',
    borderRadius: 'var(--radius-xs)',
    transition: 'all 0.12s ease',
    lineHeight: 1,
    WebkitAppRegion: 'no-drag',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  } as React.CSSProperties,
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px 16px',
  } as React.CSSProperties,
  section: {
    marginBottom: '20px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px solid var(--border-subtle)',
  } as React.CSSProperties,
  label: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: 400,
  } as React.CSSProperties,
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background 0.2s ease',
    flexShrink: 0,
  } as React.CSSProperties,
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'white',
    position: 'absolute' as const,
    top: 2,
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  themeSelector: {
    display: 'flex',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    overflow: 'hidden',
  } as React.CSSProperties,
  themeOption: {
    padding: '4px 12px',
    fontSize: '11px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.2px',
  } as React.CSSProperties,
}

export const SettingsPanel: FC<SettingsPanelProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  const updateSetting = async (path: string, value: unknown) => {
    if (!settings) return
    const parts = path.split('.')
    const updated = { ...settings } as Record<string, unknown>
    let current = updated
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown>) }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = value
    setSettings(updated as unknown as UserSettings)
    await window.api.updateSettings(updated)
  }

  if (!settings) return null

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        ...styles.toggle,
        background: on ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: on ? '0 0 8px rgba(139, 92, 246, 0.3)' : 'none',
      }}
    >
      <div style={{ ...styles.toggleDot, left: on ? 18 : 2 }} />
    </button>
  )

  const themeOptions = ['dark', 'light', 'system'] as const

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)'
            e.currentTarget.style.background = 'none'
          }}
        >
          {/* Back arrow SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={styles.title}>Settings</span>
      </div>

      <div style={styles.body}>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Notifications</div>
          <div style={styles.row}>
            <span style={styles.label}>Outage alerts</span>
            <Toggle
              on={settings.notifications.outageAlerts}
              onToggle={() => updateSetting('notifications.outageAlerts', !settings.notifications.outageAlerts)}
            />
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Recovery alerts</span>
            <Toggle
              on={settings.notifications.recoveryAlerts}
              onToggle={() => updateSetting('notifications.recoveryAlerts', !settings.notifications.recoveryAlerts)}
            />
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Maintenance alerts</span>
            <Toggle
              on={settings.notifications.maintenanceAlerts}
              onToggle={() => updateSetting('notifications.maintenanceAlerts', !settings.notifications.maintenanceAlerts)}
            />
          </div>
          <div style={styles.row}>
            <span style={styles.label}>High usage alerts</span>
            <Toggle
              on={settings.notifications.highUsageAlerts}
              onToggle={() => updateSetting('notifications.highUsageAlerts', !settings.notifications.highUsageAlerts)}
            />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Appearance</div>
          <div style={styles.row}>
            <span style={styles.label}>Theme</span>
            <div style={styles.themeSelector}>
              {themeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => updateSetting('theme', t)}
                  style={{
                    ...styles.themeOption,
                    background: settings.theme === t ? 'var(--accent)' : 'transparent',
                    color: settings.theme === t ? 'white' : 'var(--text-tertiary)',
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>General</div>
          <div style={styles.row}>
            <span style={styles.label}>Launch at login</span>
            <Toggle
              on={settings.launchAtLogin}
              onToggle={() => updateSetting('launchAtLogin', !settings.launchAtLogin)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
