export function token(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function clampInt(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

export function isUuid(s) {
  return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export const PLATFORMS = ['google', 'yelp', 'facebook', 'tripadvisor', 'bbb', 'other'];

export const DEFAULT_SETTINGS = {
  // Reviews at or below this rating are the owner's to answer personally.
  // Nothing is ever written on their behalf below this line.
  owner_handles_at_or_below: 3,

  // 'rotate' cycles the chosen replies so consecutive reviewers do not all get
  // identical words; 'single' always uses one; 'off' disables auto-replies.
  auto_reply_mode: 'rotate',

  // Which built-in replies are switched on. Three by default, so rotation is
  // meaningful on day one without the owner configuring anything.
  reply_template_ids: ['warm', 'grateful', 'team'],

  // Used only when auto_reply_mode is 'single'.
  single_reply_id: 'warm',

  // The owner's own wording. Two slots, blank until they write them; a blank
  // slot is skipped rather than posted.
  custom_replies: ['', ''],

  signature: '',
};

export function settingsOf(business) {
  return { ...DEFAULT_SETTINGS, ...(business?.settings || {}) };
}

export async function log(db, businessId, reviewId, actor, action, detail = {}) {
  try {
    await db.query(
      'INSERT INTO activity_log (business_id, review_id, actor, action, detail) VALUES ($1, $2, $3, $4, $5::jsonb)',
      [businessId, reviewId, actor, action, JSON.stringify(detail)]
    );
  } catch (e) {
    console.error('activity_log failed', e.message);
  }
}