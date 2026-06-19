// pages/api/portal-config.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches portal config from Google Sheets via SheetDB.
// ─────────────────────────────────────────────────────────────────────────────

const SHEETDB_API = 'https://sheetdb.io/api/v1/dqhmlczjx3xl8';

// These must exactly match the tab names in your SheetDB-connected spreadsheet.
// To see available tabs: GET https://sheetdb.io/api/v1/dqhmlczjx3xl8/sheets
const TABS = {
  settings:      'Settings',
  navigation:    'Navigation',
  dashStats:     'Dashboard_Stats',
  subjects:      'Subject_Progress',
  attStats:      'Attendance_Stats',
  attMonthly:    'Attendance_Monthly',
  assignments:   'Assignments',
  schedule:      'Schedule',
  notifications: 'Notifications',
  profileFields: 'Student_Profile',
};

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000;

async function fetchTab(tabName) {
  const url = `${SHEETDB_API}?sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Tab "${tabName}" returned HTTP ${res.status}`);
  return res.json();
}

function norm(row) {
  const r = { ...row };
  const bool = v => ['yes', 'true'].includes(String(v).toLowerCase());
  const num  = v => isNaN(Number(v)) ? 0 : Number(v);
  if ('Active'        in r) r.Active        = bool(r.Active);
  if ('Unread'        in r) r.Unread        = bool(r.Unread);
  if ('Visible'       in r) r.Visible       = bool(r.Visible);
  if ('Order'         in r) r.Order         = num(r.Order);
  if ('Display Order' in r) r['Display Order'] = num(r['Display Order']);
  if ('Progress %'    in r) r['Progress %'] = num(r['Progress %']);
  if ('Attendance %'  in r) r['Attendance %'] = num(r['Attendance %']);
  if ('Total Topics'  in r) r['Total Topics'] = num(r['Total Topics']);
  if ('Topics Done'   in r) r['Topics Done']  = num(r['Topics Done']);
  return r;
}

function toSettings(rows) {
  const obj = {};
  (rows || []).forEach(row => {
    if (row.Key && !row.Key.includes('—') && !row.Key.toLowerCase().includes('configuration')) {
      obj[row.Key] = row.Value ?? '';
    }
  });
  return obj;
}

async function fetchAll() {
  // First discover what tabs actually exist in this SheetDB API
  const sheetsRes = await fetch(`${SHEETDB_API}/sheets`);
  const sheetsData = await sheetsRes.json();
  const availableTabs = sheetsData.sheets || [];

  console.log('[portal-config] Available SheetDB tabs:', availableTabs);

  // Build a case-insensitive lookup
  const tabLookup = {};
  availableTabs.forEach(t => { tabLookup[t.toLowerCase().replace(/[\s_]/g, '')] = t; });

  // Match our expected tab names to actual tab names
  const resolve = (expected) => {
    const key = expected.toLowerCase().replace(/[\s_]/g, '');
    return tabLookup[key] || expected; // fall back to original if not found
  };

  const [settings, navigation, dashStats, subjects, attStats, attMonthly,
         assignments, schedule, notifications, profileFields] =
    await Promise.all([
      fetchTab(resolve(TABS.settings)),
      fetchTab(resolve(TABS.navigation)),
      fetchTab(resolve(TABS.dashStats)),
      fetchTab(resolve(TABS.subjects)),
      fetchTab(resolve(TABS.attStats)),
      fetchTab(resolve(TABS.attMonthly)),
      fetchTab(resolve(TABS.assignments)),
      fetchTab(resolve(TABS.schedule)),
      fetchTab(resolve(TABS.notifications)),
      fetchTab(resolve(TABS.profileFields)),
    ]);

  return {
    settings:      toSettings(settings),
    navigation:    (navigation    || []).map(norm).filter(r => r.Active).sort((a,b) => a.Order - b.Order),
    dashStats:     (dashStats     || []).map(norm).filter(r => r.Active).sort((a,b) => a['Display Order'] - b['Display Order']),
    subjects:      (subjects      || []).map(norm).filter(r => r.Active).sort((a,b) => a['Display Order'] - b['Display Order']),
    attStats:      (attStats      || []).map(norm).sort((a,b) => a['Display Order'] - b['Display Order']),
    attMonthly:    (attMonthly    || []).map(norm).sort((a,b) => a['Display Order'] - b['Display Order']),
    assignments:   (assignments   || []).map(norm).filter(r => r.Active),
    schedule:      (schedule      || []).map(norm).filter(r => r.Active),
    notifications: (notifications || []).map(norm).filter(r => r.Active),
    profileFields: (profileFields || []).map(norm).filter(r => r.Visible),
    _availableTabs: availableTabs, // included so you can see them in the response
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Special diagnostic endpoint: /api/portal-config?tabs=1
  // Shows you exactly what tabs SheetDB can see
  if (req.query.tabs) {
    const r = await fetch(`${SHEETDB_API}/sheets`);
    const d = await r.json();
    return res.status(200).json(d);
  }

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  try {
    const data = await fetchAll();
    cache = data;
    cacheTime = Date.now();
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[portal-config]', err.message);
    if (cache) {
      res.setHeader('X-Cache', 'STALE');
      return res.status(200).json(cache);
    }
    return res.status(503).json({ error: 'Sheet unavailable', message: err.message });
  }
}
