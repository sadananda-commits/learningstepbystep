// pages/api/student/auth.js
// Authenticates via Script 1 (Vedanta Academy Students sheet)

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPphEigUXVQnH2QUvpmTt-R1tDf3D_I9UnTqBs-D5axUp31zcy6i0ptYiL6rol5hCU/exec';

let accountsCache   = null;
let accountsCacheAt = 0;
const ACCOUNTS_TTL  = 5 * 60 * 1000;

async function getAccounts() {
  if (accountsCache && Date.now() - accountsCacheAt < ACCOUNTS_TTL) {
    console.log('[auth] Cache hit, accounts:', accountsCache.length);
    return accountsCache;
  }
  const url  = `${SCRIPT_URL}?action=accounts`;
  console.log('[auth] Fetching:', url);
  const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const raw  = await res.text();
  console.log('[auth] Response (500 chars):', raw.slice(0, 500));
  const data = JSON.parse(raw);
  if (data.error) throw new Error(data.error);
  if (!Array.isArray(data.accounts)) throw new Error(`No accounts array. Keys: ${Object.keys(data).join(', ')}`);
  console.log('[auth] Loaded', data.accounts.length, 'accounts');
  if (data.accounts[0]) {
    const s = { ...data.accounts[0], Password: '***' };
    console.log('[auth] Sample row:', JSON.stringify(s));
  }
  accountsCache   = data.accounts;
  accountsCacheAt = Date.now();
  return accountsCache;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username = '', password = '' } = req.body || {};
  if (!username.trim() || !password.trim())
    return res.status(400).json({ authenticated: false, message: 'Username and password are required.' });

  let accounts;
  try {
    accounts = await getAccounts();
  } catch (err) {
    console.error('[auth]', err.message);
    if (accountsCache) { accounts = accountsCache; }
    else return res.status(503).json({ authenticated: false, message: 'Auth service unavailable.',
      ...(process.env.NODE_ENV !== 'production' && { debug: err.message }) });
  }

  const input   = username.trim().toLowerCase();
  const account = accounts.find(r =>
    (r.Username  && r.Username.trim().toLowerCase()  === input) ||
    (r.StudentID && r.StudentID.trim().toLowerCase() === input)
  );

  if (!account) {
    console.warn('[auth] Not found:', input, '| Available:', accounts.map(r => r.Username || r.StudentID));
    return res.status(401).json({ authenticated: false, message: 'Invalid credentials.' });
  }

  // Active column is optional — if missing or empty, treat account as active.
  // Only block if explicitly set to FALSE/NO/0.
  const activeVal = String(account.Active || '').trim().toLowerCase();
  const isInactive = ['false', 'no', '0'].includes(activeVal);
  if (isInactive) {
    console.warn('[auth] Account inactive:', account.Username);
    return res.status(401).json({ authenticated: false, message: 'Account inactive. Contact your academy.' });
  }

  if (!safeEqual(String(account.Password || ''), password.trim())) {
    console.warn('[auth] Password mismatch for:', account.Username,
      '| stored length:', account.Password?.length, '| entered length:', password.trim().length);
    return res.status(401).json({ authenticated: false, message: 'Invalid credentials.' });
  }

  console.log('[auth] Login success:', account.Username, account.StudentID);
  return res.status(200).json({
    authenticated: true,
    username:  account.Username  || username,
    studentId: account.StudentID || '',
  });
}
