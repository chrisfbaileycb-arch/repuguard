import { Router } from 'express'
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

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    // Aggregate review stats
    const totalResult = await query('SELECT COUNT(*) as count FROM reviews')
    const totalReviews = parseInt(totalResult.rows[0].count)

    const autoResult = await query(
      "SELECT COUNT(*) as count FROM reviews WHERE status = 'auto_responded'"
    )
    const autoResponded = parseInt(autoResult.rows[0].count)

    const escalatedResult = await query(
      "SELECT COUNT(*) as count FROM reviews WHERE status = 'escalated'"
    )
    const escalated = parseInt(escalatedResult.rows[0].count)

    const flaggedResult = await query(
      "SELECT COUNT(*) as count FROM reviews WHERE status = 'flagged'"
    )
    const flagged = parseInt(flaggedResult.rows[0].count)

    const membersResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND status = 'active'"
    )
    const activeMembers = parseInt(membersResult.rows[0].count)

    const ratingResult = await query('SELECT AVG(rating) as avg FROM reviews')
    const avgRating = ratingResult.rows[0].avg
      ? Math.round(parseFloat(ratingResult.rows[0].avg) * 10) / 10
      : 0

    // Recent reviews (last 5)
    const recentResult = await query(
      'SELECT * FROM reviews ORDER BY review_date DESC LIMIT 5'
    )

    // All flagged reviews
    const flaggedReviewsResult = await query(
      "SELECT * FROM reviews WHERE status = 'flagged' ORDER BY review_date DESC"
    )

    return res.json({
      success: true,
      data: {
        stats: { totalReviews, autoResponded, escalated, flagged, activeMembers, avgRating },
        recentReviews: recentResult.rows.map(formatReview),
        flaggedReviews: flaggedReviewsResult.rows.map(formatReview)
      }
    })
  } catch (err) {
    console.error('GET /api/dashboard error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
