import { db } from 'hatchable';
import { requireEntitled } from 'lib/entitle.js';
import { ingestBatch, DEMO_REVIEWS } from 'lib/ingest.js';

export const access = 'user';
export const methods = ['POST', 'DELETE'];

// A brand-new business has no reviews until a connector is wired or a CSV is
// imported, which makes the dashboard look broken on day one. This loads a
// clearly-marked sample set through the real pipeline, so what the owner sees
// is genuinely computed — not hardcoded numbers dressed up as their data.
// DELETE removes it again, leaving real reviews untouched.
export default async function (req, res) {
  const biz = await requireEntitled(req, res, req.params.id, 'owner');
  if (!biz) return;

  if (req.method === 'DELETE') {
    const del = await db.query(
      `DELETE FROM reviews WHERE business_id = $1 AND source = 'sample' RETURNING id`,
      [biz.id]
    );
    return res.json({ removed: del.rows.length });
  }

  const existing = await db.query(
    `SELECT count(*)::int AS n FROM reviews WHERE business_id = $1 AND source = 'sample'`,
    [biz.id]
  );
  if (existing.rows[0].n > 0) {
    return res.status(409).json({ error: 'Sample data is already loaded.', code: 'already_loaded' });
  }

  // Runs the genuine analysis pipeline, so these rows exercise the same AI
  // triage, compliance checks and escalation logic as real reviews.
  const result = await ingestBatch(biz, DEMO_REVIEWS, {
    source: 'sample',
    actor: req.user.email || req.user.id,
  });

  res.status(201).json({
    sample: true,
    created: result.created,
    processed: result.processed,
    errors: result.errors,
  });
}