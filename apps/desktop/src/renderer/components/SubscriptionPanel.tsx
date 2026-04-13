import { useState, type FC } from 'react'
import type { SubscriptionState } from '@claude-status/core'

interface SubscriptionPanelProps {
  state: SubscriptionState
  onOpenLogin: () => void
  onSubmitKey: (key: string) => Promise<boolean>
  onLogout: () => void
  onRefresh: () => void
  loading: boolean
}

/* ─── Color by utilization level ─── */
function getBarColor(v: number): string {
  if (v >= 80) return '#ef4444'
  if (v >= 50) return '#eab308'
  return '#22c55e'
}

function getBarGlow(v: number): string {
  if (v >= 80) return 'rgba(239, 68, 68, 0.35)'
  if (v >= 50) return 'rgba(234, 179, 8, 0.35)'
  return 'rgba(34, 197, 94, 0.35)'
}

function formatResetTime(isoDate: string): string {
  if (!isoDate) return ''
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff <= 0) return 'resetting soon'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `resets in ${days}d ${hours % 24}h`
  }
  if (hours > 0) return `resets in ${hours}h ${mins}m`
  return `resets in ${mins}m`
}

/* ─── Styles ─── */
const styles = {
  wrapper: {
    padding: '0 0 8px',
  } as React.CSSProperties,

  /* ── Account card ── */
  accountSection: {
    padding: '12px 16px 4px',
  } as React.CSSProperties,
  accountCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5bf0 0%, #a78bfa 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 700,
    color: 'white',
    flexShrink: 0,
    letterSpacing: '-0.5px',
    boxShadow: '0 0 10px rgba(124, 91, 240, 0.3)',
  } as React.CSSProperties,
  accountInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
  } as React.CSSProperties,
  accountName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  accountEmail: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  accountRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  } as React.CSSProperties,
  planBadge: {
    fontSize: '9px',
    padding: '3px 9px',
    borderRadius: 20,
    background: 'rgba(124, 91, 240, 0.15)',
    color: '#a78bfa',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    border: '1px solid rgba(124, 91, 240, 0.3)',
    boxShadow: '0 0 6px rgba(124, 91, 240, 0.15)',
  } as React.CSSProperties,
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    fontSize: '10px',
    padding: 0,
    transition: 'color 0.12s ease',
    letterSpacing: '0.2px',
  } as React.CSSProperties,

  /* ── Section title ── */
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '8px',
  } as React.CSSProperties,

  /* ── Main limits section ── */
  limitsSection: {
    padding: '12px 16px 4px',
  } as React.CSSProperties,
  limitsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as React.CSSProperties,

  /* ── Limit card ── */
  limitCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '14px',
  } as React.CSSProperties,
  limitCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '10px',
  } as React.CSSProperties,
  limitLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  limitPct: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
  barTrack: {
    height: 10,
    width: '100%',
    borderRadius: 9999,
    background: 'var(--bg-elevated)',
    overflow: 'hidden',
  } as React.CSSProperties,
  barFill: {
    height: 10,
    borderRadius: 9999,
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,
  limitReset: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,

  /* ── Model limits section ── */
  modelSection: {
    padding: '12px 16px 4px',
  } as React.CSSProperties,
  modelList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as React.CSSProperties,
  modelCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '12px',
  } as React.CSSProperties,
  modelCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  } as React.CSSProperties,
  modelLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  } as React.CSSProperties,
  modelDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  } as React.CSSProperties,
  modelLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  modelPct: {
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
  modelBarTrack: {
    height: 6,
    width: '100%',
    borderRadius: 9999,
    background: 'var(--bg-elevated)',
    overflow: 'hidden',
  } as React.CSSProperties,
  modelReset: {
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,

  /* ── Extra usage section ── */
  extraSection: {
    padding: '12px 16px 4px',
  } as React.CSSProperties,
  extraCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '14px',
  } as React.CSSProperties,
  extraHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '10px',
  } as React.CSSProperties,
  extraLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  } as React.CSSProperties,
  extraAmount: {
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
  } as React.CSSProperties,

  /* ── Error ── */
  error: {
    fontSize: '11px',
    color: 'var(--rose)',
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 8,
    border: '1px solid rgba(239, 68, 68, 0.1)',
    margin: '0 16px 10px',
  } as React.CSSProperties,

  /* ── Onboarding / Connect ── */
  onboardingSection: {
    padding: '16px',
  } as React.CSSProperties,
  onboarding: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    overflow: 'hidden',
  } as React.CSSProperties,
  onboardingAccent: {
    height: 3,
    background: 'linear-gradient(90deg, #7c5bf0 0%, #a78bfa 100%)',
  } as React.CSSProperties,
  onboardingBody: {
    padding: '20px 16px 16px',
  } as React.CSSProperties,
  onboardingTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  step: {
    marginBottom: '12px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  stepNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '1px',
  } as React.CSSProperties,
  stepContent: {
    flex: 1,
  } as React.CSSProperties,
  openBtn: {
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  pasteRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  } as React.CSSProperties,
  input: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-medium)',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: '11px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 0.15s ease',
  } as React.CSSProperties,
  submitBtn: {
    background: 'var(--green)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s ease',
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  code: {
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
  } as React.CSSProperties,
}

