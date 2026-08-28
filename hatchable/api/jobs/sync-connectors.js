import { db } from 'hatchable';
import { CONNECTORS, ingestBatch, sweepUnprocessed } from 'lib/ingest.js';
import { isEntitled } from 'lib/plans.js';

// Invoked only by the platform scheduler ([[cron]] hourly). External HTTP
// requests to this path get a 404.
export const access = 'scheduler';

export default async function (req, res) {
  // Only sync businesses that are actually paying. Polling third-party APIs
  // for lapsed accounts burns quota for nothing.
  const { rows: businesses } = await db.query(
    `SELECT * FROM businesses WHERE billing_status = ANY($1::text[])`,
    [['active', 'past_due']]
  );

  const summary = { businesses: businesses.length, connectors: 0, created: 0, failed: 0, swept: 0, throttled: false };
  const paying = businesses.filter(isEntitled);

  // ─── 1. Pull anything new from connected platforms ──────────────────────────
  for (const business of paying) {
    const { rows: connectors } = await db.query(
      `SELECT * FROM connectors WHERE business_id = $1 AND status = 'connected'`,
      [business.id]
    );

    for (const connector of connectors) {
      summary.connectors++;
      const adapter = CONNECTORS[connector.platform];
      if (!adapter) continue;

      try {
        const raw = await adapter.fetchReviews(connector);
        const result = await ingestBatch(business, raw || [], {
          source: `cron:${connector.platform}`,
          defaults: { platform: connector.platform },
        });
        summary.created += result.created;

        await db.query(
          `UPDATE connectors SET last_synced_at = now(), last_error = NULL WHERE id = $1`,
          [connector.id]
        );
      } catch (e) {
        summary.failed++;
        // A connector that cannot reach its provider is expected while
        // credentials are unwired; record it and carry on to the next one.
        await db.query(
          `UPDATE connectors SET last_error = $2, last_synced_at = now() WHERE id = $1`,
          [connector.id, String(e.message || e).slice(0, 500)]
        );
      }
    }
  }

  // ─── 2. Analyse whatever is still waiting ───────────────────────────────────
  // A large import stores every review but only analyses the first slice
  // inline — processReview costs roughly ten database calls, and the platform
  // caps those at 100 per 10 seconds. The rest sit at status 'new' until this
  // runs. Without it they would stay there for ever: no alert on a one-star
  // review, no drafted reply on a five-star one.
  //
  // Bounded by a budget shared across businesses so one customer's backlog
  // cannot starve the others, and stopped early if the project hits its rate
  // limit. Either way the next tick continues from where this one stopped.
  let sweepBudget = 60;

  for (const business of paying) {
    if (sweepBudget <= 0) break;
    try {
      const swept = await sweepUnprocessed(business, { limit: Math.min(20, sweepBudget) });
      summary.swept += swept.processed;
      sweepBudget -= swept.processed;
      if (swept.throttled) { summary.throttled = true; break; }
    } catch (e) {
      console.error('sweepUnprocessed failed', business.id, e.message);
    }
  }

  console.log('sync-connectors', JSON.stringify(summary));
  res.json(summary);
}