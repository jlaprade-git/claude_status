import type { FC } from 'react'
import type { UsageSummary } from '@claude-status/core'

interface QuickStatsProps {
  summary: UsageSummary | null
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    padding: '16px 16px 4px',
    flexShrink: 0,
  } as React.CSSProperties,
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '12px',
    transition: 'all 0.12s ease',
    cursor: 'default',
  } as React.CSSProperties,
  value: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.5px',
  } as React.CSSProperties,
  label: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    marginTop: '3px',
    fontWeight: 500,
    letterSpacing: '0.3px',
  } as React.CSSProperties,
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`
}

export const QuickStats: FC<QuickStatsProps> = ({ summary }) => {
  const last24 = summary?.last24Hours ?? { tokens: 0, cost: 0, records: 0 }

  const cardHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    e.currentTarget.style.background = enter ? 'var(--bg-elevated)' : 'var(--bg-surface)'
    e.currentTarget.style.borderColor = enter ? 'var(--border-medium)' : 'var(--border-subtle)'
  }

  const cards = [
    { value: formatTokens(last24.tokens), label: 'Tokens (24h)' },
    { value: formatCost(last24.cost), label: 'Cost (24h)' },
    { value: String(last24.records), label: 'Requests (24h)' },
  ]

  return (
    <div style={styles.grid}>
      {cards.map((c, i) => (
        <div
          key={i}
          style={styles.card}
          onMouseEnter={(e) => cardHover(e, true)}
          onMouseLeave={(e) => cardHover(e, false)}
        >
          <div style={styles.value}>{c.value}</div>
          <div style={styles.label}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}
