import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowRight, Lock, Edit2, Check } from 'lucide-react'

// ─── Inline styles & keyframes injected once ────────────────────────────────
const DEMO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .demo-root * { box-sizing: border-box; }
  .demo-root { font-family: 'Inter', system-ui, sans-serif; }

  @keyframes demoFadeSlideIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes demoFadeSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-40px); }
  }
  @keyframes demoCountUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes demoCardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes demoCheckCircle {
    from { stroke-dashoffset: 166; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes demoCheckMark {
    from { stroke-dashoffset: 48; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes demoSpinSmall {
    to { transform: rotate(360deg); }
  }
  @keyframes demoPulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 #00C9FF40; }
    50%       { box-shadow: 0 0 0 8px #00C9FF00; }
  }
  @keyframes demoToastIn {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes demoGradBorder {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .demo-step-enter { animation: demoFadeSlideIn 0.35s ease forwards; }
  .demo-step-exit  { animation: demoFadeSlideOut 0.25s ease forwards; pointer-events: none; }

  .demo-card-1 { animation: demoCardIn 0.4s ease 0.3s both; }
  .demo-card-2 { animation: demoCardIn 0.4s ease 0.6s both; }
  .demo-card-3 { animation: demoCardIn 0.4s ease 0.9s both; }

  .demo-hero-cta {
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.25s, transform 0.15s;
  }
  .demo-hero-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px #00C9FF50 !important;
  }
  .demo-hero-cta::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 12px;
    background: linear-gradient(90deg, #00C9FF, #10B981, #00C9FF);
    background-size: 200% 200%;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.25s;
    animation: demoGradBorder 3s linear infinite;
  }
  .demo-hero-cta:hover::before { opacity: 1; }

  .demo-tone-card {
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    cursor: pointer;
  }
  .demo-tone-card:hover { border-color: #00C9FF60 !important; }

  .demo-freq-pill {
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    cursor: pointer;
  }
  .demo-freq-pill:hover { border-color: #00C9FF80 !important; }

  .demo-toggle-track {
    transition: background 0.25s;
    cursor: pointer;
    user-select: none;
  }
  .demo-toggle-thumb {
    transition: transform 0.25s;
  }

  .demo-step-dot {
    transition: background 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .demo-step-dot:hover { transform: scale(1.15); }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useAnimatedCount(target, active, duration = 1200) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!active) { setVal(0); return }
    const start = performance.now()
    function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [active, target, duration])
  return val
}

// ─── Animated checkmark SVG ───────────────────────────────────────────────────
function AnimatedCheck() {
  return (
    <svg viewBox="0 0 66 66" width="100" height="100" style={{ display: 'block' }}>
      <circle
        cx="33" cy="33" r="27"
        fill="none" stroke="#10B981" strokeWidth="3"
        strokeDasharray="166" strokeDashoffset="0"
        style={{ animation: 'demoCheckCircle 0.7s ease forwards' }}
      />
      <path
        d="M21 33 l8 8 l16-16"
        fill="none" stroke="#10B981" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="48" strokeDashoffset="0"
        style={{ animation: 'demoCheckMark 0.45s ease 0.5s both' }}
      />
    </svg>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: '#10B98120', border: '1px solid #10B98150', borderRadius: '10px',
      padding: '10px 20px', color: '#10B981', fontSize: '14px', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: '8px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s',
      pointerEvents: 'none',
      zIndex: 200,
      animation: visible ? 'demoToastIn 0.35s ease' : 'none',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: '16px' }}>✓</span> {msg}
    </div>
  )
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <div
      className="demo-toggle-track"
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: on ? '#10B981' : '#1e3a52',
        position: 'relative', flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: on ? '0 0 8px #10B98160' : 'none',
      }}
    >
      <div
        className="demo-toggle-thumb"
        style={{
          position: 'absolute', top: '3px', left: '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'white',
          transform: on ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total, onJump }) {
  const labels = ['Connect', 'Brand Voice', 'Notifications', 'Activate']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: '100%', maxWidth: '520px', margin: '0 auto 36px' }}>
      {labels.map((label, i) => {
        const num = i + 1
        const done = step > num
        const active = step === num
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div
                className="demo-step-dot"
                onClick={() => onJump(num)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: done ? '#10B981' : active ? '#00C9FF' : '#1B2D3E',
                  border: done ? 'none' : active ? '2px solid #00C9FF' : '2px solid #1e3a52',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || active ? 'white' : '#475569',
                  fontWeight: 700, fontSize: '13px',
                  boxShadow: active ? '0 0 12px #00C9FF50' : 'none',
                }}
              >
                {done ? <Check size={14} /> : num}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: active ? 700 : 400,
                color: active ? '#00C9FF' : done ? '#10B981' : '#475569',
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                flex: 1, height: '2px',
                background: done ? '#10B981' : '#1e3a52',
                margin: '0 6px', marginBottom: '22px',
                transition: 'background 0.4s',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ value, onChange, label }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <span
            key={s}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            style={{
              fontSize: '26px', cursor: 'pointer',
              color: s <= (hover ?? value) ? '#F59E0B' : '#1e3a52',
              transition: 'color 0.12s',
              userSelect: 'none',
            }}
          >★</span>
        ))}
      </div>
      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
        {label.replace('[X]', value)}
      </span>
    </div>
  )
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext }) {
  const [yelpOn, setYelpOn] = useState(false)
  const [toast, setToast] = useState(false)
  const [reviewCount, setReviewCount] = useState(42)
  const countTarget = yelpOn ? 89 : 42
  const displayCount = useAnimatedCount(countTarget, true, 900)

  function handleYelp(val) {
    setYelpOn(val)
    if (val) {
      setToast(true)
      setTimeout(() => setToast(false), 2800)
    }
  }

  return (
    <div>
      <Toast msg="Yelp connected — scanning 47 reviews" visible={toast} />

      {/* Business Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2D3E, #162233)',
        border: '1px solid #1e3a52', borderRadius: '14px',
        padding: '24px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px',
          background: 'radial-gradient(circle, #00C9FF12 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #00C9FF30, #0080a020)',
            border: '1px solid #00C9FF30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>🦷</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#F8FAFC' }}>Downtown Dental</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>📍 Chicago, IL · Dental Practice</div>
          </div>
        </div>

        {/* Review counter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px',
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#00C9FF', minWidth: '48px' }}>
            {displayCount}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>Reviews found</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              {yelpOn ? 'Google (42) + Yelp (47)' : 'Google Business only'}
            </div>
          </div>
        </div>
      </div>

      {/* Platform toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Connected Platforms
        </p>

        {/* Google — always on */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0D1B2A', border: '1px solid #10B98140', borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 0 0 1px #10B98120',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Google Business</div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>● Connected · 42 reviews</div>
            </div>
          </div>
          <Toggle on={true} onChange={() => {}} disabled={true} />
        </div>

        {/* Yelp — user toggles */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0D1B2A',
          border: yelpOn ? '1px solid #10B98140' : '1px solid #1e3a52',
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: yelpOn ? '0 0 0 1px #10B98120' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Yelp</div>
              <div style={{ fontSize: '11px', color: yelpOn ? '#10B981' : '#475569' }}>
                {yelpOn ? '● Connected · 47 reviews' : '○ Not connected'}
              </div>
            </div>
          </div>
          <Toggle on={yelpOn} onChange={handleYelp} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#475569', background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '999px', padding: '4px 12px' }}>
          Step 1 of 4
        </span>
        <button
          onClick={onNext}
          className="demo-hero-cta"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px #00C9FF30',
          }}>
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
const TONE_RESPONSES = {
  Professional: "Thank you for your valued feedback. We appreciate your trust in Downtown Dental and are delighted that your experience exceeded your expectations. Our team takes great pride in providing exceptional patient care.",
  Friendly: "Wow, thank you so much! 😊 We absolutely loved having you visit us at Downtown Dental! Dr. Lee and the whole team work so hard to make every visit special — it means the world to hear this!",
  Concise: "Thank you! We appreciate your feedback and look forward to seeing you again at Downtown Dental.",
}

function Step2({ onNext, onBack }) {
  const [tone, setTone] = useState('Professional')
  const [threshold, setThreshold] = useState(4)
  const [escalate, setEscalate] = useState(3)

  return (
    <div>
      {/* Tone selector */}
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        Response Tone
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {['Professional', 'Friendly', 'Concise'].map(t => (
          <div
            key={t}
            className="demo-tone-card"
            onClick={() => setTone(t)}
            style={{
              padding: '14px 12px', borderRadius: '10px', textAlign: 'center',
              background: tone === t ? '#00C9FF12' : '#0D1B2A',
              border: tone === t ? '2px solid #00C9FF' : '1px solid #1e3a52',
              boxShadow: tone === t ? '0 0 12px #00C9FF25' : 'none',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>
              {t === 'Professional' ? '🎩' : t === 'Friendly' ? '😊' : '⚡'}
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: tone === t ? '#00C9FF' : '#94a3b8' }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Auto-respond threshold */}
      <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '10px' }}>Auto-respond to reviews rated [X]★ and above</p>
        <StarRow value={threshold} onChange={setThreshold} label="Auto-respond to [X]★ and above" />
      </div>

      {/* Live preview */}
      <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e3a52', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'demoPulseGlow 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Preview</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
          <div style={{ padding: '14px', borderRight: '1px solid #1e3a52' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Review</p>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
              {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#F59E0B', fontSize: '14px' }}>{s}</span>)}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              "Amazing experience! Dr. Lee was so gentle and the whole staff was incredibly welcoming."
            </p>
            <p style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>— via Google, 2h ago</p>
          </div>
          <div style={{ padding: '14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>AI Response ({tone})</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: 0, transition: 'opacity 0.3s' }}>
              {TONE_RESPONSES[tone]}
            </p>
          </div>
        </div>
      </div>

      {/* Escalation threshold */}
      <div style={{ background: '#F59E0B10', border: '1px solid #F59E0B30', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', flexShrink: 0 }}>Escalate reviews rated</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setEscalate(n)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: escalate === n ? '#F59E0B' : '#1B2D3E',
                border: escalate === n ? '1px solid #F59E0B' : '1px solid #1e3a52',
                color: escalate === n ? '#0D1B2A' : '#64748B',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}
            >{n}★</button>
          ))}
        </div>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>and below</span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          ← Back
        </button>
        <button
          onClick={onNext}
          className="demo-hero-cta"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px #00C9FF30',
          }}>
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
function Step3({ onNext, onBack }) {
  const [smsOn, setSmsOn] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [email, setEmail] = useState('owner@downtowndental.com')
  const [freq, setFreq] = useState('Immediate')
  const [showSmsTooltip, setShowSmsTooltip] = useState(false)

  return (
    <div>
      {/* Channel cards */}
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        Alert Channels
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {/* In-app — always on */}
        <div style={{
          background: '#0D1B2A', border: '1px solid #10B98140', borderRadius: '12px', padding: '16px',
          boxShadow: '0 0 0 1px #10B98115',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>🔔</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#10B98120', border: '1px solid #10B98140', borderRadius: '999px', padding: '2px 8px' }}>
              <Lock size={10} color="#10B981" />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981' }}>Included</span>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>In-App Notifications</div>
          <div style={{ fontSize: '11px', color: '#10B981' }}>● Always active</div>
        </div>

        {/* SMS — coming soon */}
        <div
          style={{
            background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '12px', padding: '16px',
            opacity: 0.65, position: 'relative',
          }}
          onMouseEnter={() => setShowSmsTooltip(true)}
          onMouseLeave={() => setShowSmsTooltip(false)}
        >
          {showSmsTooltip && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '8px',
              padding: '8px 12px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap',
              marginBottom: '6px', zIndex: 10,
            }}>
              SMS alerts coming Q3 2026
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>📱</span>
            <div style={{ background: '#F59E0B20', border: '1px solid #F59E0B40', borderRadius: '999px', padding: '2px 8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B' }}>Coming Soon</span>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>SMS Alerts</div>
          <Toggle on={false} onChange={() => {}} disabled={true} />
        </div>
      </div>

      {/* Escalation recipient */}
      <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Escalation Recipient
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingEmail ? (
            <input
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEditingEmail(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingEmail(false)}
              style={{
                flex: 1, background: '#1B2D3E', border: '1px solid #00C9FF50',
                borderRadius: '6px', color: '#F8FAFC', fontSize: '13px',
                padding: '6px 10px', outline: 'none', fontFamily: 'inherit',
              }}
            />
          ) : (
            <span style={{ flex: 1, fontSize: '13px', color: '#94a3b8' }}>{email}</span>
          )}
          <button
            onClick={() => setEditingEmail(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            {editingEmail ? <Check size={15} color="#10B981" /> : <Edit2 size={14} />}
          </button>
        </div>
      </div>

      {/* Mock notification preview */}
      <div style={{ background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Escalation Alert Preview
        </p>
        {/* Mobile notification card */}
        <div style={{
          background: 'rgba(248,250,252,0.07)', border: '1px solid rgba(248,250,252,0.12)',
          borderRadius: '14px', padding: '12px 14px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          maxWidth: '340px', margin: '0 auto',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>RepuShield Alert</span>
              <span style={{ fontSize: '11px', color: '#475569', marginLeft: '12px' }}>now</span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
              ⚠️ New 2★ review needs your attention. Tap to respond.
            </p>
          </div>
        </div>
      </div>

      {/* Notification frequency */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Notification Frequency
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Immediate', 'Daily Digest', 'Weekly Summary'].map(f => (
            <button
              key={f}
              className="demo-freq-pill"
              onClick={() => setFreq(f)}
              style={{
                padding: '8px 16px', borderRadius: '999px',
                background: freq === f ? '#00C9FF15' : 'transparent',
                border: freq === f ? '1px solid #00C9FF' : '1px solid #1e3a52',
                color: freq === f ? '#00C9FF' : '#64748B',
                fontSize: '13px', fontWeight: freq === f ? 700 : 500,
                cursor: 'pointer',
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          ← Back
        </button>
        <button
          onClick={onNext}
          className="demo-hero-cta"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px #00C9FF30',
          }}>
          Activate Dashboard <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 4 ───────────────────────────────────────────────────────────────────
const SAMPLE_REVIEWS = [
  {
    stars: 5, platform: 'Google', text: 'Amazing experience! Dr. Lee was fantastic and the whole team made me feel right at home.',
    badge: 'AUTO-RESPONDED', badgeColor: '#10B981', badgeBg: '#10B98120',
  },
  {
    stars: 4, platform: 'Yelp', text: 'Great service, very professional staff. Only minor wait time but overall highly recommend.',
    badge: 'AUTO-RESPONDED', badgeColor: '#10B981', badgeBg: '#10B98120',
  },
  {
    stars: 2, platform: 'Google', text: 'Had to wait 45 minutes past my appointment. No one seemed to acknowledge the delay.',
    badge: 'ESCALATED', badgeColor: '#F59E0B', badgeBg: '#F59E0B20',
  },
]

function StarDisplay({ count }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= count ? '#F59E0B' : '#1e3a52', fontSize: '14px' }}>★</span>
      ))}
    </span>
  )
}

function Step4({ onNavigate }) {
  const c1 = useAnimatedCount(89, true, 1200)
  const c2 = useAnimatedCount(12, true, 1000)
  const c3 = useAnimatedCount(3, true, 800)

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Checkmark */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <AnimatedCheck />
      </div>

      <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: '#F8FAFC' }}>
        🎉 Your Shield is Active!
      </h2>
      <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '28px' }}>
        RepuShield is now monitoring Downtown Dental in real time.
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        marginBottom: '28px',
      }}>
        {[
          { val: c1, label: 'Reviews monitored', color: '#00C9FF' },
          { val: c2, label: 'Auto-responded', color: '#10B981' },
          { val: c3, label: 'Flagged for removal', color: '#F59E0B' },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '12px', padding: '16px 8px',
          }}>
            <div style={{ fontSize: '30px', fontWeight: 800, color, marginBottom: '4px' }}>{val}</div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Live review feed */}
      <div style={{ textAlign: 'left', marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>
          Live Review Feed
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SAMPLE_REVIEWS.map((r, i) => (
            <div
              key={i}
              className={`demo-card-${i + 1}`}
              style={{
                background: '#0D1B2A', border: '1px solid #1e3a52', borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <StarDisplay count={r.stars} />
                  <span style={{ fontSize: '11px', color: '#475569' }}>via {r.platform}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{r.text}"
                </p>
              </div>
              <div style={{
                flexShrink: 0, padding: '3px 10px', borderRadius: '999px',
                background: r.badgeBg, border: `1px solid ${r.badgeColor}40`,
                color: r.badgeColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {r.badge}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate('/pricing')}
        className="demo-hero-cta"
        style={{
          width: '100%', padding: '15px', borderRadius: '11px', border: 'none',
          background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
          color: 'white', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 4px 24px #00C9FF35', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
        Start Protecting My Reputation <ArrowRight size={17} />
      </button>
      <button
        onClick={() => onNavigate('/login')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748B', fontSize: '13px', fontWeight: 500,
        }}
      >
        Sign in to existing account →
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingDemo() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [animClass, setAnimClass] = useState('demo-step-enter')

  function goTo(next) {
    setAnimClass('demo-step-exit')
    setTimeout(() => {
      setStep(next)
      setAnimClass('demo-step-enter')
    }, 250)
  }

  function handleNext() { goTo(step + 1) }
  function handleBack() { goTo(step - 1) }
  function handleJump(n) { if (n !== step) goTo(n) }

  const STEP_SUBTITLES = [
    'Connect your review platforms',
    'Customize your AI response style',
    'Set up your alert preferences',
    'Your account is ready',
  ]

  return (
    <div
      className="demo-root"
      style={{
        background: '#0D1B2A', minHeight: '100vh', color: '#F8FAFC',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <style>{DEMO_STYLES}</style>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 5%', borderBottom: '1px solid #1e3a52',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,27,42,0.96)', backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#F8FAFC' }}>RepuShield</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            background: '#00C9FF15', border: '1px solid #00C9FF30',
            borderRadius: '999px', padding: '4px 12px',
            fontSize: '12px', fontWeight: 600, color: '#00C9FF',
            marginRight: '8px',
          }}>
            ✦ Interactive Demo
          </div>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
              color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'clamp(32px, 5vw, 56px) 5% 60px',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse, #00C9FF0A 0%, transparent 70%)',
        }} />

        <div style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: '8px' }}>
              {step === 1 && 'Connect Your Business'}
              {step === 2 && 'Set Your Response Style'}
              {step === 3 && 'Choose How You Get Alerted'}
              {step === 4 && 'Dashboard Preview'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>{STEP_SUBTITLES[step - 1]}</p>
          </div>

          {/* Progress */}
          <ProgressBar step={step} total={4} onJump={handleJump} />

          {/* Card */}
          <div
            className={animClass}
            style={{
              background: '#1B2D3E', border: '1px solid #1e3a52',
              borderRadius: '18px', padding: 'clamp(20px, 4vw, 32px)',
            }}
          >
            {step === 1 && <Step1 onNext={handleNext} />}
            {step === 2 && <Step2 onNext={handleNext} onBack={handleBack} />}
            {step === 3 && <Step3 onNext={handleNext} onBack={handleBack} />}
            {step === 4 && <Step4 onNavigate={navigate} />}
          </div>

          {/* Disclaimer */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '20px' }}>
            This is a live interactive demo using sample data. No account required.
          </p>
        </div>
      </main>
    </div>
  )
}
