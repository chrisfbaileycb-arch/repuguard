import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CustomerSidebar from '../components/CustomerSidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import Badge from '../components/Badge.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { getUser } from '../auth.js'
import { api } from '../api.js'
import {
  Star, Shield, AlertTriangle, CheckCircle, BarChart2,
  Download, RefreshCw, Settings, Bell, Info, Flag, CreditCard
} from 'lucide-react'

// ─── API adapters ─────────────────────────────────────────────────────────────
// The backend returns snake_case-ish records scoped to the signed-in customer.
// These map them onto the shapes the presentation components below expect.
// Nothing here invents data: an account with no reviews renders as zeroes.

function relTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const EMPTY_STATS = { reviewsMonitored: 0, autoResponded: 0, flaggedForRemoval: 0, needsAttention: 0 }

function toStats(stats) {
  if (!stats) return EMPTY_STATS
  return {
    reviewsMonitored: stats.monitored || 0,
    autoResponded: stats.autoResponded || 0,
    flaggedForRemoval: stats.flagged || 0,
    needsAttention: stats.needsAttention || 0,
  }
}

function toReview(r) {
  return {
    id: r.id,
    author: r.author || 'Anonymous',
    rating: r.rating,
    platform: r.platform ? r.platform.charAt(0).toUpperCase() + r.platform.slice(1) : 'Other',
    status: r.status,
    date: shortDate(r.reviewDate || r.createdAt),
    text: r.content || '',
    response: r.response || undefined,
  }
}

const ACTIVITY_ICON = {
  response: { icon: '✅', color: '#10B981' },
  flag: { icon: '🚫', color: '#F43F5E' },
  escalation: { icon: '🚨', color: '#F59E0B' },
  review: { icon: '⭐', color: '#00C9FF' },
}

function toActivity(a) {
  const look = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.review
  const stars = a.rating ? `${a.rating}★ — ` : ''
  const platform = a.platform ? a.platform.charAt(0).toUpperCase() + a.platform.slice(1) : ''
  const verb = {
    response: 'auto-responded',
    flag: 'flagged for guideline violation',
    escalation: 'escalated to you',
    review: 'received',
  }[a.type] || 'received'
  return {
    id: a.id,
    icon: look.icon,
    color: look.color,
    text: `${platform} review ${verb} (${stars}${a.author || 'Anonymous'})`,
    time: relTime(a.date),
  }
}

function toNotification(n) {
  return { id: n.id, type: n.type, message: n.message, read: !!n.read, time: relTime(n.createdAt) }
}

function toReport(data) {
  if (!data) return null
  const s = data.stats || {}
  return {
    month: data.month || '',
    monitored: s.monitored || 0,
    responded: s.responded || 0,
    flagged: s.flagged || 0,
    removed: s.removed || 0,
    avgRating: s.avgRating || 0,
    ratingDist: data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    score: data.reputationScore || 0,
  }
}



// ─── Sub-components ────────────────────────────────────────────────────────────

function DemoBanner({ connected, onConnect }) {
  if (connected.google && connected.yelp) return null
  return (
    <div style={{
      background: 'linear-gradient(90deg, #00C9FF20, #00C9FF10)',
      border: '1px solid #00C9FF40', borderRadius: '10px',
      padding: '14px 20px', marginBottom: '24px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px',
    }}>
      <span style={{ fontSize: '14px' }}>👋</span>
      <p style={{ flex: 1, fontSize: '14px', color: '#94a3b8', margin: 0, minWidth: '200px' }}>
        <strong style={{ color: '#00C9FF' }}>Welcome!</strong> Connect your Google and Yelp accounts so we can start monitoring new reviews as they are posted.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => onConnect('google')} style={{
          padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          background: connected.google ? '#10B98120' : '#00C9FF20',
          border: connected.google ? '1px solid #10B98140' : '1px solid #00C9FF40',
          color: connected.google ? '#10B981' : '#00C9FF',
        }}>
          {connected.google ? '✓ Google Connected' : 'Connect Google'}
        </button>
        <button onClick={() => onConnect('yelp')} style={{
          padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          background: connected.yelp ? '#10B98120' : '#F59E0B20',
          border: connected.yelp ? '1px solid #10B98140' : '1px solid #F59E0B40',
          color: connected.yelp ? '#10B981' : '#F59E0B',
        }}>
          {connected.yelp ? '✓ Yelp Connected' : 'Connect Yelp'}
        </button>
      </div>
    </div>
  )
}

