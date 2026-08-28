import { db } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';
import { settingsOf, DEFAULT_SETTINGS, clampInt, log } from 'lib/util.js';
import { BUILT_IN_TEMPLATES, CUSTOM_SLOTS, AUTO_REPLY_MODES, enabledReplies } from 'lib/replies.js';

export const access = 'user';
export const methods = ['GET', 'PATCH', 'DELETE'];

const MODE_IDS = AUTO_REPLY_MODES.map((m) => m.id);
const BUILT_IN_IDS = BUILT_IN_TEMPLATES.map((t) => t.id);
const VALID_REPLY_IDS = BUILT_IN_IDS.concat(
  Array.from({ length: CUSTOM_SLOTS }, (_, i) => `custom_${i + 1}`)
);

export default async function (req, res) {
  const biz = await requireBusiness(req, res, req.params.id, req.method === 'GET' ? 'viewer' : 'owner');
  if (!biz) return;

  if (req.method === 'GET') {
    return res.json({ business: present(biz), catalogue: catalogue() });
  }

  if (req.method === 'DELETE') {
    await db.query('DELETE FROM businesses WHERE id = $1', [biz.id]);
    return res.json({ ok: true });
  }

  const b = req.body || {};
  const fields = {};
  if (typeof b.name === 'string' && b.name.trim().length >= 2) fields.name = b.name.trim().slice(0, 120);
  if (typeof b.industry === 'string') fields.industry = b.industry.trim().slice(0, 80) || null;
  if (typeof b.website === 'string') fields.website = b.website.trim().slice(0, 200) || null;

  const cur = settingsOf(biz);
  const s = b.settings || {};
  const next = { ...cur };

  // Where the owner draws the line between "thank them" and "I will handle it".
  // Capped at 4 so a 5-star review can never be routed away from an auto-reply,
  // and floored at 1 so there is always something the owner owns.
  if ('owner_handles_at_or_below' in s) {
    next.owner_handles_at_or_below = clampInt(s.owner_handles_at_or_below, 1, 4, cur.owner_handles_at_or_below);
  }

  if ('auto_reply_mode' in s) {
    if (!MODE_IDS.includes(s.auto_reply_mode)) {
      return res.status(400).json({ error: `auto_reply_mode must be one of: ${MODE_IDS.join(', ')}` });
    }
    next.auto_reply_mode = s.auto_reply_mode;
  }

  if ('reply_template_ids' in s) {
    if (!Array.isArray(s.reply_template_ids)) {
      return res.status(400).json({ error: 'reply_template_ids must be an array' });
    }
    const unknown = s.reply_template_ids.filter((id) => !BUILT_IN_IDS.includes(id));
    if (unknown.length) {
      return res.status(400).json({ error: `Unknown reply template: ${unknown.join(', ')}` });
    }
    next.reply_template_ids = [...new Set(s.reply_template_ids)];
  }

  if ('single_reply_id' in s) {
    if (!VALID_REPLY_IDS.includes(s.single_reply_id)) {
      return res.status(400).json({ error: 'single_reply_id is not a known reply' });
    }
    next.single_reply_id = s.single_reply_id;
  }

  if ('custom_replies' in s) {
    if (!Array.isArray(s.custom_replies)) {
      return res.status(400).json({ error: 'custom_replies must be an array' });
    }
    next.custom_replies = Array.from({ length: CUSTOM_SLOTS }, (_, i) =>
      // null is how the client clears a slot — see the signature note below.
      s.custom_replies[i] === null ? '' : String(s.custom_replies[i] || '').trim().slice(0, 1000)
    );
  }

  // Clearing a value sends null, not "".
  //
  // A blank string does not survive the request: send { signature: "" } and the
  // key never reaches the handler, so an owner who deleted their sign-off in
  // the browser would watch the old one come straight back. null arrives
  // intact, so it is what the client sends for "remove this".
  if (s.signature === null) {
    next.signature = '';
  } else if (typeof s.signature === 'string') {
    next.signature = s.signature.trim().slice(0, 200);
  }

  // A mode of 'rotate' or 'single' with nothing enabled would silently send
  // nothing at all. Refuse it, so "off" is always a deliberate choice.
  if (next.auto_reply_mode !== 'off' && enabledReplies(next).length === 0) {
    return res.status(400).json({
      error: 'Pick at least one reply, or set auto-replies to off.',
      code: 'no_replies_enabled',
    });
  }

  const sets = ['settings = $2::jsonb', 'updated_at = now()'];
  const params = [biz.id, JSON.stringify(next)];
  for (const [k, v] of Object.entries(fields)) { params.push(v); sets.push(`${k} = $${params.length}`); }
  const r = await db.query(`UPDATE businesses SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, params);
  await log(db, biz.id, null, req.user.email, 'business.updated', { fields: Object.keys(fields), settings: Object.keys(s) });
  res.json({ business: present({ ...r.rows[0], role: biz.role }), catalogue: catalogue() });
}

function catalogue() {
  return {
    templates: BUILT_IN_TEMPLATES,
    modes: AUTO_REPLY_MODES,
    custom_slots: CUSTOM_SLOTS,
  };
}

function present(b) {
  return {
    id: b.id, name: b.name, industry: b.industry, website: b.website, role: b.role,
    created_at: b.created_at, settings: { ...DEFAULT_SETTINGS, ...(b.settings || {}) },
    ingest_token: b.role === 'owner' ? b.ingest_token : undefined,
  };
}