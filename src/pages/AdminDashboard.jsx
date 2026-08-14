import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import StatCard from '../components/StatCard.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import Badge from '../components/Badge.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { api } from '../api.js'
import { getUser } from '../auth.js'
import {
  Star, Shield, AlertTriangle, CheckCircle, Users, Zap, RefreshCw,
  Plus, Edit2, Trash2, X, Search, Filter, ChevronDown, BarChart2,
  TrendingUp, Clock, Flag, MessageSquare
} from 'lucide-react'

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STATS = {
  totalReviews: 1247, autoResponded: 893, flagged: 38,
  escalated: 14, avgRating: 4.2, activeMembers: 42
}

const DEMO_REVIEWS = [
  { id: 1, author: 'Jennifer Mitchell', rating: 5, platform: 'Google', status: 'auto-responded', date: 'Aug 12, 2026', text: 'Outstanding service! The team went above and beyond. I\'ve been a customer for 3 years and they\'ve never let me down.', response: 'Thank you so much Jennifer! We truly value your loyalty.', business: 'Downtown Dental' },
  { id: 2, author: 'Mike D.', rating: 1, platform: 'Yelp', status: 'flagged', date: 'Aug 11, 2026', text: 'Never been here. This review is clearly for another business. Wrong location.', business: 'Harbor Auto Shop' },
  { id: 3, author: 'Sarah K.', rating: 2, platform: 'Google', status: 'escalated', date: 'Aug 10, 2026', text: 'Waited over an hour past my scheduled time. Staff seemed overwhelmed and no one apologized.', business: 'Sunshine Salon' },
  { id: 4, author: 'Robert Chen', rating: 4, platform: 'Google', status: 'auto-responded', date: 'Aug 9, 2026', text: 'Great food and atmosphere. Parking was a bit tricky but worth the visit.', response: 'Thanks Robert! We\'re working on the parking situation.', business: 'The Rustic Table' },
  { id: 5, author: 'Competitor_Fake', rating: 1, platform: 'Google', status: 'flagged', date: 'Aug 8, 2026', text: 'Worst place ever. Do not go here.', business: 'Harbor Auto Shop' },
  { id: 6, author: 'Maria Santos', rating: 3, platform: 'Yelp', status: 'escalated', date: 'Aug 7, 2026', text: 'Mixed experience. Some staff were great, others seemed disengaged. I\'d give it another try.', business: 'Coastal Medical' },
  { id: 7, author: 'Tom B.', rating: 5, platform: 'Google', status: 'auto-responded', date: 'Aug 6, 2026', text: 'Best auto shop in town. Honest pricing and great communication.', response: 'Thanks Tom! Honesty is our #1 policy.', business: 'Harbor Auto Shop' },
  { id: 8, author: 'Lisa P.', rating: 5, platform: 'Google', status: 'auto-responded', date: 'Aug 5, 2026', text: 'Wonderful experience from start to finish. Dr. Kim was thorough and gentle.', response: 'Thank you Lisa! Dr. Kim will be thrilled to hear this.', business: 'Downtown Dental' },
]

const DEMO_WORKFLOWS = [
  { id: 1, name: 'Auto-respond to 4-5 star reviews', trigger: '4+ star review received', action: 'Send templated response within 1 hour', active: true, runs: 893, lastRun: '10 min ago' },
  { id: 2, name: 'Escalate 1-2 star reviews', trigger: '1-2 star review received', action: 'Notify business owner via email + SMS', active: true, runs: 147, lastRun: '3h ago' },
  { id: 3, name: 'Flag guideline violations', trigger: 'Review matches violation pattern', action: 'Flag for review + submit removal request', active: true, runs: 38, lastRun: '1d ago' },
  { id: 4, name: 'Weekly digest email', trigger: 'Every Monday 8:00 AM', action: 'Send performance summary to all clients', active: false, runs: 24, lastRun: '6d ago' },
]

