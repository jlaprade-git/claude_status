import type { FC } from 'react'
import type { UsageSummary } from '@claude-status/core'

interface UsageDashboardProps {
  summary: UsageSummary | null
}

const styles = {
  section: {
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
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '4px 0',
    overflow: 'hidden',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    transition: 'background 0.12s ease',
    cursor: 'default',
  } as React.CSSProperties,
  label: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 400,
  } as React.CSSProperties,
  values: {
    display: 'flex',
    gap: '14px',
    alignItems: 'baseline',
  } as React.CSSProperties,
  tokenValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    minWidth: '50px',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  costValue: {
    fontSize: '12px',
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
    minWidth: '50px',
    textAlign: 'right' as const,
    fontWeight: 500,
  } as React.CSSProperties,
  /* Projects section */
  projectSection: {
    padding: '12px 16px 16px',
  } as React.CSSProperties,
  projectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 12px',
    transition: 'background 0.12s ease',
    cursor: 'default',
  } as React.CSSProperties,
  projectName: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 400,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '160px',
  } as React.CSSProperties,
  projectValues: {
    display: 'flex',
    gap: '12px',
    alignItems: 'baseline',
    flexShrink: 0,
  } as React.CSSProperties,
  emptyText: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
    padding: '12px 0',
  } as React.CSSProperties,
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

const timeRanges = [
  { key: 'last5Hours', label: 'Last 5 hours' },
  { key: 'last24Hours', label: 'Last 24 hours' },
  { key: 'last7Days', label: 'Last 7 days' },
  { key: 'currentWeek', label: 'This week' },
  { key: 'allTime', label: 'All time' },
] as const

export const UsageDashboard: FC<UsageDashboardProps> = ({ summary }) => {
  const projects = summary?.topProjects ?? []

  return (
    <>
      {/* Time Ranges */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Time Ranges</div>
        <div style={styles.card}>
          {timeRanges.map(({ key, label }) => {
            const data = summary?.[key] ?? { tokens: 0, cost: 0, records: 0 }
            return (
              <div
                key={key}
                style={styles.row}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={styles.label}>{label}</span>
                <div style={styles.values}>
                  <span style={styles.tokenValue}>{formatTokens(data.tokens)}</span>
                  <span style={styles.costValue}>${data.cost.toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Projects */}
      <div style={styles.projectSection}>
        <div style={styles.sectionTitle}>Top Projects</div>
        <div style={styles.card}>
          {projects.length === 0 ? (
            <div style={styles.emptyText}>No project data yet</div>
          ) : (
            projects.map((p) => (
              <div
                key={p.name}
                style={styles.projectRow}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={styles.projectName} title={p.name}>{p.name}</span>
                <div style={styles.projectValues}>
                  <span style={styles.tokenValue}>{formatTokens(p.tokens)}</span>
                  <span style={styles.costValue}>${p.cost.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
