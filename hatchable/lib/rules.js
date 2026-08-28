import { db } from 'hatchable';

/**
 * Effective rule set for a business: global defaults (business_id NULL) minus per-business disables,
 * plus the business's own rules.
 */
export async function effectiveRules(businessId) {
  const r = await db.query(
    `SELECT r.*, COALESCE(o.enabled, r.enabled) AS effective_enabled, (r.business_id IS NULL) AS is_global
       FROM compliance_rules r
       LEFT JOIN rule_overrides o ON o.rule_id = r.id AND o.business_id = $1
      WHERE r.business_id IS NULL OR r.business_id = $1
      ORDER BY r.business_id NULLS FIRST, r.applies_to, r.created_at`,
    [businessId]
  );
  return r.rows;
}

export function activeRules(rules, target) {
  return rules.filter(r => r.effective_enabled && (r.applies_to === target || r.applies_to === 'both'));
}

function compile(pattern) {
  try { return new RegExp(pattern, 'i'); } catch { return null; }
}

/** Run regex/keyword rules against text. Returns [{ rule, detail }]. */
export function runRegexRules(rules, text) {
  const hits = [];
  const t = String(text || '');
  for (const rule of rules) {
    if (rule.kind !== 'regex' && rule.kind !== 'keyword') continue;
    if (!rule.pattern) continue;
    let re;
    if (rule.kind === 'keyword') {
      const words = rule.pattern.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!words.length) continue;
      re = compile('\\b(' + words.join('|') + ')\\b');
    } else {
      re = compile(rule.pattern);
    }
    if (!re) continue;
    const m = t.match(re);
    if (m) hits.push({ rule, detail: `Matched "${m[0].slice(0, 80)}"` });
  }
  return hits;
}

export const SEVERITY_RANK = { info: 0, warn: 1, block: 2 };

export function maxSeverity(hits) {
  return hits.reduce((acc, h) => Math.max(acc, SEVERITY_RANK[h.rule.severity] ?? 0), -1);
}