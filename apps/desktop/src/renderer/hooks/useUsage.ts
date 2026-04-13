import { useState, useEffect, useCallback } from 'react'
import type { UsageSummary } from '@claude-status/core'

export function useUsage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.getUsageSummary()
      setSummary(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = window.api.onUsageUpdate((data) => {
      setSummary(data)
    })
    return unsubscribe
  }, [refresh])

  return { summary, loading, error, refresh }
}
