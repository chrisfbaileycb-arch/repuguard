import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET /api/stats — public aggregate counts for the marketing page.
//
// The landing page used to hardcode "Now monitoring 1,200+ local businesses",
// which was simply untrue. These are the real numbers, and the page hides the
// claim entirely while they are zero rather than inventing one.
//
// Deliberately coarse: counts only, no names, no per-business detail. This
// endpoint is unauthenticated, so nothing here may identify a customer.
router.get('/', async (req, res) => {
  try {
    const [businesses, reviews, responded] = await Promise.all([
      query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'customer' AND status = 'active'"),
      query('SELECT COUNT(*)::int AS n FROM reviews'),
      query("SELECT COUNT(*)::int AS n FROM reviews WHERE status = 'auto_responded'"),
    ])

    return res.json({
      success: true,
      data: {
        businesses: businesses.rows[0]?.n || 0,
        reviews: reviews.rows[0]?.n || 0,
        responded: responded.rows[0]?.n || 0,
      },
    })
  } catch (err) {
    console.error('GET /api/stats error:', err)
    // The landing page treats a failure the same as zero and shows nothing,
    // so a broken count never blocks the page from rendering.
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    })
  }
})

export default router
