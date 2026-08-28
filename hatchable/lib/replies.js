// Reply templates and owner guidance.
//
// Deliberately no AI: the rule is the rating. Good reviews get a thank-you the
// owner chose in advance; anything at or below the threshold gets no written
// reply from us at all, only an alert and some advice. That keeps the product
// cheap to run, predictable, and impossible to embarrass its owner with.

// {{author}} and {{business}} are filled in per review; {{author}} falls back
// to a neutral greeting when the platform gave no name.
export const BUILT_IN_TEMPLATES = [
  {
    id: 'warm',
    label: 'Warm and personal',
    body: 'Thank you so much, {{author}} — this really made our day. We appreciate you taking the time to share it, and we look forward to seeing you again at {{business}}.',
  },
  {
    id: 'grateful',
    label: 'Short and grateful',
    body: 'Thanks for the kind words, {{author}}. It means a lot to everyone here at {{business}}.',
  },
  {
    id: 'team',
    label: 'Credits the team',
    body: 'Thank you, {{author}}. We passed this along to the team and it genuinely made them smile. Thanks for choosing {{business}}.',
  },
  {
    id: 'welcome-back',
    label: 'Invites them back',
    body: 'We really appreciate the review, {{author}}. Thank you for supporting {{business}} — we hope to see you again soon.',
  },
  {
    id: 'straightforward',
    label: 'Plain and professional',
    body: 'Thank you for the review, {{author}}. We are glad you had a good experience with {{business}} and we appreciate you sharing it.',
  },
  {
    id: 'community',
    label: 'Local and friendly',
    body: 'Thanks so much, {{author}}. Reviews like yours are how neighbours find us, and we are grateful for it. See you next time at {{business}}.',
  },
];

// Two slots the owner writes themselves. Empty by default; blank slots are
// skipped when replying, so an unfinished one never posts an empty message.
export const CUSTOM_SLOTS = 2;

export const AUTO_REPLY_MODES = [
  { id: 'rotate', label: 'Rotate through my selected replies' },
  { id: 'single', label: 'Always use one reply' },
  { id: 'off', label: 'Do not reply automatically' },
];

/**
 * What the owner sees next to a review they have to handle themselves.
 * Advice about how to approach it, NOT words to copy. The owner writes the
 * reply; a canned apology under their name is exactly what this avoids.
 */
export const LOW_RATING_GUIDANCE = [
  'Reply in your own words — a personal response reads very differently from a template here.',
  'Acknowledge what went wrong and apologise plainly, without excuses or blaming the customer.',
  'Say what you are doing about it, even if it is small and specific.',
  'Offer to continue the conversation off the review — invite them to contact you directly.',
  'Do not offer money, a discount or anything else in exchange for changing or removing the review. Google and Yelp both prohibit it.',
  'Do not mention private details of their visit, purchase or account in a public reply.',
  'If it alleges anything about health, safety or legal action, take a breath and consider getting advice before you post.',
];

function escapeName(name) {
  return String(name || '').trim();
}

export function fillTemplate(body, { author, business }) {
  const name = escapeName(author);
  return String(body || '')
    // No name from the platform: "Thank you so much, there" reads badly, so
    // drop the address entirely rather than greeting a placeholder.
    .replace(/,?\s*\{\{author\}\}/g, name ? `, ${name}` : '')
    .replace(/\{\{business\}\}/g, escapeName(business) || 'our business')
    // Reviewer names are routinely abbreviated ("Tom R."), and dropping one
    // straight before the template's own full stop produces "Tom R.." on a
    // public review page. Collapse repeated sentence punctuation.
    .replace(/([.!?])\1+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Every reply the owner has actually enabled, in display order:
 * the built-ins they ticked, then any custom slots they filled in.
 */
export function enabledReplies(settings) {
  const chosen = Array.isArray(settings.reply_template_ids) ? settings.reply_template_ids : [];
  const custom = Array.isArray(settings.custom_replies) ? settings.custom_replies : [];

  const builtIns = BUILT_IN_TEMPLATES
    .filter((t) => chosen.includes(t.id))
    .map((t) => ({ id: t.id, body: t.body }));

  const written = custom
    .slice(0, CUSTOM_SLOTS)
    .map((body, i) => ({ id: `custom_${i + 1}`, body: String(body || '').trim() }))
    .filter((r) => r.body.length > 0);

  return builtIns.concat(written);
}

/**
 * Choose the reply for one review.
 *
 * `sentCount` is how many auto-replies this business has already sent; using it
 * to index the rotation means consecutive reviewers do not all receive the same
 * words, which is what makes a profile look automated.
 *
 * Returns null when nothing should be sent.
 */
export function pickReply(settings, review, business, sentCount = 0) {
  const mode = settings.auto_reply_mode || 'rotate';
  if (mode === 'off') return null;

  const replies = enabledReplies(settings);
  if (!replies.length) return null;

  let chosen;
  if (mode === 'single') {
    chosen = replies.find((r) => r.id === settings.single_reply_id) || replies[0];
  } else {
    chosen = replies[Math.abs(sentCount) % replies.length];
  }

  const body = fillTemplate(chosen.body, {
    author: review.author_name,
    business: business.name,
  });
  if (!body) return null;

  const signature = String(settings.signature || '').trim();
  return {
    templateId: chosen.id,
    body: signature ? `${body}\n\n${signature}` : body,
  };
}