const DEMO_MEMBERS = [
  { id: 1, businessName: 'Downtown Dental', contactName: 'Dr. Sarah Lee', email: 'sarah@downtowndental.com', plan: 'Pro', monthlyPrice: 179, status: 'active', startDate: 'Mar 1, 2026', endDate: 'Aug 31, 2026', monthsIn: 6, reviewsThisMonth: 23 },
  { id: 2, businessName: 'Harbor Auto Shop', contactName: 'James Wilson', email: 'james@harborauto.com', plan: 'Growth', monthlyPrice: 109, status: 'active', startDate: 'Apr 1, 2026', endDate: 'Sep 30, 2026', monthsIn: 5, reviewsThisMonth: 31 },
  { id: 3, businessName: 'The Rustic Table', contactName: 'Marco Ricci', email: 'marco@rustictable.com', plan: 'Basic', monthlyPrice: 69, status: 'active', startDate: 'Jun 1, 2026', endDate: 'Nov 30, 2026', monthsIn: 3, reviewsThisMonth: 47 },
  { id: 4, businessName: 'Sunshine Salon', contactName: 'Priya Patel', email: 'priya@sunshinesalon.com', plan: 'Growth', monthlyPrice: 109, status: 'active', startDate: 'May 1, 2026', endDate: 'Oct 31, 2026', monthsIn: 4, reviewsThisMonth: 18 },
  { id: 5, businessName: 'Coastal Medical', contactName: 'Dr. Kevin Nguyen', email: 'kevin@coastalmedical.com', plan: 'Pro', monthlyPrice: 179, status: 'active', startDate: 'Feb 1, 2026', endDate: 'Jul 31, 2026', monthsIn: 6, reviewsThisMonth: 12 },
]

const DEMO_SCAN = {
  lastRun: 'Aug 12, 2026 9:14 AM',
  running: false,
  progress: 100,
  platforms: [
    { name: 'Google', reviewed: 847, flagged: 26, status: 'complete' },
    { name: 'Yelp', reviewed: 400, flagged: 12, status: 'complete' },
  ],
  flagged: [
    { id: 1, business: 'Harbor Auto Shop', platform: 'Google', author: 'Mike D.', reason: 'Wrong business — reviewer confused location', rating: 1, date: 'Aug 11' },
    { id: 2, business: 'Harbor Auto Shop', platform: 'Google', author: 'Competitor_Fake', reason: 'Suspected competitor — no purchase history', rating: 1, date: 'Aug 8' },
    { id: 3, business: 'Downtown Dental', platform: 'Yelp', author: 'N/A', reason: 'Outside business hours / private event', rating: 2, date: 'Jul 30' },
    { id: 4, business: 'Sunshine Salon', platform: 'Google', author: 'Anonymous_1', reason: 'Multiple reviews from same IP address', rating: 1, date: 'Jul 28' },
  ]
}

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'escalation', message: 'New 2-star Yelp review for Sunshine Salon needs attention.', time: '15m ago', read: false },
  { id: 2, type: 'flagged', message: 'Potential fake review flagged for Harbor Auto Shop.', time: '3h ago', read: false },
  { id: 3, type: 'new_review', message: '5-star Google review for Downtown Dental — auto-responded.', time: '1d ago', read: true },
]

const INPUT_STYLE = {
  background: '#0D1B2A', border: '1px solid #1e3a52',
  borderRadius: '8px', color: '#F8FAFC', fontSize: '13px',
  padding: '9px 12px', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', width: '100%',
}

const PLANS = [
  { id: 'basic', name: 'Basic', price: 69 },
  { id: 'growth', name: 'Growth', price: 109 },
  { id: 'pro', name: 'Pro', price: 179 },
]

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function RatingGauge({ rating }) {
  const pct = ((rating - 1) / 4) * 100
  const color = rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : '#F43F5E'
  return (
    <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: '#94a3b8' }}>Average Platform Rating</h3>
      <div style={{ position: 'relative', width: '120px', height: '60px', overflow: 'hidden' }}>
        <svg width="120" height="70" viewBox="0 0 120 70">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#0D1B2A" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`} style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontSize: '26px', fontWeight: 800, color }}>{rating}</span>
          <span style={{ fontSize: '12px', color: '#64748B' }}>/5</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2px', marginTop: '8px' }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: '16px', color: i <= Math.round(rating) ? '#F59E0B' : '#334155' }}>★</span>)}
      </div>
    </div>
  )
}

