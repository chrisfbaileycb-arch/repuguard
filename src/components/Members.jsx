import React, { useState, useEffect } from 'react'
import Badge from './Badge.jsx'
import { api } from '../api.js'
const getMembers = () => api.getMembers()
const createMember = (d) => api.createMember(d)
const updateMember = (id, d) => api.updateMember(id, d)
import { Plus, Edit2, Eye, Star, X, AlertCircle, Check } from 'lucide-react'

const plans = [
  { value: 'basic', label: 'Basic', price: '$69/mo' },
  { value: 'growth', label: 'Growth', price: '$109/mo' },
  { value: 'pro', label: 'Pro', price: '$179/mo' }
]

function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function toDateInput(iso) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function PlatformDot({ active, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '11px',
      color: active ? '#94A3B8' : '#394558',
      fontWeight: active ? 500 : 400
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: active ? '#00C9FF' : '#243447'
      }} />
      {label}
    </span>
  )
}

function RatingMini({ value }) {
  const color = value >= 4 ? '#10B981' : value >= 3 ? '#F59E0B' : '#F43F5E'
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color, fontWeight: 600, fontSize: '13px' }}>
      <Star size={12} fill={color} color={color} />
      {value?.toFixed(1) ?? '—'}
    </span>
  )
}

function MemberModal({ member, onClose, onSave }) {
  const isEdit = !!member?.id
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    businessName: member?.businessName || '',
    contactName: member?.contactName || '',
    email: member?.email || '',
    phone: member?.phone || '',
    plan: member?.plan || 'starter',
    startDate: toDateInput(member?.startDate) || today,
    endDate: toDateInput(member?.endDate) || addMonths(today, 6),
    status: member?.status || 'active',
    platforms: {
      google: member?.platforms?.google ?? true,
      yelp: member?.platforms?.yelp ?? false
    }
  })
  const [saving, setSaving] = useState(false)
  const [endDateWarning, setEndDateWarning] = useState(false)

  const set = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val }
      // When start date changes, enforce min end date
      if (key === 'startDate') {
        const minEnd = addMonths(val, 6)
        if (next.endDate < minEnd) {
          next.endDate = minEnd
        }
      }
      // Validate end date
      if (key === 'endDate') {
        const minEnd = addMonths(f.startDate, 6)
        setEndDateWarning(val < minEnd)
      }
      return next
    })
  }

  const setPlatform = (key, val) => setForm(f => ({ ...f, platforms: { ...f.platforms, [key]: val } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const minEnd = addMonths(form.startDate, 6)
    if (form.endDate < minEnd) {
      setEndDateWarning(true)
      return
    }
    setSaving(true)
    await onSave({ ...form, startDate: form.startDate + 'T00:00:00Z', endDate: form.endDate + 'T00:00:00Z' })
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1B2D3E', border: '1px solid #243447',
        borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflow: 'auto'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #243447',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0,
          background: '#1B2D3E', zIndex: 1
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Business info */}
          <SectionLabel>Business Information</SectionLabel>
          <Field label="Business Name">
            <input type="text" value={form.businessName} onChange={e => set('businessName', e.target.value)}
              placeholder="e.g. Sunrise Dental" required style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Contact Name">
              <input type="text" value={form.contactName} onChange={e => set('contactName', e.target.value)}
                placeholder="John Smith" required style={inputStyle} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="(555) 000-0000" style={inputStyle} />
            </Field>
          </div>
          <Field label="Email Address">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="owner@business.com" required style={inputStyle} />
          </Field>

          {/* Plan */}
          <SectionLabel>Membership Plan</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {plans.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('plan', p.value)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: form.plan === p.value ? '1px solid #00C9FF66' : '1px solid #243447',
                  background: form.plan === p.value ? '#00C9FF1A' : '#0D1B2A',
                  color: form.plan === p.value ? '#00C9FF' : '#94A3B8',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center', transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: form.plan === p.value ? '#00C9FF88' : '#64748B', marginTop: '2px' }}>{p.price}</div>
              </button>
            ))}
          </div>

          {/* Dates */}
          <SectionLabel>Membership Duration</SectionLabel>
          <div style={{
            background: '#F59E0B11', border: '1px solid #F59E0B33',
            borderRadius: '8px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', color: '#F59E0B'
          }}>
            <AlertCircle size={14} />
            Minimum 6-month membership for reputation repair
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                style={inputStyle} />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={form.endDate}
                min={addMonths(form.startDate, 6)}
                onChange={e => set('endDate', e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: endDateWarning ? '#F43F5E66' : '#243447'
                }}
              />
            </Field>
          </div>
          {endDateWarning && (
            <div style={{ fontSize: '12px', color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={12} />
              End date must be at least 6 months after start date
            </div>
          )}

          {/* Platforms */}
          <SectionLabel>Platforms</SectionLabel>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'google', label: 'Google Reviews', color: '#4285F4' },
              { key: 'yelp', label: 'Yelp', color: '#EF5350' }
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPlatform(p.key, !form.platforms[p.key])}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '8px',
                  border: form.platforms[p.key] ? `1px solid ${p.color}55` : '1px solid #243447',
                  background: form.platforms[p.key] ? p.color + '1A' : '#0D1B2A',
                  color: form.platforms[p.key] ? p.color : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 500, transition: 'all 0.15s'
                }}
              >
                {form.platforms[p.key] && <Check size={13} />}
                {p.label}
              </button>
            ))}
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <>
              <SectionLabel>Status</SectionLabel>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['active', 'pending', 'expired'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    style={{
                      flex: 1, padding: '8px',
                      borderRadius: '8px',
                      border: form.status === s ? '1px solid #00C9FF44' : '1px solid #243447',
                      background: form.status === s ? '#00C9FF11' : '#0D1B2A',
                      color: form.status === s ? '#00C9FF' : '#64748B',
                      cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
                      transition: 'all 0.15s'
                    }}
                  >{s}</button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid #243447' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', background: 'none',
              border: '1px solid #243447', borderRadius: '8px',
              color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
            }}>Cancel</button>
            <button type="submit" disabled={saving || endDateWarning} style={{
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #00C9FF22, #00C9FF33)',
              border: '1px solid #00C9FF66',
              borderRadius: '8px', color: '#00C9FF',
              cursor: saving || endDateWarning ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
              opacity: saving || endDateWarning ? 0.6 : 1
            }}>
              {saving ? 'Saving…' : isEdit ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, color: '#64748B',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      paddingBottom: '2px', borderBottom: '1px solid #243447'
    }}>{children}</div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  background: '#0D1B2A', border: '1px solid #243447',
  borderRadius: '8px', color: '#F8FAFC',
  fontSize: '13px', fontFamily: 'inherit', outline: 'none'
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [viewMember, setViewMember] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await getMembers()
    if (res.success !== false) setMembers(res.data?.members || res.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (payload) => {
    if (modal?.id) {
      const res = await updateMember(modal.id, payload)
      if (res.success !== false) {
        setMembers(prev => prev.map(m => m.id === modal.id ? (res.data?.member || res.data) : m))
      }
    } else {
      const res = await createMember(payload)
      if (res.success !== false) {
        setMembers(prev => [...prev, res.data?.member || res.data])
      }
    }
    setModal(null)
  }

  const statusCounts = {
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    expired: members.filter(m => m.status === 'expired').length,
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Client Members
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Manage business memberships with 6-month minimum contracts
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #00C9FF22, #00C9FF11)',
            border: '1px solid #00C9FF44',
            borderRadius: '8px', color: '#00C9FF',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Active', value: statusCounts.active, color: '#10B981' },
          { label: 'Pending', value: statusCounts.pending, color: '#F59E0B' },
          { label: 'Expired', value: statusCounts.expired, color: '#F43F5E' },
          { label: 'Total', value: members.length, color: '#00C9FF' }
        ].map(s => (
          <div key={s.label} style={{
            background: '#1B2D3E', border: '1px solid #243447',
            borderRadius: '10px', padding: '12px 20px',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '56px', background: '#1B2D3E', borderRadius: '8px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447', borderRadius: '12px',
          padding: '48px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
          <div style={{ color: '#F8FAFC', fontWeight: 600, marginBottom: '8px' }}>No members yet</div>
          <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>Add your first client to get started</div>
          <button onClick={() => setModal('new')} style={{
            padding: '8px 20px', background: '#00C9FF22',
            border: '1px solid #00C9FF44', borderRadius: '8px',
            color: '#00C9FF', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
          }}>Add First Member</button>
        </div>
      ) : (
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 100px',
            gap: '0',
            padding: '12px 20px',
            borderBottom: '1px solid #243447',
            background: '#162333'
          }}>
            {['Business', 'Contact', 'Plan', 'Status', 'Start Date', 'End Date', 'Avg Rating', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {members.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              isLast={i === members.length - 1}
              onEdit={() => setModal(m)}
              onView={() => setViewMember(m)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewMember && (
        <MemberDetailModal member={viewMember} onClose={() => setViewMember(null)} onEdit={() => { setModal(viewMember); setViewMember(null) }} />
      )}

      {modal && (
        <MemberModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}

function MemberRow({ member, isLast, onEdit, onView }) {
  const [hover, setHover] = useState(false)
  const startStr = new Date(member.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  const endStr = new Date(member.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

  const isExpiringSoon = (() => {
    const diff = new Date(member.endDate).getTime() - Date.now()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
  })()

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 100px',
        gap: '0',
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid #1a2a3a',
        background: hover ? '#1E3347' : 'transparent',
        transition: 'background 0.15s',
        alignItems: 'center'
      }}
    >
      {/* Business */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{member.businessName}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <PlatformDot active={member.platforms?.google} label="G" />
          <PlatformDot active={member.platforms?.yelp} label="Y" />
        </div>
      </div>

      {/* Contact */}
      <div>
        <div style={{ fontSize: '13px', color: '#94A3B8' }}>{member.contactName}</div>
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
      </div>

      {/* Plan */}
      <div>
        <Badge variant={member.plan} size="xs">{member.plan.charAt(0).toUpperCase() + member.plan.slice(1)}</Badge>
      </div>

      {/* Status */}
      <div>
        <Badge variant={member.status} dot size="xs">{member.status.charAt(0).toUpperCase() + member.status.slice(1)}</Badge>
      </div>

      {/* Start */}
      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{startStr}</div>

      {/* End */}
      <div>
        <div style={{ fontSize: '12px', color: isExpiringSoon ? '#F59E0B' : '#94A3B8' }}>{endStr}</div>
        {isExpiringSoon && <div style={{ fontSize: '10px', color: '#F59E0B' }}>Expiring soon</div>}
      </div>

      {/* Rating */}
      <div><RatingMini value={member.avgRating} /></div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <RowBtn icon={Eye} title="View" onClick={onView} />
        <RowBtn icon={Edit2} title="Edit" onClick={onEdit} />
      </div>
    </div>
  )
}

function RowBtn({ icon: Icon, title, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '28px', height: '28px', borderRadius: '6px',
        background: hover ? '#243447' : 'transparent',
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: hover ? '#00C9FF' : '#64748B',
        transition: 'all 0.15s'
      }}
    >
      <Icon size={13} />
    </button>
  )
}

function MemberDetailModal({ member, onClose, onEdit }) {
  const startStr = new Date(member.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const endStr = new Date(member.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1B2D3E', border: '1px solid #243447',
        borderRadius: '16px', width: '100%', maxWidth: '480px'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #243447',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{member.businessName}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onEdit} style={{
              padding: '5px 12px', background: '#00C9FF11',
              border: '1px solid #00C9FF33', borderRadius: '6px',
              color: '#00C9FF', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit'
            }}>Edit</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DetailRow label="Contact" value={member.contactName} />
          <DetailRow label="Email" value={member.email} mono />
          <DetailRow label="Phone" value={member.phone} />
          <DetailRow label="Plan">
            <Badge variant={member.plan}>{member.plan.charAt(0).toUpperCase() + member.plan.slice(1)}</Badge>
          </DetailRow>
          <DetailRow label="Status">
            <Badge variant={member.status} dot>{member.status.charAt(0).toUpperCase() + member.status.slice(1)}</Badge>
          </DetailRow>
          <DetailRow label="Start Date" value={startStr} />
          <DetailRow label="End Date" value={endStr} />
          <DetailRow label="Platforms">
            <div style={{ display: 'flex', gap: '8px' }}>
              {member.platforms?.google && <Badge variant="google" size="xs">Google</Badge>}
              {member.platforms?.yelp && <Badge variant="yelp" size="xs">Yelp</Badge>}
            </div>
          </DetailRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px', borderTop: '1px solid #243447' }}>
            <MetricBox label="Total Reviews" value={member.reviewCount} color="#00C9FF" />
            <MetricBox label="Avg Rating" value={`${member.avgRating?.toFixed(1)} ★`} color={member.avgRating >= 4 ? '#10B981' : '#F59E0B'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, minWidth: '80px' }}>{label}</span>
      {children || (
        <span style={{ fontSize: '13px', color: '#F8FAFC', fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>
          {value || '—'}
        </span>
      )}
    </div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: '#0D1B2A', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>{label}</div>
    </div>
  )
}
