import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 69,
    features: [
      'Up to 50 reviews/mo',
      'Google + Yelp monitoring',
      'Auto-responses',
      'Email notifications',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 109,
    popular: true,
    features: [
      'Up to 150 reviews/mo',
      'Everything in Basic',
      'Compliance scanning',
      'Violation flagging',
      'Priority escalation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 179,
    features: [
      'Unlimited reviews',
      'Everything in Growth',
      'Dedicated account manager',
      'Custom response templates',
      'Monthly strategy call',
    ],
  },
]

const faqs = [
  {
    q: 'Why 6 months?',
    a: 'Reputation repair takes time. We scan your entire review history, flag guideline violations, submit removal requests, and build your response record. Some businesses have years of reviews. Results compound — the 6-month commitment means we can actually complete the job rather than making a dent and stopping.',
  },
  {
    q: 'Can I upgrade my plan?',
    a: 'Yes. You can upgrade to a higher tier at any time and the difference is prorated. You cannot downgrade during your 6-month term, but you can switch to a lower plan when you renew.',
  },
  {
    q: 'What platforms do you monitor?',
    a: 'All plans include Google and Yelp monitoring. We\'re actively building integrations for Facebook Reviews, TripAdvisor, and Healthgrades. Those will roll out to all active members at no extra charge.',
  },
  {
    q: 'What happens with fake reviews?',
    a: 'We identify reviews that violate Google\'s and Yelp\'s content policies — fake reviews, reviews from competitors, reviews about the wrong business, reviews that violate personal experience policies. We flag them and submit formal removal requests on your behalf. Removal isn\'t guaranteed (it\'s up to the platform) but we track every request and follow up.',
  },
]

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid #1e3a52',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', background: open ? '#1B2D3E' : 'transparent',
          border: 'none', color: '#F8FAFC', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer', gap: '12px',
        }}>
        {q}
        {open ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', background: '#1B2D3E' }}>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.7', margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  return (
    <div style={{ background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 5%', borderBottom: '1px solid #1e3a52',
        background: '#0D1B2A',
      }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', color: '#F8FAFC' }}>RepuShield</span>
        </button>
        <button onClick={() => navigate('/login')} style={{
          border: '1px solid #1e3a52', background: 'none', color: '#94a3b8',
          fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
        }}>
          Sign In
        </button>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: 'clamp(48px, 7vw, 72px) 5% 48px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: '14px' }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: '17px', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
          All plans include Google + Yelp monitoring, auto-responses, and a 6-month commitment.
        </p>
      </div>

      {/* PLAN CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 5% 80px',
      }}>
        {plans.map((plan, i) => (
          <div key={plan.id} style={{
            background: plan.popular ? '#1B2D3E' : '#0D1B2A',
            border: plan.popular ? '2px solid #00C9FF' : '1px solid #1e3a52',
            borderRadius: '16px',
            padding: '32px',
            position: 'relative',
            transform: plan.popular ? 'scale(1.03)' : 'none',
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: '#00C9FF', color: '#0D1B2A', fontSize: '11px', fontWeight: 700,
                padding: '4px 16px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.06em',
              }}>
                MOST POPULAR
              </div>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{plan.name}</h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: plan.popular ? '#00C9FF' : '#F8FAFC' }}>
                ${plan.price}
              </span>
              <span style={{ color: '#64748B', fontSize: '15px' }}>/month</span>
            </div>
            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '24px' }}>
              billed monthly · 6-month minimum commitment
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                  <Check size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(`/signup?plan=${plan.id}`)}
              style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                background: plan.popular ? 'linear-gradient(135deg, #00C9FF, #0080a0)' : 'transparent',
                color: plan.popular ? 'white' : '#00C9FF',
                border: plan.popular ? 'none' : '1px solid #00C9FF50',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}>
              Get Started →
            </button>
          </div>
        ))}
      </div>

      {/* ALL PLANS INCLUDE */}
      <div style={{
        maxWidth: '700px', margin: '0 auto', padding: '0 5% 80px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          All Plans Include
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          {['Automated review responses', 'Platform violation flagging', 'Email notifications', 'Monthly reporting', 'Secure dashboard access', '6-month commitment'].map(f => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '999px',
              background: '#1B2D3E', border: '1px solid #1e3a52',
              fontSize: '13px', color: '#94a3b8',
            }}>
              <Check size={12} color="#10B981" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 5% 80px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, i) => <FAQ key={i} {...faq} />)}
        </div>
      </div>

      {/* CTA STRIP */}
      <div style={{
        background: 'linear-gradient(135deg, #00C9FF15, transparent)',
        borderTop: '1px solid #00C9FF20', borderBottom: '1px solid #00C9FF20',
        padding: '40px 5%', textAlign: 'center', marginBottom: '0',
      }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>
          Ready to protect your reputation?
        </h3>
        <p style={{ color: '#64748B', marginBottom: '20px', fontSize: '15px' }}>
          Start with the plan that fits your business.
        </p>
        <button onClick={() => navigate('/signup')} style={{
          background: 'linear-gradient(135deg, #00C9FF, #0080a0)', border: 'none',
          color: 'white', fontSize: '15px', fontWeight: 700, padding: '13px 32px',
          borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 20px #00C9FF30',
        }}>
          Get Started Today
        </button>
      </div>

      <footer style={{ padding: '24px 5%', textAlign: 'center' }}>
        <span style={{ color: '#475569', fontSize: '13px' }}>RepuShield © 2026 · </span>
        <a href="#" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none' }}>Privacy</a>
        <span style={{ color: '#475569', fontSize: '13px' }}> · </span>
        <a href="#" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none' }}>Terms</a>
      </footer>
    </div>
  )
}
