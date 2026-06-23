// pages/api/student/profile.js
//
// Updates editable fields on a student's Accounts row via the Apps Script.
// Called by portal.js when the student clicks "Save Changes" on the Profile tab.
//
// POST body: { studentId, classLevel?, fullName?, email?, phone?, address? }
//
// Only fields actually sent are updated — omitting a field leaves it unchanged.
// Password changes use a separate flow (not handled here).
//
// Apps Script action used: updateAccount
// (see vedanta_apps_script.js — action=updateAccount&studentId=XXX&ClassLevel=Y)

const SCRIPT_URL = process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzPphEigUXVQnH2QUvpmTt-R1tDf3D_I9UnTqBs-D5axUp31zcy6i0ptYiL6rol5hCU/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { studentId, classLevel, fullName, email, phone, address } = req.body || {};
  if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required.' });

  // Build query string — only include fields that were actually sent
  const params = new URLSearchParams({ action: 'updateAccount', studentId });
  if (classLevel !== undefined) params.set('ClassLevel', classLevel);
  if (fullName   !== undefined) params.set('FullName',   fullName);
  if (email      !== undefined) params.set('Email',      email);
  if (phone      !== undefined) params.set('Phone',      phone);
  if (address    !== undefined) params.set('Address',    address);

  try {
    const r    = await fetch(`${SCRIPT_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`Script HTTP ${r.status}`);
    const data = await r.json();
    if (data.error) return res.status(500).json({ success: false, message: data.error });
    return res.status(200).json({ success: true, updated: data.updated || [] });
  } catch (err) {
    console.error('[student/profile]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
