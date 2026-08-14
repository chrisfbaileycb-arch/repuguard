import React from 'react'
import { LayoutDashboard, Star, Bell, FileText, Settings, LogOut, ChevronRight, Shield } from 'lucide-react'
import { removeToken, removeUser } from '../auth.js'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { id: 'reviews',       label: 'My Reviews',    icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'report',        label: 'My Report',     icon: FileText },
  { id: 'settings',      label: 'Settings',      icon: Settings },
]

export default function CustomerSidebar({ activeTab, onTabChange, unreadCount = 0 }) {
  const navigate = useNavigate()

  function handleLogout() {
    removeToken()
    removeUser()
    navigate('/login')
  }

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: '#0D1B2A',
      borderRight: '1px solid #1e3a52',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e3a52' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #00C9FF, #0080a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC', lineHeight: 1 }}>
              RepuShield
            </div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 500 }}>
              My Account
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const active = activeTab === item.id
          const isNotif = item.id === 'notifications'
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', border: 'none',
                background: active ? '#00C9FF18' : 'transparent',
                color: active ? '#00C9FF' : '#64748B',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.15s',
                borderLeft: active ? '2px solid #00C9FF' : '2px solid transparent',
              }}>
              <Icon size={16} />
              {item.label}
              {isNotif && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#F43F5E',
                  color: 'white',
                  fontSize: '10px', fontWeight: 700,
                  minWidth: '16px', height: '16px',
                  borderRadius: '999px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && !isNotif && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e3a52' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '8px', border: 'none',
            background: 'transparent', color: '#64748B', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F43F5E18'; e.currentTarget.style.color = '#F43F5E' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