function DashboardTab({ stats, reviews }) {
  const recent = reviews.slice(0, 4)
  const flagged = reviews.filter(r => r.status === 'flagged').slice(0, 3)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Reviews" value={stats.totalReviews.toLocaleString()} icon={Star} accent="#00C9FF" sub="All time" />
        <StatCard label="Auto-Responded" value={stats.autoResponded.toLocaleString()} icon={CheckCircle} accent="#10B981" sub="By RepuShield" />
        <StatCard label="Flagged" value={stats.flagged} icon={Flag} accent="#F43F5E" sub="Awaiting removal" />
        <StatCard label="Escalated" value={stats.escalated} icon={AlertTriangle} accent="#F59E0B" sub="Need attention" />
        <StatCard label="Avg Rating" value={`${stats.avgRating}★`} icon={TrendingUp} accent="#F59E0B" sub="Across platforms" />
        <StatCard label="Members" value={stats.activeMembers} icon={Users} accent="#00C9FF" sub="Active plans" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>Recent Reviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent.map(r => <ReviewCard key={r.id} review={r} adminMode={false} />)}
          </div>
        </div>
        <RatingGauge rating={stats.avgRating} />
      </div>

      {flagged.length > 0 && (
        <div style={{ background: '#1B2D3E', border: '1px solid #F43F5E30', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Flag size={16} color="#F43F5E" />
            <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#F43F5E' }}>Flagged Reviews</h3>
            <Badge variant="rose">{flagged.length}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flagged.map(r => <ReviewCard key={r.id} review={r} adminMode={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reviews Tab ───────────────────────────────────────────────────────────────
function ReviewsTab({ reviews: initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = reviews.filter(r => {
    if (search && !r.author.toLowerCase().includes(search.toLowerCase()) && !r.text.toLowerCase().includes(search.toLowerCase())) return false
    if (platform !== 'all' && r.platform.toLowerCase() !== platform) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  function updateStatus(id, newStatus) {
    setReviews(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }

  const selectStyle = { background: '#0D1B2A', border: '1px solid #1e3a52', color: '#94a3b8', fontSize: '13px', padding: '7px 12px', borderRadius: '7px', fontFamily: 'inherit', cursor: 'pointer' }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." style={{ ...INPUT_STYLE, paddingLeft: '32px', width: '100%' }} />
        </div>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={selectStyle}>
          <option value="all">All Platforms</option>
          <option value="google">Google</option>
          <option value="yelp">Yelp</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="auto-responded">Auto-Responded</option>
          <option value="escalated">Escalated</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
        Showing {filtered.length} of {reviews.length} reviews
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(r => (
          <ReviewCard
            key={r.id}
            review={r}
            adminMode
            onRespond={id => updateStatus(id, 'responded')}
            onFlag={id => updateStatus(id, 'flagged')}
            onEscalate={id => updateStatus(id, 'escalated')}
          />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#475569', fontSize: '14px', textAlign: 'center', padding: '32px' }}>No reviews match your filters.</p>
        )}
      </div>
    </div>
  )
}

// ─── Workflows Tab ─────────────────────────────────────────────────────────────
function WorkflowsTab({ workflows: initial }) {
  const [workflows, setWorkflows] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editWf, setEditWf] = useState(null)
  const [form, setForm] = useState({ name: '', trigger: '', action: '' })

  function toggleWorkflow(id) {
    setWorkflows(ws => ws.map(w => w.id === id ? { ...w, active: !w.active } : w))
  }

  function deleteWorkflow(id) {
    setWorkflows(ws => ws.filter(w => w.id !== id))
    try { api.deleteWorkflow(id) } catch {}
  }

  function openEdit(wf) {
    setEditWf(wf)
    setForm({ name: wf.name, trigger: wf.trigger, action: wf.action })
    setShowModal(true)
  }

  function openCreate() {
    setEditWf(null)
    setForm({ name: '', trigger: '', action: '' })
    setShowModal(true)
  }

  function saveWorkflow() {
    if (!form.name) return
    if (editWf) {
      setWorkflows(ws => ws.map(w => w.id === editWf.id ? { ...w, ...form } : w))
      try { api.updateWorkflow(editWf.id, form) } catch {}
    } else {
      const newWf = { id: Date.now(), ...form, active: true, runs: 0, lastRun: 'Never' }
      setWorkflows(ws => [...ws, newWf])
      try { api.createWorkflow(form) } catch {}
    }
    setShowModal(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>Automation Workflows</h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Configure automatic actions for review events.</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> New Workflow
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {workflows.map(wf => (
          <div key={wf.id} style={{ background: '#1B2D3E', border: `1px solid ${wf.active ? '#1e3a52' : '#0D1B2A'}`, borderRadius: '12px', padding: '18px 20px', opacity: wf.active ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{wf.name}</span>
                  <Badge variant={wf.active ? 'emerald' : 'slate'}>{wf.active ? 'Active' : 'Paused'}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#0D1B2A', borderRadius: '6px', padding: '8px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Trigger</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{wf.trigger}</p>
                  </div>
                  <div style={{ background: '#0D1B2A', borderRadius: '6px', padding: '8px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Action</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{wf.action}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}><strong style={{ color: '#94a3b8' }}>{wf.runs}</strong> runs total</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Last run: <strong style={{ color: '#94a3b8' }}>{wf.lastRun}</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => openEdit(wf)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #1e3a52', background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteWorkflow(wf.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #F43F5E30', background: 'transparent', color: '#F43F5E', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
                {/* Toggle */}
                <button onClick={() => toggleWorkflow(wf.id)} style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', background: wf.active ? '#10B981' : '#1e3a52', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: wf.active ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '17px' }}>{editWf ? 'Edit Workflow' : 'New Workflow'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[['name', 'Workflow Name'], ['trigger', 'Trigger Condition'], ['action', 'Action to Take']].map(([k, l]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</label>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={l} style={INPUT_STYLE} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveWorkflow} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {editWf ? 'Save Changes' : 'Create Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Compliance Tab ─────────────────────────────────────────────────────────────
function ComplianceTab({ scan: initialScan }) {
  const [scan, setScan] = useState(initialScan)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(100)

  async function runScan() {
    setRunning(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 12, 100)), 300)
    await new Promise(r => setTimeout(r, 4000))
    clearInterval(interval)
    setProgress(100)
    setRunning(false)
    setScan(s => ({ ...s, lastRun: 'Just now' }))
    try { api.runScan() } catch {}
  }

  return (
    <div>
      {/* Scan Header */}
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Compliance Scan</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Last run: {scan.lastRun}</p>
          </div>
          <button onClick={runScan} disabled={running} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px',
            borderRadius: '8px', border: 'none',
            background: running ? '#1e3a52' : 'linear-gradient(135deg, #00C9FF, #0080a0)',
            color: running ? '#64748B' : 'white', fontSize: '13px', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
          }}>
            <RefreshCw size={14} style={{ animation: running ? 'spin 1s linear infinite' : 'none' }} />
            {running ? 'Scanning...' : 'Run New Scan'}
          </button>
        </div>
        {running && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Scanning platforms...</span>
              <span style={{ fontSize: '12px', color: '#00C9FF', fontWeight: 600 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ background: '#0D1B2A', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #00C9FF, #10B981)', transition: 'width 0.3s ease', borderRadius: '999px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Platform Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {scan.platforms.map(p => (
          <div key={p.name} style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</span>
              <Badge variant="emerald">Complete</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ textAlign: 'center', background: '#0D1B2A', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#00C9FF' }}>{p.reviewed}</div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reviewed</div>
              </div>
              <div style={{ textAlign: 'center', background: '#0D1B2A', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F43F5E' }}>{p.flagged}</div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flagged</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flagged List */}
      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Flag size={15} color="#F43F5E" />
          <h3 style={{ fontWeight: 700, fontSize: '15px' }}>Flagged for Removal</h3>
          <Badge variant="rose">{scan.flagged.length}</Badge>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scan.flagged.map(f => (
            <div key={f.id} style={{ background: '#0D1B2A', border: '1px solid #F43F5E20', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{f.business}</span>
                    <Badge variant="rose" size="xs">{f.platform}</Badge>
                    <span style={{ fontSize: '11px', color: '#475569' }}>{f.date}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    <strong style={{ color: '#F43F5E' }}>Reason: </strong>{f.reason}
                  </p>
                  {f.author && f.author !== 'N/A' && (
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '3px 0 0' }}>Reviewer: {f.author}</p>
                  )}
                </div>
                <Badge variant="rose" size="xs">{'★'.repeat(f.rating)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab({ members: initial }) {
  const [members, setMembers] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ businessName: '', contactName: '', email: '', plan: 'growth', businessType: 'Restaurant' })

  const filtered = members.filter(m =>
    m.businessName.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditMember(null)
    setForm({ businessName: '', contactName: '', email: '', plan: 'growth', businessType: 'Restaurant' })
    setShowModal(true)
  }

  function openEdit(m) {
    setEditMember(m)
    setForm({ businessName: m.businessName, contactName: m.contactName, email: m.email, plan: m.plan.toLowerCase(), businessType: 'Restaurant' })
    setShowModal(true)
  }

  function saveMember() {
    if (!form.businessName || !form.email) return
    const planData = PLANS.find(p => p.id === form.plan) || PLANS[1]
    if (editMember) {
      setMembers(ms => ms.map(m => m.id === editMember.id ? { ...m, ...form, plan: planData.name, monthlyPrice: planData.price } : m))
      try { api.updateMember(editMember.id, form) } catch {}
    } else {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setMonth(endDate.getMonth() + 6)
      const newM = {
        id: Date.now(), ...form,
        plan: planData.name, monthlyPrice: planData.price,
        status: 'active', monthsIn: 1, reviewsThisMonth: 0,
        startDate: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      setMembers(ms => [...ms, newM])
      try { api.createMember(form) } catch {}
    }
    setShowModal(false)
  }

  const planColors = { Basic: '#94a3b8', Growth: '#00C9FF', Pro: '#F59E0B' }
  const businessTypes = ['Restaurant', 'Dental', 'Auto Shop', 'Salon', 'Medical', 'Retail', 'Other']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ ...INPUT_STYLE, paddingLeft: '32px' }} />
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={14} /> Add Member
        </button>
      </div>

      <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e3a52' }}>
                {['Business', 'Contact', 'Plan', 'Month', 'Reviews', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #0D1B2A' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{m.businessName}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8' }}>{m.contactName}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: planColors[m.plan] || '#94a3b8' }}>{m.plan}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>${m.monthlyPrice}/mo</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8' }}>
                    {m.monthsIn}/6
                    <div style={{ background: '#0D1B2A', borderRadius: '999px', height: '4px', width: '60px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(m.monthsIn / 6) * 100}%`, height: '100%', background: '#00C9FF', borderRadius: '999px' }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{m.reviewsThisMonth}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={m.status === 'active' ? 'emerald' : 'slate'} size="xs">{m.status}</Badge>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => openEdit(m)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #1e3a52', background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e3a52', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#475569' }}>{filtered.length} members · ${filtered.reduce((s, m) => s + m.monthlyPrice, 0).toLocaleString()}/mo recurring</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1B2D3E', border: '1px solid #1e3a52', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '17px' }}>{editMember ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Name</label>
                <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} style={INPUT_STYLE} placeholder="e.g. Downtown Dental" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Name</label>
                <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} style={INPUT_STYLE} placeholder="Owner's full name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={INPUT_STYLE} placeholder="owner@business.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</label>
                  <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} style={{ ...INPUT_STYLE, appearance: 'none' }}>
                    {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}/mo</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Type</label>
                  <select value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))} style={{ ...INPUT_STYLE, appearance: 'none' }}>
                    {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {/* 6-month note */}
              <div style={{ background: '#F59E0B10', border: '1px solid #F59E0B30', borderRadius: '8px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#F59E0B', margin: 0 }}>
                  ⏱ <strong>6-month minimum commitment</strong> applies to all plans. End date will be set 6 months from today.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #1e3a52', background: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveMember} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00C9FF, #0080a0)', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {editMember ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard')
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)
  const user = getUser()

  function handleMarkRead(id) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const tabTitles = {
    dashboard: 'Dashboard',
    reviews: 'Reviews',
    workflows: 'Workflows',
    compliance: 'Compliance Scan',
    members: 'Members',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D1B2A' }}>
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #1e3a52',
          background: '#0D1B2A', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '2px' }}>{tabTitles[tab] || 'Admin'}</h1>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              RepuShield Admin · {user?.name || user?.email || 'Administrator'}
            </p>
          </div>
          <NotificationBell notifications={notifications} onMarkRead={handleMarkRead} />
        </header>

        <div style={{ padding: '28px' }}>
          {tab === 'dashboard'  && <DashboardTab  stats={DEMO_STATS} reviews={DEMO_REVIEWS} />}
          {tab === 'reviews'    && <ReviewsTab    reviews={DEMO_REVIEWS} />}
          {tab === 'workflows'  && <WorkflowsTab  workflows={DEMO_WORKFLOWS} />}
          {tab === 'compliance' && <ComplianceTab scan={DEMO_SCAN} />}
          {tab === 'members'    && <MembersTab    members={DEMO_MEMBERS} />}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
