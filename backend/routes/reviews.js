import { Router } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

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

const autoResponseTemplates = [
  'Thank you so much for your wonderful feedback! We truly appreciate you taking the time to share your experience with us.',
  'We really appreciate your kind words! It means a lot to our team to hear such positive feedback.',
  'Thank you for the great review! We work hard to provide excellent service and are so glad it shows.',
  'We\'re thrilled to hear you had a great experience! Thank you for taking the time to share your thoughts.',
  'Your feedback is greatly appreciated! We look forward to serving you again in the future.'
]

function generateAutoResponse(review) {
  if (review.rating >= 4) {
    return autoResponseTemplates[Math.floor(Math.random() * autoResponseTemplates.length)]
  }
  return `Thank you for your feedback. We sincerely apologize for any inconvenience and would like to make this right. Please contact us directly so we can address your concerns.`
}

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const { platform, status } = req.query
    let sql = 'SELECT * FROM reviews WHERE 1=1'
    const params = []

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
    console.error('GET /api/reviews error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/reviews/:id/respond
router.post('/:id/respond', async (req, res) => {
  try {
    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      })
    }

    const review = reviewResult.rows[0]
    const response = req.body.response || generateAutoResponse(review)
    const respondedAt = new Date().toISOString()

    await query(
      'UPDATE reviews SET status = $1, response = $2, responded_at = $3 WHERE id = $4',
      ['auto_responded', response, respondedAt, req.params.id]
    )

    const updated = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    return res.json({
      success: true,
      data: { review: formatReview(updated.rows[0]) }
    })
  } catch (err) {
    console.error('POST /api/reviews/:id/respond error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/reviews/:id/flag
router.post('/:id/flag', async (req, res) => {
  try {
    const { flagReason } = req.body
    if (!flagReason) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'flagReason is required' }
      })
    }

    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      })
    }

    await query(
      'UPDATE reviews SET status = $1, flag_reason = $2 WHERE id = $3',
      ['flagged', flagReason, req.params.id]
    )

    const updated = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    return res.json({
      success: true,
      data: { review: formatReview(updated.rows[0]) }
    })
  } catch (err) {
    console.error('POST /api/reviews/:id/flag error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/reviews/:id/escalate
router.post('/:id/escalate', async (req, res) => {
  try {
    const reviewResult = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      })
    }

    const review = reviewResult.rows[0]
    const year = new Date().getFullYear()
    const seq = Math.floor(1000 + Math.random() * 9000)
    const ticketId = `ESC-${year}-${seq}`
    const escalatedAt = new Date().toISOString()

    await query(
      'UPDATE reviews SET status = $1, ticket_id = $2, escalated_at = $3 WHERE id = $4',
      ['escalated', ticketId, escalatedAt, req.params.id]
    )

    // Notify the member if one is assigned
    if (review.member_id) {
      const notifId = randomUUID()
      await query(
        'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          notifId,
          review.member_id,
          'escalation',
          `A review from ${review.author} on ${review.platform} has been escalated. Ticket: ${ticketId}`,
          false,
          new Date().toISOString()
        ]
      )
    }

    const updated = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id])
    return res.json({
      success: true,
      data: { review: formatReview(updated.rows[0]), ticketId }
    })
  } catch (err) {
    console.error('POST /api/reviews/:id/escalate error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
