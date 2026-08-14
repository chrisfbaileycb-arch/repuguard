import { Router } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

function formatWorkflow(row) {
  let conditions = {}
  try {
    conditions = typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions
  } catch {
    conditions = {}
  }
  return {
    id: row.id,
    name: row.name,
    trigger: row.trigger,
    conditions,
    action: row.action,
    responseTemplate: row.response_template,
    active: row.active,
    runsCount: row.runs_count,
    createdAt: row.created_at
  }
}

// GET /api/workflows
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM workflows ORDER BY created_at DESC')
    return res.json({
      success: true,
      data: { workflows: result.rows.map(formatWorkflow) }
    })
  } catch (err) {
    console.error('GET /api/workflows error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/workflows
router.post('/', async (req, res) => {
  try {
    const { name, trigger, conditions, action, responseTemplate, active } = req.body
    if (!name || !trigger || !action) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'name, trigger, and action are required' }
      })
    }

    const id = randomUUID()
    const conditionsStr = JSON.stringify(conditions || {})
    const createdAt = new Date().toISOString()

    await query(
      'INSERT INTO workflows (id, name, trigger, conditions, action, response_template, active, runs_count, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, name, trigger, conditionsStr, action, responseTemplate || null, active !== false, 0, createdAt]
    )

    const result = await query('SELECT * FROM workflows WHERE id = $1', [id])
    return res.status(201).json({
      success: true,
      data: { workflow: formatWorkflow(result.rows[0]) }
    })
  } catch (err) {
    console.error('POST /api/workflows error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// GET /api/workflows/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM workflows WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workflow not found' }
      })
    }
    return res.json({
      success: true,
      data: { workflow: formatWorkflow(result.rows[0]) }
    })
  } catch (err) {
    console.error('GET /api/workflows/:id error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// PUT /api/workflows/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM workflows WHERE id = $1', [req.params.id])
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workflow not found' }
      })
    }

    const row = existing.rows[0]
    const { name, trigger, conditions, action, responseTemplate, active } = req.body

    const updatedName = name !== undefined ? name : row.name
    const updatedTrigger = trigger !== undefined ? trigger : row.trigger
    const updatedConditions = conditions !== undefined ? JSON.stringify(conditions) : row.conditions
    const updatedAction = action !== undefined ? action : row.action
    const updatedTemplate = responseTemplate !== undefined ? responseTemplate : row.response_template
    const updatedActive = active !== undefined ? active : row.active

    await query(
      'UPDATE workflows SET name = $1, trigger = $2, conditions = $3, action = $4, response_template = $5, active = $6 WHERE id = $7',
      [updatedName, updatedTrigger, updatedConditions, updatedAction, updatedTemplate, updatedActive, req.params.id]
    )

    const result = await query('SELECT * FROM workflows WHERE id = $1', [req.params.id])
    return res.json({
      success: true,
      data: { workflow: formatWorkflow(result.rows[0]) }
    })
  } catch (err) {
    console.error('PUT /api/workflows/:id error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// DELETE /api/workflows/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await query('SELECT id FROM workflows WHERE id = $1', [req.params.id])
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workflow not found' }
      })
    }
    await query('DELETE FROM workflows WHERE id = $1', [req.params.id])
    return res.json({ success: true, data: { deleted: true } })
  } catch (err) {
    console.error('DELETE /api/workflows/:id error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
