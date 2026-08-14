import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

function formatMember(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    businessName: row.business_name,
    contactName: row.contact_name,
    phone: row.phone,
    businessType: row.business_type,
    plan: row.plan,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    googleConnected: row.google_connected,
    yelpConnected: row.yelp_connected,
    createdAt: row.created_at
  }
}

function validateDates(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const minEnd = new Date(start)
  minEnd.setMonth(minEnd.getMonth() + 6)
  if (end < minEnd) {
    return { valid: false, message: 'endDate must be at least 6 months after startDate' }
  }
  return { valid: true }
}

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM users WHERE role = 'customer' ORDER BY created_at DESC"
    )
    return res.json({
      success: true,
      data: { members: result.rows.map(formatMember) }
    })
  } catch (err) {
    console.error('GET /api/members error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { email, password, businessName, contactName, phone, businessType, plan, startDate, endDate } = req.body

    if (!email || !password || !businessName || !contactName) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'email, password, businessName, and contactName are required' }
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' }
      })
    }

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' }
      })
    }

    const now = new Date()
    const resolvedStart = startDate ? new Date(startDate) : now
    let resolvedEnd = endDate ? new Date(endDate) : null
    const minEnd = new Date(resolvedStart)
    minEnd.setMonth(minEnd.getMonth() + 6)

    if (!resolvedEnd || resolvedEnd < minEnd) {
      resolvedEnd = minEnd
    }

    const dateCheck = validateDates(resolvedStart.toISOString(), resolvedEnd.toISOString())
    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: dateCheck.message }
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const id = randomUUID()
    const createdAt = now.toISOString()

    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, phone, business_type, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        email.toLowerCase(),
        passwordHash,
        'customer',
        businessName,
        contactName,
        phone || null,
        businessType || null,
        plan || 'basic',
        resolvedStart.toISOString(),
        resolvedEnd.toISOString(),
        'active',
        false,
        false,
        createdAt
      ]
    )

    const result = await query('SELECT * FROM users WHERE id = $1', [id])
    return res.status(201).json({
      success: true,
      data: { member: formatMember(result.rows[0]) }
    })
  } catch (err) {
    console.error('POST /api/members error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM users WHERE id = $1 AND role = 'customer'",
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' }
      })
    }

    // Get their review stats
    const reviewResult = await query(
      'SELECT status, COUNT(*) as count FROM reviews WHERE member_id = $1 GROUP BY status',
      [req.params.id]
    )
    const reviewStats = {}
    reviewResult.rows.forEach(r => { reviewStats[r.status] = parseInt(r.count) })

    return res.json({
      success: true,
      data: {
        member: formatMember(result.rows[0]),
        reviewStats
      }
    })
  } catch (err) {
    console.error('GET /api/members/:id error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await query(
      "SELECT * FROM users WHERE id = $1 AND role = 'customer'",
      [req.params.id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' }
      })
    }

    const row = existing.rows[0]
    const { businessName, contactName, phone, businessType, plan, startDate, endDate, status } = req.body

    const updatedStart = startDate ? new Date(startDate).toISOString() : row.start_date
    const updatedEnd = endDate ? new Date(endDate).toISOString() : row.end_date

    if (updatedStart && updatedEnd) {
      const dateCheck = validateDates(updatedStart, updatedEnd)
      if (!dateCheck.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: dateCheck.message }
        })
      }
    }

    await query(
      `UPDATE users SET
        business_name = $1, contact_name = $2, phone = $3, business_type = $4,
        plan = $5, start_date = $6, end_date = $7, status = $8
       WHERE id = $9`,
      [
        businessName !== undefined ? businessName : row.business_name,
        contactName !== undefined ? contactName : row.contact_name,
        phone !== undefined ? phone : row.phone,
        businessType !== undefined ? businessType : row.business_type,
        plan !== undefined ? plan : row.plan,
        updatedStart,
        updatedEnd,
        status !== undefined ? status : row.status,
        req.params.id
      ]
    )

    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id])
    return res.json({
      success: true,
      data: { member: formatMember(result.rows[0]) }
    })
  } catch (err) {
    console.error('PUT /api/members/:id error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
