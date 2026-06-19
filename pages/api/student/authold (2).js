// pages/api/student/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// Authenticates a student by looking up their record directly from
// Google Apps Script — zero SheetDB calls, no rate limits.
//
// POST body: { username: string, password: string }
//   username can be either the Username field OR the StudentID field.
//
// The Google Apps Script must expose an ?action=auth endpoint (see
// the companion Apps Script snippet below).
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz4ZiRm6pONwbeeSLwZ7lx9bZMQWIDf7tCucUc73_pbmudoimYACqn6kiR3zJpV6np5/exec';

// In-memory account cache: avoids hitting Apps Script on every login attempt.
// Accounts data rarely changes, so a 5-minute TTL is safe.
let accountsCache   = null;
let accountsCacheAt = 0;
const ACCOUNTS_TTL  = 5 * 60 * 1000; // 5 minutes

async function getAccounts() {
  if (accountsCache && Date.now() - accountsCacheAt < ACCOUNTS_TTL) {
    return accountsCache;
  }

  const res = await fetch(
    `${GOOGLE_SCRIPT_URL}?action=accounts`,
    { signal: AbortSignal.timeout(10000) }
  );

  if (!res.ok) throw new Error(`Apps Script returned HTTP ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  // data.accounts should be an array of row objects from the Accounts sheet
  const rows = Array.isArray(data.accounts) ? data.accounts : [];
  accountsCache   = rows;
  accountsCacheAt = Date.now();
  return rows;
}

// Constant-time string comparison to prevent timing attacks
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    // Still iterate to keep timing consistent
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff++;
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username = '', password = '' } = req.body || {};

  if (!username.trim() || !password.trim()) {
    return res.status(400).json({ authenticated: false, message: 'Username and password are required.' });
  }

  try {
    const accounts = await getAccounts();

    // Match on Username column OR StudentID column (case-insensitive)
    const input = username.trim().toLowerCase();
    const account = accounts.find(row =>
      (row.Username  && row.Username.trim().toLowerCase()  === input) ||
      (row.StudentID && row.StudentID.trim().toLowerCase() === input)
    );

    // Account not found — return generic message (don't leak "user not found")
    if (!account) {
      return res.status(401).json({ authenticated: false, message: 'Invalid credentials.' });
    }

    // Check Active flag — reject disabled accounts
    const isActive = ['yes', 'true', '1'].includes(String(account.Active || '').toLowerCase());
    if (!isActive) {
      return res.status(401).json({ authenticated: false, message: 'Account is inactive. Please contact your academy.' });
    }

    // Password check — plain text comparison (upgrade to bcrypt if your sheet
    // stores hashed passwords by replacing this with bcrypt.compare())
    const storedPassword = String(account.Password || '');
    if (!safeEqual(storedPassword, password.trim())) {
      return res.status(401).json({ authenticated: false, message: 'Invalid credentials.' });
    }

    // ✅ Success
    return res.status(200).json({
      authenticated: true,
      username:  account.Username  || username,
      studentId: account.StudentID || '',
      // Add any extra safe fields you want available in the portal:
      // classLevel: account['Class Level'] || '',
    });

  } catch (err) {
    console.error('[auth]', err.message);

    // If the cache is stale but still populated, use it rather than
    // returning a hard error (resilience during transient outages)
    if (accountsCache) {
      console.warn('[auth] Using stale accounts cache due to fetch error');
      // Re-run the same logic against the stale cache
      const input = username.trim().toLowerCase();
      const account = accountsCache.find(row =>
        (row.Username  && row.Username.trim().toLowerCase()  === input) ||
        (row.StudentID && row.StudentID.trim().toLowerCase() === input)
      );
      if (account && safeEqual(String(account.Password || ''), password.trim())) {
        return res.status(200).json({
          authenticated: true,
          username:  account.Username  || username,
          studentId: account.StudentID || '',
        });
      }
      return res.status(401).json({ authenticated: false, message: 'Invalid credentials.' });
    }

    return res.status(503).json({
      authenticated: false,
      message: 'Authentication service unavailable. Please try again shortly.',
    });
  }
}
