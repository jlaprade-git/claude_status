import type { FC } from 'react'

interface HeaderProps {
  onSettingsClick: () => void
  onRefresh?: () => void
  loading?: boolean
  lastActivity?: string
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    height: 36,
    minHeight: 36,
    borderBottom: '1px solid var(--border-subtle)',
    background: 'transparent',
    WebkitAppRegion: 'drag',
    flexShrink: 0,
  } as React.CSSProperties,
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  logo: {
    width: 18,
    height: 18,
    borderRadius: 4,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties,
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  } as React.CSSProperties,
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  } as React.CSSProperties,
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '5px 6px',
    borderRadius: 'var(--radius-xs)',
    fontSize: '13px',
    WebkitAppRegion: 'no-drag',
    lineHeight: 1,
    transition: 'all 0.12s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
}

export const Header: FC<HeaderProps> = ({ onSettingsClick, onRefresh, loading }) => {
  const btnHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    e.currentTarget.style.color = enter ? 'var(--text-primary)' : 'var(--text-tertiary)'
    e.currentTarget.style.background = enter ? 'rgba(255,255,255,0.06)' : 'none'
  }

  return (
    <div style={styles.header}>
      <div style={styles.left}>
        <div style={styles.logo}>C</div>
        <span style={styles.title}>Claude Status</span>
      </div>
      <div style={styles.right}>
        {onRefresh && (
          <button
            style={{
              ...styles.iconBtn,
              opacity: loading ? 0.4 : 1,
              animation: loading ? 'pulse-glow 1s ease-in-out infinite' : 'none',
            }}
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            onMouseEnter={(e) => btnHover(e, true)}
            onMouseLeave={(e) => btnHover(e, false)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        )}
        <button
          style={styles.iconBtn}
          onClick={onSettingsClick}
          title="Settings"
          onMouseEnter={(e) => btnHover(e, true)}
          onMouseLeave={(e) => btnHover(e, false)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
