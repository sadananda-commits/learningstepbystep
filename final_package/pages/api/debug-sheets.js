// pages/api/debug-sheets.js
//
// TEMPORARY DEBUG ENDPOINT — remove after fixing the questions issue.
//
// Visit:  /api/debug-sheets
//
// Returns a JSON report showing, for every subject sheet:
//   • Whether the tab was reachable at all
//   • The raw first 3 rows of CSV (so you can see exactly what Google sent)
//   • The parsed headers (so you can spot typos / extra spaces)
//   • How many Learning Modules rows came back
//   • How many Learning Steps rows came back
//   • The first 2 parsed step objects (so you can verify field names & values)
//   • Any Module IDs in Steps that do NOT match any Module ID in Modules
//     (the #1 cause of "chapters show but questions don't")

// ── Copy the same SHEETS map from portal-config.js ───────────────────────────
const SHEETS = {
  master: '1DRrtTtWsUNH38LOPuVNa4B9bHKXkRK1UccV3WMT2fx0',
  subjects: {
    'Mathematics':            '1pNLKtuG90F28NyLBjz53NK8Nl8I9kC18UwRyA8EZ8tU',
    'Science':                '13zZy6TdtTFHh0aGEIF3T2Hw_dC4sDi6yVABI5qbcUrY',
    'English Grammar':        '1rsoL-ZBgcejtefzZ1KjR2DRcyxMhSVbwgO7Mu6IC65U',
    'Social Studies':         '1H4tLGOZBXWNeQbXAtlCtSktMvzwcEdwmiEvQpyD9xqs',
    'General Knowledge':      '1AcPo8DPmZYJeno3kYTgvPO2sS8GcEQJX6guDLJ3qfWA',
    'Artificial Intelegence': '1GL0oIaFc3TnyTrMIZmqpWTBrYfb-Me8k5X8WwZKCE2I',
    'Basic Danish':           '1cVbB-AE7zwCwARRpln0VBzd3VINjtHnrG2Zf3kIm8Sw',
  },
};

const CSV_URL = (sheetId, tabName) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

// ── Same CSV parser as portal-config.js ──────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.every(c => (c || '').trim() === '')) continue;
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      let val = cells[i] !== undefined ? cells[i].trim() : '';
      if (h === 'Active') val = val.toUpperCase() === 'TRUE';
      else if (h === 'Display Order' || h === 'Step Number') val = val === '' ? '' : Number(val);
      obj[h] = val;
    });
    out.push(obj);
  }
  return out;
}

