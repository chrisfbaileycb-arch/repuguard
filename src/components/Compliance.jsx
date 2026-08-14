import React, { useState, useEffect } from 'react'
import Badge from './Badge.jsx'
import { getScan, runScan } from '../api.js'
import { Shield, Play, RefreshCw, AlertTriangle, CheckCircle, X, ExternalLink, Clock } from 'lucide-react'

const violationTypes = [
  { key: 'fake_review', label: 'Fake Review', color: '#F43F5E' },
  { key: 'competitor_mention', label: 'Competitor Mention', color: '#F59E0B' },
  { key: 'guideline_violation', label: 'Guideline Violation', color: '#EF5350' },
  { key: 'spam_solicited', label: 'Spam/Solicited', color: '#A78BFA' }
]

function ViolationChip({ type }) {
  const info = violationTypes.find(v => v.key === type) || violationTypes[2]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px',
      background: info.color + '22',
      border: `1px solid ${info.color}44`,
      borderRadius: '999px',
      fontSize: '11px', fontWeight: 500, color: info.color
    }}>
      {info.label}
    </span>
  )
}

function PlatformCard({ name, icon, data, color }) {
  const flagRate = data.scanned > 0 ? ((data.flagged / data.scanned) * 100).toFixed(1) : 0
  return (
    <div style={{
      background: '#1B2D3E', border: '1px solid #243447',
      borderRadius: '12px', padding: '20px 24px',
      borderLeft: `3px solid ${color}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: color + '22', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 800, color
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>Platform scan results</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Metric label="Scanned" value={data.scanned} color="#00C9FF" />
        <Metric label="Flagged" value={data.flagged} color="#F43F5E" />
        <Metric label="Flag Rate" value={`${flagRate}%`} color={parseFloat(flagRate) > 5 ? '#F59E0B' : '#10B981'} />
      </div>

      {data.flagged > 0 && (
        <div style={{
          marginTop: '12px', padding: '8px 12px',
          background: '#F43F5E11', border: '1px solid #F43F5E22',
          borderRadius: '6px', fontSize: '12px', color: '#F43F5E',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <AlertTriangle size={12} />
          {data.flagged} review{data.flagged > 1 ? 's' : ''} requiring action
        </div>
      )}
      {data.flagged === 0 && (
        <div style={{
          marginTop: '12px', padding: '8px 12px',
          background: '#10B98111', border: '1px solid #10B98122',
          borderRadius: '6px', fontSize: '12px', color: '#10B981',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <CheckCircle size={12} />
          No violations detected
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

const mockFlaggedReviews = [
  {
    id: 'fr1',
    platform: 'google',
    author: 'J. Smith',
    content: 'This place is terrible! Go to CompetitorXYZ instead, much better service.',
    date: '2024-11-20T10:00:00Z',
    rating: 1,
    violation: 'competitor_mention',
    memberName: 'Sunrise Dental'
  },
  {
    id: 'fr2',
    platform: 'yelp',
    author: 'FakeAccount999',
    content: 'Best place ever!! 10/10 would recommend to everyone I know!!!! Amazing!',
    date: '2024-11-18T15:30:00Z',
    rating: 5,
    violation: 'fake_review',
    memberName: 'Metro Auto Repair'
  },
  {
    id: 'fr3',
    platform: 'google',
    author: 'Spam Bot',
    content: 'We were asked to leave a 5-star review by the staff in exchange for a discount.',
    date: '2024-11-15T08:00:00Z',
    rating: 5,
    violation: 'spam_solicited',
    memberName: 'Harbor View Hotel'
  },
  {
    id: 'fr4',
    platform: 'yelp',
    author: 'Anonymous User',
    content: 'This business violated my privacy and I demand compensation immediately.',
    date: '2024-11-12T11:00:00Z',
    rating: 1,
    violation: 'guideline_violation',
    memberName: 'Capital Law Group'
  }
]

export default function Compliance() {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())
  const [submitted, setSubmitted] = useState(new Set())

  const load = async () => {
    setLoading(true)
    const res = await getScan()
    if (res.success !== false) setScan(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRunScan = async () => {
    setRunning(true)
    await runScan()
    // Simulate scan completing
    setTimeout(async () => {
      await load()
      setRunning(false)
    }, 2800)
  }

  const visibleFlagged = mockFlaggedReviews.filter(r => !dismissed.has(r.id))

  const scanData = scan || {
    lastScan: new Date().toISOString(),
    scanned: 247,
    flagged: 4,
    platforms: {
      google: { scanned: 148, flagged: 2 },
      yelp: { scanned: 99, flagged: 2 }
    }
  }

  const lastScanTime = new Date(scanData.lastScan)
  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - lastScanTime.getTime()) / 1000 / 60)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    const h = Math.floor(diff / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  })()

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Compliance Scan
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Scan reviews for guideline violations and policy breaches
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '12px' }}>
            <Clock size={13} />
            Last scan: {timeAgo}
          </div>
          <button
            onClick={handleRunScan}
            disabled={running || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px',
              background: running
                ? 'linear-gradient(135deg, #00C9FF22, #00C9FF11)'
                : 'linear-gradient(135deg, #00C9FF33, #00C9FF22)',
              border: `1px solid ${running ? '#00C9FF66' : '#00C9FF55'}`,
              borderRadius: '8px', color: '#00C9FF',
              fontSize: '13px', fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              position: 'relative'
            }}
          >
            {running ? (
              <>
                <div style={{
                  position: 'absolute', inset: '-2px',
                  borderRadius: '10px',
                  border: '2px solid transparent',
                  borderTopColor: '#00C9FF',
                  animation: 'spin 1s linear infinite'
                }} />
                <RefreshCw size={14} />
                Scanning…
              </>
            ) : (
              <>
                <Play size={14} />
                Run Scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scan progress */}
      {running && (
        <div style={{
          background: '#00C9FF11', border: '1px solid #00C9FF33',
          borderRadius: '12px', padding: '20px 24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid #00C9FF33',
            borderTopColor: '#00C9FF',
            animation: 'spin 1s linear infinite', flexShrink: 0
          }} />
          <div>
            <div style={{ fontWeight: 600, color: '#00C9FF', marginBottom: '4px' }}>Scan in progress...</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              Analyzing reviews across Google and Yelp for policy violations
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            width: '120px', height: '4px',
            background: '#243447', borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: '#00C9FF',
              animation: 'progress 2.8s ease-in-out forwards',
              borderRadius: '2px'
            }} />
          </div>
        </div>
      )}

      {/* Summary row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px', marginBottom: '24px'
      }}>
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447',
          borderRadius: '10px', padding: '16px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#00C9FF' }}>{scanData.scanned}</div>
          <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>Total Scanned</div>
        </div>
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447',
          borderRadius: '10px', padding: '16px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#F43F5E' }}>{visibleFlagged.length}</div>
          <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>Violations Found</div>
        </div>
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447',
          borderRadius: '10px', padding: '16px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>
            {submitted.size}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>Submitted for Removal</div>
        </div>
      </div>

      {/* Platform cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <PlatformCard name="Google Reviews" icon="G" data={scanData.platforms.google} color="#4285F4" />
        <PlatformCard name="Yelp Reviews" icon="Y" data={scanData.platforms.yelp} color="#EF5350" />
      </div>

      {/* Flagged reviews */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>Flagged Reviews</h2>
          <span style={{
            background: '#F43F5E22', color: '#F43F5E', border: '1px solid #F43F5E44',
            borderRadius: '999px', fontSize: '11px', fontWeight: 600, padding: '1px 8px'
          }}>{visibleFlagged.length}</span>
        </div>

        {visibleFlagged.length === 0 ? (
          <div style={{
            background: '#10B98111', border: '1px solid #10B98122',
            borderRadius: '12px', padding: '32px', textAlign: 'center'
          }}>
            <CheckCircle size={32} color="#10B981" style={{ marginBottom: '12px' }} />
            <div style={{ color: '#10B981', fontWeight: 600 }}>All clear!</div>
            <div style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>No violations requiring action</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleFlagged.map(review => (
              <FlaggedReviewCard
                key={review.id}
                review={review}
                isSubmitted={submitted.has(review.id)}
                onSubmit={() => setSubmitted(s => new Set([...s, review.id]))}
                onDismiss={() => setDismissed(s => new Set([...s, review.id]))}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}

function FlaggedReviewCard({ review, isSubmitted, onSubmit, onDismiss }) {
  const dateStr = new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const platformColor = review.platform === 'google' ? '#4285F4' : '#EF5350'

  return (
    <div style={{
      background: '#1B2D3E', border: '1px solid #F43F5E33',
      borderLeft: '3px solid #F43F5E',
      borderRadius: '10px', padding: '16px 20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '5px',
            background: platformColor + '22', border: `1px solid ${platformColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color: platformColor
          }}>
            {review.platform === 'google' ? 'G' : 'Y'}
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#F8FAFC' }}>{review.author}</span>
          <ViolationChip type={review.violation} />
          <span style={{ fontSize: '12px', color: '#64748B' }}>{dateStr}</span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>— {review.memberName}</span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', color: '#64748B',
            cursor: 'pointer', padding: '2px', flexShrink: 0
          }}
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '12px' }}>
        "{review.content}"
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isSubmitted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            background: '#10B98111', border: '1px solid #10B98133',
            borderRadius: '6px', fontSize: '12px', color: '#10B981', fontWeight: 500
          }}>
            <CheckCircle size={12} />
            Submitted for Removal
          </div>
        ) : (
          <ActionBtn
            icon={ExternalLink}
            label="Submit for Removal"
            color="#F43F5E"
            onClick={onSubmit}
          />
        )}
        <ActionBtn
          icon={X}
          label="Dismiss"
          color="#64748B"
          onClick={onDismiss}
        />
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px',
        background: hover ? color + '22' : color + '11',
        border: `1px solid ${color}44`,
        borderRadius: '6px', color,
        fontSize: '12px', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s'
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}
