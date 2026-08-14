import React from 'react'

const variants = {
  emerald: { bg: '#052e16', border: '#10B981', color: '#10B981' },
  amber:   { bg: '#451a03', border: '#F59E0B', color: '#F59E0B' },
  rose:    { bg: '#4c0519', border: '#F43F5E', color: '#F43F5E' },
  cyan:    { bg: '#083344', border: '#00C9FF', color: '#00C9FF' },
  slate:   { bg: '#1e293b', border: '#64748B', color: '#94a3b8' },
  blue:    { bg: '#0c1a3a', border: '#3b82f6', color: '#60a5fa' },
}

export default function Badge({ children, variant = 'slate', size = 'sm' }) {
  const v = variants[variant] || variants.slate
  const padding = size === 'xs' ? '1px 6px' : size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'xs' ? '10px' : size === 'sm' ? '11px' : '12px'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding,
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: '999px',
      color: v.color,
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
