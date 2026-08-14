import React, { useState, useEffect } from 'react'
import Badge from './Badge.jsx'
import { api } from '../api.js'
const getWorkflows = () => api.getWorkflows()
const createWorkflow = (d) => api.createWorkflow(d)
const updateWorkflow = (id, d) => api.updateWorkflow(id, d)
const deleteWorkflow = (id) => api.deleteWorkflow(id)
import { Plus, Zap, AlertTriangle, Flag, Bell, Trash2, Edit2, X, ChevronDown } from 'lucide-react'

const triggerLabels = {
  rating_above: 'Rating Above',
  rating_below: 'Rating Below',
  keyword_match: 'Keyword Match',
  new_review: 'New Review'
}

const actionLabels = {
  auto_respond: 'Auto Respond',
  escalate: 'Escalate',
  flag: 'Flag',
  notify: 'Notify'
}

const actionColors = {
  auto_respond: '#10B981',
  escalate: '#F59E0B',
  flag: '#F43F5E',
  notify: '#00C9FF'
}

const actionIcons = {
  auto_respond: Zap,
  escalate: AlertTriangle,
  flag: Flag,
  notify: Bell
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '40px', height: '22px',
        borderRadius: '11px',
        background: checked ? '#00C9FF' : '#243447',
        border: 'none', cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '21px' : '3px',
        width: '16px', height: '16px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </button>
  )
}

