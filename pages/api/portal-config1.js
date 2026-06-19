// pages/api/portal-config.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4ZiRm6pONwbeeSLwZ7lx9bZMQWIDf7tCucUc73_pbmudoimYACqn6kiR3zJpV6np5/exec';

let cache   = null;
let cacheAt = 0;
const TTL   = 15 * 1000;

function num(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

function norm(row) {
  const r = { ...row };
  if ('Order'         in r) r.Order            = num(r.Order);
  if ('Display Order' in r) r['Display Order'] = num(r['Display Order']);
  if ('Progress %'    in r) r['Progress %']    = num(r['Progress %']);
  if ('Attendance %'  in r) r['Attendance %']  = num(r['Attendance %']);
  if ('Total Topics'  in r) r['Total Topics']  = num(r['Total Topics']);
  if ('Topics Done'   in r) r['Topics Done']   = num(r['Topics Done']);
  return r;
}

function normaliseSettings(settings) {
  if (Array.isArray(settings)) {
    const obj = {};
    settings.forEach(row => {
      if (row.Key && !String(row.Key).includes('—')) obj[row.Key] = row.Value ?? '';
    });
    return obj;
  }
  return settings || {};
}

// Keep only rows that have at least one non-empty value (skip blank sheet rows)
function nonEmpty(rows) {
  return rows.filter(r => Object.values(r).some(v => String(v).trim() !== ''));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (cache && Date.now() - cacheAt < TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  try {
    const r   = await fetch(SCRIPT_URL, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(`Apps Script HTTP ${r.status}`);
    const raw = await r.json();
    if (raw.error) throw new Error(raw.error);

    // Log first row of navigation so we can see all actual column names
    if ((raw.navigation || []).length > 0) {
      console.log('[portal-config] Navigation columns:', Object.keys(raw.navigation[0]));
      console.log('[portal-config] Navigation row 1:', JSON.stringify(raw.navigation[0]));
    }

    const formatted = {
      settings:      normaliseSettings(raw.settings),
      navigation:    nonEmpty((raw.navigation    || []).map(norm)).sort((a,b) => a.Order - b.Order),
      dashStats:     nonEmpty((raw.dashStats     || []).map(norm)).sort((a,b) => a['Display Order'] - b['Display Order']),
      subjects:      nonEmpty((raw.subjects      || []).map(norm)).sort((a,b) => a['Display Order'] - b['Display Order']),
      attStats:      nonEmpty((raw.attStats      || []).map(norm)).sort((a,b) => a['Display Order'] - b['Display Order']),
      attMonthly:    nonEmpty((raw.attMonthly    || []).map(norm)).sort((a,b) => a['Display Order'] - b['Display Order']),
      assignments:   nonEmpty((raw.assignments   || []).map(norm)),
      schedule:      nonEmpty((raw.schedule      || []).map(norm)),
      notifications: nonEmpty((raw.notifications || []).map(norm)),
      profileFields: nonEmpty((raw.profileFields || []).map(norm)),
    };

    console.log('[portal-config] Loaded — nav:', formatted.navigation.length,
      'dashStats:', formatted.dashStats.length, 'subjects:', formatted.subjects.length,
      'assignments:', formatted.assignments.length, 'schedule:', formatted.schedule.length,
      'notifications:', formatted.notifications.length);

    cache   = formatted;
    cacheAt = Date.now();
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(cache);

  } catch (err) {
    console.error('[portal-config]', err.message);
    if (cache) { res.setHeader('X-Cache', 'STALE'); return res.status(200).json(cache); }
    return res.status(503).json({ error: 'Sheet unavailable', message: err.message });
  }
}
