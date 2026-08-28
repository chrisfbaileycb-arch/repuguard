import { db } from 'hatchable';
import { listBusinessesFor } from 'lib/authz.js';
import { token, DEFAULT_SETTINGS, log } from 'lib/util.js';

export const access = 'user';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  if (req.method === 'GET') {
    return res.json({ businesses: await listBusinessesFor(req.user.id) });
  }
  const { name, industry, website } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Business name is required' });
  }
  const count = await db.query('SELECT count(*)::int AS n FROM business_members WHERE user_id = $1', [req.user.id]);
  if (count.rows[0].n >= 25) return res.status(400).json({ error: 'Business limit reached' });

  const settings = { ...DEFAULT_SETTINGS, signature: `— The ${name.trim()} Team` };
  const ins = await db.query(
    `INSERT INTO businesses (name, industry, website, owner_user_id, ingest_token, settings)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id, name, industry, website, created_at`,
    [name.trim().slice(0, 120), (industry || '').trim().slice(0, 80) || null, (website || '').trim().slice(0, 200) || null, req.user.id, token(), JSON.stringify(settings)]
  );
  const biz = ins.rows[0];
  await db.query('INSERT INTO business_members (business_id, user_id, role) VALUES ($1,$2,$3)', [biz.id, req.user.id, 'owner']);
  for (const p of ['google', 'yelp', 'facebook']) {
    await db.query('INSERT INTO connectors (business_id, platform) VALUES ($1,$2) ON CONFLICT DO NOTHING', [biz.id, p]);
  }
  await log(db, biz.id, null, req.user.email, 'business.created', { name: biz.name });
  res.status(201).json({ business: { ...biz, role: 'owner' } });
}