import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getUser, setUser } from '../auth.js'
import { api } from '../api.js'

export default function ProtectedRoute({ children, requireActive = true }) {
  const user = getUser()
  const locallyActive = user?.role === 'admin' || user?.stripeStatus === 'active'

  // Stored user state goes stale the moment Stripe redirects back from Checkout —
  // the webhook activates the account server-side, but localStorage still says
  // 'inactive'. Re-verify with the server before sending anyone back to /pay.
  const needsCheck = isAuthenticated() && requireActive && !locallyActive
  const [status, setStatus] = useState(needsCheck ? 'checking' : 'resolved')

  useEffect(() => {
    if (!needsCheck) return
    let cancelled = false
    api.getSubscriptionStatus()
      .then(res => {
        if (cancelled) return
        if (res?.success && res.data?.status === 'active') {
          setUser({ ...user, stripeStatus: 'active', plan: res.data.plan || user?.plan })
          setStatus('active')
        } else {
          setStatus('inactive')
        }
      })
      .catch(() => { if (!cancelled) setStatus('inactive') })
    return () => { cancelled = true }
  }, [needsCheck])

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  // Admins always pass — no subscription check
  if (user?.role === 'admin') return children

  if (!requireActive || locallyActive) return children

  if (status === 'checking') {
    return (
      <div style={{
        background: '#0D1B2A', minHeight: '100vh', color: '#64748B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif', fontSize: '14px'
      }}>
        Confirming your subscription…
      </div>
    )
  }

  if (status === 'active') return children

  return <Navigate to="/pay" replace />
}
