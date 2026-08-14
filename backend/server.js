import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, usePg } from './db.js'
import { seed } from './seed.js'

import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customer.js'
import reviewRoutes from './routes/reviews.js'
import workflowRoutes from './routes/workflows.js'
import memberRoutes from './routes/members.js'
import scanRoutes from './routes/scan.js'
import dashboardRoutes from './routes/dashboard.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

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
    db: usePg ? 'postgres' : 'pglite',
    uptime: Math.floor(process.uptime()),
    version: '1.0.0'
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
      { method: 'GET',  path: '/api/dashboard', description: 'Admin dashboard stats (admin)' }
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
      console.log(`RepuShield API listening on port ${PORT}`)
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
