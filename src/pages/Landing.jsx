import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Check, ChevronRight, Star, ArrowRight, Play } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 69,
    features: ['Up to 50 reviews/mo', 'Google + Yelp monitoring', 'Auto-responses', 'Email notifications'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 109,
    popular: true,
    features: ['Up to 150 reviews/mo', 'Everything in Basic', 'Compliance scanning', 'Violation flagging', 'Priority escalation'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 179,
    features: ['Unlimited reviews', 'Everything in Growth', 'Dedicated account manager', 'Custom response templates', 'Monthly strategy call'],
  },
]

const businessTypes = [
  { emoji: '🦷', label: 'Dental Practices' },
  { emoji: '🍽️', label: 'Restaurants' },
  { emoji: '🔧', label: 'Auto Shops' },
  { emoji: '💇', label: 'Salons' },
  { emoji: '🏥', label: 'Medical Offices' },
]

const painPoints = [
  {
    icon: '⏰',
    title: "You don't have time to monitor every platform",
    desc: 'Between running your business, managing staff, and serving customers, who has time to check Google, Yelp, and Facebook every day? Things slip through.',
  },
  {
    icon: '🚫',
    title: 'Fake and guideline-violating reviews stay up for years',
    desc: 'Competitors, bitter ex-employees, and confused reviewers can leave reviews that violate platform guidelines — but they stay up until someone fights them.',
  },
  {
    icon: '📉',
    title: 'Slow responses signal you don\'t care',
    desc: 'Studies show 89% of consumers read business responses to reviews. If you\'re not responding — or responding days later — you\'re losing customers to businesses that are.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Connect your Google & Yelp accounts',
    desc: 'Takes about 2 minutes. We use read-only access to monitor your reviews in real time.',
  },
  {
    num: '02',
    title: 'We scan, flag violations, and auto-respond',
    desc: 'Every new 4+ star review gets a personalized, professional response within the hour. Suspicious reviews get flagged for removal.',
  },
  {
    num: '03',
    title: 'You get notified when you need to act',
    desc: 'Anything we can\'t handle automatically — a 1-star review that needs your personal touch — goes straight to your phone.',
  },
]

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

