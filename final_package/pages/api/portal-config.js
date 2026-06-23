// pages/api/portal-config.js
//
// Reads the live Google Sheets content (master subject list + 5 per-subject
// question-bank files) and returns it in the exact shape portal.js expects
// from fetchAllSheetData(). All 6 files must be shared as "Anyone with the
// link → Viewer" — this route uses Google's public CSV export endpoint and
// requires NO credentials / service account / API key.
//
// If any individual fetch fails (renamed tab, file made private, network
// blip, etc.) that one piece is simply omitted from the response — portal.js
// already falls back to its own FALLBACK data for any array that comes back
// empty, so a partial failure here never breaks the page.

// ── Sheet IDs ────────────────────────────────────────────────────────────────
// To update later: open the file in Drive, copy the long ID between
// /d/ and /edit in the URL, and paste it below.
const SHEETS = {
  master: '1DRrtTtWsUNH38LOPuVNa4B9bHKXkRK1UccV3WMT2fx0', // Assignment Portal — Subjects (Master)
  subjects: {
    'Mathematics':       '1pNLKtuG90F28NyLBjz53NK8Nl8I9kC18UwRyA8EZ8tU',
    'Science':           '13zZy6TdtTFHh0aGEIF3T2Hw_dC4sDi6yVABI5qbcUrY',
    'English Grammar':   '1rsoL-ZBgcejtefzZ1KjR2DRcyxMhSVbwgO7Mu6IC65U',
    'Social Studies':    '1H4tLGOZBXWNeQbXAtlCtSktMvzwcEdwmiEvQpyD9xqs',
    'General Knowledge': '1AcPo8DPmZYJeno3kYTgvPO2sS8GcEQJX6guDLJ3qfWA',
    'Artificial Intelegence': '1GL0oIaFc3TnyTrMIZmqpWTBrYfb-Me8k5X8WwZKCE2I',
    'Basic Danish': '1cVbB-AE7zwCwARRpln0VBzd3VINjtHnrG2Zf3kIm8Sw',

  },
};

const CSV_URL = (sheetId, tabName) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

// ── Minimal CSV parser (handles quoted fields, embedded commas/newlines) ────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\r') { /* skip, \n handles the break */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  // last field/row if the file doesn't end in a newline
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Converts parsed CSV rows into an array of header-keyed objects, exactly
// like the FALLBACK arrays in portal.js. Blank rows (teacher hasn't filled
// them in yet) are skipped. 'Active' is coerced from "TRUE"/"FALSE" text
// into a real boolean since isRowActive() expects that.
function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const isBlank = cells.every(c => (c || '').trim() === '');
    if (isBlank) continue;

    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return; // skip stray unnamed columns
      let val = cells[i] !== undefined ? cells[i].trim() : '';
      if (h === 'Active') val = val.toUpperCase() === 'TRUE';
      else if (h === 'Display Order' || h === 'Step Number') val = val === '' ? '' : Number(val);
      obj[h] = val;
    });
    out.push(obj);
  }
  return out;
}

async function fetchTab(sheetId, tabName) {
  const res = await fetch(CSV_URL(sheetId, tabName));
  if (!res.ok) throw new Error(`Sheet ${sheetId} tab "${tabName}" returned ${res.status}`);
  // IMPORTANT: don't use res.text() here. Google's gviz CSV export endpoint
  // doesn't always send a reliable charset in its Content-Type header, and
  // Response.text() falls back to guessing — which can misdecode UTF-8 bytes
  // (em-dashes, emoji, curly quotes) as Latin-1/Windows-1252, producing
  // garbled "mojibake" text like "â€”" instead of "—". Reading the raw bytes
  // and explicitly decoding as UTF-8 sidesteps that guesswork entirely.
  const buf  = await res.arrayBuffer();
  const text = new TextDecoder('utf-8').decode(buf);
  // Google returns an HTML error page (not CSV) if the sheet/tab isn't
  // shared or doesn't exist — catch that case explicitly.
  if (text.trimStart().startsWith('<')) {
    throw new Error(`Sheet ${sheetId} tab "${tabName}" is not accessible (check sharing + tab name)`);
  }
  return rowsToObjects(parseCSV(text));
}

// Fetches one tab but never throws — logs and returns [] instead, so one
// bad tab/file can't take down the whole response.
async function fetchTabSafe(sheetId, tabName, label) {
  try {
    return await fetchTab(sheetId, tabName);
  } catch (err) {
    console.warn(`[portal-config] ${label}:`, err.message);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const [assignmentSubjects, ...subjectResults] = await Promise.all([
      fetchTabSafe(SHEETS.master, 'Assignment Subjects', 'master/Assignment Subjects'),
      ...Object.entries(SHEETS.subjects).flatMap(([name, id]) => [
        fetchTabSafe(id, 'Learning Modules', `${name}/Learning Modules`),
        fetchTabSafe(id, 'Learning Steps', `${name}/Learning Steps`),
      ]),
    ]);

    // subjectResults is a flat array: [mathMods, mathSteps, sciMods, sciSteps, ...]
    // in the same order as Object.entries(SHEETS.subjects) above — unflatten it.
    const subjectNames = Object.keys(SHEETS.subjects);
    let learningModules = [];
    let learningSteps = [];
    subjectNames.forEach((_, i) => {
      learningModules = learningModules.concat(subjectResults[i * 2]);
      learningSteps   = learningSteps.concat(subjectResults[i * 2 + 1]);
    });

    // No-store: teachers expect edits to show up on next page load, not
    // after a cache window expires.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      // Only the assignment-related keys are sourced from Sheets today.
      // Other FALLBACK keys (settings, navigation, dashStats, etc.) are
      // intentionally omitted here — portal.js already falls back to its
      // own FALLBACK for any key this response doesn't include.
      assignmentSubjects,
      learningModules,
      learningSteps,
    });
  } catch (err) {
    console.error('[portal-config] Unexpected failure:', err);
    // Still respond 200 with empty arrays rather than 500 — portal.js's
    // fetchAllSheetData() only falls back to FALLBACK on a non-OK response
    // or a thrown error, and an empty-but-valid payload merges more
    // gracefully (per-key) than a hard failure would.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ assignmentSubjects: [], learningModules: [], learningSteps: [] });
  }
}
