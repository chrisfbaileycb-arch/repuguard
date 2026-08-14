import { Router } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

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

function formatReview(row) {
  return {
    id: row.id,
    platform: row.platform,
    rating: row.rating,
    author: row.author,
    content: row.content,
    reviewDate: row.review_date,
    status: row.status,
    response: row.response,
    ticketId: row.ticket_id,
    flagReason: row.flag_reason,
    memberId: row.member_id,
    memberName: row.member_name,
    respondedAt: row.responded_at,
    escalatedAt: row.escalated_at,
    createdAt: row.created_at
  }
}

// GET /api/customer/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      })
    }
    const user = userResult.rows[0]

    const reviewsResult = await query(
      'SELECT * FROM reviews WHERE member_id = $1 ORDER BY review_date DESC',
      [req.user.id]
    )
    const reviews = reviewsResult.rows

    const monitored = reviews.length
    const autoResponded = reviews.filter(r => r.status === 'auto_responded').length
    const flagged = reviews.filter(r => r.status === 'flagged').length
    const needsAttention = reviews.filter(r => r.status === 'escalated').length

    // Membership months since startDate
    let membershipMonths = 0
    if (user.start_date) {
      const start = new Date(user.start_date)
      const now = new Date()
      membershipMonths = Math.max(
        0,
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      )
    }

    // Recent activity: last 10 reviews formatted as activity items
    const recentActivity = reviews.slice(0, 10).map(r => ({
      id: r.id,
      type: r.status === 'auto_responded' ? 'response' : r.status === 'flagged' ? 'flag' : r.status === 'escalated' ? 'escalation' : 'review',
      platform: r.platform,
      rating: r.rating,
      author: r.author,
      summary: r.content.length > 100 ? r.content.slice(0, 100) + '…' : r.content,
      status: r.status,
      date: r.review_date
    }))

    return res.json({
      success: true,
      data: {
        stats: { monitored, autoResponded, flagged, needsAttention },
        membershipMonths,
        recentActivity,
        user: formatUser(user)
      }
    })
  } catch (err) {
    console.error('GET /api/customer/dashboard error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// GET /api/customer/reviews
router.get('/reviews', async (req, res) => {
  try {
    const { platform, status } = req.query
    let sql = 'SELECT * FROM reviews WHERE member_id = $1'
    const params = [req.user.id]

    if (platform) {
      params.push(platform)
      sql += ` AND platform = $${params.length}`
    }
    if (status) {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }
    sql += ' ORDER BY review_date DESC'

    const result = await query(sql, params)
    return res.json({
      success: true,
      data: { reviews: result.rows.map(formatReview) }
    })
  } catch (err) {
    console.error('GET /api/customer/reviews error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// GET /api/customer/notifications
router.get('/notifications', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    return res.json({
      success: true,
      data: {
        notifications: result.rows.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          read: n.read,
          createdAt: n.created_at
        }))
      }
    })
  } catch (err) {
    console.error('GET /api/customer/notifications error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/customer/notifications/:id/read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    const updated = result.rowCount ?? result.rows?.length ?? 0
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      })
    }
    return res.json({ success: true, data: { id: req.params.id, read: true } })
  } catch (err) {
    console.error('POST /api/customer/notifications/:id/read error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/customer/connect/:platform
router.post('/connect/:platform', async (req, res) => {
  try {
    const { platform } = req.params
    if (platform !== 'google' && platform !== 'yelp') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PLATFORM', message: 'Platform must be google or yelp' }
      })
    }

    const column = platform === 'google' ? 'google_connected' : 'yelp_connected'
    await query(`UPDATE users SET ${column} = TRUE WHERE id = $1`, [req.user.id])

    const notifId = randomUUID()
    const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [notifId, req.user.id, 'connected', `Your ${platformLabel} account has been connected`, false, new Date().toISOString()]
    )

    return res.json({
      success: true,
      data: { platform, connected: true }
    })
  } catch (err) {
    console.error('POST /api/customer/connect/:platform error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// GET /api/customer/report
router.get('/report', async (req, res) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const result = await query(
      'SELECT * FROM reviews WHERE member_id = $1 AND review_date >= $2 AND review_date <= $3',
      [req.user.id, monthStart, monthEnd]
    )
    const reviews = result.rows

    const monitored = reviews.length
    const responded = reviews.filter(r => r.status === 'auto_responded' || r.response).length
    const flagged = reviews.filter(r => r.status === 'flagged').length
    const removed = reviews.filter(r => r.status === 'flagged' && r.flag_reason).length

    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
    const avgRating = monitored > 0 ? Math.round((totalRating / monitored) * 10) / 10 : 0

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, r.rating))
      ratingDistribution[star] = (ratingDistribution[star] || 0) + 1
    })

    // Reputation score formula
    const responseRate = responded / Math.max(monitored, 1)
    const rawScore = (avgRating / 5) * 60 + responseRate * 25 + 15
    const reputationScore = Math.min(100, Math.max(0, Math.round(rawScore)))

    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

    return res.json({
      success: true,
      data: {
        month: monthName,
        stats: { monitored, responded, flagged, removed, avgRating },
        ratingDistribution,
        reputationScore
      }
    })
  } catch (err) {
    console.error('GET /api/customer/report error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