export default function Landing() {
  const navigate = useNavigate()
  const [heroRef, heroIn] = useInView(0)
  const [problemRef, problemIn] = useInView()
  const [stepsRef, stepsIn] = useInView()
  const [whyRef, whyIn] = useInView()
  const [pricingRef, pricingIn] = useInView()

  return (
    <div style={{ background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 5%', borderBottom: '1px solid #1e3a52',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={17} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px' }}>RepuShield</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => navigate('/pricing')} style={{
            background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', padding: '8px 16px', borderRadius: '8px',
          }}>
            Pricing
          </button>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: '1px solid #1e3a52', color: '#94a3b8', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', padding: '8px 16px', borderRadius: '8px',
          }}>
            Sign In
          </button>
          <button onClick={() => navigate('/pricing')} style={{
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)', border: 'none',
            color: 'white', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', padding: '8px 18px', borderRadius: '8px',
          }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(60px, 10vw, 100px) 5% clamp(60px, 8vw, 80px)',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-80px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, #00C9FF25 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40px', right: '60px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, #00C9FF15 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px', borderRadius: '999px',
            background: '#00C9FF15', border: '1px solid #00C9FF30',
            marginBottom: '24px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#00C9FF' }}>
              Now monitoring 1,200+ local businesses
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '20px',
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            Your Reputation Is Your Business.{' '}
            <span style={{ color: '#00C9FF' }}>We Protect It.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: '#94a3b8',
            lineHeight: '1.7',
            marginBottom: '36px',
            maxWidth: '560px',
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s ease 0.1s',
          }}>
            RepuShield automatically responds to great reviews, flags fake ones, and routes bad ones to you — before they cost you customers.
          </p>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            <button onClick={() => navigate('/pricing')} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
              color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px #00C9FF40',
            }}>
              See Plans <ArrowRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '10px',
                border: '1px solid #1e3a52',
                background: 'transparent',
                color: '#94a3b8', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              }}>
              <Play size={14} fill="#94a3b8" /> Watch How It Works
            </button>
          </div>

          {/* Social proof micro */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginTop: '40px',
            opacity: heroIn ? 1 : 0, transition: 'all 0.6s ease 0.3s',
          }}>
            <div style={{ display: 'flex' }}>
              {['🦷','🍽️','🔧','💇','🏥'].map((e, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#1B2D3E', border: '2px solid #0D1B2A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', marginLeft: i > 0 ? '-8px' : 0,
                }}>{e}</div>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Restaurants, dentists, salons, auto shops & more
            </span>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{
        padding: '24px 5%',
        borderTop: '1px solid #1e3a52',
        borderBottom: '1px solid #1e3a52',
        background: '#0D1B2A',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Trusted by local businesses
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
            {businessTypes.map(b => (
              <div key={b.label} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '999px',
                background: '#1B2D3E', border: '1px solid #1e3a52',
                fontSize: '13px', fontWeight: 500, color: '#94a3b8',
              }}>
                <span style={{ fontSize: '16px' }}>{b.emoji}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section ref={problemRef} style={{ padding: 'clamp(60px, 8vw, 80px) 5%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginBottom: '12px',
              opacity: problemIn ? 1 : 0, transform: problemIn ? 'none' : 'translateY(16px)',
              transition: 'all 0.5s ease',
            }}>
              One bad review can cost you{' '}
              <span style={{ color: '#F43F5E' }}>30 customers.</span>
            </h2>
            <p style={{ color: '#64748B', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
              And most business owners don't find out until the damage is done.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {painPoints.map((p, i) => (
              <div key={i} style={{
                background: '#1B2D3E',
                border: '1px solid #1e3a52',
                borderRadius: '14px',
                padding: '28px',
                opacity: problemIn ? 1 : 0,
                transform: problemIn ? 'none' : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.1}s`,
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{p.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: '#F8FAFC' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.65' }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={stepsRef} style={{
        padding: 'clamp(60px, 8vw, 80px) 5%',
        background: '#0a1520',
        borderTop: '1px solid #1e3a52',
        borderBottom: '1px solid #1e3a52',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginBottom: '12px' }}>
              How RepuShield Works
            </h2>
            <p style={{ color: '#64748B', fontSize: '16px' }}>
              Set it up once. We handle it from there.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                position: 'relative',
                background: '#1B2D3E',
                border: '1px solid #1e3a52',
                borderRadius: '14px',
                padding: '32px 24px',
                opacity: stepsIn ? 1 : 0,
                transform: stepsIn ? 'none' : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.12}s`,
              }}>
                <div style={{
                  position: 'absolute', top: '-1px', left: '24px',
                  background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
                  color: 'white', fontWeight: 800, fontSize: '11px',
                  padding: '3px 10px', borderRadius: '0 0 6px 6px',
                  letterSpacing: '0.06em',
                }}>
                  STEP {s.num}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', marginTop: '12px', color: '#F8FAFC' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.65' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY 6 MONTHS */}
      <section ref={whyRef} style={{ padding: 'clamp(60px, 8vw, 80px) 5%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginBottom: '20px',
            opacity: whyIn ? 1 : 0, transform: whyIn ? 'none' : 'translateY(16px)',
            transition: 'all 0.5s ease',
          }}>
            Why We Require 6 Months
          </h2>
          <p style={{
            fontSize: '16px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '28px',
            opacity: whyIn ? 1 : 0, transition: 'all 0.5s ease 0.1s',
          }}>
            Reputation repair takes time. We scan your entire review history — some businesses have 5–10 years of reviews to comb through. We flag guideline violations, submit removal requests, and build your response record. That doesn't happen in 30 days. The 6-month commitment means we can actually finish the job.
          </p>

          {/* Callout */}
          <div style={{
            background: '#1B2D3E',
            border: '1px solid #00C9FF30',
            borderLeft: '4px solid #00C9FF',
            borderRadius: '12px',
            padding: '24px 28px',
            textAlign: 'left',
            opacity: whyIn ? 1 : 0,
            transition: 'all 0.5s ease 0.2s',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#00C9FF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Real Example
            </p>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.8', margin: 0 }}>
              A restaurant owner had a bad review from a private event outside normal business hours. The reviewer couldn't enter — not the restaurant's fault. That review violated Google's guidelines. <strong style={{ color: '#F8FAFC' }}>We got it removed.</strong> That takes time to identify and process.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section ref={pricingRef} style={{
        padding: 'clamp(60px, 8vw, 80px) 5%',
        background: '#0a1520',
        borderTop: '1px solid #1e3a52',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginBottom: '12px' }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ color: '#64748B', fontSize: '16px' }}>
              All plans include a 6-month commitment. No surprises.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {plans.map((plan, i) => (
              <div key={plan.id} style={{
                background: plan.popular ? '#1B2D3E' : '#0D1B2A',
                border: plan.popular ? '2px solid #00C9FF' : '1px solid #1e3a52',
                borderRadius: '14px',
                padding: '28px',
                position: 'relative',
                opacity: pricingIn ? 1 : 0,
                transform: pricingIn ? (plan.popular ? 'scale(1.02)' : 'none') : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.1}s`,
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: '#00C9FF', color: '#0D1B2A',
                    fontSize: '11px', fontWeight: 700, padding: '3px 14px',
                    borderRadius: '999px', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#F8FAFC' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: plan.popular ? '#00C9FF' : '#F8FAFC' }}>
                      ${plan.price}
                    </span>
                    <span style={{ color: '#64748B', fontSize: '14px' }}>/mo</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    billed monthly · 6-month minimum
                  </p>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                      <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(`/signup?plan=${plan.id}`)}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '8px',
                    background: plan.popular ? 'linear-gradient(135deg, #00C9FF, #0080a0)' : '#1B2D3E',
                    color: plan.popular ? 'white' : '#00C9FF',
                    border: plan.popular ? '1px solid transparent' : '1px solid #00C9FF40',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '32px 5%',
        borderTop: '1px solid #1e3a52',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between',
        gap: '12px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#00C9FF" />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>RepuShield</span>
          <span style={{ color: '#475569', fontSize: '13px' }}>© 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'Terms'].map(l => (
            <a key={l} href="#" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
