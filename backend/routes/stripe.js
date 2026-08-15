import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Lazy init — only instantiate when a request comes in, not at module load.
// This prevents crash-on-startup when STRIPE_SECRET_KEY is not yet set.
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  return new Stripe(key, { apiVersion: '2026-07-29.dahlia' })
}

const PRICE_IDS = {
  basic:  process.env.STRIPE_PRICE_BASIC  || 'price_1U4TPB4Pr8vJAOFf4dV340om',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_1U4TQI4Pr8vJAOFfy7IRboRE',
  pro:    process.env.STRIPE_PRICE_PRO    || 'price_1U4TRg4Pr8vJAOFfYlp5GlnK'
}

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// POST /api/stripe/create-checkout-session (requires auth)
// Called after signup — creates a Stripe Checkout Session for the selected plan
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    // Admins bypass Stripe entirely — no payment required
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: { adminBypass: true, url: null } })
    }

    // Guard: Stripe not configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ success: false, error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Payment processing is not configured' } })
    }

    const { plan } = req.body
    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PLAN', message: 'Invalid plan selected' }
      })
    }

    // Get user email from DB
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!userResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      })
    }
    const user = userResult.rows[0]

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId: req.user.id, plan }
      },
      metadata: { userId: req.user.id, plan },
      success_url: `${APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/signup?payment=cancelled&plan=${plan}`,
      allow_promotion_codes: true,
      integration_identifier: 'repushield-signup-AbCdEfGh'
    })

    return res.json({ success: true, data: { url: session.url, sessionId: session.id } })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'STRIPE_ERROR', message: err.message }
    })
  }
})

// GET /api/stripe/subscription-status (requires auth)
// Returns current subscription status for the logged-in user
router.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT stripe_customer_id, stripe_subscription_id, stripe_status, plan FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      })
    }
    const user = result.rows[0]
    return res.json({
      success: true,
      data: {
        customerId: user.stripe_customer_id,
        subscriptionId: user.stripe_subscription_id,
        status: user.stripe_status || 'inactive',
        plan: user.plan
      }
    })
  } catch (err) {
    console.error('Subscription status error:', err)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    })
  }
})

export default router
