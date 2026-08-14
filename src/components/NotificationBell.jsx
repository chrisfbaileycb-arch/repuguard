import React, { useState, useRef, useEffect } from 'react'
import { Bell, Check, Info, AlertTriangle, Flag, CheckCircle } from 'lucide-react'

const typeConfig = {
  new_review:  { icon: Info,         color: '#3b82f6' },
  escalation:  { icon: AlertTriangle, color: '#F59E0B' },
  flagged:     { icon: Flag,          color: '#F43F5E' },
  resolved:    { icon: CheckCircle,   color: '#10B981' },
}

export default function NotificationBell({ notifications = [], onMarkRead }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: open ? '#1B2D3E' : 'transparent',
          border: '1px solid',
          borderColor: open ? '#00C9FF40' : '#1e3a52',
          borderRadius: '8px',
          padding: '7px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
        <Bell size={18} color={open ? '#00C9FF' : '#64748B'} />
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px', right: '-4px',
            background: '#F43F5E',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0D1B2A',
            padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          background: '#1B2D3E',
          border: '1px solid #1e3a52',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #1e3a52',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
              Notifications
            </span>
            {unread > 0 && onMarkRead && (
              <button
                onClick={() => notifications.filter(n => !n.read).forEach(n => onMarkRead(n.id))}
                style={{
                  background: 'none', border: 'none',
                  color: '#00C9FF', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map(n => {
                const cfg = typeConfig[n.type] || typeConfig.new_review
                const TypeIcon = cfg.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead && !n.read && onMarkRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #0D1B2A',
                      cursor: onMarkRead ? 'pointer' : 'default',
                      background: n.read ? 'transparent' : '#00C9FF08',
                      borderLeft: n.read ? 'none' : `3px solid ${cfg.color}`,
                      transition: 'background 0.15s',
                    }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: `${cfg.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <TypeIcon size={13} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: '#F8FAFC', margin: 0, lineHeight: '1.5', fontWeight: n.read ? 400 : 600 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        {n.time || n.createdAt || 'Recently'}
                      </span>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: cfg.color, flexShrink: 0, marginTop: '6px',
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
