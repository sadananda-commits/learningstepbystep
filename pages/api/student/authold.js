import { getSheetsClient, SPREADSHEET_ID } from '../../../lib/sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ authenticated: false, message: 'Missing credentials.' });
  }

  try {
    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Accounts!A2:E100',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(500).json({ authenticated: false, message: 'Database sheet empty or unreadable.' });
    }

    let authenticatedUser = null;

    for (const row of rows) {
      const dbStudentID = row[0]?.trim();
      const dbUsername  = row[1]?.trim();
      const dbPassword  = row[2]?.trim();

      if ((username === dbUsername || username === dbStudentID) && password === dbPassword) {
        authenticatedUser = {
          studentId: dbStudentID,
          username: row[3]?.trim() || dbUsername,
          mustResetPassword: row[4]?.toLowerCase() === 'true',
        };
        break;
      }
    }

    if (authenticatedUser) {
      return res.status(200).json({
        authenticated: true,
        studentId: authenticatedUser.studentId,
        username: authenticatedUser.username,
        mustResetPassword: authenticatedUser.mustResetPassword,
      });
    } else {
      return res.status(401).json({ authenticated: false, message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ authenticated: false, message: 'Internal server error.' });
  }
}
