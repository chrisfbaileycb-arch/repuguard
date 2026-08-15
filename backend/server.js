import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import Stripe from 'stripe'
import { initDb, usePg } from './db.js'
import { seed } from './seed.js'

import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customer.js'
import reviewRoutes from './routes/reviews.js'
import workflowRoutes from './routes/workflows.js'
import memberRoutes from './routes/members.js'
import scanRoutes from './routes/scan.js'
import dashboardRoutes from './routes/dashboard.js'
import stripeRoutes from './routes/stripe.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Startup env var validation
const REQUIRED_PROD_VARS = ['JWT_SECRET', 'ADMIN_EMAILS']
const STRIPE_VARS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
const missing = REQUIRED_PROD_VARS.filter(v => !process.env[v])
if (missing.length) console.warn(`⚠️  WARNING: Missing env vars: ${missing.join(', ')}`)
const missingStripe = STRIPE_VARS.filter(v => !process.env[v])
if (missingStripe.length) console.warn(`⚠️  Stripe not fully configured. Missing: ${missingStripe.join(', ')}. Payment features disabled.`)

// ─── Stripe webhook — MUST be before express.json() to receive raw body ──────
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    console.warn('Stripe not fully configured — skipping webhook')
    return res.json({ received: true })
  }

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' })

  let event
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      if (userId) {
        await query(
          'UPDATE users SET stripe_customer_id = $1, stripe_status = $2, plan = $3, status = $4 WHERE id = $5',
          [session.customer, 'active', plan || 'basic', 'active', userId]
        )
        if (session.subscription) {
          await query(
            'UPDATE users SET stripe_subscription_id = $1 WHERE id = $2',
            [session.subscription, userId]
          )
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      if (userId) {
        const stripeStatus = sub.status
        const appStatus = stripeStatus === 'active' ? 'active' : stripeStatus === 'canceled' ? 'expired' : 'pending'
        await query(
          'UPDATE users SET stripe_status = $1, status = $2 WHERE id = $3',
          [stripeStatus, appStatus, userId]
        )
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      if (userId) {
        await query(
          'UPDATE users SET stripe_status = $1, status = $2 WHERE id = $3',
          ['canceled', 'expired', userId]
        )
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const result = await query('SELECT id FROM users WHERE stripe_customer_id = $1', [invoice.customer])
      if (result.rows.length) {
        const userId = result.rows[0].id
        await query(
          'UPDATE users SET stripe_status = $1, status = $2 WHERE id = $3',
          ['past_due', 'pending', userId]
        )
        await query(
          'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [randomUUID(), userId, 'payment_failed', 'Your last payment failed. Please update your payment method to keep your account active.', false, new Date().toISOString()]
        )
      }
    } else {
      console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }

  return res.json({ received: true })
})

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`)
  })
  next()
})

// ─── API routes ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: process.env.DATABASE_URL ? 'postgres' : 'pglite',
    stripe: !!process.env.STRIPE_SECRET_KEY,
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/api', (req, res) => {
  res.json({
    name: 'RepuShield API',
    version: '1.0.0',
    description: 'Reputation management SaaS backend — monitor, respond, and escalate online reviews.',
    health: '/health',
    docs: '/docs',
    endpoints: [
      { method: 'POST', path: '/api/auth/signup', description: 'Register a new customer account' },
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate and receive a JWT' },
      { method: 'GET',  path: '/api/customer/dashboard', description: 'Customer dashboard summary (auth required)' },
      { method: 'GET',  path: '/api/customer/reviews', description: 'Customer reviews with ?platform= ?status= filters (auth required)' },
      { method: 'GET',  path: '/api/customer/notifications', description: 'Customer notifications (auth required)' },
      { method: 'POST', path: '/api/customer/notifications/:id/read', description: 'Mark notification as read (auth required)' },
      { method: 'POST', path: '/api/customer/connect/:platform', description: 'Connect google or yelp platform (auth required)' },
      { method: 'GET',  path: '/api/customer/report', description: 'Monthly reputation report (auth required)' },
      { method: 'GET',  path: '/api/reviews', description: 'All reviews with filters (admin)' },
      { method: 'POST', path: '/api/reviews/:id/respond', description: 'Auto-respond to a review (admin)' },
      { method: 'POST', path: '/api/reviews/:id/flag', description: 'Flag a review (admin)' },
      { method: 'POST', path: '/api/reviews/:id/escalate', description: 'Escalate a review (admin)' },
      { method: 'GET',  path: '/api/workflows', description: 'List workflows (admin)' },
      { method: 'POST', path: '/api/workflows', description: 'Create workflow (admin)' },
      { method: 'GET',  path: '/api/workflows/:id', description: 'Get workflow (admin)' },
      { method: 'PUT',  path: '/api/workflows/:id', description: 'Update workflow (admin)' },
      { method: 'DELETE', path: '/api/workflows/:id', description: 'Delete workflow (admin)' },
      { method: 'GET',  path: '/api/members', description: 'List customer members (admin)' },
      { method: 'POST', path: '/api/members', description: 'Create customer member (admin)' },
      { method: 'GET',  path: '/api/members/:id', description: 'Get member details (admin)' },
      { method: 'PUT',  path: '/api/members/:id', description: 'Update member (admin)' },
      { method: 'GET',  path: '/api/scan', description: 'Get scan state (admin)' },
      { method: 'POST', path: '/api/scan/run', description: 'Trigger a review scan (admin)' },
      { method: 'GET',  path: '/api/dashboard', description: 'Admin dashboard stats (admin)' },
      { method: 'POST', path: '/api/stripe/create-checkout-session', description: 'Create Stripe Checkout Session for a plan (auth required)' },
      { method: 'GET',  path: '/api/stripe/subscription-status', description: 'Get current subscription status (auth required)' },
      { method: 'POST', path: '/api/webhooks/stripe', description: 'Stripe webhook receiver (signed by Stripe)' }
    ]
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/stripe', stripeRoutes)

// ─── Static frontend + SPA fallback ──────────────────────────────────────────
const distPath = path.join(process.cwd(), 'dist')
app.use(express.static(distPath))

app.get('*', (req, res) => {
  // Don't SPA-fallback API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
    })
  }
  const indexPath = path.join(distPath, 'index.html')
  res.sendFile(indexPath, err => {
    if (err) {
      // No dist yet (dev mode) — just return API info
      res.status(200).json({ message: 'RepuShield API running. Frontend not built yet.' })
    }
  })
})

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDb()
    await seed()

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`RepuShield server running on 0.0.0.0:${PORT}`)
      console.log(`Health: http://localhost:${PORT}/health`)
      console.log(`API info: http://localhost:${PORT}/api`)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received — shutting down gracefully')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received — shutting down gracefully')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
