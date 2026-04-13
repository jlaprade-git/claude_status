import type { FC } from 'react'
import type { ServiceHealth, Incident } from '@claude-status/core'

interface StatusBannerProps {
  status: ServiceHealth | null
  incidents: Incident[]
}

const styles = {
  section: {
    padding: '16px 16px 4px',
  } as React.CSSProperties,
  card: {
    borderRadius: 8,
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  } as React.CSSProperties,
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    flexShrink: 0,
  } as React.CSSProperties,
  textWrap: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  title: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.3,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '11px',
    opacity: 0.7,
    marginTop: '2px',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  /* Components list */
  componentSection: {
    padding: '12px 16px 4px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '8px',
  } as React.CSSProperties,
  componentCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '4px 0',
    overflow: 'hidden',
  } as React.CSSProperties,
  componentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 12px',
  } as React.CSSProperties,
  componentName: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 400,
  } as React.CSSProperties,
  componentStatus: {
    fontSize: '11px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
}

const statusConfig: Record<string, { bg: string; iconBg: string; color: string; icon: string; label: string }> = {
  operational: {
    bg: 'rgba(34, 197, 94, 0.06)',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    color: 'var(--green)',
    icon: '\u2713',
    label: 'All Systems Operational',
  },
  degraded: {
    bg: 'rgba(234, 179, 8, 0.06)',
    iconBg: 'rgba(234, 179, 8, 0.15)',
    color: 'var(--amber)',
    icon: '\u26A0',
    label: 'Degraded Performance',
  },
  major_outage: {
    bg: 'rgba(239, 68, 68, 0.08)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--rose)',
    icon: '\u2716',
    label: 'Major Outage',
  },
  maintenance: {
    bg: 'rgba(59, 130, 246, 0.06)',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--blue)',
    icon: '\u2699',
    label: 'Under Maintenance',
  },
  unknown: {
    bg: 'rgba(255, 255, 255, 0.02)',
    iconBg: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--text-tertiary)',
    icon: '?',
    label: 'Status Unknown',
  },
}

function componentStatusColor(status: string): string {
  if (status === 'operational') return 'var(--green)'
  if (status === 'degraded_performance') return 'var(--amber)'
  if (status === 'partial_outage') return 'var(--amber)'
  if (status === 'major_outage') return 'var(--rose)'
  return 'var(--text-tertiary)'
}

function formatComponentStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export const StatusBanner: FC<StatusBannerProps> = ({ status, incidents }) => {
  const indicator = status?.indicator ?? 'unknown'
  const cfg = statusConfig[indicator] ?? statusConfig.unknown
  const activeIncident = incidents[0]
  const components = status?.components ?? []

  return (
    <>
      {/* Service Status Card */}
      <div style={styles.section}>
        <div style={{ ...styles.card, background: cfg.bg, border: `1px solid ${cfg.bg}` }}>
          <div style={{ ...styles.iconWrap, background: cfg.iconBg, color: cfg.color }}>
            {cfg.icon}
          </div>
          <div style={styles.textWrap}>
            <div style={{ ...styles.title, color: cfg.color }}>{cfg.label}</div>
            {activeIncident && (
              <div style={{ ...styles.subtitle, color: cfg.color }}>
                {activeIncident.name} — {activeIncident.status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Components */}
      {components.length > 0 && (
        <div style={styles.componentSection}>
          <div style={styles.sectionTitle}>Components</div>
          <div style={styles.componentCard}>
            {components.map((c) => (
              <div key={c.id} style={styles.componentRow}>
                <span style={styles.componentName}>{c.name}</span>
                <span style={{ ...styles.componentStatus, color: componentStatusColor(c.status) }}>
                  {formatComponentStatus(c.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
