import React, { useState, useEffect } from 'react'
import StatCard from './StatCard.jsx'
import ReviewCard from './ReviewCard.jsx'
import Badge from './Badge.jsx'
import { api } from '../api.js'
const getDashboard = () => api.getAdminDashboard()
const respondToReview = (id) => api.respondToReview(id)
const escalateReview = (id) => api.escalateReview(id)
const flagReview = (id, reason) => api.flagReview(id, reason)
import { Star, MessageSquare, AlertTriangle, Flag, Users, Activity, TrendingUp, RefreshCw } from 'lucide-react'

function RatingGauge({ value, max = 5 }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 300)
    return () => clearTimeout(timer)
  }, [value])

  const pct = (animated / max) * 100
  const color = value >= 4 ? '#10B981' : value >= 3 ? '#F59E0B' : '#F43F5E'
  const circumference = 2 * Math.PI * 36
  const dash = (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
        <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r="36" fill="none" stroke="#243447" strokeWidth="7" />
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>/ 5.0</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>Average Rating</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC' }}>{value} ★</div>
        <div style={{ fontSize: '12px', color, marginTop: '4px', fontWeight: 500 }}>
          {value >= 4.5 ? 'Excellent' : value >= 4 ? 'Good' : value >= 3 ? 'Average' : 'Needs Improvement'}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await getDashboard()
      if (res.success !== false) {
        setData(res.data)
        setError(null)
      } else {
        setError(res.error?.message || 'Failed to load dashboard')
      }
    } catch (e) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRespond = async (id) => {
    await respondToReview(id)
    load(true)
  }
  const handleEscalate = async (id) => {
    await escalateReview(id)
    load(true)
  }
  const handleFlag = async (id) => {
    await flagReview(id, 'Guideline Violation')
    load(true)
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => load()} />

  const { stats = {}, recentReviews = [], flaggedReviews = [] } = data || {}

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Reputation Overview
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Monitor and manage your clients' online reputation in real-time
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px',
            background: '#1B2D3E', border: '1px solid #243447',
            borderRadius: '8px', color: '#94A3B8',
            fontSize: '13px', fontWeight: 500,
            cursor: refreshing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s'
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Rating gauge banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2D3E, #162333)',
        border: '1px solid #243447',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <RatingGauge value={stats.avgRating || 4.2} />
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <MiniStat label="This Week" value="+12 reviews" color="#00C9FF" />
          <MiniStat label="Response Rate" value="94%" color="#10B981" />
          <MiniStat label="Escalation Rate" value="8%" color="#F59E0B" />
          <MiniStat label="Flag Rate" value="3%" color="#F43F5E" />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard icon={Star} label="Total Reviews" value={stats.totalReviews ?? 0} accent="cyan" trend={12} />
        <StatCard icon={MessageSquare} label="Auto-Responded" value={stats.autoResponded ?? 0} accent="emerald" sub="Automated replies sent" />
        <StatCard icon={AlertTriangle} label="Escalated" value={stats.escalated ?? 0} accent="amber" sub="Needs manual review" />
        <StatCard icon={Flag} label="Flagged" value={stats.flagged ?? 0} accent="rose" sub="Compliance violations" />
        <StatCard icon={Users} label="Active Members" value={stats.activeMembers ?? 0} accent="violet" />
        <StatCard icon={TrendingUp} label="Avg Rating" value={`${stats.avgRating ?? 0}★`} accent="emerald" sub="Across all platforms" />
      </div>

      {/* Two column section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Reviews */}
        <section>
          <SectionHeader title="Recent Reviews" count={recentReviews.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentReviews.length === 0 ? (
              <EmptyState message="No recent reviews" />
            ) : (
              recentReviews.map(r => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onRespond={handleRespond}
                  onEscalate={handleEscalate}
                  onFlag={handleFlag}
                  compact
                />
              ))
            )}
          </div>
        </section>

        {/* Flagged Reviews */}
        <section>
          <SectionHeader title="Flagged Reviews" count={flaggedReviews.length} accent="rose" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flaggedReviews.length === 0 ? (
              <EmptyState message="No flagged reviews" icon="✓" color="#10B981" />
            ) : (
              flaggedReviews.map(r => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onRespond={handleRespond}
                  onEscalate={handleEscalate}
                  onFlag={handleFlag}
                  compact
                />
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function SectionHeader({ title, count, accent = 'cyan' }) {
  const colors = { cyan: '#00C9FF', rose: '#F43F5E' }
  const color = colors[accent] || colors.cyan
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>{title}</h2>
      <span style={{
        background: color + '22', color, border: `1px solid ${color}44`,
        borderRadius: '999px', fontSize: '11px', fontWeight: 600, padding: '1px 8px'
      }}>{count}</span>
    </div>
  )
}

function EmptyState({ message, icon = '📭', color = '#64748B' }) {
  return (
    <div style={{
      background: '#1B2D3E', border: '1px solid #243447', borderRadius: '10px',
      padding: '32px', textAlign: 'center', color
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px' }}>{message}</div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ height: '32px', width: '200px', background: '#1B2D3E', borderRadius: '8px', marginBottom: '32px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: '110px', background: '#1B2D3E', borderRadius: '12px', animation: 'shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ color: '#F43F5E', fontWeight: 600, marginBottom: '8px' }}>Failed to load dashboard</div>
        <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px' }}>{message}</div>
        <button onClick={onRetry} style={{
          padding: '8px 20px', background: '#00C9FF22', border: '1px solid #00C9FF44',
          borderRadius: '8px', color: '#00C9FF', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '13px', fontWeight: 500
        }}>Retry</button>
      </div>
    </div>
  )
}
