import React from 'react'

export default function StatCard({ label, value, icon: Icon, accent = '#00C9FF', sub, trend }) {
  return (
    <div style={{
      background: '#1B2D3E',
      border: '1px solid #1e3a52',
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '80px', height: '80px',
        background: `radial-gradient(circle at 80% 20%, ${accent}18, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: `${accent}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={accent} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>
          {value ?? '—'}
        </span>
        {trend !== undefined && (
          <span style={{
            fontSize: '12px', fontWeight: 600,
            color: trend >= 0 ? '#10B981' : '#F43F5E'
          }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: '12px', color: '#64748B' }}>{sub}</span>
      )}
    </div>
  )
}