function WorkflowCard({ workflow, onToggle, onDelete, onEdit }) {
  const [delConfirm, setDelConfirm] = useState(false)
  const color = actionColors[workflow.action] || '#00C9FF'
  const ActionIcon = actionIcons[workflow.action] || Zap

  const triggerDesc = () => {
    if (workflow.trigger === 'rating_above') return `Rating > ${workflow.conditions?.minRating ?? 3}`
    if (workflow.trigger === 'rating_below') return `Rating < ${workflow.conditions?.maxRating ?? 4}`
    if (workflow.trigger === 'keyword_match') return `Keywords: ${(workflow.conditions?.keywords || []).join(', ')}`
    return 'Any new review'
  }

  return (
    <div style={{
      background: '#1B2D3E',
      border: `1px solid ${workflow.active ? '#243447' : '#1B2D3E'}`,
      borderLeft: `3px solid ${workflow.active ? color : '#243447'}`,
      borderRadius: '10px',
      padding: '20px',
      opacity: workflow.active ? 1 : 0.65,
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '7px',
              background: color + '22', border: `1px solid ${color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <ActionIcon size={15} color={color} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>{workflow.name}</span>
            <Badge variant={workflow.active ? 'success' : 'default'} dot>
              {workflow.active ? 'Active' : 'Paused'}
            </Badge>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <InfoChip label="Trigger" value={triggerLabels[workflow.trigger]} />
            <InfoChip label="Action" value={actionLabels[workflow.action]} color={color} />
            <InfoChip label="Runs" value={workflow.runsCount?.toLocaleString() ?? '0'} />
          </div>

          {workflow.responseTemplate && (
            <div style={{
              padding: '10px 14px',
              background: '#10B98111', border: '1px solid #10B98122',
              borderRadius: '6px',
              fontSize: '12px', color: '#94A3B8', lineHeight: '1.5',
              marginTop: '4px'
            }}>
              <span style={{ color: '#10B981', fontWeight: 600 }}>Template: </span>
              {workflow.responseTemplate}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <Toggle checked={workflow.active} onChange={(v) => onToggle(workflow.id, v)} />
          <IconBtn icon={Edit2} title="Edit" onClick={() => onEdit(workflow)} />
          {delConfirm ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <IconBtn icon={Trash2} title="Confirm delete" color="#F43F5E" onClick={() => onDelete(workflow.id)} />
              <IconBtn icon={X} title="Cancel" onClick={() => setDelConfirm(false)} />
            </div>
          ) : (
            <IconBtn icon={Trash2} title="Delete" onClick={() => setDelConfirm(true)} />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoChip({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '3px 9px',
      background: '#0D1B2A',
      border: '1px solid #243447',
      borderRadius: '5px',
      fontSize: '12px'
    }}>
      <span style={{ color: '#64748B' }}>{label}:</span>
      <span style={{ color: color || '#94A3B8', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function IconBtn({ icon: Icon, title, onClick, color = '#64748B' }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '30px', height: '30px',
        borderRadius: '6px',
        background: hover ? '#243447' : 'transparent',
        border: '1px solid transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: hover ? color : '#64748B',
        transition: 'all 0.15s'
      }}
    >
      <Icon size={14} />
    </button>
  )
}

function WorkflowModal({ workflow, onClose, onSave }) {
  const isEdit = !!workflow?.id
  const [form, setForm] = useState({
    name: workflow?.name || '',
    trigger: workflow?.trigger || 'rating_above',
    action: workflow?.action || 'auto_respond',
    conditions: {
      minRating: workflow?.conditions?.minRating ?? 4,
      maxRating: workflow?.conditions?.maxRating ?? 3,
      keywords: (workflow?.conditions?.keywords || []).join(', ')
    },
    responseTemplate: workflow?.responseTemplate || '',
    active: workflow?.active ?? true
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setCondition = (key, val) => setForm(f => ({ ...f, conditions: { ...f.conditions, [key]: val } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      trigger: form.trigger,
      action: form.action,
      conditions: {
        minRating: form.conditions.minRating ? parseInt(form.conditions.minRating) : undefined,
        maxRating: form.conditions.maxRating ? parseInt(form.conditions.maxRating) : undefined,
        keywords: form.conditions.keywords ? form.conditions.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
      },
      responseTemplate: form.action === 'auto_respond' ? form.responseTemplate : undefined,
      active: form.active
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1B2D3E', border: '1px solid #243447',
        borderRadius: '16px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflow: 'auto'
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #243447',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            {isEdit ? 'Edit Workflow' : 'New Workflow'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Workflow Name">
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. High Rating Auto-Response"
              required
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Trigger">
              <select value={form.trigger} onChange={e => set('trigger', e.target.value)} style={inputStyle}>
                {Object.entries(triggerLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Action">
              <select value={form.action} onChange={e => set('action', e.target.value)} style={inputStyle}>
                {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          {(form.trigger === 'rating_above') && (
            <Field label="Minimum Rating">
              <select value={form.conditions.minRating} onChange={e => setCondition('minRating', e.target.value)} style={inputStyle}>
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} stars</option>)}
              </select>
            </Field>
          )}
          {(form.trigger === 'rating_below') && (
            <Field label="Maximum Rating">
              <select value={form.conditions.maxRating} onChange={e => setCondition('maxRating', e.target.value)} style={inputStyle}>
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} stars</option>)}
              </select>
            </Field>
          )}
          {form.trigger === 'keyword_match' && (
            <Field label="Keywords (comma separated)">
              <input
                type="text"
                value={form.conditions.keywords}
                onChange={e => setCondition('keywords', e.target.value)}
                placeholder="e.g. terrible, refund, manager"
                style={inputStyle}
              />
            </Field>
          )}

          {form.action === 'auto_respond' && (
            <Field label="Response Template">
              <textarea
                value={form.responseTemplate}
                onChange={e => set('responseTemplate', e.target.value)}
                placeholder="Thank you for your review! We appreciate your feedback..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Toggle checked={form.active} onChange={v => set('active', v)} />
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>Activate workflow immediately</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid #243447' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', background: 'none',
              border: '1px solid #243447', borderRadius: '8px',
              color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #00C9FF22, #00C9FF33)',
              border: '1px solid #00C9FF66',
              borderRadius: '8px', color: '#00C9FF',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
              opacity: saving ? 0.7 : 1
            }}>{saving ? 'Saving…' : isEdit ? 'Update Workflow' : 'Create Workflow'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
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

export default function Workflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | workflow object

  const load = async () => {
    setLoading(true)
    const res = await getWorkflows()
    if (res.success !== false) setWorkflows(res.data?.workflows || res.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id, active) => {
    const wf = workflows.find(w => w.id === id)
    if (!wf) return
    const res = await updateWorkflow(id, { ...wf, active })
    if (res.success !== false) {
      setWorkflows(prev => prev.map(w => w.id === id ? (res.data?.workflow || res.data) : w))
    }
  }

  const handleDelete = async (id) => {
    await deleteWorkflow(id)
    setWorkflows(prev => prev.filter(w => w.id !== id))
  }

  const handleSave = async (payload) => {
    if (modal?.id) {
      const res = await updateWorkflow(modal.id, payload)
      if (res.success !== false) {
        setWorkflows(prev => prev.map(w => w.id === modal.id ? (res.data?.workflow || res.data) : w))
      }
    } else {
      const res = await createWorkflow(payload)
      if (res.success !== false) {
        setWorkflows(prev => [...prev, res.data?.workflow || res.data])
      }
    }
    setModal(null)
  }

  const activeCount = workflows.filter(w => w.active).length
  const totalRuns = workflows.reduce((s, w) => s + (w.runsCount || 0), 0)

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Automation Workflows
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Configure auto-respond and escalation rules for incoming reviews
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
          New Workflow
        </button>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: '16px',
        marginBottom: '24px', flexWrap: 'wrap'
      }}>
        {[
          { label: 'Total Workflows', value: workflows.length, color: '#00C9FF' },
          { label: 'Active', value: activeCount, color: '#10B981' },
          { label: 'Paused', value: workflows.length - activeCount, color: '#F59E0B' },
          { label: 'Total Runs', value: totalRuns.toLocaleString(), color: '#A78BFA' }
        ].map(s => (
          <div key={s.label} style={{
            flex: '1', minWidth: '120px',
            background: '#1B2D3E', border: '1px solid #243447',
            borderRadius: '10px', padding: '14px 18px'
          }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Workflow list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: '100px', background: '#1B2D3E', borderRadius: '10px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div style={{
          background: '#1B2D3E', border: '1px solid #243447', borderRadius: '12px',
          padding: '48px', textAlign: 'center'
        }}>
          <Zap size={32} color="#243447" style={{ marginBottom: '12px' }} />
          <div style={{ color: '#F8FAFC', fontWeight: 600, marginBottom: '8px' }}>No workflows yet</div>
          <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>
            Create automation rules to handle reviews automatically
          </div>
          <button onClick={() => setModal('new')} style={{
            padding: '8px 20px', background: '#00C9FF22',
            border: '1px solid #00C9FF44', borderRadius: '8px',
            color: '#00C9FF', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
          }}>Create First Workflow</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workflows.map(wf => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={(wf) => setModal(wf)}
            />
          ))}
        </div>
      )}

      {modal && (
        <WorkflowModal
          workflow={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}
