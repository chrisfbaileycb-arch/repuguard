import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { api } from '../api.js'
import { setToken, setUser } from '../auth.js'

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px',
  background: '#0D1B2A', border: '1px solid #1e3a52',
  borderRadius: '8px', color: '#F8FAFC', fontSize: '14px',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

export default function Login() {
  const navigate = useNavigate()

  // Sign-in state
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Forgot-password state
  const [forgotMode, setForgotMode]     = useState(false)
  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone]     = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email, password)
      const token = res.data?.token || res.token
      const user  = res.data?.user  || res.user
      if (token) {
        setToken(token)
        setUser(user)
        if (user?.role === 'admin') navigate('/admin')
        else navigate('/dashboard')
      } else {
        setError(res.error?.message || res.error || res.message || 'Invalid email or password.')
      }
    } catch (e) {
      // Demo mode fallback
      if (email === 'admin@repushield.com' && password === 'admin123') {
        setToken('demo_admin_token')
        setUser({ name: 'Admin User', email: 'admin@repushield.com', role: 'admin' })
        navigate('/admin')
      } else if (email && password.length >= 6) {
        setToken('demo_customer_token')
        setUser({ name: 'Demo Business', email, role: 'customer', plan: 'growth', businessName: 'Demo Business' })
        navigate('/dashboard')
      } else {
        setError('Invalid email or password. Try admin@repushield.com / admin123')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      await api.forgotPassword(forgotEmail)
    } catch (_) {
      // swallow — we always show the neutral message
    } finally {
      setForgotLoading(false)
      setForgotDone(true)
    }
  }

  // ── Forgot-password view ────────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div style={{
        background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 5%',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '300px',
          background: 'radial-gradient(ellipse, #00C9FF12 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: '36px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#F8FAFC' }}>RepuShield</span>
        </button>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: '420px',
          background: '#1B2D3E', border: '1px solid #1e3a52',
          borderRadius: '16px', padding: '36px 32px',
          position: 'relative', zIndex: 1,
        }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Reset your password</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
            Enter your email and we'll send a reset link if an account exists.
          </p>

          {forgotDone ? (
            <div style={{
              padding: '16px', borderRadius: '10px',
              background: '#10B98115', border: '1px solid #10B98140',
              color: '#6ee7b7', fontSize: '14px', lineHeight: '1.6',
            }}>
              If that account exists, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                  style={INPUT_STYLE}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading || !forgotEmail}
                style={{
                  width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
                  color: 'white', fontSize: '15px', fontWeight: 700,
                  cursor: forgotLoading || !forgotEmail ? 'not-allowed' : 'pointer',
                  opacity: forgotLoading || !forgotEmail ? 0.7 : 1,
                  boxShadow: '0 4px 16px #00C9FF30',
                }}>
                {forgotLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => { setForgotMode(false); setForgotDone(false); setForgotEmail('') }}
              style={{ background: 'none', border: 'none', color: '#00C9FF', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Sign-in view ────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 5%',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, #00C9FF12 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'none', border: 'none', cursor: 'pointer', marginBottom: '36px',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#F8FAFC' }}>RepuShield</span>
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#1B2D3E', border: '1px solid #1e3a52',
        borderRadius: '16px', padding: '36px 32px',
        position: 'relative', zIndex: 1,
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Welcome back</h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
          Sign in to your RepuShield account
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              style={INPUT_STYLE}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                style={{ ...INPUT_STYLE, paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
                  display: 'flex', alignItems: 'center',
                }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Forgot password link — right-aligned, below password field */}
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <ForgotLink onClick={() => setForgotMode(true)} />
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '8px',
              background: '#F43F5E15', border: '1px solid #F43F5E40',
              color: '#F43F5E', fontSize: '13px',
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '4px',
              boxShadow: '0 4px 16px #00C9FF30',
            }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#1e3a52' }} />
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#1e3a52' }} />
        </div>

        {/* Get Started button */}
        <button
          onClick={() => navigate('/pricing')}
          style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white', fontSize: '15px', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px #10B98130',
          }}>
          Create Free Account →
        </button>
      </div>

      {/* Demo note */}
      <div style={{
        marginTop: '20px', padding: '14px 20px',
        background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '10px',
        maxWidth: '420px', width: '100%',
      }}>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0, textAlign: 'center' }}>
          <strong style={{ color: '#64748B' }}>Demo admin:</strong>{' '}
          <span style={{ fontFamily: 'monospace', color: '#00C9FF', fontSize: '11px' }}>admin@repushield.com</span>
          {' / '}
          <span style={{ fontFamily: 'monospace', color: '#00C9FF', fontSize: '11px' }}>admin123</span>
        </p>
        <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0', textAlign: 'center' }}>
          Any other email + 6+ char password → customer dashboard
        </p>
      </div>
    </div>
  )
}

// Small helper — keeps hover logic out of inline styles
function ForgotLink({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', padding: 0,
        fontSize: '12px',
        color: hovered ? '#94a3b8' : '#475569',
        cursor: 'pointer',
        transition: 'color 0.15s',
      }}>
      Forgot your password?
    </button>
  )
}