// ── Fetch with full diagnostics ───────────────────────────────────────────────
async function fetchTabDebug(sheetId, tabName) {
  const url = CSV_URL(sheetId, tabName);
  const result = {
    url,
    tabName,
    httpStatus: null,
    error: null,
    isHtmlResponse: false,
    rawFirst500Chars: null,
    parsedHeaderRow: null,
    totalDataRows: 0,
    parsedObjects: [],
    activeRows: 0,
    inactiveRows: 0,
    first2Objects: [],
  };

  try {
    const res = await fetch(url);
    result.httpStatus = res.status;

    if (!res.ok) {
      result.error = `HTTP ${res.status} — tab may not exist or sheet may not be shared`;
      return result;
    }

    const buf  = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buf);
    result.rawFirst500Chars = text.slice(0, 500);

    if (text.trimStart().startsWith('<')) {
      result.isHtmlResponse = true;
      result.error = 'Google returned HTML instead of CSV — sheet is not shared as "Anyone with link → Viewer", OR this tab name does not exist in the sheet';
      return result;
    }

    const rows = parseCSV(text);
    if (rows.length > 0) result.parsedHeaderRow = rows[0].map(h => `"${h}"`);
    const objects = rowsToObjects(rows);
    result.totalDataRows   = objects.length;
    result.parsedObjects   = objects;
    result.activeRows      = objects.filter(o => o.Active === true).length;
    result.inactiveRows    = objects.filter(o => o.Active === false).length;
    result.first2Objects   = objects.slice(0, 2);
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {},
    subjects: {},
  };

  // Check each subject sheet
  for (const [subjectName, sheetId] of Object.entries(SHEETS.subjects)) {
    const [modResult, stepResult] = await Promise.all([
      fetchTabDebug(sheetId, 'Learning Modules'),
      fetchTabDebug(sheetId, 'Learning Steps'),
    ]);

    // Cross-check: find Step Module IDs that don't match any Module
    const moduleIds   = new Set(modResult.parsedObjects.map(m => m['Module ID']).filter(Boolean));
    const stepModIds  = stepResult.parsedObjects.map(s => s['Module ID']).filter(Boolean);
    const orphanIds   = [...new Set(stepModIds.filter(id => !moduleIds.has(id)))];
    const matchedIds  = [...new Set(stepModIds.filter(id =>  moduleIds.has(id)))];

    // Check Active field values in steps (raw, before boolean coercion)
    const activeFieldSample = stepResult.parsedObjects.slice(0, 5).map(s => ({
      'Module ID': s['Module ID'],
      'Step Number': s['Step Number'],
      'Active': s.Active,
      'Question (first 40 chars)': (s.Question || '').slice(0, 40),
    }));

    // Check for header name mismatches vs what the app expects
    const expectedStepHeaders = [
      'Module ID', 'Step Number', 'Learning Section', 'Teaching',
      'Step Image URL', 'Question', 'Option A', 'Option B', 'Option C', 'Option D',
      'Correct Option', 'Explanation', 'Active'
    ];
    const actualStepHeaders = stepResult.parsedHeaderRow || [];
    const missingHeaders = expectedStepHeaders.filter(
      h => !actualStepHeaders.some(a => a.replace(/"/g, '') === h)
    );
    const extraHeaders = actualStepHeaders
      .map(a => a.replace(/"/g, ''))
      .filter(h => h && !expectedStepHeaders.includes(h));

    report.subjects[subjectName] = {
      sheetId,

      learningModules: {
        httpStatus:    modResult.httpStatus,
        error:         modResult.error,
        isHtmlResponse: modResult.isHtmlResponse,
        tabAccessible: !modResult.error,
        headers:       modResult.parsedHeaderRow,
        totalRows:     modResult.totalDataRows,
        activeRows:    modResult.activeRows,
        inactiveRows:  modResult.inactiveRows,
        moduleIds:     [...moduleIds],
        first2Rows:    modResult.first2Objects,
      },

      learningSteps: {
        httpStatus:    stepResult.httpStatus,
        error:         stepResult.error,
        isHtmlResponse: stepResult.isHtmlResponse,
        tabAccessible: !stepResult.error,
        headers:       actualStepHeaders,
        missingExpectedHeaders: missingHeaders,
        unexpectedHeaders:      extraHeaders,
        totalRows:     stepResult.totalDataRows,
        activeRows:    stepResult.activeRows,
        inactiveRows:  stepResult.inactiveRows,
        first2Rows:    stepResult.first2Objects,
        activeFieldSample,
      },

      crossCheck: {
        moduleIdsInModulesTab:   [...moduleIds],
        moduleIdsInStepsTab:     [...new Set(stepModIds)],
        matchedModuleIds:        matchedIds,
        orphanedStepModuleIds:   orphanIds,   // ← steps whose Module ID doesn't match any module
        diagnosis: orphanIds.length > 0
          ? `⚠️  ${orphanIds.length} Module ID(s) in Steps tab don't match any Module ID in the Modules tab: ${orphanIds.join(', ')}`
          : stepResult.totalDataRows === 0
            ? '⚠️  Steps tab returned 0 rows — tab may be empty or not accessible'
            : stepResult.activeRows === 0
              ? '⚠️  Steps tab has rows but ALL have Active=false — set Active column to TRUE'
              : '✅  All Step Module IDs match a Module — ID linkage looks correct',
      },
    };

    // One-line summary per subject
    report.summary[subjectName] = {
      modulesLoaded: modResult.totalDataRows,
      stepsLoaded:   stepResult.totalDataRows,
      stepsActive:   stepResult.activeRows,
      orphanStepIds: orphanIds,
      quickDiagnosis:
        modResult.error   ? `❌ Modules tab error: ${modResult.error}` :
        stepResult.error  ? `❌ Steps tab error: ${stepResult.error}` :
        stepResult.totalDataRows === 0 ? '⚠️  Steps tab is empty or unreachable' :
        stepResult.activeRows === 0    ? '⚠️  All steps have Active=false' :
        orphanIds.length > 0           ? `⚠️  Module ID mismatch in steps: ${orphanIds.join(', ')}` :
        '✅  Looks good',
    };
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(report);
}
