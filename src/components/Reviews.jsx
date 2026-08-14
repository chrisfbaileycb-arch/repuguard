import React, { useState, useEffect } from 'react'
import ReviewCard from './ReviewCard.jsx'
import { api } from '../api.js'
const getReviews = (p) => api.getReviews(p)
const respondToReview = (id) => api.respondToReview(id)
const escalateReview = (id) => api.escalateReview(id)
const flagReview = (id, reason) => api.flagReview(id, reason)
import { Search, Filter, RefreshCw, Star } from 'lucide-react'

const platforms = ['all', 'google', 'yelp']
const statuses = ['all', 'pending', 'auto_responded', 'escalated', 'flagged']
const ratings = ['all', '5', '4', '3', '2', '1']

const platformLabels = { all: 'All Platforms', google: 'Google', yelp: 'Yelp' }
const statusLabels = {
  all: 'All Statuses',
  pending: 'Pending',
  auto_responded: 'Auto-Responded',
  escalated: 'Escalated',
  flagged: 'Flagged'
}

function FilterChip({ label, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '6px 14px',
        borderRadius: '999px',
        border: active ? '1px solid #00C9FF66' : '1px solid #243447',
        background: active ? '#00C9FF1A' : hover ? '#1B2D3E' : 'transparent',
        color: active ? '#00C9FF' : hover ? '#F8FAFC' : '#94A3B8',
        fontSize: '12px', fontWeight: active ? 600 : 400,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s', whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    const params = {}
    if (platform !== 'all') params.platform = platform
    if (status !== 'all') params.status = status
    const res = await getReviews(params)
    if (res.success !== false) {
      setReviews(res.data?.reviews || res.data || [])
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [platform, status])

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

  const filtered = reviews.filter(r => {
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.author.toLowerCase().includes(q) &&
          !r.content.toLowerCase().includes(q) &&
          !r.memberName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    auto_responded: reviews.filter(r => r.status === 'auto_responded').length,
    escalated: reviews.filter(r => r.status === 'escalated').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Review Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Monitor, respond, and manage reviews from Google and Yelp
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
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#1B2D3E',
        border: '1px solid #243447',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by author, content, or business..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: '#0D1B2A', border: '1px solid #243447',
              borderRadius: '8px', color: '#F8FAFC',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none'
            }}
          />
        </div>

        {/* Platform filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>Platform:</span>
          {platforms.map(p => (
            <FilterChip key={p} label={platformLabels[p]} active={platform === p} onClick={() => setPlatform(p)} />
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>Status:</span>
          {statuses.map(s => (
            <FilterChip
              key={s}
              label={`${statusLabels[s]}${s !== 'all' ? ` (${counts[s]})` : ` (${counts.all})`}`}
              active={status === s}
              onClick={() => setStatus(s)}
            />
          ))}
        </div>

        {/* Rating filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>Rating:</span>
          {ratings.map(r => (
            <FilterChip
              key={r}
              label={r === 'all' ? 'All Ratings' : `${r} ★`}
              active={ratingFilter === r}
              onClick={() => setRatingFilter(r)}
            />
          ))}
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
        Showing <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{filtered.length}</span> reviews
        {(search || ratingFilter !== 'all') && ` (filtered from ${reviews.length})`}
      </div>

      {/* Review list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              height: '140px', background: '#1B2D3E', borderRadius: '10px',
              animation: 'shimmer 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447', borderRadius: '12px',
          padding: '48px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <div style={{ color: '#F8FAFC', fontWeight: 600, marginBottom: '8px' }}>No reviews found</div>
          <div style={{ color: '#64748B', fontSize: '13px' }}>Try adjusting your filters or search query</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              onRespond={handleRespond}
              onEscalate={handleEscalate}
              onFlag={handleFlag}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
