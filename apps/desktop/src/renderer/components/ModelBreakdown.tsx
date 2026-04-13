import type { FC } from 'react'
import type { UsageSummary } from '@claude-status/core'

interface ModelBreakdownProps {
  summary: UsageSummary | null
}

const styles = {
  section: {
    padding: '0 16px 16px',
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
  item: {
    padding: '8px 12px',
    transition: 'background 0.12s ease',
    cursor: 'default',
  } as React.CSSProperties,
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  } as React.CSSProperties,
  modelLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  } as React.CSSProperties,
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  } as React.CSSProperties,
  modelName: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: 500,
  } as React.CSSProperties,
  modelRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'baseline',
    flexShrink: 0,
  } as React.CSSProperties,
  tokenText: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
  } as React.CSSProperties,
  costText: {
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    minWidth: '50px',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  barTrack: {
    height: 3,
    borderRadius: 2,
    background: '#1c1f36',
    marginTop: 6,
    overflow: 'hidden',
  } as React.CSSProperties,
  empty: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
    padding: '16px 0',
  } as React.CSSProperties,
}

const modelColors: Record<string, string> = {
  opus: '#8b5cf6',
  sonnet: '#3b82f6',
  haiku: '#22c55e',
}

function getModelColor(model: string): string {
  for (const [key, color] of Object.entries(modelColors)) {
    if (model.toLowerCase().includes(key)) return color
  }
  return '#6b7280'
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function shortModelName(model: string): string {
  if (model.includes('opus')) return 'Opus'
  if (model.includes('sonnet')) return 'Sonnet'
  if (model.includes('haiku')) return 'Haiku'
  return model.split('-').slice(-2).join(' ')
}

export const ModelBreakdown: FC<ModelBreakdownProps> = ({ summary }) => {
  const models = summary?.topModels ?? []
  const maxTokens = Math.max(...models.map((m) => m.tokens), 1)

  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>By Model</div>
      <div style={styles.card}>
        {models.length === 0 ? (
          <div style={styles.empty}>No model data yet</div>
        ) : (
          models.map((m) => {
            const color = getModelColor(m.model)
            const pct = (m.tokens / maxTokens) * 100
            return (
              <div
                key={m.model}
                style={styles.item}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={styles.itemTop}>
                  <div style={styles.modelLeft}>
                    <div style={{ ...styles.dot, background: color }} />
                    <span style={styles.modelName}>{shortModelName(m.model)}</span>
                  </div>
                  <div style={styles.modelRight}>
                    <span style={styles.tokenText}>{formatTokens(m.tokens)}</span>
                    <span style={styles.costText}>${m.cost.toFixed(2)}</span>
                  </div>
                </div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 2,
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
