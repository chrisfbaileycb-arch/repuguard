import { db } from 'hatchable';
import { PLATFORMS, token } from 'lib/util.js';
import { processReview } from 'lib/pipeline.js';

/**
 * Canonical review shape every adapter produces:
 * { platform, external_id, author_name, rating, body, review_url, reviewed_at }
 */
export function normalize(raw, defaults = {}) {
  const platform = String(raw.platform || defaults.platform || 'other').toLowerCase().trim();
  const body = String(raw.body ?? raw.text ?? raw.comment ?? raw.review ?? '').trim();
  let rating = raw.rating ?? raw.stars ?? raw.score;
  rating = rating == null || rating === '' ? null : Math.round(Number(rating));
  if (rating != null && (Number.isNaN(rating) || rating < 1 || rating > 5)) rating = null;
  let reviewed_at = raw.reviewed_at ?? raw.date ?? raw.created_at ?? raw.time;
  reviewed_at = reviewed_at ? new Date(reviewed_at) : new Date();
  if (Number.isNaN(reviewed_at.getTime())) reviewed_at = new Date();
  const author_name = String(raw.author_name ?? raw.author ?? raw.name ?? raw.reviewer ?? '').trim().slice(0, 120) || null;
  const external_id = String(raw.external_id ?? raw.id ?? raw.review_id ?? '').trim() || ('gen_' + token(8));
  return {
    platform: PLATFORMS.includes(platform) ? platform : 'other',
    external_id: external_id.slice(0, 200),
    author_name,
    rating,
    body: body.slice(0, 8000),
    review_url: raw.review_url ?? raw.url ?? null,
    reviewed_at: reviewed_at.toISOString(),
  };
}

/** Insert if new. Returns { review, created }. */
export async function upsertReview(businessId, canon, source) {
  const r = await db.query(
    `INSERT INTO reviews (business_id, platform, external_id, author_name, rating, body, review_url, reviewed_at, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (business_id, platform, external_id) DO NOTHING
     RETURNING *`,
    [businessId, canon.platform, canon.external_id, canon.author_name, canon.rating, canon.body, canon.review_url, canon.reviewed_at, source]
  );
  if (r.rows[0]) return { review: r.rows[0], created: true };
  const ex = await db.query('SELECT * FROM reviews WHERE business_id = $1 AND platform = $2 AND external_id = $3', [businessId, canon.platform, canon.external_id]);
  return { review: ex.rows[0], created: false };
}

/**
 * Remove the placeholder review set for a business.
 *
 * Reviews cascade to their responses, flags and escalations, so this takes the
 * whole placeholder state with it and leaves nothing behind to explain.
 * Returns the number of sample reviews removed.
 */
export async function clearSampleData(businessId) {
  const r = await db.query(
    `DELETE FROM reviews WHERE business_id = $1 AND source = 'sample' RETURNING id`,
    [businessId]
  );
  return r.rows.length;
}

/** Ingest a batch of raw items through an adapter, running the pipeline on new rows. */
export async function ingestBatch(business, rawItems, { source, defaults = {}, actor = 'system', process = true, limit = 25 } = {}) {
  const results = { received: rawItems.length, created: 0, duplicates: 0, skipped: 0, processed: 0, errors: [], ids: [], sampleCleared: 0 };
  const isSample = source === 'sample';
  let n = 0;
  for (const raw of rawItems) {
    if (n++ >= limit) { results.skipped++; continue; }
    let canon;
    try { canon = normalize(raw, defaults); } catch (e) { results.errors.push(e.message); continue; }
    if (!canon.body && canon.rating == null) { results.skipped++; continue; }
    const { review, created } = await upsertReview(business.id, canon, source);
    if (!created) { results.duplicates++; continue; }

    // The first genuine review retires the placeholder set, so a business
    // never sees its own data sitting next to invented data. Runs once: after
    // this the DELETE matches nothing.
    if (!isSample && results.created === 0) {
      try {
        results.sampleCleared = await clearSampleData(business.id);
      } catch (e) {
        console.error('clearSampleData failed', e.message);
      }
    }

    results.created++; results.ids.push(review.id);
    if (process) {
      try { await processReview(business, review.id, { actor }); results.processed++; }
      catch (e) { results.errors.push(`${review.id}: ${e.message}`); }
    }
  }
  return results;
}

/** Minimal RFC-4180 CSV parser -> array of objects keyed by header. */
export function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field); if (row.some(v => v !== '')) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

/**
 * Platform connectors. Each exposes the same interface: { platform, describe(), fetchReviews(connector) }.
 * Google and Yelp are stubbed: they validate config and explain what credentials are needed.
 * When credentials are wired (via [[api]] blocks + connect-an-external-api), fetchReviews returns raw items for ingestBatch.
 */
export const CONNECTORS = {
  google: {
    platform: 'google',
    label: 'Google Business Profile',
    ref_label: 'Location ID (accounts/{account}/locations/{location})',
    requirements: 'Requires a Google Cloud project with the Business Profile API enabled, OAuth consent, and a verified business location. Approval from Google is required for API access.',
    async fetchReviews() { throw new Error('Google Business Profile connector is not yet wired to live credentials. Use CSV import or the webhook until OAuth is configured.'); },
  },
  yelp: {
    platform: 'yelp',
    label: 'Yelp',
    ref_label: 'Yelp business ID or alias',
    requirements: 'Yelp Fusion API key. Note: the public Fusion API returns only 3 review excerpts per business; full review access requires the Yelp Knowledge / partner program.',
    async fetchReviews() { throw new Error('Yelp connector is not yet wired to live credentials. Use CSV import or the webhook until an API key is configured.'); },
  },
  facebook: {
    platform: 'facebook',
    label: 'Facebook Page',
    ref_label: 'Page ID',
    requirements: 'Meta Graph API page token with pages_read_user_content permission.',
    async fetchReviews() { throw new Error('Facebook connector is not yet wired to live credentials.'); },
  },
};

export const DEMO_REVIEWS = [
  { platform: 'google', external_id: 'demo-g-1', author: 'Maria L.', rating: 5, date: '2026-08-20', body: 'Absolutely wonderful experience. The staff went above and beyond and everything was ready on time. Will be recommending to friends!' },
  { platform: 'google', external_id: 'demo-g-2', author: 'Derek P.', rating: 2, date: '2026-08-21', body: 'Waited 40 minutes past my appointment and nobody apologized. When I asked for a refund the manager just shrugged. Not coming back.' },
  { platform: 'yelp', external_id: 'demo-y-1', author: 'Jasmine T.', rating: 1, date: '2026-08-22', body: 'My daughter got sick after our visit and the place looked unsafe. I am reporting this to the health department and talking to my attorney.' },
  { platform: 'google', external_id: 'demo-g-3', author: 'Tom R.', rating: 4, date: '2026-08-23', body: 'Solid service, fair prices. Parking was a little tight but otherwise a good visit. Ask for Kevin, he was great.' },
  { platform: 'yelp', external_id: 'demo-y-2', author: 'Anonymous', rating: 5, date: '2026-08-24', body: 'Best place ever!!! Way better than Riverside Auto down the street, those guys are crooks. Five stars.' },
  { platform: 'facebook', external_id: 'demo-f-1', author: 'Priya N.', rating: 3, date: '2026-08-25', body: 'Mixed feelings. The work was fine but the front desk person, Brenda, was rude and rolled her eyes at me. Call me at 555-201-4477 if you want details.' },
  { platform: 'google', external_id: 'demo-g-4', author: 'Carlos M.', rating: 5, date: '2026-08-26', body: 'They gave me a discount for leaving this review. Nice folks though, honest work.' },
];