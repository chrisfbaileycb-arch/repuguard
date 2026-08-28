import { db } from 'hatchable';
import { ingestBatch, parseCsv } from 'lib/ingest.js';
import { isEntitled } from 'lib/plans.js';
import { log } from 'lib/util.js';

// Public: the caller is a script, a Zapier step, or a platform webhook, none
// of which have a session. The per-business ingest_token is the credential.
export const access = 'public';
export const methods = ['POST'];

// POST /api/ingest/{ingest_token}
//
// This is how real reviews get in. Until it existed the connectors were the
// only route and all of them throw pending credentials, so a business had no
// way to move past the sample set.
//
// Accepts either:
//   application/json  { reviews: [ {...}, ... ] }  or a bare array
//   text/csv          a CSV with a header row
//
// Every field name lib/ingest.js#normalize understands is accepted, so
// exports from different platforms mostly work unedited.
export default async function (req, res) {
  const token = String(req.params.token || '');
  // Length check before touching the database: this endpoint is unauthenticated
  // and public, so it should reject junk without doing work.
  if (token.length < 24 || token.length > 128) {
    return res.status(404).json({ error: 'Unknown ingest token.' });
  }

  const { rows } = await db.query('SELECT * FROM businesses WHERE ingest_token = $1', [token]);
  const business = rows[0];
  // Same response for a malformed and an unknown token, so this cannot be
  // used to probe which tokens exist.
  if (!business) return res.status(404).json({ error: 'Unknown ingest token.' });

  if (!isEntitled(business)) {
    return res.status(402).json({
      error: 'This business does not have an active subscription.',
      code: 'payment_required',
    });
  }

  // Parse the payload.
  let items = [];
  const contentType = String(req.headers['content-type'] || '');

  if (contentType.includes('csv') || typeof req.body === 'string') {
    const text = typeof req.body === 'string' ? req.body : req.rawBody;
    items = parseCsv(text || '');
  } else if (Array.isArray(req.body)) {
    items = req.body;
  } else if (req.body && Array.isArray(req.body.reviews)) {
    items = req.body.reviews;
  } else {
    return res.status(400).json({
      error: 'Send a JSON array, { "reviews": [...] }, or a CSV body.',
      code: 'bad_payload',
    });
  }

  if (!items.length) return res.status(400).json({ error: 'No reviews found in the payload.' });
  if (items.length > 200) {
    return res.status(413).json({ error: 'Send at most 200 reviews per request.', code: 'too_many' });
  }

  // processReview costs roughly half a second of SQL per review, so a 200-row
  // import cannot be analysed inside one request. Store everything, analyse
  // the first slice inline, and leave the rest at status 'new' for the hourly
  // sweep. Previously this passed `process: items.length <= ANALYSE_INLINE`,
  // which switched analysis off for the WHOLE batch above ten: an import of a
  // customer's review history was stored and then never looked at, so a
  // one-star review in it raised no alert and no reply was ever drafted.
  const ANALYSE_INLINE = 10;

  const result = await ingestBatch(business, items, {
    source: 'api',
    actor: 'ingest-api',
    limit: items.length,
    process: true,
    processLimit: ANALYSE_INLINE,
  });

  await log(db, business.id, null, 'ingest-api', 'reviews.ingested', {
    received: result.received,
    created: result.created,
    duplicates: result.duplicates,
    analysed: result.processed,
    queued: result.queued,
    sample_cleared: result.sampleCleared,
  });

  return res.status(201).json({
    received: result.received,
    created: result.created,
    duplicates: result.duplicates,
    skipped: result.skipped,
    analysed: result.processed,
    // Stored, not yet analysed. These are picked up within the hour.
    queued: result.queued,
    // Reported so the caller can see the placeholder set retiring itself.
    sample_reviews_removed: result.sampleCleared,
    errors: result.errors.slice(0, 5),
  });
}