function MembershipBar({ month = 0 }) {
  // The commitment can be served out and exceeded, so clamp the bar rather
  // than letting it overflow its track at "Month 7 of 6".
  const complete = month >= 6
  const pct = Math.min(100, Math.max(0, (month / 6) * 100))
  return (
    <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>6-Month Membership Progress</span>
        <Badge variant={complete ? 'emerald' : 'cyan'}>
          {complete ? `Commitment complete · month ${month}` : `Month ${month} of 6`}
        </Badge>
      </div>
      <div style={{ background: '#0D1B2A', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #00C9FF, #10B981)',
          width: `${pct}%`, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: '#475569' }}>Started</span>
        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>{Math.round(pct)}% complete</span>
        <span style={{ fontSize: '11px', color: '#475569' }}>Month 6</span>
      </div>
    </div>
  )
}

function OverviewTab({ stats, activity, escalated, connected }) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Reviews Monitored" value={stats.reviewsMonitored} icon={Star} accent="#00C9FF" sub="This month" />
        <StatCard label="Auto-Responded" value={stats.autoResponded} icon={CheckCircle} accent="#10B981" sub="Handled for you" />
        <StatCard label="Flagged for Removal" value={stats.flaggedForRemoval} icon={Flag} accent="#F43F5E" sub="Submitted to platform" />
        <StatCard label="Needs Attention" value={stats.needsAttention} icon={AlertTriangle} accent="#F59E0B" sub="Action required" />
      </div>

      {/* Needs Attention */}
      {escalated.length > 0 && (
        <div style={{ background: '#1B2D3E', border: '1px solid #F59E0B30', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={16} color="#F59E0B" />
            <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#F59E0B' }}>Needs Your Attention</h3>
            <Badge variant="amber">{escalated.length}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {escalated.map(r => (
              <div key={r.id} style={{ background: '#0D1B2A', border: '1px solid #F59E0B20', borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.author}</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{r.platform} · {r.date}</span>
                    <div style={{ display: 'flex', gap: '1px' }}>
                      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= r.rating ? '#F59E0B' : '#334155', fontSize: '10px' }}>★</span>)}
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>{r.text}</p>
                </div>
                <button style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #10B98140', background: '#10B98115', color: '#10B981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Mark Resolved
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: i < activity.length - 1 ? '1px solid #0D1B2A' : 'none' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>{a.text}</p>
              </div>
              <span style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewsTab({ reviews }) {
  const [platform, setPlatform] = useState('all')
  const [rating, setRating] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = reviews.filter(r => {
    if (platform !== 'all' && r.platform.toLowerCase() !== platform) return false
    if (rating !== 'all' && r.rating !== parseInt(rating)) return false
    if (status !== 'all' && r.status !== status) return false
    return true
  })

  const selectStyle = { background: '#0D1B2A', border: '1px solid #1e3a52', color: '#94a3b8', fontSize: '13px', padding: '7px 12px', borderRadius: '7px', fontFamily: 'inherit', cursor: 'pointer' }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={selectStyle}>
          <option value="all">All Platforms</option>
          <option value="google">Google</option>
          <option value="yelp">Yelp</option>
        </select>
        <select value={rating} onChange={e => setRating(e.target.value)} style={selectStyle}>
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="auto-responded">Auto-Responded</option>
          <option value="escalated">Escalated</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0
          ? <p style={{ color: '#475569', fontSize: '14px', textAlign: 'center', padding: '32px' }}>No reviews match your filters.</p>
          : filtered.map(r => <ReviewCard key={r.id} review={r} adminMode={false} />)
        }
      </div>
    </div>
  )
}

function NotificationsTab({ notifications, onMarkRead }) {
  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)
  const typeColors = { new_review: '#3b82f6', escalation: '#F59E0B', flagged: '#F43F5E', resolved: '#10B981' }
  const typeIcons = { new_review: '⭐', escalation: '⚠️', flagged: '🚩', resolved: '✅' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Notifications</h3>
          {unread.length > 0 && <Badge variant="rose">{unread.length} unread</Badge>}
        </div>
        {unread.length > 0 && (
          <button onClick={() => unread.forEach(n => onMarkRead(n.id))} style={{ background: 'none', border: 'none', color: '#00C9FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Mark all read
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => {
          const c = typeColors[n.type] || '#64748B'
          return (
            <div key={n.id} onClick={() => !n.read && onMarkRead(n.id)} style={{
              background: '#1B2D3E', border: '1px solid #1e3a52',
              borderLeft: n.read ? '1px solid #1e3a52' : `4px solid ${c}`,
              borderRadius: '10px', padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              cursor: n.read ? 'default' : 'pointer',
              opacity: n.read ? 0.65 : 1,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{typeIcons[n.type] || '📢'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: '#F8FAFC', margin: 0, fontWeight: n.read ? 400 : 600, lineHeight: '1.5' }}>{n.message}</p>
                <span style={{ fontSize: '11px', color: '#475569' }}>{n.time}</span>
              </div>
              {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, flexShrink: 0, marginTop: '6px' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReportTab({ report, toast, setToast }) {
  // No report yet (a fresh account, or the request failed) — say so rather
  // than rendering a chart built from nothing.
  if (!report) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <BarChart2 size={26} color="#334155" style={{ marginBottom: '12px' }} />
        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
          Your first monthly report will appear once reviews start coming in.
        </p>
      </div>
    )
  }
  const maxVal = Math.max(...Object.values(report.ratingDist))
  const scoreColor = report.score >= 80 ? '#10B981' : report.score >= 60 ? '#F59E0B' : '#F43F5E'
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (report.score / 100) * circumference

  return (
    <div>
      {toast && (
        <div style={{ background: '#1B2D3E', border: '1px solid #00C9FF40', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#00C9FF', fontSize: '13px', fontWeight: 600 }}>
          📥 {toast}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px' }}>
        {/* Monthly Summary */}
        <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>Monthly Summary</h3>
              <span style={{ fontSize: '13px', color: '#64748B' }}>{report.month}</span>
            </div>
            <button
              onClick={() => { setToast('Report download coming soon'); setTimeout(() => setToast(''), 3000) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: '1px solid #1e3a52', background: 'transparent', color: '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Download size={13} /> Download
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Monitored', value: report.monitored, color: '#00C9FF' },
              { label: 'Responded', value: report.responded, color: '#10B981' },
              { label: 'Flagged', value: report.flagged, color: '#F43F5E' },
              { label: 'Removed', value: report.removed, color: '#10B981' },
              { label: 'Avg Rating', value: `${report.avgRating}★`, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', background: '#0D1B2A', borderRadius: '8px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Ring */}
        <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#0D1B2A" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={scoreColor} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="50" y="46" textAnchor="middle" fill={scoreColor} fontSize="20" fontWeight="800" fontFamily="Inter">{report.score}</text>
            <text x="50" y="60" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Inter">/100</text>
          </svg>
          <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '8px', fontWeight: 600 }}>
            Reputation Score
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>Rating Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[5,4,3,2,1].map(star => {
            const count = report.ratingDist[star] || 0
            const pct = maxVal > 0 ? (count / maxVal) * 100 : 0
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600, width: '20px', textAlign: 'right' }}>{star}★</span>
                <div style={{ flex: 1, background: '#0D1B2A', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? '#10B981' : star === 3 ? '#F59E0B' : '#F43F5E', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#475569', width: '24px' }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ settings, connected, subscription, onCompletePayment, onManageSubscription }) {
  const subStatus = subscription?.status || 'inactive'
  const statusConfig = {
    active:   { label: 'Active',    variant: 'emerald' },
    past_due: { label: 'Past Due',  variant: 'amber' },
    inactive: { label: 'Inactive',  variant: 'slate' },
  }
  const { label: statusLabel, variant: statusVariant } = statusConfig[subStatus] || statusConfig.inactive

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>Account Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            ['Business Name', settings.businessName],
            ['Email', settings.email],
            ['Plan', `${settings.plan} — $${settings.planPrice}/mo`],
            ['Start Date', settings.startDate],
            ['End Date', settings.endDate],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e3a52' }}>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: '13px', color: '#F8FAFC', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Section */}
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <CreditCard size={16} color="#00C9FF" />
          <h3 style={{ fontWeight: 700, fontSize: '15px' }}>Subscription</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e3a52' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Current Plan</span>
            <span style={{ fontSize: '13px', color: '#F8FAFC', fontWeight: 600 }}>{settings.plan} &mdash; ${settings.planPrice}/mo</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e3a52' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Status</span>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <div style={{ paddingTop: '4px' }}>
            {(subStatus === 'inactive' || subStatus === 'past_due') ? (
              <button
                onClick={onCompletePayment}
                style={{
                  width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
                  color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}>
                <CreditCard size={15} />
                Complete Payment
              </button>
            ) : (
              <button
                onClick={onManageSubscription}
                style={{
                  width: '100%', padding: '11px', borderRadius: '8px',
                  border: '1px solid #1e3a52', background: 'transparent',
                  color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#F59E0B10', border: '1px solid #F59E0B30', borderRadius: '12px', padding: '18px 20px' }}>
        <p style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600, marginBottom: '4px' }}>⏱ 6-Month Commitment</p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Your 6-month commitment ends on: <strong style={{ color: '#F8FAFC' }}>{settings.endDate}</strong></p>
      </div>

      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>Connected Platforms</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Google', 'Yelp'].map(p => {
            const isConn = connected[p.toLowerCase()]
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#0D1B2A', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{p}</span>
                <Badge variant={isConn ? 'emerald' : 'slate'}>{isConn ? '✓ Connected' : 'Not connected'}</Badge>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const [tab, setTab] = useState('overview')
  const [notifications, setNotifications] = useState([])
  const [dash, setDash] = useState(null)
  const [reviews, setReviews] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [connected, setConnected] = useState({ google: false, yelp: false })
  const [toast, setToast] = useState('')
  const [paymentBanner, setPaymentBanner] = useState(null) // { type: 'success'|'cancelled', message }
  const [subscription, setSubscription] = useState({ status: 'inactive' })
  const [searchParams, setSearchParams] = useSearchParams()
  const user = getUser()
  const planPrices = { basic: 69, growth: 109, pro: 179 }
  const liveSettings = {
    businessName: user?.businessName || user?.name || '—',
    email: user?.email || '—',
    plan: user?.plan ? (user.plan.charAt(0).toUpperCase() + user.plan.slice(1)) : '—',
    planPrice: planPrices[user?.plan] || '—',
    startDate: user?.startDate ? new Date(user.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
    endDate: user?.endDate ? new Date(user.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
    platforms: { google: user?.googleConnected || false, yelp: user?.yelpConnected || false },
  }
  const unreadCount = notifications.filter(n => !n.read).length
  const escalated = reviews.filter(r => r.status === 'escalated')

  // Check URL params for payment status on mount
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      setPaymentBanner({ type: 'success', message: '🎉 Payment successful! Your account is now active.' })
      setSubscription({ status: 'active' })
      // Auto-dismiss after 5s
      setTimeout(() => setPaymentBanner(null), 5000)
      // Clean up URL param
      setSearchParams(prev => { prev.delete('payment'); return prev }, { replace: true })
    } else if (payment === 'cancelled') {
      setPaymentBanner({ type: 'cancelled', message: 'Payment was cancelled. You can complete payment anytime from Settings.' })
      setSearchParams(prev => { prev.delete('payment'); return prev }, { replace: true })
    }
  }, [])

  // Fetch subscription status on mount
  useEffect(() => {
    api.getSubscriptionStatus()
      .then(res => { if (res.success && res.data) setSubscription(res.data) })
      .catch(() => {})
  }, [])

  // Load this customer's own data. Every figure on screen comes from here;
  // a brand-new account legitimately shows zeroes rather than sample numbers.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      api.getMyDashboard().catch(() => null),
      api.getMyReviews().catch(() => null),
      api.getMyNotifications().catch(() => null),
      api.getMyReport().catch(() => null),
    ]).then(([d, rv, nt, rp]) => {
      if (cancelled) return
      if (d?.success && d.data) setDash(d.data)
      if (rv?.success && rv.data?.reviews) setReviews(rv.data.reviews.map(toReview))
      if (nt?.success && nt.data?.notifications) setNotifications(nt.data.notifications.map(toNotification))
      if (rp?.success && rp.data) setReport(toReport(rp.data))
      if (!d?.success && !rv?.success) {
        setLoadError('We could not load your data just now. Refresh to try again.')
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function handleCompletePayment() {
    try {
      const res = await api.createCheckoutSession(user?.plan || 'growth')
      if (res.success && res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (e) {
      console.error('Checkout session error:', e)
    }
  }

  function handleManageSubscription() {
    console.log('Manage Subscription clicked — Stripe Customer Portal coming soon')
  }

  function handleConnect(platform) {
    setConnected(c => ({ ...c, [platform]: true }))
    try { api.connectPlatform(platform) } catch {}
  }

  function handleMarkRead(id) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    try { api.markNotificationRead(id) } catch {}
  }

  const businessName = user?.businessName || user?.name || 'Your Business'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D1B2A' }}>
      <CustomerSidebar activeTab={tab} onTabChange={setTab} unreadCount={unreadCount} />

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #1e3a52',
          background: '#0D1B2A', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '2px' }}>
              {tab === 'overview' ? `👋 Welcome, ${businessName}` :
               tab === 'reviews' ? 'My Reviews' :
               tab === 'notifications' ? 'Notifications' :
               tab === 'report' ? 'My Report' : 'Settings'}
            </h1>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              {tab === 'overview' ? 'Here\'s what\'s happening with your reputation' :
               tab === 'reviews' ? 'All your monitored reviews in one place' :
               tab === 'notifications' ? 'Stay on top of your review activity' :
               tab === 'report' ? 'Monthly performance summary' : 'Your account & preferences'}
            </p>
          </div>
          <NotificationBell notifications={notifications} onMarkRead={handleMarkRead} />
        </header>

        {/* Payment banners */}
        {paymentBanner && (
          <div style={{
            margin: '20px 28px 0',
            padding: '14px 18px',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            background: paymentBanner.type === 'success' ? '#10B98115' : '#F59E0B15',
            border: paymentBanner.type === 'success' ? '1px solid #10B98140' : '1px solid #F59E0B40',
            color: paymentBanner.type === 'success' ? '#10B981' : '#F59E0B',
            fontSize: '14px', fontWeight: 600,
          }}>
            <span>{paymentBanner.message}</span>
            <button
              onClick={() => setPaymentBanner(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '18px', lineHeight: 1, padding: '0 4px', opacity: 0.7 }}
              aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '28px' }}>
          <DemoBanner connected={connected} onConnect={handleConnect} />

          {tab === 'overview' && (
            <>
              <MembershipBar month={dash?.membershipMonths ?? 0} />
              <OverviewTab
                stats={toStats(dash?.stats)}
                activity={(dash?.recentActivity || []).map(toActivity)}
                escalated={escalated}
                connected={connected}
              />
            </>
          )}
          {tab === 'reviews' && <ReviewsTab reviews={reviews} />}
          {tab === 'notifications' && <NotificationsTab notifications={notifications} onMarkRead={handleMarkRead} />}
          {tab === 'report' && <ReportTab report={report} toast={toast} setToast={setToast} />}
          {tab === 'settings' && (
            <SettingsTab
              settings={liveSettings}
              connected={connected}
              subscription={subscription}
              onCompletePayment={handleCompletePayment}
              onManageSubscription={handleManageSubscription}
            />
          )}
        </div>
      </main>
    </div>
  )
}
