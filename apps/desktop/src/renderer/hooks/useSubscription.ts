import { useState, useEffect, useCallback } from 'react'
import type { SubscriptionState } from '@claude-status/core'

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    organization: null,
    usage: null,
    extraUsage: null,
    isAuthenticated: false,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.subscriptionRefresh()
      if (data) setState(data)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  const openLoginPage = useCallback(() => {
    window.api.subscriptionOpenLogin()
  }, [])

  const submitKey = useCallback(async (key: string) => {
    setLoading(true)
    const success = await window.api.subscriptionSubmitKey(key)
    if (success) {
      const data = await window.api.getSubscriptionState()
      setState(data)
    } else {
      const data = await window.api.getSubscriptionState()
      setState(data)
    }
    setLoading(false)
    return success
  }, [])

  const logout = useCallback(async () => {
    await window.api.subscriptionLogout()
    setState({
      organization: null,
      usage: null,
      extraUsage: null,
      isAuthenticated: false,
    })
  }, [])

  useEffect(() => {
    window.api.getSubscriptionState().then((data) => {
      setState(data)
      setLoading(false)
    })
    const unsubscribe = window.api.onSubscriptionChange((data) => {
      setState(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { state, loading, openLoginPage, submitKey, logout, refresh }
}
