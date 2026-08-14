import React from 'react'
import Badge from './Badge.jsx'
import { MessageSquare, Flag, AlertTriangle, Star } from 'lucide-react'

const statusConfig = {
  'auto-responded': { label: 'Auto-Responded', variant: 'emerald' },
  'responded':      { label: 'Responded', variant: 'emerald' },
  'escalated':      { label: 'Escalated', variant: 'amber' },
  'flagged':        { label: 'Flagged', variant: 'rose' },
  'pending':        { label: 'Pending', variant: 'slate' },
  'resolved':       { label: 'Resolved', variant: 'emerald' },
}

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={13}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
          color={i <= rating ? '#F59E0B' : '#334155'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

export default function ReviewCard({ review, onRespond, onFlag, onEscalate, adminMode = false }) {
  const status = statusConfig[review.status] || statusConfig['pending']
  const isLowRating = review.rating <= 3

  return (
    <div style={{
      background: '#1B2D3E',
      border: `1px solid ${isLowRating && review.status === 'escalated' ? '#F59E0B40' : review.status === 'flagged' ? '#F43F5E40' : '#1e3a52'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
              {review.author || 'Anonymous'}
            </span>
            <StarRating rating={review.rating || 5} />
            <Badge variant={review.platform === 'Google' ? 'blue' : 'amber'} size="xs">
              {review.platform || 'Google'}
            </Badge>
          </div>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            {review.date || review.createdAt || 'Recently'}
          </span>
        </div>
        <Badge variant={status.variant} size="xs">{status.label}</Badge>
      </div>

      <p style={{
        fontSize: '13px',
        color: '#94a3b8',
        lineHeight: '1.6',
        margin: 0,
      }}>
        {review.text || review.content || 'No review text provided.'}
      </p>

      {review.response && (
        <div style={{
          background: '#0D1B2A',
          border: '1px solid #10B98130',
          borderRadius: '8px',
          padding: '10px 14px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', display: 'block', marginBottom: '4px' }}>
            ✓ Owner Response
          </span>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
            {review.response}
          </p>
        </div>
      )}

      {adminMode && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid #1e3a52' }}>
          {onRespond && review.status !== 'responded' && review.status !== 'auto-responded' && (
            <button
              onClick={() => onRespond(review.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px', border: '1px solid #00C9FF40',
                background: '#00C9FF15', color: '#00C9FF', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
              }}>
              <MessageSquare size={12} /> Respond
            </button>
          )}
          {onEscalate && review.status !== 'escalated' && (
            <button
              onClick={() => onEscalate(review.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px', border: '1px solid #F59E0B40',
                background: '#F59E0B15', color: '#F59E0B', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
              }}>
              <AlertTriangle size={12} /> Escalate
            </button>
          )}
          {onFlag && review.status !== 'flagged' && (
            <button
              onClick={() => onFlag(review.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px', border: '1px solid #F43F5E40',
                background: '#F43F5E15', color: '#F43F5E', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
              }}>
              <Flag size={12} /> Flag
            </button>
          )}
        </div>
      )}
    </div>
  )
}
