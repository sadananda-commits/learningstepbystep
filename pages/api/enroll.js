// pages/api/enroll.js
// Writes new enrolment to Script 1 (Vedanta Academy Students sheet)
// No SheetDB — uses Google Apps Script doPost endpoint.

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPphEigUXVQnH2QUvpmTt-R1tDf3D_I9UnTqBs-D5axUp31zcy6i0ptYiL6rol5hCU/exec';

function generateStudentId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `APX${rand}`;
}

function generateUsername(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '.');
}

function generateTempPassword() {
  return `Apex@${new Date().getFullYear()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  const {
    studentName, dob, parentName, email, phone,
    emergencyContact, address, classLevel, teacherId,
    timeSlot, subjects,
  } = req.body;

  if (!studentName || !parentName || !email || !phone || !classLevel)
    return res.status(400).json({ message: 'Missing required fields.' });

  const studentId    = generateStudentId();
  const username     = generateUsername(studentName);
  const tempPassword = generateTempPassword();
  const enrolledAt   = new Date().toISOString();

  const payload = {
    action: 'enroll',
    enrollment: {
      StudentID:        studentId,
      StudentName:      studentName,
      DOB:              dob || '',
      ParentName:       parentName,
      Email:            email,
      Phone:            String(phone),
      EmergencyContact: emergencyContact || '',
      Address:          address || '',
      ClassLevel:       classLevel,
      TeacherID:        teacherId || '',
      TimeSlot:         timeSlot || '',
      Subjects:         Array.isArray(subjects) ? subjects.join(', ') : subjects || '',
      EnrolledAt:       enrolledAt,
      Status:           'Pending',
    },
    account: {
      StudentID:         studentId,
      Username:          username,
      Password:          tempPassword,
      DisplayName:       studentName,
      Active:            'TRUE',
      MustResetPassword: 'TRUE',
    },
  };

  try {
    console.log('[enroll] Posting to Apps Script, studentId:', studentId);
    const r = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(15000),
    });

    const raw = await r.text();
    console.log('[enroll] Response:', r.status, raw.slice(0, 300));

    let data;
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    if (!r.ok || data.error)
      return res.status(500).json({ message: data.error || `Script error (${r.status})` });

    return res.status(200).json({ success: true, studentId, username, tempPassword });

  } catch (err) {
    console.error('[enroll]', err.message);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
}
