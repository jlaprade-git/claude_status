import { useState, useEffect, useCallback } from 'react'
import type { ServiceHealth } from '@claude-status/core'

export function useStatus() {
  const [status, setStatus] = useState<ServiceHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.getCurrentStatus()
      setStatus(data)
    } catch {
      // Silent fail — status is supplementary
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = window.api.onStatusChange((data) => {
      setStatus(data)
    })
    return unsubscribe
  }, [refresh])

  return { status, loading, refresh }
}
