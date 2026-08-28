import { db } from 'hatchable';
import { CONNECTORS, ingestBatch } from 'lib/ingest.js';
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

  const summary = { businesses: businesses.length, connectors: 0, created: 0, failed: 0 };

  for (const business of businesses) {
    if (!isEntitled(business)) continue;

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

  console.log('sync-connectors', JSON.stringify(summary));
  res.json(summary);
}