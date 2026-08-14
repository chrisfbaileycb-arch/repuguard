import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Check, Eye, EyeOff, ChevronRight, AlertCircle } from 'lucide-react'
import { api } from '../api.js'
import { setToken, setUser } from '../auth.js'

const plans = [
  { id: 'basic',  name: 'Basic',  price: 69,  features: ['Up to 50 reviews/mo', 'Google + Yelp monitoring', 'Auto-responses', 'Email notifications'] },
  { id: 'growth', name: 'Growth', price: 109, popular: true, features: ['Up to 150 reviews/mo', 'Everything in Basic', 'Compliance scanning', 'Violation flagging', 'Priority escalation'] },
  { id: 'pro',    name: 'Pro',    price: 179, features: ['Unlimited reviews', 'Everything in Growth', 'Dedicated account manager', 'Custom response templates', 'Monthly strategy call'] },
]

const businessTypes = ['Restaurant', 'Dental', 'Auto Shop', 'Salon', 'Medical', 'Retail', 'Other']

const INPUT_STYLE = {
  width: '100%', padding: '10px 14px',
  background: '#0D1B2A', border: '1px solid #1e3a52',
  borderRadius: '8px', color: '#F8FAFC', fontSize: '14px',
  fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'growth')
  const [form, setForm] = useState({
    businessName: '', contactName: '', email: '', password: '', phone: '', businessType: 'Restaurant',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const plan = plans.find(p => p.id === selectedPlan) || plans[1]

  function updateForm(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const [loadingMessage, setLoadingMessage] = useState('')

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the 6-month commitment to continue.'); return }
    setLoading(true)
    setLoadingMessage('Setting up your account...')
    setError('')
    try {
      const res = await api.signup({
        ...form,
        plan: selectedPlan,
        planPrice: plan.price,
      })
      const token = res.data?.token || res.token
      const user  = res.data?.user  || res.user
      if (token) {
        setToken(token)
        setUser(user)
        // Now create a Stripe Checkout session
        // Admin accounts bypass Stripe entirely
        if (user?.role === 'admin') {
          navigate('/admin')
          return
        }
        setLoadingMessage('Redirecting to payment...')
        try {
          const checkoutRes = await api.createCheckoutSession(selectedPlan)
          if (checkoutRes.data?.adminBypass) {
            navigate('/admin')
          } else if (checkoutRes.success && checkoutRes.data?.url) {
            window.location.href = checkoutRes.data.url
          } else {
            navigate('/dashboard?payment=skipped')
          }
        } catch {
          navigate('/dashboard?payment=skipped')
        }
      } else {
        setError(res.error?.message || res.error || res.message || 'Signup failed.')
        setLoading(false)
        setLoadingMessage('')
      }
    } catch (e) {
      // Demo mode: simulate success, attempt checkout
      setToken('demo_customer_token')
      setUser({ name: form.contactName || form.businessName, email: form.email, role: 'customer', plan: selectedPlan })
      setLoadingMessage('Redirecting to payment...')
      try {
        const checkoutRes = await api.createCheckoutSession(selectedPlan)
        if (checkoutRes.success && checkoutRes.data?.url) {
          window.location.href = checkoutRes.data.url
        } else {
          navigate('/dashboard?payment=skipped')
        }
      } catch {
        navigate('/dashboard?payment=skipped')
      }
    }
  }

  const steps = ['Choose Plan', 'Business Info', 'Confirm']

  return (
    <div style={{ background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 5%' }}>

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '32px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={17} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '17px', color: '#F8FAFC' }}>RepuShield</span>
      </button>

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '40px', width: '100%', maxWidth: '520px' }}>
        {steps.map((s, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: done ? '#10B981' : active ? '#00C9FF' : '#1B2D3E',
                  border: done ? 'none' : active ? '2px solid #00C9FF' : '2px solid #1e3a52',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || active ? 'white' : '#475569', fontWeight: 700, fontSize: '13px',
                }}>
                  {done ? <Check size={14} /> : num}
                </div>
                <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, color: active ? '#00C9FF' : done ? '#10B981' : '#475569', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: done ? '#10B981' : '#1e3a52', margin: '0 8px', marginBottom: '22px', transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: step === 1 ? '900px' : '520px', background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '16px', padding: '32px' }}>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>Choose Your Plan</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>All plans include a 6-month minimum commitment.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {plans.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
                  border: selectedPlan === p.id ? '2px solid #00C9FF' : '1px solid #1e3a52',
                  borderRadius: '12px', padding: '20px', cursor: 'pointer',
                  background: selectedPlan === p.id ? '#00C9FF10' : '#0D1B2A',
                  position: 'relative', transition: 'all 0.15s',
                }}>
                  {p.popular && (
                    <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#00C9FF', color: '#0D1B2A', fontSize: '10px', fontWeight: 700, padding: '2px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</h3>
                    {selectedPlan === p.id && (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#00C9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color="white" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: selectedPlan === p.id ? '#00C9FF' : '#F8FAFC' }}>${p.price}</span>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>/mo</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                        <Check size={11} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              Continue with {plan.name} — ${plan.price}/mo →
            </button>
          </div>
        )}

        {/* STEP 2: Business Info */}
        {step === 2 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>Business Information</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Tell us about your business and create your account.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Name *</label>
                <input value={form.businessName} onChange={e => updateForm('businessName', e.target.value)} placeholder="e.g. Downtown Dental" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Name *</label>
                <input value={form.contactName} onChange={e => updateForm('contactName', e.target.value)} placeholder="e.g. Sarah Johnson" style={INPUT_STYLE} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="sarah@downtowndental.com" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="(555) 000-0000" style={INPUT_STYLE} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Type *</label>
                <select value={form.businessType} onChange={e => updateForm('businessType', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none' }}>
                  {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password * (min 8 chars)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    placeholder="Create a strong password"
                    style={{ ...INPUT_STYLE, paddingRight: '42px' }}
                  />
                  <button onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && form.password.length < 8 && (
                  <p style={{ color: '#F43F5E', fontSize: '11px', marginTop: '4px' }}>Password must be at least 8 characters</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
              <button onClick={() => setStep(1)} style={{ flex: '0 0 auto', padding: '12px 20px', borderRadius: '10px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!form.businessName || !form.contactName || !form.email || !form.password) { setError('Please fill in all required fields.'); return }
                  if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
                  setError(''); setStep(3)
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                Continue →
              </button>
            </div>
            {error && <p style={{ color: '#F43F5E', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertCircle size={13} />{error}</p>}
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>Review & Complete</h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Confirm your plan and commitment before signing up.</p>

            {/* Order Summary */}
            <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Your Plan</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{plan.name}</span>
                <span style={{ fontWeight: 800, fontSize: '20px', color: '#00C9FF' }}>${plan.price}<span style={{ fontSize: '13px', fontWeight: 400, color: '#64748B' }}>/mo</span></span>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>6-month minimum · Total commitment: ${plan.price * 6}</p>
            </div>

            {/* Business Summary */}
            <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Account Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[['Business', form.businessName], ['Name', form.contactName], ['Email', form.email], ['Type', form.businessType]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>{l}</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commitment Agreement */}
            <div style={{
              background: '#F59E0B10', border: '1px solid #F59E0B30',
              borderRadius: '10px', padding: '16px', marginBottom: '20px',
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#00C9FF', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                  I understand and agree to the <strong style={{ color: '#F8FAFC' }}>6-month minimum commitment</strong>. I agree to pay ${plan.price}/month for 6 months (${plan.price * 6} total). I understand that reputation improvement takes time and that this commitment is required to deliver meaningful results.
                </span>
              </label>
            </div>

            {error && <p style={{ color: '#F43F5E', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertCircle size={13} />{error}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{ flex: '0 0 auto', padding: '12px 20px', borderRadius: '10px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !agreed}
                style={{
                  flex: 1, padding: '13px', borderRadius: '10px', border: 'none',
                  background: agreed ? 'linear-gradient(135deg, #00C9FF, #0080a0)' : '#1e3a52',
                  color: agreed ? 'white' : '#475569', fontSize: '15px', fontWeight: 700,
                  cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {loadingMessage || 'Setting up your account...'}
                  </>
                ) : 'Continue to Payment →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: '#475569', fontSize: '13px', marginTop: '20px' }}>
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#00C9FF', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
          Sign in
        </button>
      </p>
    </div>
  )
}
