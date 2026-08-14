import pg from 'pg'
import { PGlite } from '@electric-sql/pglite'

let pool
let pglite
export let usePg = false

export async function initDb() {
  if (process.env.DATABASE_URL) {
    usePg = true
    const connStr = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '')
    pool = new pg.Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    })
    console.log('Using Postgres (DATABASE_URL)')
  } else {
    pglite = new PGlite('/tmp/repushield-data')
    await pglite.waitReady
    console.log('Using PGlite (local)')
  }
  await runMigrations()
}

export async function query(sql, params = []) {
  if (usePg) {
    return pool.query(sql, params)
  } else {
    return pglite.query(sql, params)
  }
}

async function runMigrations() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    business_name TEXT,
    contact_name TEXT,
    phone TEXT,
    business_type TEXT,
    plan TEXT DEFAULT 'basic',
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'active',
    google_connected BOOLEAN DEFAULT FALSE,
    yelp_connected BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT ''
  )`)

  await query(`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    rating INTEGER NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    review_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    response TEXT,
    ticket_id TEXT,
    flag_reason TEXT,
    member_id TEXT,
    member_name TEXT,
    responded_at TEXT,
    escalated_at TEXT,
    created_at TEXT DEFAULT ''
  )`)

  await query(`CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    conditions TEXT NOT NULL,
    action TEXT NOT NULL,
    response_template TEXT,
    active BOOLEAN DEFAULT TRUE,
    runs_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT ''
  )`)

  await query(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT ''
  )`)

  await query(`CREATE TABLE IF NOT EXISTS scan_state (
    id TEXT PRIMARY KEY,
    last_scan TEXT,
    google_scanned INTEGER DEFAULT 0,
    google_flagged INTEGER DEFAULT 0,
    yelp_scanned INTEGER DEFAULT 0,
    yelp_flagged INTEGER DEFAULT 0
  )`)
}
