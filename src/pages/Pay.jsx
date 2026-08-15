import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, CreditCard, AlertCircle } from 'lucide-react'
import { api } from '../api.js'
import { getUser, removeToken } from '../auth.js'
import { PLAN_PRICES, PLAN_NAMES } from '../constants/plans.js'

export default function Pay() {
  const navigate = useNavigate()
  const user = getUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoverPay, setHoverPay] = useState(false)

  // Guard: no user → send to login (hooks must all be called before any early return)
  React.useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  const planPrice = PLAN_PRICES[user?.plan] || 69
  const planName = PLAN_NAMES[user?.plan] || 'Basic'

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await api.createCheckoutSession(user?.plan || 'basic')
      if (res.data?.url) {
        window.location.href = res.data.url
      } else {
        setError('Payment setup failed. Please try again or contact support@repushield.com')
        setLoading(false)
      }
    } catch {
      setError('Unable to connect to payment server. Please try again or contact support@repushield.com')
      setLoading(false)
    }
  }

  function handleSignOut() {
    removeToken()
    navigate('/login')
  }

  return (
    <div style={{
      background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 5%', fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, #00C9FF12 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '18px' }}>RepuShield</span>
      </div>

      <style>{`@keyframes paySpinner { to { transform: rotate(360deg); } }`}</style>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '440px', background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '16px', padding: '36px 32px', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#00C9FF15', border: '1px solid #00C9FF30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={22} color="#00C9FF" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Complete Your Payment</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>One step left to activate your account</p>
          </div>
        </div>

        {/* Plan Summary */}
        <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700 }}>{planName} Plan</span>
            <span style={{ fontWeight: 800, color: '#00C9FF', fontSize: '18px' }}>${planPrice}<span style={{ fontSize: '12px', fontWeight: 400, color: '#64748B' }}>/mo</span></span>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>6-month minimum · ${planPrice * 6} total commitment</p>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '24px' }}>
          Your account has been created. Complete your payment to activate reputation monitoring, auto-responses, and compliance scanning.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: '#F43F5E15', border: '1px solid #F43F5E40', color: '#F43F5E', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={14} />{error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          onMouseEnter={() => setHoverPay(true)}
          onMouseLeave={() => setHoverPay(false)}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
            background: loading ? '#1e3a52' : 'linear-gradient(135deg, #00C9FF, #0080a0)',
            color: loading ? '#475569' : 'white', fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : hoverPay ? '0 6px 28px #00C9FF55' : '0 4px 16px #00C9FF30',
            transition: 'box-shadow 0.25s, transform 0.15s',
            transform: !loading && hoverPay ? 'translateY(-1px)' : 'none',
            marginBottom: '12px'
          }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'paySpinner 0.7s linear infinite' }} />
              Redirecting to secure Stripe portal...
            </span>
          ) : `Pay $${planPrice}/mo — Activate Now →`}
        </button>

        <button
          onClick={handleSignOut}
          style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #1e3a52', background: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
