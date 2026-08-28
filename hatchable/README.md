# RepuGuard on Hatchable

This folder is a byte-exact mirror of the RepuGuard app that runs live on
Hatchable. It is here so git is the backup — nothing in this folder is used by
the Express/Vite app in the rest of this repository.

**Live project:** `proj_uBR8ceouzWe8` — RepuGuard
**Live URL:** https://repuguard.hatchable.site

## Two codebases, zero shared files

The repository root and this folder are two separate implementations of the
same product. They do not import from each other and never will:

| | Repository root | `hatchable/` |
|---|---|---|
| Frontend | React + JSX, built by Vite | `htm` tagged templates, no build step |
| Backend | Express, `pg`/PGlite | Per-file route handlers on a V8 isolate |
| Auth | `bcryptjs` + `jsonwebtoken` | Platform auth (`hatchable.auth`) |
| Stripe | `stripe` npm package | Direct REST calls to `api.stripe.com/v1` |
| Deploy | Docker | `deploy` via the Hatchable MCP tools |

Hatchable rejects `.jsx`/`.tsx`, runs no `npm install`, and has no Node
built-ins, so none of the root code could be reused. Changing one side does
not change the other. If you fix a bug in both, you write it twice.

## Restoring this into a Hatchable project

Copy every file in this folder to the project root — `api/`, `lib/`,
`migrations/`, `public/`, and `hatchable.toml` — then deploy.

Two things this mirror deliberately omits:

**1. Vendored browser libraries.** `public/vendor/` holds third-party UMD
builds served from the app's own origin (Hatchable's CSP blocks CDNs). They are
re-fetchable rather than stored here:

```
import_file_from_url  https://unpkg.com/react@18.3.1/umd/react.production.min.js          → public/vendor/react.js
import_file_from_url  https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js  → public/vendor/react-dom.js
import_file_from_url  https://unpkg.com/htm@3.1.1/dist/htm.umd.js                         → public/vendor/htm.js
```

The live project also carries `public/vendor/alpine.min.js` from an earlier
iteration. Nothing references it; it does not need restoring.

**2. Secrets.** `hatchable.toml` declares which config keys the app reads
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, the three price IDs). The values
live in the Hatchable console and are never committed.

## What the app does

Reviews arrive by `POST /api/ingest/{token}` (JSON or CSV, up to 200 at a
time). Every review runs through `lib/pipeline.js`, which sorts it by rating
alone — there is no AI and no API key:

- **At or below the owner's threshold (3 stars by default), or no rating at
  all** → an alert on the dashboard under "Needs your reply". The app writes
  nothing. The owner gets handling advice, not a script, because a low rating
  deserves the owner's own words.
- **Four stars and up** → an automatic thank-you drawn from six built-in
  templates plus two the owner can write, in rotate / always-this-one / off
  modes (`lib/replies.js`).

`lib/rules.js` runs a compliance check over every drafted reply and over
incoming review text, independently of the rating.

No email and no SMS are sent for any of this — alerts live on the dashboard.

Each account gets three sign-ins (`lib/seats.js`): the owner plus two
managers or viewers, so a manager or a spouse can help handle bad reviews.

## Files

```
hatchable.toml                 app manifest: routes, tables, config keys, cron
api/me.js                      session + business list
api/businesses/…               CRUD, dashboard, reviews, escalations, team, samples
api/billing/…                  Stripe Checkout + entitlement status
api/ingest/[token].js          public review intake, token in the URL
api/webhooks/stripe.js         subscription lifecycle, HMAC-verified
api/jobs/sync-connectors.js    scheduled connector sync
lib/pipeline.js                rating-based triage — the core of the product
lib/replies.js                 reply templates and rotation
lib/rules.js                   compliance engine
lib/seats.js                   three-logins-per-account
lib/{authz,entitle,plans,stripe,billing-events,ingest,urls,util}.js
migrations/000{1..4}_*.sql     schema, seeded rules, billing, invites
public/{index,login,app}.html  marketing page, sign-in, the SPA
public/theme.css               shared design tokens
```
