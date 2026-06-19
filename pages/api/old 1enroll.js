const SHEETDB_URL = process.env.SHEETDB_URL;

function generateStudentId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APX${year}${rand}`;
}

function generateUsername(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '.');
}

function generateTempPassword() {
  return `Apex@${new Date().getFullYear()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    studentName, dob, parentName, email, phone,
    emergencyContact, address, classLevel, teacherId,
    timeSlot, subjects, learningMode, gender, schoolName,
  } = req.body;

  if (!studentName || !parentName || !email || !phone || !classLevel) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  if (!SHEETDB_URL) {
    return res.status(500).json({ message: 'SHEETDB_URL is missing from .env.local — restart the server after adding it.' });
  }

  const studentId    = generateStudentId();
  const username     = generateUsername(studentName);
  const tempPassword = generateTempPassword();
  const enrolledAt   = new Date().toISOString();

  try {
    // Write to Enrollments sheet
    const enrollRes = await fetch(`${SHEETDB_URL}?sheet=Enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          StudentID: studentId,
          StudentName: studentName,
          DOB: dob || '',
          ParentName: parentName,
          Email: email,
          Phone: phone,
          EmergencyContact: emergencyContact || '',
          Address: address || '',
          ClassLevel: classLevel,
          TeacherID: teacherId || '',
          TimeSlot: timeSlot || '',
          Subjects: Array.isArray(subjects) ? subjects.join(', ') : subjects || '',
          EnrolledAt: enrolledAt,
          Status: 'Pending',
        }],
      }),
    });

    const enrollBody = await enrollRes.text();
    console.log('SheetDB Enrollments response:', enrollRes.status, enrollBody);

    if (!enrollRes.ok) {
      return res.status(500).json({
        message: `SheetDB Enrollments error (${enrollRes.status}): ${enrollBody}`
      });
    }

    // Write to Accounts sheet
    const acctRes = await fetch(`${SHEETDB_URL}?sheet=Accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          StudentID: studentId,
          Username: username,
          Password: tempPassword,
          DisplayName: studentName,
          MustResetPassword: 'true',
        }],
      }),
    });

    const acctBody = await acctRes.text();
    console.log('SheetDB Accounts response:', acctRes.status, acctBody);

    if (!acctRes.ok) {
      return res.status(500).json({
        message: `SheetDB Accounts error (${acctRes.status}): ${acctBody}`
      });
    }

    return res.status(200).json({ success: true, studentId, username, tempPassword });

  } catch (error) {
    console.error('Enroll error:', error.message);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
}
