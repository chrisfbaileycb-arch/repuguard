import React, { useState, useEffect } from 'react'
import CustomerSidebar from '../components/CustomerSidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import Badge from '../components/Badge.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { getUser } from '../auth.js'
import { api } from '../api.js'
import {
  Star, Shield, AlertTriangle, CheckCircle, BarChart2,
  Download, RefreshCw, Settings, Bell, Info, Flag
} from 'lucide-react'

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STATS = { reviewsMonitored: 87, autoResponded: 61, flaggedForRemoval: 4, needsAttention: 3 }
const DEMO_MONTH = 4 // month 4 of 6

const DEMO_REVIEWS = [
  { id: 1, author: 'Jennifer M.', rating: 5, platform: 'Google', status: 'auto-responded', date: 'Aug 10, 2026', text: 'Absolutely love this place! The staff was so friendly and the service was top notch. Will definitely be coming back.', response: 'Thank you so much, Jennifer! We truly appreciate your kind words.' },
  { id: 2, author: 'Marcus T.', rating: 2, platform: 'Yelp', status: 'escalated', date: 'Aug 9, 2026', text: 'Waited 45 minutes past my appointment time. Very frustrating experience.' },
  { id: 3, author: 'Anonymous', rating: 1, platform: 'Google', status: 'flagged', date: 'Aug 7, 2026', text: 'Never been here. This review is a mistake.' },
  { id: 4, author: 'Lisa R.', rating: 4, platform: 'Google', status: 'auto-responded', date: 'Aug 5, 2026', text: 'Great experience overall. A bit of a wait but worth it.', response: 'Thanks Lisa! We\'re working on reducing wait times.' },
  { id: 5, author: 'David K.', rating: 3, platform: 'Yelp', status: 'escalated', date: 'Aug 3, 2026', text: 'Decent service but nothing special. Expected more for the price.' },
  { id: 6, author: 'Sarah P.', rating: 5, platform: 'Google', status: 'auto-responded', date: 'Aug 1, 2026', text: 'Best in town. Been coming here for years.', response: 'Sarah, you\'re the best! Thank you for your loyalty.' },
]

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'escalation', message: 'New 2-star review from Marcus T. on Yelp needs your attention.', time: '2 hours ago', read: false },
  { id: 2, type: 'flagged', message: 'Anonymous 1-star review on Google flagged for guideline violation.', time: '5 hours ago', read: false },
  { id: 3, type: 'new_review', message: '5-star Google review from Jennifer M. — auto-response sent.', time: '1 day ago', read: true },
  { id: 4, type: 'resolved', message: 'Previous escalation from July 28 marked as resolved.', time: '2 days ago', read: true },
  { id: 5, type: 'new_review', message: '4-star Google review from Lisa R. — auto-response sent.', time: '3 days ago', read: true },
  { id: 6, type: 'flagged', message: 'Competitor-posted review on Yelp flagged for removal request.', time: '5 days ago', read: true },
]

const DEMO_ACTIVITY = [
  { icon: '✅', text: 'Google review auto-responded (5★ — Jennifer M.)', time: '2h ago', color: '#10B981' },
  { icon: '🚨', text: 'Yelp review escalated to you (2★ — Marcus T.)', time: '5h ago', color: '#F59E0B' },
  { icon: '🚫', text: 'Google review flagged for guideline violation', time: '5h ago', color: '#F43F5E' },
  { icon: '✅', text: 'Google review auto-responded (4★ — Lisa R.)', time: '3d ago', color: '#10B981' },
  { icon: '📋', text: 'Compliance scan completed — 4 violations found', time: '5d ago', color: '#00C9FF' },
]

const DEMO_REPORT = {
  month: 'August 2026',
  monitored: 87, responded: 61, flagged: 4, removed: 2, avgRating: 4.1,
  ratingDist: { 1: 3, 2: 5, 3: 8, 4: 22, 5: 49 },
  score: 87,
}

const DEMO_SETTINGS = {
  businessName: 'Downtown Dental',
  email: 'owner@downtowndental.com',
  plan: 'Growth',
  planPrice: 109,
  startDate: 'March 1, 2026',
  endDate: 'August 31, 2026',
  platforms: { google: true, yelp: false },
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
        <strong style={{ color: '#00C9FF' }}>Welcome!</strong> Connect your Google and Yelp accounts to go live. Until then, you're viewing sample data.
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

function MembershipBar({ month = 4 }) {
  const pct = (month / 6) * 100
  return (
    <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>6-Month Membership Progress</span>
        <Badge variant={month >= 6 ? 'emerald' : 'cyan'}>Month {month} of 6</Badge>
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

function SettingsTab({ settings, connected }) {
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
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)
  const [connected, setConnected] = useState({ google: false, yelp: false })
  const [toast, setToast] = useState('')
  const user = getUser()
  const unreadCount = notifications.filter(n => !n.read).length
  const escalated = DEMO_REVIEWS.filter(r => r.status === 'escalated')

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

        {/* Content */}
        <div style={{ padding: '28px' }}>
          <DemoBanner connected={connected} onConnect={handleConnect} />

          {tab === 'overview' && (
            <>
              <MembershipBar month={DEMO_MONTH} />
              <OverviewTab stats={DEMO_STATS} activity={DEMO_ACTIVITY} escalated={escalated} connected={connected} />
            </>
          )}
          {tab === 'reviews' && <ReviewsTab reviews={DEMO_REVIEWS} />}
          {tab === 'notifications' && <NotificationsTab notifications={notifications} onMarkRead={handleMarkRead} />}
          {tab === 'report' && <ReportTab report={DEMO_REPORT} toast={toast} setToast={setToast} />}
          {tab === 'settings' && <SettingsTab settings={DEMO_SETTINGS} connected={connected} />}
        </div>
      </main>
    </div>
  )
}
