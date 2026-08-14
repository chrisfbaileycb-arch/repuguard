import { Router } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

function formatScanState(row) {
  return {
    lastScan: row.last_scan,
    googleScanned: row.google_scanned,
    googleFlagged: row.google_flagged,
    yelpScanned: row.yelp_scanned,
    yelpFlagged: row.yelp_flagged
  }
}

// GET /api/scan
router.get('/', async (req, res) => {
  try {
    const result = await query("SELECT * FROM scan_state WHERE id = 'singleton'")
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          lastScan: null,
          googleScanned: 0,
          googleFlagged: 0,
          yelpScanned: 0,
          yelpFlagged: 0
        }
      })
    }
    return res.json({
      success: true,
      data: formatScanState(result.rows[0])
    })
  } catch (err) {
    console.error('GET /api/scan error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

// POST /api/scan/run
router.post('/run', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const jobId = randomUUID()

    // Random delta to simulate new scans
    const googleDelta = Math.floor(Math.random() * 15) + 1
    const yelpDelta = Math.floor(Math.random() * 10) + 1
    const googleFlagDelta = Math.floor(Math.random() * 3)
    const yelpFlagDelta = Math.floor(Math.random() * 2)

    const existing = await query("SELECT * FROM scan_state WHERE id = 'singleton'")

    if (existing.rows.length === 0) {
      await query(
        'INSERT INTO scan_state (id, last_scan, google_scanned, google_flagged, yelp_scanned, yelp_flagged) VALUES ($1, $2, $3, $4, $5, $6)',
        ['singleton', now, googleDelta, googleFlagDelta, yelpDelta, yelpFlagDelta]
      )
    } else {
      const row = existing.rows[0]
      await query(
        'UPDATE scan_state SET last_scan = $1, google_scanned = $2, google_flagged = $3, yelp_scanned = $4, yelp_flagged = $5 WHERE id = $6',
        [
          now,
          (row.google_scanned || 0) + googleDelta,
          (row.google_flagged || 0) + googleFlagDelta,
          (row.yelp_scanned || 0) + yelpDelta,
          (row.yelp_flagged || 0) + yelpFlagDelta,
          'singleton'
        ]
      )
    }

    const result = await query("SELECT * FROM scan_state WHERE id = 'singleton'")
    return res.json({
      success: true,
      data: {
        jobId,
        ...formatScanState(result.rows[0]),
        delta: {
          googleScanned: googleDelta,
          yelpScanned: yelpDelta,
          googleFlagged: googleFlagDelta,
          yelpFlagged: yelpFlagDelta
        }
      }
    })
  } catch (err) {
    console.error('POST /api/scan/run error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    })
  }
})

export default router
