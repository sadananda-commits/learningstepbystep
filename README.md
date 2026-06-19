# ApexCBSE Academy — Developer Guide

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Bug Fix: Enrollment Form Data Loss](#2-bug-fix-enrollment-form-data-loss)
3. [Google Sheets Setup](#3-google-sheets-setup)
4. [Data Flow: Registration → Student Profile](#4-data-flow-registration--student-profile)
5. [Sheet Structure](#5-sheet-structure)
6. [Running Locally](#6-running-locally)
7. [Future: Student Login & Progress Tracking](#7-future-student-login--progress-tracking)

---

## 1. Project Overview

ApexCBSE is a Next.js website for a CBSE home-tuition academy. It has:
- **Landing page** (`pages/index.js`) — marketing, FAQ, and a multi-step enrollment form
- **Student portal** (`pages/portal.js`) — login-protected dashboard with progress, attendance, assignments, schedule, and profile
- **API routes** — `/api/enroll` (registration) and `/api/student/auth` (login)
- **Google Sheets backend** — used as the persistent database via `lib/sheets.js`

---

## 2. Bug Fix: Enrollment Form Data Loss

### Root Cause
The multi-step enrollment form used **conditional rendering** (`{step===1 && <div>...</div>}`). When advancing to step 2, React **unmounts** step 1's DOM nodes. By the time the form was submitted on step 4, all fields from steps 1–3 had been removed from the DOM, so `FormData` collected empty values. This triggered the "Missing required fields" 400 error from the API.

### Fix Applied
**`pages/index.js`** — Three changes:

1. **`formData` state pre-initialised** with all field keys set to empty strings/arrays.
2. **`saveStepAndAdvance(e, nextStep)`** — called by each "Next" button. Reads the *current* step's live DOM values via `FormData`, merges them into the `formData` React state, then advances the step. Data is never lost when a step unmounts.
3. **`handleEnroll`** — now reads directly from `formData` state (not from the form DOM) to build the API payload. All fields are guaranteed to be present.
4. **`defaultValue` props** on all inputs — so navigating *back* to a previous step restores the user's entered values.
5. **Step 4 review panel** — displays a summary of all collected data before the user submits, providing a confirmation layer.

---

## 3. Google Sheets Setup

### Step A — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it `ApexCBSE Students` (or anything you like).
3. Create two sheets (tabs) inside it:

**Sheet: `Enrollments`** — add these headers in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| StudentID | StudentName | DOB | ParentName | Email | Phone | EmergencyContact | Address | ClassLevel | TeacherID | TimeSlot | Subjects | EnrolledAt | Status |

**Sheet: `Accounts`** — add these headers in row 1:

| A | B | C | D | E |
|---|---|---|---|---|
| StudentID | Username | Password | DisplayName | MustResetPassword |

4. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

### Step B — Create a Service Account (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Enable the **Google Sheets API**: APIs & Services → Library → search "Google Sheets API" → Enable.
4. Go to **IAM & Admin → Service Accounts** → Create Service Account.
5. Give it any name (e.g. `apexcbse-sheets`). Skip optional steps. Click Done.
6. Click the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
7. Download the JSON file. Keep it safe — never commit it to git.
8. **Share your Google Sheet** with the service account's email (visible in the JSON as `client_email`) with **Editor** role.

### Step C — Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account", ... paste entire JSON as one line ... }
```

To paste the JSON as a single line, open the downloaded key file and minify it (remove all newlines). On Mac/Linux:
```bash
cat your-key.json | tr -d '\n'
```
Note: the `private_key` field inside already uses `\n` escape sequences — that's correct.

---

## 4. Data Flow: Registration → Student Profile

```
User fills Step 1 (Student details)
        ↓ saveStepAndAdvance() → formData state updated
User fills Step 2 (Parent details)
        ↓ saveStepAndAdvance() → formData state updated
User fills Step 3 (Course selection)
        ↓ saveStepAndAdvance() → formData state updated
User reviews Step 4 → clicks Submit
        ↓
handleEnroll() reads from formData state
        ↓
POST /api/enroll  { studentName, dob, parentName, email, ... }
        ↓
enroll.js API handler validates required fields
        ↓ (all present now — bug fixed)
Generates: StudentID (APX25XXXX), Username (first.last), TempPassword (Apex@2025)
        ↓
Google Sheets: append row to Enrollments sheet
Google Sheets: append row to Accounts sheet
        ↓
Response: { success: true, studentId, username, tempPassword }
        ↓
Landing page shows success card with credentials
        ↓
Student visits /portal → logs in with username + tempPassword
        ↓
/api/student/auth reads Accounts sheet, validates credentials
        ↓
Portal dashboard loads with student's profile
```

---

## 5. Sheet Structure

### Enrollments Sheet
Each row = one enrollment submission.

| Column | Field | Example |
|--------|-------|---------|
| A | StudentID | APX257341 |
| B | StudentName | Rohan Sharma |
| C | DOB | 2016-04-15 |
| D | ParentName | Mr. Vijay Sharma |
| E | Email | parent@email.com |
| F | Phone | +91 98765 43210 |
| G | EmergencyContact | +91 00000 00000 |
| H | Address | 12 MG Road, Delhi |
| I | ClassLevel | class3 |
| J | TeacherID | T001 |
| K | TimeSlot | Batch A |
| L | Subjects | Mathematics, Science, English |
| M | EnrolledAt | 2025-06-05T10:30:00.000Z |
| N | Status | Pending |

### Accounts Sheet
Each row = one student login account.

| Column | Field | Example |
|--------|-------|---------|
| A | StudentID | APX257341 |
| B | Username | rohan.sharma |
| C | Password | Apex@2025 (temp) |
| D | DisplayName | Rohan Sharma |
| E | MustResetPassword | true |

---

## 6. Running Locally

```bash
cd apexcbse
npm install
# add your .env.local with Google credentials
npm run dev
# open http://localhost:3000
```

---

## 7. Future: Student Login & Progress Tracking

The data structure is already designed for expansion. Here's what to build next:

### Student Login (Ready to implement)
`/api/student/auth` is already complete. It:
- Accepts `{ username, password }` or `{ studentId, password }`
- Reads the `Accounts` sheet and validates credentials
- Returns `{ authenticated, studentId, username, mustResetPassword }`

The portal page (`pages/portal.js`) already has a login form that calls this endpoint.

### Password Reset Flow
1. On first login, `mustResetPassword === true` → show a "Set new password" form
2. POST `/api/student/change-password` → update column C in the `Accounts` sheet and set column E to `false`

### Real Progress Data
Currently the portal uses hardcoded mock data. To make it real:
1. Add a `Progress` sheet: `StudentID | Subject | TopicsDone | TotalTopics | LastUpdated`
2. Add an `Attendance` sheet: `StudentID | Date | Present | ClassSubject`
3. Add an `Assignments` sheet: `StudentID | AssignmentID | Subject | Title | DueDate | Status | Grade`
4. Create GET API routes to read each sheet filtered by `StudentID`
5. Replace the hardcoded arrays in `portal.js` with `useEffect` calls to these APIs

### Profile Updates
1. POST `/api/student/profile` → update selected columns in the `Enrollments` sheet (address, phone, learning mode)
2. Add a `lastUpdated` column to track changes

### Security Recommendations (Before Production)
- Hash passwords using `bcrypt` — never store plain text
- Add JWT or session-based auth so the portal doesn't require re-login on page refresh
- Move `GOOGLE_SERVICE_ACCOUNT_JSON` to a proper secrets manager (e.g. Vercel env vars, AWS Secrets Manager)
- Rate-limit `/api/enroll` and `/api/student/auth` to prevent abuse