/* ─── Limit Card Component ─── */
const UsageBar: FC<{
  label: string
  utilization: number
  resetsAt: string
  cardStyle?: React.CSSProperties
  barHeight?: number
  labelSize?: string
  pctSize?: string
  resetStyle?: React.CSSProperties
  dotColor?: string
}> = ({ label, utilization, resetsAt, cardStyle, barHeight = 10, labelSize = '13px', pctSize = '16px', resetStyle, dotColor }) => {
  const pct = Math.min(100, Math.max(0, utilization))
  const color = getBarColor(pct)
  const glow = getBarGlow(pct)

  return (
    <div style={cardStyle ?? styles.limitCard}>
      <div style={styles.limitCardHeader}>
        <span style={{ ...styles.limitLabel, fontSize: labelSize, display: 'flex', alignItems: 'center', gap: '7px' }}>
          {dotColor && (
            <span style={{ ...styles.modelDot, background: dotColor }} />
          )}
          {label}
        </span>
        <span style={{ ...styles.limitPct, color, fontSize: pctSize }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ ...styles.barTrack, height: barHeight }}>
        <div
          style={{
            ...styles.barFill,
            height: barHeight,
            width: `${pct}%`,
            background: color,
            boxShadow: pct > 5 ? `0 0 6px ${glow}` : 'none',
          }}
        />
      </div>
      {resetsAt && (
        <div style={resetStyle ?? styles.limitReset}>
          <span>⏱</span>
          <span>{formatResetTime(resetsAt)}</span>
        </div>
      )}
    </div>
  )
}

