import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

function formatUser(row) {
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

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Invalid email address' }
      })
    }

    // Check if this email is a designated admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@repushield.com').split(',').map(e => e.trim().toLowerCase())
    const isAdminEmail = adminEmails.includes(email.toLowerCase())
    const role = isAdminEmail ? 'admin' : 'customer'

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' }
      })
    }

    const now = new Date()
    const passwordHash = await bcrypt.hash(password, 10)
    const id = randomUUID()
    const createdAt = now.toISOString()

    let resolvedPlan, resolvedStartDate, resolvedEndDate

    if (isAdminEmail) {
      // Admin accounts skip plan/date enforcement entirely
      resolvedPlan = null
      resolvedStartDate = null
      resolvedEndDate = null
    } else {
      // Validate and compute dates for customer accounts
      resolvedPlan = plan || 'basic'
      const startDt = startDate ? new Date(startDate) : now
      let endDt = endDate ? new Date(endDate) : null

      // End date must be at least 6 months after start date
      const minEnd = new Date(startDt)
      minEnd.setMonth(minEnd.getMonth() + 6)
      if (!endDt || endDt < minEnd) {
        endDt = minEnd
      }

      resolvedStartDate = startDt.toISOString()
      resolvedEndDate = endDt.toISOString()
    }

    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, phone, business_type, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        email.toLowerCase(),
        passwordHash,
        role,
        businessName,
        contactName,
        phone || null,
        businessType || null,
        resolvedPlan,
        resolvedStartDate,
        resolvedEndDate,
        'active',
        false,
        false,
        createdAt
      ]
    )

    const result = await query('SELECT * FROM users WHERE id = $1', [id])
    const user = result.rows[0]
    const token = signToken(user)

    return res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
      data: { token, user: formatUser(user) }
    })
  } catch (err) {
    console.error('POST /api/auth/signup error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'email and password are required' }
      })
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    // Re-enforce admin role from ADMIN_EMAILS env var at login time.
    // This is the source of truth — DB role is secondary.
    // If email is on the list, force role=admin regardless of what's stored.
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@repushield.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
    const isAdmin = adminEmails.includes(user.email.toLowerCase())
    if (isAdmin && user.role !== 'admin') {
      // Silently upgrade role in DB to stay in sync
      await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id])
      user.role = 'admin'
    }
    // Block anyone NOT on the admin list from having admin role
    if (!isAdmin && user.role === 'admin') {
      await query('UPDATE users SET role = $1 WHERE id = $2', ['customer', user.id])
      user.role = 'customer'
    }

    // Refresh user row after any role updates so token contains current stripe_status
    const freshResult = await query('SELECT * FROM users WHERE id = $1', [user.id])
    const freshUser = freshResult.rows[0]
    const token = signToken(freshUser)

    return res.json({
      success: true,
      token,
      user: formatUser(freshUser),
      data: { token, user: formatUser(freshUser) }
    })
  } catch (err) {
    console.error('POST /api/auth/login error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } })
    }
    // Look up user silently — never reveal if email exists
    const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length > 0) {
      const resetToken = randomUUID()
      const expiresAt = new Date(Date.now() + 3600000).toISOString() // 1 hour
      // Store reset token in notifications table as a lightweight store
      // (full reset flow wired up when email provider is added)
      await query(
        'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [randomUUID(), result.rows[0].id, 'password_reset', `reset:${resetToken}:${expiresAt}`, false, new Date().toISOString()]
      )
    }
    // Always return the same response — security best practice
    return res.json({
      success: true,
      data: { message: 'If that account exists, a reset link has been sent.' }
    })
  } catch (err) {
    console.error('POST /api/auth/forgot-password error:', err)
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } })
  }
})

export default router
