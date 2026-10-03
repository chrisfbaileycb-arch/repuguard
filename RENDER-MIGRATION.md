# RepuGuard on Render

This Blueprint hosts the full original React frontend and Express API together, with same-origin `/api` calls and SPA routing. It does not deploy the compact `hatchable/` rebuild.

## Configure and deploy

Provide a durable PostgreSQL connection in `DATABASE_URL`. Render's free database expires after 30 days and is unsuitable for permanent customer data. This Blueprint does not silently provision an expiring datastore or charge for a paid one. Use a paid Render PostgreSQL instance or an existing persistent PostgreSQL database.

The Blueprint creates a random JWT signing secret. Set `ADMIN_EMAILS` to the owner's actual email and set `ADMIN_PASSWORD` (12+ characters) securely in Render. Startup creates the owner only if no owner exists. Public registration cannot claim an owner email. Production refuses the development signing key or an ephemeral local database. Sample users and fabricated reviews are not seeded in production.

Set `FRONTEND_URL` to the final Render URL. Stripe keys, price ID and webhook secret are required only for billing; configure the Stripe webhook at the new `/api/webhooks/stripe` URL before enabling charges. Leave billing disabled during workflow review.

Build: `npm ci --include=dev && npm ci --prefix backend && npm run build`. Start: `node backend/server.js`. Health: `/health`.

## Current product limits

Moving hosts does not complete the live Google/Yelp integrations. The original `/api/scan/run` generated random scan counts. The production endpoint now reports that live ingestion is unavailable instead of claiming a real scan happened. Review responses and connection controls also need provider integration verification before customer launch. The current source remains a workflow prototype for those integrations.

The Hatchable rebuild has one business, no reviews and no business memberships. The full database export, including connector configuration and compliance rules, is kept separately. These schemas differ from the original application's user/review schema; validate business identity mapping before importing. Do not remove the old app until the new owner login and customer workflow are tested.

## Verification

Production frontend build and backend syntax checks passed. Local server health and SPA routes passed. Admin API access without authentication returned 401; attempted public registration with the owner email returned 403. Live providers, Stripe and the hosted database are not yet verified.
