import { Router } from 'express'
import Stripe from 'stripe'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// The one plan every account is on. See src/constants/plans.js for the price
// and feature list the marketing pages render.
const PLAN_ID = 'standard'

// Lazy init — only instantiate when a request comes in, not at module load.
// This prevents crash-on-startup when STRIPE_SECRET_KEY is not yet set.
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  // No apiVersion pin: let the SDK use the version it was built against.
  // Pinning a version the installed SDK doesn't know makes every call fail.
  return new Stripe(key)
}

// One plan, so one price ID. It must come from env: a baked-in ID belongs to
// whichever Stripe account created it, so a fallback silently points checkout at
// someone else's account and fails with "No such price".
const PRICE_ID = process.env.STRIPE_PRICE_STANDARD

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// POST /api/stripe/create-checkout-session (requires auth)
// Called after signup — creates a Stripe Checkout Session for the selected plan
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    // Admins bypass Stripe entirely — no payment required
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: { adminBypass: true, url: null } })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        success: false, 
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Payment processing is temporarily unavailable. Please contact support.' }
      })
    }

    // There is nothing to choose, so nothing to validate. A `plan` in the body
    // is ignored rather than rejected, so an old /signup?plan=growth link still
    // works.
    const plan = PLAN_ID

    const priceId = PRICE_ID
    if (!priceId) {
      return res.status(503).json({ 
        success: false, 
        error: { code: 'PRICE_NOT_CONFIGURED', message: 'Stripe price ID is not configured. Set STRIPE_PRICE_STANDARD in environment variables.' }
      })
    }

    // Get user email from DB — fetch only what's needed
    const userResult = await query('SELECT id, email FROM users WHERE id = $1', [req.user.id])
    if (!userResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      })
    }
    const user = userResult.rows[0]

    let session
    try {
      session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: { userId: req.user.id, plan }
        },
        metadata: { userId: req.user.id, plan },
        success_url: `${APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/signup?payment=cancelled&plan=${plan}`,
        allow_promotion_codes: true
      })
    } catch (stripeErr) {
      console.error('Stripe session creation failed:', stripeErr.message)
      return res.status(502).json({ 
        success: false, 
        error: { code: 'STRIPE_API_ERROR', message: 'Unable to create checkout session. Please try again.' }
      })
    }

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
