const SHEETDB_URL = process.env.SHEETDB_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ authenticated: false, message: 'Missing credentials.' });
  }

  if (!SHEETDB_URL) {
    return res.status(500).json({ authenticated: false, message: 'SHEETDB_URL is missing from .env.local' });
  }

  try {
    // Search Accounts sheet by username
    const searchUrl = `${SHEETDB_URL}/search?sheet=Accounts&Username=${encodeURIComponent(username)}`;
    console.log('Auth search URL:', searchUrl);

    let response = await fetch(searchUrl);
    let rows = await response.json();
    console.log('Search by username result:', rows);

    // If not found by username, try by StudentID
    if (!Array.isArray(rows) || rows.length === 0) {
      const searchById = `${SHEETDB_URL}/search?sheet=Accounts&StudentID=${encodeURIComponent(username)}`;
      console.log('Auth search by ID URL:', searchById);
      response = await fetch(searchById);
      rows = await response.json();
      console.log('Search by StudentID result:', rows);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ authenticated: false, message: 'Invalid username or password.' });
    }

    const account = rows[0];

    if (account.Password !== password) {
      return res.status(401).json({ authenticated: false, message: 'Invalid username or password.' });
    }

    return res.status(200).json({
      authenticated: true,
      studentId: account.StudentID,
      username: account.Username,
      displayName: account.DisplayName,
      mustResetPassword: account.MustResetPassword === 'true',
    });

  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(500).json({ authenticated: false, message: `Server error: ${error.message}` });
  }
}