export const SubscriptionPanel: FC<SubscriptionPanelProps> = ({
  state,
  onOpenLogin,
  onSubmitKey,
  onLogout,
  onRefresh,
  loading,
}) => {
  const [keyInput, setKeyInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [keyError, setKeyError] = useState('')

  const handleSubmit = async () => {
    if (!keyInput.trim()) return
    setSubmitting(true)
    setKeyError('')
    const ok = await onSubmitKey(keyInput.trim())
    if (!ok) {
      setKeyError('Invalid key. Make sure you copied the full sessionKey value.')
    } else {
      setKeyInput('')
    }
    setSubmitting(false)
  }

  /* ─── Not Authenticated: Show onboarding card ─── */
  if (!state.isAuthenticated || (!state.usage && !state.lastError)) {
    return (
      <div style={styles.onboardingSection}>
        <div style={styles.onboarding}>
          <div style={styles.onboardingAccent} />
          <div style={styles.onboardingBody}>
            <div style={styles.onboardingTitle}>Connect Your Account</div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>1</span>
              <div style={styles.stepContent}>
                Open Claude in your browser and sign in
                <div style={{ marginTop: 8 }}>
                  <button
                    style={styles.openBtn}
                    onClick={onOpenLogin}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    Open claude.ai
                  </button>
                </div>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>2</span>
              <div style={styles.stepContent}>
                Press <span style={styles.code}>F12</span> to open DevTools, go to{' '}
                <span style={styles.code}>Application</span> &rarr;{' '}
                <span style={styles.code}>Cookies</span> &rarr;{' '}
                <span style={styles.code}>claude.ai</span>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNumber}>3</span>
              <div style={styles.stepContent}>
                Copy the <span style={styles.code}>sessionKey</span> value and paste below
              </div>
            </div>
            <div style={styles.pasteRow}>
              <input
                style={styles.input}
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setKeyError('') }}
                placeholder="sk-ant-sid..."
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 91, 240, 0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)' }}
              />
              <button
                style={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitting || !keyInput.trim()}
              >
                {submitting ? '...' : 'Connect'}
              </button>
            </div>
            {keyError && <div style={{ ...styles.error, margin: '8px 0 0' }}>{keyError}</div>}
          </div>
        </div>
      </div>
    )
  }

  /* ─── Authenticated: Rich card layout ─── */
  const { usage, extraUsage } = state
  const hasModelLimits = usage && (usage.sevenDayOpus || usage.sevenDaySonnet)

  return (
    <div style={styles.wrapper}>
      {/* Account Card */}
      {(state.displayName || state.subscriptionType) && (
        <div style={styles.accountSection}>
          <div style={styles.accountCard}>
            {/* Avatar */}
            <div style={styles.avatar}>
              {(state.displayName ?? '?').charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div style={styles.accountInfo}>
              {state.displayName && (
                <div style={styles.accountName}>{state.displayName}</div>
              )}
            </div>

            {/* Plan badge + disconnect */}
            <div style={styles.accountRight}>
              {state.subscriptionType && (
                <span style={styles.planBadge}>{state.subscriptionType}</span>
              )}
              <button
                style={styles.logoutBtn}
                onClick={onLogout}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state.lastError && (
        <div style={styles.error}>
          <span style={{ flex: 1 }}>{state.lastError}</span>
          {state.lastError.includes('expired') && (
            <button
              onClick={onOpenLogin}
              style={{
                background: 'none',
                border: '1px solid var(--rose)',
                color: 'var(--rose)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Re-connect
            </button>
          )}
        </div>
      )}

      {/* Main Limits */}
      {usage && (
        <div style={styles.limitsSection}>
          <div style={styles.sectionTitle}>Limits</div>
          <div style={styles.limitsList}>
            <UsageBar
              label="5-Hour Session"
              utilization={usage.fiveHour.utilization}
              resetsAt={usage.fiveHour.resetsAt}
            />
            <UsageBar
              label="Weekly (7-Day)"
              utilization={usage.sevenDay.utilization}
              resetsAt={usage.sevenDay.resetsAt}
            />
          </div>
        </div>
      )}

      {/* Per-Model Limits */}
      {hasModelLimits && (
        <div style={styles.modelSection}>
          <div style={styles.sectionTitle}>By Model</div>
          <div style={styles.modelList}>
            {usage.sevenDayOpus && (
              <UsageBar
                label="Opus"
                utilization={usage.sevenDayOpus.utilization}
                resetsAt={usage.sevenDayOpus.resetsAt}
                cardStyle={styles.modelCard}
                barHeight={6}
                labelSize="12px"
                pctSize="13px"
                resetStyle={styles.modelReset}
                dotColor="#8b5cf6"
              />
            )}
            {usage.sevenDaySonnet && (
              <UsageBar
                label="Sonnet"
                utilization={usage.sevenDaySonnet.utilization}
                resetsAt={usage.sevenDaySonnet.resetsAt}
                cardStyle={styles.modelCard}
                barHeight={6}
                labelSize="12px"
                pctSize="13px"
                resetStyle={styles.modelReset}
                dotColor="#3b82f6"
              />
            )}
          </div>
        </div>
      )}

      {/* Extra Usage */}
      {extraUsage?.isEnabled && (
        <div style={styles.extraSection}>
          <div style={styles.sectionTitle}>Extra Usage</div>
          <div style={styles.extraCard}>
            <div style={styles.extraHeader}>
              <span style={styles.extraLabel}>
                <span style={{ fontSize: '12px' }}>$</span>
                Spend
              </span>
              <span style={styles.extraAmount}>
                ${(extraUsage.usedCents / 100).toFixed(2)}
                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: '11px' }}>
                  {' '}/ ${(extraUsage.monthlyLimitCents / 100).toFixed(2)}
                </span>
              </span>
            </div>
            {extraUsage.monthlyLimitCents > 0 && (
              <div style={{ ...styles.barTrack, height: 6 }}>
                <div
                  style={{
                    ...styles.barFill,
                    height: 6,
                    width: `${Math.min(100, (extraUsage.usedCents / extraUsage.monthlyLimitCents) * 100)}%`,
                    background: getBarColor(
                      (extraUsage.usedCents / extraUsage.monthlyLimitCents) * 100
                    ),
                    boxShadow: `0 0 6px ${getBarGlow(
                      (extraUsage.usedCents / extraUsage.monthlyLimitCents) * 100
                    )}`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
