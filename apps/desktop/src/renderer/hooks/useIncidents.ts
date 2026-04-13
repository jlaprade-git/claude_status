import { useState, useEffect, useCallback } from 'react'
import type { Incident } from '@claude-status/core'

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.getActiveIncidents()
      setIncidents(data)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = window.api.onIncidentUpdate((incident) => {
      setIncidents((prev) => {
        const idx = prev.findIndex((i) => i.id === incident.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = incident
          return updated
        }
        return [incident, ...prev]
      })
    })
    return unsubscribe
  }, [refresh])

  return { incidents, loading, refresh }
}
