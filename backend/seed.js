import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { query } from './db.js'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

function monthsFromNow(n) {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d.toISOString()
}

export async function seed() {
  try {
    // Check if admin exists — if so, skip everything (idempotent)
    const adminCheck = await query("SELECT id FROM users WHERE email = 'admin@repushield.com'")
    if (adminCheck.rows.length > 0) {
      console.log('Seed: already seeded, skipping.')
      return
    }

    console.log('Seed: seeding database...')

    // ─── Admin user ───────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 10)
    const adminId = randomUUID()
    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        adminId,
        'admin@repushield.com',
        adminHash,
        'admin',
        'RepuShield HQ',
        'Admin User',
        'enterprise',
        monthsAgo(12),
        monthsFromNow(12),
        'active',
        true,
        true,
        monthsAgo(12)
      ]
    )

    // ─── Customer 1: Downtown Dental ──────────────────────────────────────────
    const dental_id = randomUUID()
    const dentalHash = await bcrypt.hash('dental123', 10)
    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, phone, business_type, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        dental_id,
        'dental@downtown.com',
        dentalHash,
        'customer',
        'Downtown Dental',
        'Dr. Sarah Mitchell',
        '555-0101',
        'Healthcare',
        'growth',
        monthsAgo(7),
        monthsFromNow(5),
        'active',
        true,
        false,
        monthsAgo(7)
      ]
    )

    // ─── Customer 2: Metro Auto Repair ────────────────────────────────────────
    const auto_id = randomUUID()
    const autoHash = await bcrypt.hash('auto1234', 10)
    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, phone, business_type, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        auto_id,
        'manager@metroauto.com',
        autoHash,
        'customer',
        'Metro Auto Repair',
        'James Kowalski',
        '555-0202',
        'Automotive',
        'basic',
        monthsAgo(8),
        monthsFromNow(4),
        'active',
        true,
        true,
        monthsAgo(8)
      ]
    )

    // ─── Customer 3: Sunrise Bakery ───────────────────────────────────────────
    const bakery_id = randomUUID()
    const bakeryHash = await bcrypt.hash('bakery123', 10)
    await query(
      `INSERT INTO users (id, email, password_hash, role, business_name, contact_name, phone, business_type, plan, start_date, end_date, status, google_connected, yelp_connected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        bakery_id,
        'hello@sunrisebakery.com',
        bakeryHash,
        'customer',
        'Sunrise Bakery',
        'Maria Flores',
        '555-0303',
        'Food & Beverage',
        'pro',
        monthsAgo(6),
        monthsFromNow(6),
        'active',
        false,
        true,
        monthsAgo(6)
      ]
    )

    // ─── Reviews ──────────────────────────────────────────────────────────────
    // 5 reviews for Downtown Dental
    const dentalReviews = [
      {
        platform: 'google',
        rating: 5,
        author: 'Emily R.',
        content: 'Absolutely fantastic experience! Dr. Mitchell and her team were so professional and gentle. The office was spotless and I barely felt any pain during my filling. Highly recommend!',
        status: 'auto_responded',
        response: 'Thank you so much for your wonderful feedback, Emily! We truly appreciate you taking the time to share your experience.',
        daysAgoN: 3
      },
      {
        platform: 'google',
        rating: 4,
        author: 'Tom B.',
        content: 'Great dental office overall. Friendly staff, modern equipment. Only minor issue was the wait time, about 20 minutes past my appointment. Would still recommend.',
        status: 'auto_responded',
        response: 'Thank you for your kind words, Tom! We apologize for the wait and are working to improve our scheduling.',
        daysAgoN: 9
      },
      {
        platform: 'yelp',
        rating: 2,
        author: 'Kevin H.',
        content: 'Disappointed with my visit. I was told the procedure would be quick and painless but it took over an hour. Staff seemed rushed. Billing was also confusing.',
        status: 'escalated',
        ticketId: `ESC-${new Date().getFullYear()}-4421`,
        escalatedAt: daysAgo(5),
        daysAgoN: 6
      },
      {
        platform: 'yelp',
        rating: 5,
        author: 'Priya S.',
        content: 'Love this dental office! I used to be terrified of dentists but Dr. Mitchell completely changed that. She explains everything beforehand and is so patient.',
        status: 'auto_responded',
        response: 'We are thrilled to hear you had a great experience! It means the world to us to know Dr. Mitchell made you feel comfortable.',
        daysAgoN: 14
      },
      {
        platform: 'google',
        rating: 1,
        author: 'Mark T.',
        content: 'Terrible experience. They double-billed me and the receptionist was rude when I called to dispute it. Would not recommend to anyone.',
        status: 'flagged',
        flagReason: 'Potentially fraudulent billing claim — reviewing with finance team',
        daysAgoN: 2
      }
    ]

    for (const r of dentalReviews) {
      const id = randomUUID()
      await query(
        `INSERT INTO reviews (id, platform, rating, author, content, review_date, status, response, ticket_id, flag_reason, member_id, member_name, responded_at, escalated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id,
          r.platform,
          r.rating,
          r.author,
          r.content,
          daysAgo(r.daysAgoN),
          r.status,
          r.response || null,
          r.ticketId || null,
          r.flagReason || null,
          dental_id,
          'Downtown Dental',
          r.status === 'auto_responded' ? daysAgo(r.daysAgoN - 1) : null,
          r.escalatedAt || null,
          daysAgo(r.daysAgoN)
        ]
      )
    }

    // 5 reviews for Metro Auto Repair
    const autoReviews = [
      {
        platform: 'google',
        rating: 5,
        author: 'Sandra L.',
        content: 'James and his crew are the best mechanics in town! Fixed my transmission in record time and for a fair price. Super honest and no upselling. My go-to shop from now on.',
        status: 'auto_responded',
        response: 'Thank you for the great review, Sandra! We work hard to be transparent and fair — so glad it shows.',
        daysAgoN: 4
      },
      {
        platform: 'yelp',
        rating: 4,
        author: 'David N.',
        content: 'Solid shop. They fixed my brakes quickly and the price was reasonable. Waiting room could be improved but the work quality is excellent.',
        status: 'auto_responded',
        response: 'Thanks for the feedback David! We appreciate your patience and are working on improving the waiting area.',
        daysAgoN: 11
      },
      {
        platform: 'google',
        rating: 3,
        author: 'Carla M.',
        content: 'Decent service but they misdiagnosed my issue the first time, requiring a second visit. The second time they got it right, but it cost me extra time off work.',
        status: 'pending',
        daysAgoN: 1
      },
      {
        platform: 'yelp',
        rating: 1,
        author: 'Anonymous',
        content: 'SCAM! They said I needed a new engine but got a second opinion and it was just a sensor. These guys are crooks trying to rip off people who don\'t know cars.',
        status: 'flagged',
        flagReason: 'Defamatory claim — no engine replacement was suggested per service records',
        daysAgoN: 7
      },
      {
        platform: 'google',
        rating: 5,
        author: 'Robert K.',
        content: 'Best auto shop I\'ve been to in years. They diagnosed a weird noise other shops couldn\'t figure out in minutes. Fair price, honest service. Highly recommend.',
        status: 'auto_responded',
        response: 'We really appreciate your kind words, Robert! Thank you for trusting us with your vehicle.',
        daysAgoN: 18
      }
    ]

    for (const r of autoReviews) {
      const id = randomUUID()
      await query(
        `INSERT INTO reviews (id, platform, rating, author, content, review_date, status, response, ticket_id, flag_reason, member_id, member_name, responded_at, escalated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id,
          r.platform,
          r.rating,
          r.author,
          r.content,
          daysAgo(r.daysAgoN),
          r.status,
          r.response || null,
          null,
          r.flagReason || null,
          auto_id,
          'Metro Auto Repair',
          r.status === 'auto_responded' ? daysAgo(r.daysAgoN - 1) : null,
          null,
          daysAgo(r.daysAgoN)
        ]
      )
    }

    // 5 reviews for Sunrise Bakery
    const bakeryReviews = [
      {
        platform: 'yelp',
        rating: 5,
        author: 'Jasmine W.',
        content: 'Sunrise Bakery is a hidden gem! The croissants are the best I\'ve had outside of Paris. Everything is made fresh daily and Maria is always so warm and welcoming.',
        status: 'auto_responded',
        response: 'Thank you so much Jasmine! Comments like yours make everything worthwhile. We look forward to seeing you again!',
        daysAgoN: 2
      },
      {
        platform: 'google',
        rating: 5,
        author: 'Chris P.',
        content: 'Ordered a custom birthday cake and it was absolutely stunning AND delicious. Worth every penny. The attention to detail was incredible.',
        status: 'auto_responded',
        response: 'Thank you so much, Chris! We love making special celebrations even sweeter.',
        daysAgoN: 8
      },
      {
        platform: 'yelp',
        rating: 4,
        author: 'Lucia G.',
        content: 'Lovely little bakery with great pastries. The only reason I give 4 stars instead of 5 is they often sell out of my favorites by 10am. Come early!',
        status: 'auto_responded',
        response: 'Thank you Lucia! That\'s a great problem to have — we will try to bake more of your favorites!',
        daysAgoN: 15
      },
      {
        platform: 'google',
        rating: 2,
        author: 'Pete R.',
        content: 'Overpriced for what you get. Paid $8 for a muffin that was dry and hard. The coffee is watered down. Other bakeries in the area offer better value.',
        status: 'escalated',
        ticketId: `ESC-${new Date().getFullYear()}-3875`,
        escalatedAt: daysAgo(3),
        daysAgoN: 4
      },
      {
        platform: 'google',
        rating: 5,
        author: 'Nina A.',
        content: 'I have been coming here every Saturday for two years. The quality is always consistent and Maria remembers my order. This place is a true community treasure.',
        status: 'auto_responded',
        response: 'Nina, you made our day! We treasure our regulars and can\'t wait for your next Saturday visit.',
        daysAgoN: 21
      }
    ]

    for (const r of bakeryReviews) {
      const id = randomUUID()
      await query(
        `INSERT INTO reviews (id, platform, rating, author, content, review_date, status, response, ticket_id, flag_reason, member_id, member_name, responded_at, escalated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id,
          r.platform,
          r.rating,
          r.author,
          r.content,
          daysAgo(r.daysAgoN),
          r.status,
          r.response || null,
          r.ticketId || null,
          null,
          bakery_id,
          'Sunrise Bakery',
          r.status === 'auto_responded' ? daysAgo(r.daysAgoN - 1) : null,
          r.escalatedAt || null,
          daysAgo(r.daysAgoN)
        ]
      )
    }

    // ─── Workflows ────────────────────────────────────────────────────────────
    const wf1Id = randomUUID()
    await query(
      `INSERT INTO workflows (id, name, trigger, conditions, action, response_template, active, runs_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        wf1Id,
        'High Rating Auto-Response',
        'rating_above',
        JSON.stringify({ minRating: 4 }),
        'auto_respond',
        'Thank you so much for your wonderful feedback! We truly appreciate you taking the time to share your experience with us. We look forward to serving you again!',
        true,
        47,
        monthsAgo(6)
      ]
    )

    const wf2Id = randomUUID()
    await query(
      `INSERT INTO workflows (id, name, trigger, conditions, action, response_template, active, runs_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        wf2Id,
        'Low Rating Escalation',
        'rating_below',
        JSON.stringify({ maxRating: 3 }),
        'escalate',
        null,
        true,
        12,
        monthsAgo(5)
      ]
    )

    // ─── Scan State ───────────────────────────────────────────────────────────
    const existingScan = await query("SELECT id FROM scan_state WHERE id = 'singleton'")
    if (existingScan.rows.length === 0) {
      await query(
        'INSERT INTO scan_state (id, last_scan, google_scanned, google_flagged, yelp_scanned, yelp_flagged) VALUES ($1, $2, $3, $4, $5, $6)',
        ['singleton', daysAgo(1), 284, 6, 193, 4]
      )
    }

    // ─── Notifications ────────────────────────────────────────────────────────
    // Dental notifications
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), dental_id, 'escalation', 'A review from Kevin H. on Yelp has been escalated. Ticket: ESC-' + new Date().getFullYear() + '-4421', false, daysAgo(5)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), dental_id, 'new_review', 'New 1-star review received on Google from Mark T.', false, daysAgo(2)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), dental_id, 'connected', 'Your Google account has been connected', true, monthsAgo(7)]
    )

    // Auto notifications
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), auto_id, 'flag', 'A review from Anonymous has been flagged for review.', false, daysAgo(7)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), auto_id, 'new_review', 'New 3-star review received on Google from Carla M.', false, daysAgo(1)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), auto_id, 'connected', 'Your Google account has been connected', true, monthsAgo(8)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), auto_id, 'connected', 'Your Yelp account has been connected', true, monthsAgo(8)]
    )

    // Bakery notifications
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), bakery_id, 'escalation', 'A review from Pete R. on Google has been escalated. Ticket: ESC-' + new Date().getFullYear() + '-3875', false, daysAgo(3)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), bakery_id, 'connected', 'Your Yelp account has been connected', true, monthsAgo(6)]
    )
    await query(
      'INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), bakery_id, 'new_review', 'New 5-star review received on Yelp from Jasmine W.', true, daysAgo(2)]
    )

    console.log('Seed: complete. Admin: admin@repushield.com / admin123')
    console.log('Seed: Customers created:')
    console.log('  - dental@downtown.com / dental123 (Downtown Dental, growth plan)')
    console.log('  - manager@metroauto.com / auto1234 (Metro Auto Repair, basic plan)')
    console.log('  - hello@sunrisebakery.com / bakery123 (Sunrise Bakery, pro plan)')
  } catch (err) {
    console.error('Seed error:', err)
    throw err
  }
}
