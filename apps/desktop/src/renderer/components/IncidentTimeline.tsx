import type { FC } from 'react'
import type { Incident } from '@claude-status/core'

interface IncidentTimelineProps {
  incidents: Incident[]
}

const styles = {
  section: {
    padding: '12px 16px 16px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '8px',
  } as React.CSSProperties,
  empty: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '20px 16px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
  } as React.CSSProperties,
  emptyIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: 'var(--green)',
    fontWeight: 700,
  } as React.CSSProperties,
  emptyText: {
    fontSize: '12px',
    color: 'var(--green)',
    fontWeight: 500,
  } as React.CSSProperties,
  incident: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '12px',
    marginBottom: '8px',
    transition: 'border-color 0.12s ease',
  } as React.CSSProperties,
  incidentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    gap: '8px',
  } as React.CSSProperties,
  incidentName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  badge: {
    fontSize: '9px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
    letterSpacing: '0.3px',
    flexShrink: 0,
  } as React.CSSProperties,
  update: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.5,
  } as React.CSSProperties,
}

const statusColors: Record<string, { bg: string; text: string }> = {
  investigating: { bg: 'rgba(239, 68, 68, 0.12)', text: 'var(--rose)' },
  identified: { bg: 'rgba(234, 179, 8, 0.12)', text: 'var(--amber)' },
  monitoring: { bg: 'rgba(59, 130, 246, 0.12)', text: 'var(--blue)' },
  resolved: { bg: 'rgba(34, 197, 94, 0.12)', text: 'var(--green)' },
}

export const IncidentTimeline: FC<IncidentTimelineProps> = ({ incidents }) => {
  const active = incidents.filter(i => i.status !== 'resolved')
  const recent = incidents.filter(i => i.status === 'resolved')

  return (
    <>
      {/* Active Incidents */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Active Incidents</div>
        {active.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>{'\u2713'}</div>
            <div style={styles.emptyText}>No active incidents</div>
          </div>
        ) : (
          active.map((incident) => {
            const colors = statusColors[incident.status] ?? statusColors.investigating
            const latestUpdate = incident.updates[0]
            return (
              <div
                key={incident.id}
                style={styles.incident}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              >
                <div style={styles.incidentHeader}>
                  <span style={styles.incidentName}>{incident.name}</span>
                  <span style={{ ...styles.badge, background: colors.bg, color: colors.text }}>
                    {incident.status}
                  </span>
                </div>
                {latestUpdate && (
                  <div style={styles.update}>{latestUpdate.body}</div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Recent Incidents */}
      {recent.length > 0 && (
        <div style={{ ...styles.section, paddingTop: 0 }}>
          <div style={styles.sectionTitle}>Recent Incidents</div>
          {recent.map((incident) => {
            const colors = statusColors[incident.status] ?? statusColors.resolved
            return (
              <div
                key={incident.id}
                style={{ ...styles.incident, opacity: 0.7 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              >
                <div style={styles.incidentHeader}>
                  <span style={styles.incidentName}>{incident.name}</span>
                  <span style={{ ...styles.badge, background: colors.bg, color: colors.text }}>
                    {incident.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
