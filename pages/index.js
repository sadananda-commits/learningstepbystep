import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   FALLBACK DATA
   Shown instantly on first render and used if the sheet is unreachable.
   These are your original hardcoded values — the site never breaks.
───────────────────────────────────────────────────────────────────────────── */
const FALLBACK = {
  classes: [
    { Id: 'KG', Label: 'Kindergarten', Age: '4–5 yrs',  Description: 'Foundational literacy, numeracy, and sensory learning through play-based activities.',       Color: '#f97316' },
    { Id: 'C1', Label: 'Class 1',      Age: '5–6 yrs',  Description: 'Introduction to reading, basic arithmetic, and exploring the natural world.',                 Color: '#eab308' },
    { Id: 'C2', Label: 'Class 2',      Age: '6–7 yrs',  Description: 'Expanding vocabulary, two-digit arithmetic, and basic scientific concepts.',                   Color: '#22c55e' },
    { Id: 'C3', Label: 'Class 3',      Age: '7–8 yrs',  Description: 'Comprehension, multiplication, introduction to geography and Indian history.',                  Color: '#00c6a7' },
    { Id: 'C4', Label: 'Class 4',      Age: '8–9 yrs',  Description: 'Essay writing, fractions, forces & matter, world geography, freedom movement.',                 Color: '#3b82f6' },
    { Id: 'C5', Label: 'Class 5',      Age: '9–10 yrs', Description: 'Advanced comprehension, geometry, ecosystems, map reading, and ancient civilizations.',         Color: '#a855f7' },
  ],
  subjects: [
    { Name: 'English',     Icon: 'fa-book',           Color: '#3b82f6', Topics: 'Phonics · Grammar · Reading Comprehension · Creative Writing',      Goal: 'Confident communication and expressive writing',  Method: 'Story-based learning, role-play, reading circles' },
    { Name: 'Mathematics', Icon: 'fa-calculator',     Color: '#f97316', Topics: 'Arithmetic · Fractions · Geometry · Word Problems',                  Goal: 'Analytical thinking and problem solving',         Method: 'Visual aids, manipulatives, structured worksheets' },
    { Name: 'Science',     Icon: 'fa-flask',          Color: '#22c55e', Topics: 'Plant Life · Human Body · Force & Matter · Simple Machines',         Goal: 'Curiosity-driven empirical understanding',        Method: 'Experiments, observations, model building' },
    { Name: 'Geography',   Icon: 'fa-earth-americas', Color: '#eab308', Topics: 'Maps · Climate Zones · Landforms · Natural Resources',               Goal: 'Spatial awareness and global knowledge',          Method: 'Map exercises, documentary clips, field discussions' },
    { Name: 'History',     Icon: 'fa-landmark',       Color: '#a855f7', Topics: 'Early Civilizations · Indian History · National Movements · Culture', Goal: 'Cultural identity and chronological awareness',   Method: 'Timelines, storytelling, primary source discussion' },
  ],
  schedules: [
    { Batch: 'Morning Batch',   Days: 'Mon – Fri', Time: '7:00 AM – 8:30 AM',  Mode: 'Physical', Seats: '3', Color: '#f97316' },
    { Batch: 'Afternoon Batch', Days: 'Mon – Fri', Time: '3:30 PM – 5:00 PM',  Mode: 'Physical', Seats: '1', Color: '#eab308' },
    { Batch: 'Evening Batch',   Days: 'Mon – Fri', Time: '6:00 PM – 7:30 PM',  Mode: 'Online',   Seats: '4', Color: '#22c55e' },
    { Batch: 'Weekend Morning', Days: 'Sat – Sun', Time: '9:00 AM – 11:00 AM', Mode: 'Hybrid',   Seats: '5', Color: '#3b82f6' },
    { Batch: 'Weekend Evening', Days: 'Sat – Sun', Time: '4:00 PM – 6:00 PM',  Mode: 'Online',   Seats: '2', Color: '#a855f7' },
  ],
  fees: [
    { Tier: 'Single Subject', Price: '₹1,500', Period: '/month', Perks: '1 Subject|Weekly Tests|Homework Support|Progress Reports',                                     Highlight: 'FALSE' },
    { Tier: 'Core Pack',      Price: '₹3,500', Period: '/month', Perks: '3 Subjects|Weekly Tests|Homework Support|Progress Reports|Parent Meetings',                    Highlight: 'TRUE'  },
    { Tier: 'Full Academy',   Price: '₹5,500', Period: '/month', Perks: 'All 5 Subjects|Daily Tests|Homework Support|Progress Reports|Parent Meetings|Exam Prep',        Highlight: 'FALSE' },
  ],
  testimonials: [
    { Name: 'Priya Mehta',   Role: 'Parent, Class 3',     Text: 'My son went from struggling with fractions to topping his school test in just two months. The teachers here genuinely care.' },
    { Name: 'Rajiv Sinha',   Role: 'Parent, Class 5',     Text: "The real-time dashboard helps me track my daughter's progress without having to call the teacher every week. Brilliant system." },
    { Name: 'Anjali Kapoor', Role: 'Parent, KG & Class 2', Text: 'Both my kids attend and the micro-batch approach means neither of them ever feels lost or ignored.' },
  ],
  teachers: [
    { Id: 'T01', Name: 'Mrs. Anjali Sharma', Qualification: 'M.Sc. Mathematics · B.Ed',      Experience: '5 Years', Subjects: 'Mathematics & Science', Bio: 'Renowned for making complex concepts feel intuitive. Her students consistently rank in the top 10% of their school exams.' },
    { Id: 'T02', Name: 'Mr. Pradeep Nair',   Qualification: 'M.A. English Literature · B.Ed', Experience: '7 Years', Subjects: 'English & History',     Bio: 'Award-winning educator whose storytelling approach brings history and language to life in every session.' },
  ],
  faqs: [
    { Question: 'What age groups do you teach?',           Answer: 'We cover Kindergarten (age 4–5) through Class 5 (age 9–10), following the CBSE curriculum framework.' },
    { Question: 'How many students are in each batch?',    Answer: 'We strictly limit batches to a maximum of 5 students to guarantee individual attention and a personalised learning experience.' },
    { Question: 'Do you offer online classes?',            Answer: 'Yes. We offer Physical, Online (via Google Meet / Zoom), and Hybrid formats. You choose your preferred mode during enrollment.' },
    { Question: 'What happens after I submit the form?',   Answer: 'Your Student ID, username, and temporary password are generated instantly. You can log in to the Student Portal immediately.' },
    { Question: 'Can I change my schedule after joining?', Answer: 'Yes, schedule changes can be requested through the portal or by contacting the registrar, subject to seat availability.' },
    { Question: 'Are study materials provided?',           Answer: 'Yes. Worksheets, practice papers, and reading materials are uploaded directly to your student dashboard.' },
  ],
  about: [
    { Icon: 'fa-users-between-lines', IconBg: 'rgba(0,198,167,.1)',   IconColor: 'var(--teal)',  Heading: 'Micro-Batch Teaching',           Body: 'Strictly limited to 5 students per batch — every child receives undivided attention and a truly personalised learning path.' },
    { Icon: 'fa-chart-line',          IconBg: 'rgba(245,166,35,.1)',  IconColor: 'var(--accent)', Heading: 'Live Progress Dashboards',        Body: 'Parents and students access real-time academic logs — homework completion, attendance, quiz scores, and growth metrics updated daily.' },
    { Icon: 'fa-map-pin',             IconBg: 'rgba(99,102,241,.1)',  IconColor: '#818cf8',      Heading: 'CBSE Blueprint Mapping',          Body: 'Every lesson plan is meticulously mapped to current CBSE standards, ensuring students are always ahead of classroom expectations.' },
    { Icon: 'fa-laptop-code',         IconBg: 'rgba(239,68,68,.1)',   IconColor: '#f87171',      Heading: 'Physical, Online & Hybrid',       Body: 'Choose the format that works best for your family. Switch modes anytime through the student portal — no questions asked.' },
    { Icon: 'fa-medal',               IconBg: 'rgba(168,85,247,.1)',  IconColor: '#a855f7',      Heading: 'Proven Results',                  Body: 'Our students consistently rank in the top 15% of their school exams within three months of joining — measurable, visible improvement.' },
    { Icon: 'fa-shield-halved',       IconBg: 'rgba(34,197,94,.1)',   IconColor: '#22c55e',      Heading: 'Background-Verified Teachers',    Body: 'All teachers are degree-qualified, B.Ed certified, DBS checked, and trained in child-centred primary developmental learning.' },
  ],
  contact: {
    whatsappNumber: '919999999999',
    phone:          '+91 99999 99999',
    email:          'support@apexcbse.com',
    address:        'Sector 15, Block C, New Delhi',
  },
  hero: {
    badge:      'CBSE Certified · KG to Class 5',
    headline:   "Where every child's potential is unlocked",
    subheadline:'Premium, personalised CBSE home tuition with expert mentors, micro-batches of 5, and a real-time student portal to track every step of your child\'s growth.',
    btn1Text:   'Enroll Now — Free',
    btn1Link:   '#enroll',
    btn2Text:   'Student Login',
    btn2Link:   '/portal',
    stat1Num:   '5',   stat1Label: 'Students Max Per Batch',
    stat2Num:   '98%', stat2Label: 'Parent Satisfaction',
    stat3Num:   '6',   stat3Label: 'Class Levels KG – Class 5',
    stat4Num:   '5',   stat4Label: 'Core Subjects',
    feat1: 'Live attendance & homework tracking',
    feat2: 'Personalised progress dashboards',
    feat3: 'Physical, Online & Hybrid options',
    feat4: 'CBSE blueprint-aligned content',
  },
};

export default function Home() {
  const [cms, setCms] = useState(FALLBACK);
  // Public-site mobile nav: the hamburger button existed in markup already
  // but had no handler and no menu to open — .nav-links simply vanishes
  // below 900px with no way to reach Classes/Subjects/Schedule/etc. on a
  // phone. Same off-canvas-drawer fix as the Student Portal's sidebar.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Fetch live data from Google Sheet via /api/content ──────────────────
  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(data => {
        // Accept data from sheet OR stale cache — only skip if explicit fallback with no real data
        if (data.source === 'fallback' && !data.hero && !data.classes) {
          console.warn('[cms] Using hardcoded fallback — sheet unavailable:', data.error);
          return;
        }
        setCms({
          hero:         Object.keys(data.hero    || {}).length ? data.hero         : FALLBACK.hero,
          about:        data.about?.length                     ? data.about        : FALLBACK.about,
          classes:      data.classes?.length                   ? data.classes      : FALLBACK.classes,
          subjects:     data.subjects?.length                  ? data.subjects     : FALLBACK.subjects,
          schedules:    data.schedules?.length                 ? data.schedules    : FALLBACK.schedules,
          fees:         data.fees?.length                      ? data.fees         : FALLBACK.fees,
          testimonials: data.testimonials?.length              ? data.testimonials : FALLBACK.testimonials,
          teachers:     data.teachers?.length                  ? data.teachers     : FALLBACK.teachers,
          faqs:         data.faqs?.length                      ? data.faqs         : FALLBACK.faqs,
          contact:      Object.keys(data.contact || {}).length ? data.contact      : FALLBACK.contact,
        });
      })
      .catch(err => console.warn('[cms] Fetch error, using fallback:', err.message));
  }, []);

  // ── Portal Dashboard (Req #8): live aggregate stats from /api/portal-stats,
  // a separate public endpoint backed by the same Apps Script as the student
  // portal's progress/leaderboard data. Starts null so the section can render
  // a loading skeleton instead of flashing zeroes before the real numbers
  // arrive — these are real counts, not content a hardcoded fallback can
  // meaningfully approximate.
  const [portalStats, setPortalStats] = useState(null);
  useEffect(() => {
    fetch('/api/portal-stats')
      .then(r => r.json())
      .then(data => setPortalStats(data))
      .catch(err => { console.warn('[portal-stats] Fetch error:', err.message); setPortalStats(false); });
  }, []);

  const [formStatus, setFormStatus] = useState({ state: 'idle', studentId: '', username: '', tempPassword: '' });
  const [openFaq, setOpenFaq]       = useState(null);
  const [step, setStep]             = useState(1);
  const [formData, setFormData]     = useState({
    studentName: '', dob: '', gender: '', schoolName: '', classLevel: '',
    parentName: '', email: '', phone: '', emergencyContact: '', address: '',
    teacherId: '', timeSlot: '', learningMode: '', subjects: [],
  });

  const saveStepAndAdvance = (e, nextStep) => {
    const fd = new FormData(e.currentTarget.closest('form'));
    const updates = {};
    if (nextStep > 1) {
      updates.studentName = fd.get('studentName') || formData.studentName;
      updates.dob         = fd.get('dob')         || formData.dob;
      updates.gender      = fd.get('gender')      || formData.gender;
      updates.schoolName  = fd.get('schoolName')  || formData.schoolName;
      updates.classLevel  = fd.get('classLevel')  || formData.classLevel;
    }
    if (nextStep > 2) {
      updates.parentName       = fd.get('parentName')       || formData.parentName;
      updates.email            = fd.get('email')            || formData.email;
      updates.phone            = fd.get('phone')            || formData.phone;
      updates.emergencyContact = fd.get('emergencyContact') || formData.emergencyContact;
      updates.address          = fd.get('address')          || formData.address;
    }
    if (nextStep > 3) {
      updates.teacherId    = fd.get('teacherId')    || formData.teacherId;
      updates.timeSlot     = fd.get('timeSlot')     || formData.timeSlot;
      updates.learningMode = fd.get('learningMode') || formData.learningMode;
      const subs = fd.getAll('subjects');
      updates.subjects = subs.length > 0 ? subs : formData.subjects;
    }
    setFormData(prev => ({ ...prev, ...updates }));
    setStep(nextStep);
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setFormStatus({ state: 'loading', studentId: '', username: '', tempPassword: '' });
    const payload = { ...formData };
    try {
      const res  = await fetch('/api/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormStatus({ state: 'success', studentId: data.studentId, username: data.username, tempPassword: data.tempPassword });
        setFormData({ studentName:'', dob:'', gender:'', schoolName:'', classLevel:'', parentName:'', email:'', phone:'', emergencyContact:'', address:'', teacherId:'', timeSlot:'', learningMode:'', subjects:[] });
        setStep(1);
      } else {
        setFormStatus({ state: 'error', message: data.message || 'Something went wrong.', studentId: '', username: '', tempPassword: '' });
      }
    } catch {
      setFormStatus({ state: 'error', message: 'Connection failed. Is the server running?', studentId: '', username: '', tempPassword: '' });
    }
  };

  // ── Convenience shorthands ──────────────────────────────────────────────
  const h = cms.hero;
  const c = cms.contact;

  return (
    <>
      <Head>
        <title>ApexCBSE Academy | Expert Home Tuition KG – Class 5</title>
        <meta name="description" content="Premium CBSE home tuition. Micro-batches, real-time dashboards, expert mentors. Kindergarten to Class 5." />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0;}
          :root{
            --navy:#0a0f2c; --navy-mid:#121a3e; --accent:#f5a623; --accent-light:#ffd280;
            --teal:#00c6a7; --text:#1a1a2e; --muted:#64748b;
            --surface:#fff; --surface-alt:#f8f9fc; --border:#e2e8f0;
            --radius:16px; --shadow:0 4px 24px rgba(10,15,44,.10); --shadow-lg:0 8px 48px rgba(10,15,44,.18);
            --font-d:'Playfair Display',Georgia,serif; --font-b:'DM Sans',system-ui,sans-serif;
          }
          html{scroll-behavior:smooth;}
          body{font-family:var(--font-b);color:var(--text);background:var(--surface-alt);-webkit-font-smoothing:antialiased;}

          /* NAV */
          .nav{position:sticky;top:0;z-index:200;background:rgba(10,15,44,.97);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.07);}
          .nav-i{max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:66px;}
          .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
          .logo-box{width:36px;height:36px;background:var(--accent);border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--navy);font-size:17px;}
          .logo-txt{font-family:var(--font-d);font-size:19px;font-weight:900;color:#fff;}
          .nav-links{display:flex;align-items:center;gap:4px;}
          .nl{color:rgba(255,255,255,.65);text-decoration:none;font-size:13px;font-weight:500;padding:7px 12px;border-radius:8px;transition:all .2s;}
          .nl:hover{color:#fff;background:rgba(255,255,255,.08);}
          .n-portal{border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);padding:8px 16px;border-radius:9px;font-size:13px;text-decoration:none;font-weight:500;transition:all .2s;}
          .n-portal:hover{border-color:var(--teal);color:var(--teal);}
          .n-cta{background:var(--accent);color:var(--navy);font-weight:700;padding:8px 18px;border-radius:9px;font-size:13px;text-decoration:none;transition:all .2s;}
          .n-cta:hover{background:var(--accent-light);transform:translateY(-1px);}
          .hm{display:none;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:8px;}
          @media(max-width:900px){.nav-links{display:none;}.hm{display:block;}}
          .mnav-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:290;opacity:0;pointer-events:none;transition:opacity .2s ease;}
          .mnav-drawer{display:none;position:fixed;top:0;right:0;bottom:0;width:80vw;max-width:320px;background:var(--navy);z-index:300;
            transform:translateX(100%);transition:transform .25s ease;box-shadow:0 0 40px rgba(0,0,0,.4);flex-direction:column;overflow-y:auto;}
          .mnav-drawer.open{transform:translateX(0);}
          .mnav-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08);}
          .mnav-drawer-close{background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.7);width:32px;height:32px;border-radius:9px;cursor:pointer;font-size:14px;}
          .mnav-drawer-close:hover{background:rgba(255,255,255,.12);color:#fff;}
          .mnav-drawer-links{display:flex;flex-direction:column;gap:4px;padding:16px 20px;}
          .mnav-drawer-links .nl{padding:12px 14px;font-size:14px;}
          @media(max-width:900px){
            .mnav-drawer{display:flex;}
            .mnav-backdrop{display:block;}
            .mnav-backdrop.open{opacity:1;pointer-events:auto;}
          }

          /* HERO */
          .hero{background:var(--navy);min-height:90vh;display:flex;align-items:center;position:relative;overflow:hidden;}
          .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 70% 40%,rgba(0,198,167,.13) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 20% 70%,rgba(245,166,35,.10) 0%,transparent 60%);}
          .hgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;}
          .hero-in{max-width:1200px;margin:0 auto;padding:100px 24px 80px;display:grid;grid-template-columns:1fr 400px;gap:60px;align-items:center;position:relative;z-index:1;}
          .badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,198,167,.12);border:1px solid rgba(0,198,167,.3);color:var(--teal);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 13px;border-radius:100px;margin-bottom:22px;}
          .h1{font-family:var(--font-d);font-size:clamp(34px,4vw,56px);font-weight:900;line-height:1.12;color:#fff;margin-bottom:18px;}
          .h1 span{color:var(--accent);}
          .hero-p{font-size:16px;color:rgba(255,255,255,.65);line-height:1.75;margin-bottom:34px;max-width:480px;}
          .hero-btns{display:flex;gap:12px;flex-wrap:wrap;}
          .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:14px;padding:13px 24px;border-radius:11px;text-decoration:none;transition:all .25s;border:none;cursor:pointer;font-family:var(--font-b);}
          .btn-accent{background:var(--accent);color:var(--navy);}
          .btn-accent:hover{background:var(--accent-light);transform:translateY(-2px);box-shadow:0 8px 28px rgba(245,166,35,.35);}
          .btn-ghost{background:rgba(255,255,255,.07);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.12);}
          .btn-ghost:hover{background:rgba(255,255,255,.12);color:#fff;}
          .hero-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:28px;backdrop-filter:blur(8px);}
          .sgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
          .sc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:18px;text-align:center;}
          .sc-n{font-family:var(--font-d);font-size:30px;font-weight:900;color:var(--accent);line-height:1;margin-bottom:5px;}
          .sc-l{font-size:11px;color:rgba(255,255,255,.45);font-weight:500;}
          .hdiv{border:none;border-top:1px solid rgba(255,255,255,.1);margin:20px 0;}
          .hfeats{display:flex;flex-direction:column;gap:10px;}
          .hfeat{display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.65);font-size:13px;font-weight:500;}
          .hfeat i{color:var(--teal);font-size:12px;width:16px;}
          @media(max-width:860px){.hero-in{grid-template-columns:1fr;}.hero-card{display:none;}}

          /* SECTION WRAPPER */
          .sec{padding:88px 24px;}
          .sec-in{max-width:1200px;margin:0 auto;}
          .sec-lbl{font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--teal);margin-bottom:10px;}
          .sec-h{font-family:var(--font-d);font-size:clamp(26px,3.5vw,42px);font-weight:900;color:var(--navy);line-height:1.15;margin-bottom:14px;}
          .sec-sub{font-size:15px;color:var(--muted);line-height:1.75;max-width:540px;}
          .sec-dark{background:var(--navy);}
          .sec-dark .sec-lbl{color:var(--accent);}
          .sec-dark .sec-h{color:#fff;}
          .sec-dark .sec-sub{color:rgba(255,255,255,.5);}
          .sec-alt{background:var(--surface-alt);}

          /* ABOUT / WHY */
          .why-g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:52px;}
          .why-c{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;transition:all .3s;}
          .why-c:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--teal);}
          .why-ic{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:19px;margin-bottom:18px;}
          .why-c h3{font-size:17px;font-weight:700;margin-bottom:9px;color:var(--navy);}
          .why-c p{font-size:13px;color:var(--muted);line-height:1.7;}
          @media(max-width:720px){.why-g{grid-template-columns:1fr;}}

          /* PORTAL DASHBOARD */
          .pd-stats-g{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:52px;}
          .pd-stat-c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);padding:24px;text-align:center;transition:all .3s;}
          .pd-stat-c:hover{transform:translateY(-3px);background:rgba(255,255,255,.07);}
          .pd-stat-ic{width:42px;height:42px;border-radius:12px;background:rgba(0,198,167,.12);color:var(--teal);display:flex;align-items:center;justify-content:center;font-size:17px;margin:0 auto 14px;}
          .pd-stat-v{font-family:var(--font-d);font-size:30px;font-weight:900;color:#fff;line-height:1;margin-bottom:6px;}
          .pd-stat-l{font-size:11px;color:rgba(255,255,255,.45);font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
          .pd-skel{display:inline-block;width:50px;height:24px;border-radius:6px;background:rgba(255,255,255,.08);animation:pdpulse 1.4s ease-in-out infinite;}
          @keyframes pdpulse{0%,100%{opacity:1}50%{opacity:.35}}
          .pd-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px;}
          .pd-sub-h{font-size:13px;font-weight:700;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
          .pd-sub-h i{color:var(--accent);}
          .pd-champ-list,.pd-activity-list{display:flex;flex-direction:column;gap:10px;}
          .pd-champ-c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;}
          .pd-champ-overall{border-color:rgba(245,166,35,.35);background:rgba(245,166,35,.06);}
          .pd-champ-ic{width:40px;height:40px;border-radius:11px;background:rgba(245,166,35,.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
          .pd-champ-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.4);margin-bottom:3px;}
          .pd-champ-name{font-size:14px;font-weight:800;color:#fff;}
          .pd-champ-meta{font-size:11.5px;color:rgba(255,255,255,.5);margin-top:2px;}
          .pd-activity-row{display:flex;align-items:flex-start;gap:11px;padding:11px 4px;border-bottom:1px solid rgba(255,255,255,.06);}
          .pd-activity-row:last-child{border-bottom:none;}
          .pd-activity-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);margin-top:6px;flex-shrink:0;}
          .pd-activity-text{font-size:13px;color:rgba(255,255,255,.7);line-height:1.6;}
          .pd-activity-text strong{color:#fff;font-weight:700;}
          .pd-activity-subj{color:rgba(255,255,255,.4);}
          .pd-empty,.pd-error{text-align:center;color:rgba(255,255,255,.4);font-size:13px;padding:20px;background:rgba(255,255,255,.03);border-radius:12px;margin-top:30px;}
          .pd-cta{margin-top:44px;padding-top:36px;border-top:1px solid rgba(255,255,255,.08);text-align:center;}
          .pd-cta p{font-size:14px;color:rgba(255,255,255,.6);margin-bottom:16px;}
          @media(max-width:900px){.pd-stats-g{grid-template-columns:1fr 1fr;}.pd-row{grid-template-columns:1fr;}}
          @media(max-width:480px){.pd-stats-g{grid-template-columns:1fr;}}

          /* CLASSES */
          .cls-g{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:52px;}
          .cls-c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);padding:26px;transition:all .3s;}
          .cls-c:hover{transform:translateY(-3px);background:rgba(255,255,255,.07);}
          .cls-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:100px;margin-bottom:14px;}
          .cls-label{font-family:var(--font-d);font-size:22px;font-weight:900;color:#fff;margin-bottom:4px;}
          .cls-age{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:12px;}
          .cls-desc{font-size:13px;color:rgba(255,255,255,.65);line-height:1.7;}
          @media(max-width:720px){.cls-g{grid-template-columns:1fr 1fr;}}
          @media(max-width:480px){.cls-g{grid-template-columns:1fr;}}

          /* SUBJECTS */
          .subj-g{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:52px;}
          .subj-c{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;transition:all .3s;}
          .subj-c:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);}
          .subj-hd{display:flex;align-items:center;gap:14px;margin-bottom:18px;}
          .subj-ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
          .subj-nm{font-size:19px;font-weight:800;color:var(--navy);}
          .subj-row{display:flex;flex-direction:column;gap:10px;}
          .subj-item label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);display:block;margin-bottom:3px;}
          .subj-item p{font-size:13px;color:var(--text);line-height:1.6;}
          @media(max-width:720px){.subj-g{grid-template-columns:1fr;}}

          /* SCHEDULE */
          .sched-g{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:52px;}
          .sched-c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:var(--radius);padding:24px;transition:all .3s;}
          .sched-c:hover{background:rgba(255,255,255,.07);}
          .sched-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
          .sched-batch{font-size:15px;font-weight:800;color:#fff;}
          .mode-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:100px;}
          .sched-rows{display:flex;flex-direction:column;gap:8px;}
          .sched-row{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(255,255,255,.65);}
          .sched-row i{color:var(--teal);font-size:12px;width:14px;}
          .seats{display:flex;align-items:center;gap:6px;margin-top:16px;font-size:12px;font-weight:700;}
          .seat-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);}
          .seat-dot.few{background:#f97316;}
          .seat-dot.last{background:#ef4444;}
          @media(max-width:900px){.sched-g{grid-template-columns:1fr 1fr;}}
          @media(max-width:560px){.sched-g{grid-template-columns:1fr;}}

          /* FEES */
          .fees-g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:52px;}
          .fee-c{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px;position:relative;transition:all .3s;}
          .fee-c:hover{box-shadow:var(--shadow-lg);}
          .fee-c.hi{border-color:var(--teal);box-shadow:0 0 0 1px var(--teal);}
          .fee-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--teal);color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:4px 14px;border-radius:100px;white-space:nowrap;}
          .fee-tier{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
          .fee-price{font-family:var(--font-d);font-size:38px;font-weight:900;color:var(--navy);line-height:1;}
          .fee-period{font-size:13px;color:var(--muted);margin-bottom:24px;}
          .fee-perks{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
          .fee-perk{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text);}
          .fee-perk i{color:var(--teal);font-size:12px;}
          @media(max-width:720px){.fees-g{grid-template-columns:1fr;}}

          /* TESTIMONIALS */
          .test-g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px;}
          .test-c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius);padding:26px;}
          .test-q{font-size:32px;color:var(--teal);line-height:1;margin-bottom:12px;}
          .test-txt{font-size:14px;color:rgba(255,255,255,.7);line-height:1.75;margin-bottom:20px;}
          .test-auth{display:flex;align-items:center;gap:12px;}
          .test-av{width:40px;height:40px;border-radius:12px;background:rgba(0,198,167,.15);display:flex;align-items:center;justify-content:center;color:var(--teal);font-size:16px;}
          .test-name{font-size:14px;font-weight:700;color:#fff;}
          .test-role{font-size:12px;color:rgba(255,255,255,.4);}
          @media(max-width:720px){.test-g{grid-template-columns:1fr;}}

          /* TEACHERS */
          .teach-g{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-top:52px;}
          .teach-c{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px;display:flex;gap:20px;align-items:flex-start;transition:all .3s;}
          .teach-c:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);}
          .teach-av{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--navy),#2a3a7c);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;color:rgba(255,255,255,.4);}
          .teach-id{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);background:rgba(0,198,167,.08);border:1px solid rgba(0,198,167,.2);padding:3px 10px;border-radius:100px;display:inline-block;margin-bottom:7px;}
          .teach-name{font-size:18px;font-weight:700;color:var(--navy);margin-bottom:3px;}
          .teach-qual{font-size:12px;color:var(--muted);margin-bottom:10px;}
          .teach-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--navy);background:#f1f5f9;border-radius:8px;padding:4px 10px;margin-bottom:12px;}
          .teach-bio{font-size:13px;color:var(--muted);line-height:1.7;}
          @media(max-width:720px){.teach-g{grid-template-columns:1fr;}.teach-c{flex-direction:column;}}

          /* FAQ */
          .faq-list{display:flex;flex-direction:column;gap:12px;margin-top:52px;max-width:800px;}
          .faq-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:var(--radius);overflow:hidden;}
          .faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;background:none;border:none;color:#fff;font-family:var(--font-b);font-size:15px;font-weight:600;cursor:pointer;text-align:left;gap:16px;}
          .faq-q i{color:var(--teal);font-size:13px;transition:transform .3s;flex-shrink:0;}
          .faq-q.open i{transform:rotate(45deg);}
          .faq-a{padding:0 22px 18px;font-size:14px;color:rgba(255,255,255,.6);line-height:1.75;}

          /* ENROLL FORM */
          .form-wrap{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:44px;margin-top:44px;}
          .steps{display:flex;gap:0;margin-bottom:36px;}
          .step-item{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;}
          .step-item:not(:last-child)::after{content:'';position:absolute;top:18px;left:50%;width:100%;height:2px;background:rgba(255,255,255,.1);}
          .step-item.done::after,.step-item.active::after{background:var(--teal);}
          .step-circle{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid rgba(255,255,255,.15);color:rgba(255,255,255,.4);background:transparent;z-index:1;position:relative;}
          .step-item.done .step-circle{background:var(--teal);border-color:var(--teal);color:#fff;}
          .step-item.active .step-circle{border-color:var(--teal);color:var(--teal);}
          .step-lbl{font-size:11px;font-weight:600;color:rgba(255,255,255,.4);margin-top:7px;text-align:center;}
          .step-item.active .step-lbl,.step-item.done .step-lbl{color:rgba(255,255,255,.8);}
          .fg{display:flex;flex-direction:column;gap:6px;margin-bottom:18px;}
          .fg-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
          .fl{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55);}
          .fi{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;color:#fff;font-size:14px;font-family:var(--font-b);transition:all .2s;outline:none;width:100%;}
          .fi:focus{border-color:var(--teal);background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(0,198,167,.15);}
          .fi option{background:var(--navy);}
          .fi::placeholder{color:rgba(255,255,255,.3);}
          .cb-g{display:flex;flex-wrap:wrap;gap:10px;}
          .cb-l{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.7);font-weight:500;transition:all .2s;}
          .cb-l:hover{border-color:var(--teal);color:#fff;}
          .step-nav{display:flex;justify-content:space-between;margin-top:28px;gap:12px;}
          .btn-back{background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);padding:12px 24px;border-radius:10px;font-family:var(--font-b);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
          .btn-back:hover{background:rgba(255,255,255,.12);}
          .btn-next{background:var(--teal);color:#fff;border:none;padding:12px 28px;border-radius:10px;font-family:var(--font-b);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
          .btn-next:hover{opacity:.9;transform:translateY(-1px);}
          .btn-submit{background:var(--accent);color:var(--navy);border:none;padding:14px 32px;border-radius:11px;font-family:var(--font-b);font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;width:100%;margin-top:8px;}
          .btn-submit:hover{background:var(--accent-light);transform:translateY(-1px);}
          .status-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#f87171;border-radius:10px;padding:13px;font-size:13px;font-weight:600;text-align:center;margin-top:16px;}
          @media(max-width:640px){.fg-2{grid-template-columns:1fr;}.form-wrap{padding:24px 18px;}}

          /* SUCCESS CARD */
          .success-card{background:rgba(0,198,167,.08);border:1px solid rgba(0,198,167,.25);border-radius:16px;padding:32px;margin-top:24px;}
          .cred-g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;}
          .review-g{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;color:rgba(255,255,255,.7);}
          @media(max-width:480px){.review-g{grid-template-columns:1fr;}}
          .cred-box{background:rgba(255,255,255,.05);border-radius:10px;padding:14px;}
          .cred-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:6px;}
          .cred-val{font-size:15px;font-weight:800;font-family:monospace;}
          @media(max-width:520px){.cred-g{grid-template-columns:1fr;}}

          /* PORTAL BANNER */
          .pb{background:linear-gradient(135deg,var(--teal),#0099cc);}
          .pb-in{max-width:1200px;margin:0 auto;padding:48px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
          .pb h2{font-family:var(--font-d);font-size:26px;font-weight:900;color:#fff;}
          .pb p{font-size:14px;color:rgba(255,255,255,.8);margin-top:5px;}
          .btn-white{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--navy);font-weight:700;font-size:14px;padding:12px 22px;border-radius:11px;text-decoration:none;transition:all .2s;white-space:nowrap;}
          .btn-white:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2);}
          @media(max-width:600px){.pb-in{flex-direction:column;align-items:flex-start;}}

          /* FOOTER */
          .footer{background:#050913;color:rgba(255,255,255,.4);padding:60px 24px 28px;border-top:1px solid rgba(255,255,255,.06);}
          .footer-in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:44px;}
          .contact-g{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:48px;}
          @media(max-width:640px){.contact-g{grid-template-columns:1fr;}}
          .f-brand{font-family:var(--font-d);font-size:20px;font-weight:900;color:#fff;margin-bottom:10px;}
          .f-p{font-size:13px;line-height:1.8;}
          .f-h{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;margin-bottom:14px;}
          .f-lnk{display:flex;align-items:center;gap:7px;font-size:13px;margin-bottom:9px;text-decoration:none;color:rgba(255,255,255,.4);transition:color .2s;}
          .f-lnk:hover{color:var(--teal);}
          .footer-bot{max-width:1200px;margin:0 auto;border-top:1px solid rgba(255,255,255,.06);padding-top:22px;text-align:center;font-size:12px;}
          @media(max-width:900px){.footer-in{grid-template-columns:1fr 1fr;gap:28px;}}
          @media(max-width:560px){.footer-in{grid-template-columns:1fr;}}
        `}</style>
      </Head>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-i">
          <a href="#home" className="logo">
            <div className="logo-box"><i className="fa-solid fa-graduation-cap"></i></div>
            <span className="logo-txt">ApexCBSE</span>
          </a>
          <div className="nav-links">
            <a href="#dashboard" className="nl">Dashboard</a>
            <a href="#about"    className="nl">About</a>
            <a href="#classes"  className="nl">Classes</a>
            <a href="#subjects" className="nl">Subjects</a>
            <a href="#schedule" className="nl">Schedule</a>
            <a href="#fees"     className="nl">Fees</a>
            <a href="#contact"  className="nl">Contact</a>
            <a href="/portal"   className="n-portal"><i className="fa-solid fa-lock-open" style={{fontSize:'11px'}}></i> Student Login</a>
            <a href="#enroll"   className="n-cta">Enroll Now</a>
          </div>
          <button className="hm" onClick={()=>setMobileNavOpen(true)} aria-label="Open menu"><i className="fa-solid fa-bars"></i></button>
        </div>
      </nav>

      {/* Mobile nav drawer — only relevant/visible under the 900px breakpoint (see CSS) */}
      <div className={`mnav-backdrop${mobileNavOpen?' open':''}`} onClick={()=>setMobileNavOpen(false)} />
      <div className={`mnav-drawer${mobileNavOpen?' open':''}`}>
        <div className="mnav-drawer-head">
          <span className="logo-txt" style={{color:'#fff'}}>Menu</span>
          <button className="mnav-drawer-close" onClick={()=>setMobileNavOpen(false)} aria-label="Close menu"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="mnav-drawer-links">
          <a href="#dashboard" className="nl" onClick={()=>setMobileNavOpen(false)}>Dashboard</a>
          <a href="#about"    className="nl" onClick={()=>setMobileNavOpen(false)}>About</a>
          <a href="#classes"  className="nl" onClick={()=>setMobileNavOpen(false)}>Classes</a>
          <a href="#subjects" className="nl" onClick={()=>setMobileNavOpen(false)}>Subjects</a>
          <a href="#schedule" className="nl" onClick={()=>setMobileNavOpen(false)}>Schedule</a>
          <a href="#fees"     className="nl" onClick={()=>setMobileNavOpen(false)}>Fees</a>
          <a href="#contact"  className="nl" onClick={()=>setMobileNavOpen(false)}>Contact</a>
          <a href="/portal"   className="n-portal" style={{marginTop:'10px',textAlign:'center'}}><i className="fa-solid fa-lock-open" style={{fontSize:'11px'}}></i> Student Login</a>
          <a href="#enroll"   className="n-cta" style={{textAlign:'center',marginTop:'8px'}} onClick={()=>setMobileNavOpen(false)}>Enroll Now</a>
        </div>
      </div>

      {/* ── HERO ── */}
      <section id="home" className="hero">
        <div className="hgrid"></div>
        <div className="hero-in">
          <div>
            <div className="badge"><i className="fa-solid fa-circle-check" style={{fontSize:'10px'}}></i> {h.badge}</div>
            <h1 className="h1">{h.headline?.split("'s")[0]}'s<br /><span>{h.headline?.split("'s")[1] || ''}</span></h1>
            <p className="hero-p">{h.subheadline}</p>
            <div className="hero-btns">
              <a href={h.btn1Link} className="btn btn-accent"><i className="fa-solid fa-user-plus"></i> {h.btn1Text}</a>
              <a href={h.btn2Link} className="btn btn-ghost"><i className="fa-solid fa-right-to-bracket"></i> {h.btn2Text}</a>
            </div>
          </div>
          <div className="hero-card">
            <div className="sgrid">
              <div className="sc"><div className="sc-n">{h.stat1Num}</div><div className="sc-l">{h.stat1Label}</div></div>
              <div className="sc"><div className="sc-n">{h.stat2Num}</div><div className="sc-l">{h.stat2Label}</div></div>
              <div className="sc"><div className="sc-n">{h.stat3Num}</div><div className="sc-l">{h.stat3Label}</div></div>
              <div className="sc"><div className="sc-n">{h.stat4Num}</div><div className="sc-l">{h.stat4Label}</div></div>
            </div>
            <hr className="hdiv" />
            <div className="hfeats">
              {[h.feat1, h.feat2, h.feat3, h.feat4].filter(Boolean).map((f, i) => (
                <div key={i} className="hfeat"><i className="fa-solid fa-check-circle"></i> {f}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTAL DASHBOARD (live stats from the Student Portal) ── */}
      <section id="dashboard" className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Live From The Portal</p>
          <h2 className="sec-h">Real students,<br/>real progress</h2>
          <p className="sec-sub">Every number below updates automatically as students work through lessons in the Student Portal — nothing here is staged.</p>

          {portalStats === false ? (
            <div className="pd-error">Live stats are temporarily unavailable — please check back shortly.</div>
          ) : (
            <>
              <div className="pd-stats-g">
                {[
                  { icon:'fa-user-graduate', label:'Total Students',        val: portalStats?.totalStudents },
                  { icon:'fa-list-check',    label:'Questions Available',   val: portalStats?.totalQuestionsAvailable },
                  { icon:'fa-pen',           label:'Questions Attempted',   val: portalStats?.totalQuestionsAttempted },
                  { icon:'fa-circle-check',  label:'Correct Answers',       val: portalStats?.totalCorrectAnswers },
                ].map((s,i) => (
                  <div key={i} className="pd-stat-c">
                    <div className="pd-stat-ic"><i className={`fa-solid ${s.icon}`}></i></div>
                    <div className="pd-stat-v">{portalStats ? (s.val ?? 0).toLocaleString('en-IN') : <span className="pd-skel" />}</div>
                    <div className="pd-stat-l">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="pd-row">
                <div className="pd-col">
                  <p className="pd-sub-h"><i className="fa-solid fa-trophy"></i> Top Performers</p>
                  {!portalStats ? (
                    <div className="pd-champ-c"><div className="pd-skel" style={{height:'60px'}} /></div>
                  ) : !portalStats.topPerformers?.overall && !Object.keys(portalStats.topPerformers?.bySubject||{}).length ? (
                    <div className="pd-empty">No champions yet — be the first!</div>
                  ) : (
                    <div className="pd-champ-list">
                      {portalStats.topPerformers.overall && (
                        <div className="pd-champ-c pd-champ-overall">
                          <div className="pd-champ-ic"><i className="fa-solid fa-crown"></i></div>
                          <div>
                            <div className="pd-champ-tag">Overall Champion</div>
                            <div className="pd-champ-name">{portalStats.topPerformers.overall.studentName}</div>
                            <div className="pd-champ-meta">{portalStats.topPerformers.overall.correct} correct · {portalStats.topPerformers.overall.accuracy}% accuracy</div>
                          </div>
                        </div>
                      )}
                      {Object.entries(portalStats.topPerformers.bySubject||{}).slice(0,4).map(([subject, champ]) => champ && (
                        <div key={subject} className="pd-champ-c">
                          <div className="pd-champ-ic" style={{background:'rgba(245,166,35,.12)',color:'var(--accent)'}}><i className="fa-solid fa-medal"></i></div>
                          <div>
                            <div className="pd-champ-tag">{subject} Champion</div>
                            <div className="pd-champ-name">{champ.studentName}</div>
                            <div className="pd-champ-meta">{champ.correct} correct · {champ.accuracy}% accuracy</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pd-col">
                  <p className="pd-sub-h"><i className="fa-solid fa-bolt"></i> Recent Activity</p>
                  {!portalStats ? (
                    <div className="pd-champ-c"><div className="pd-skel" style={{height:'60px'}} /></div>
                  ) : !portalStats.recentActivity?.length ? (
                    <div className="pd-empty">No recent activity yet.</div>
                  ) : (
                    <div className="pd-activity-list">
                      {portalStats.recentActivity.map((a,i) => (
                        <div key={i} className="pd-activity-row">
                          <div className="pd-activity-dot"></div>
                          <div className="pd-activity-text">
                            <strong>{a.studentName}</strong> worked on <strong>{a.topic || a.subject}</strong>
                            {a.subject && a.topic ? <span className="pd-activity-subj"> · {a.subject}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="pd-cta">
            <p>Already enrolled? Pick up right where you left off.</p>
            <a href="/portal" className="btn btn-accent"><i className="fa-solid fa-right-to-bracket"></i> Continue Learning in the Student Portal</a>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="sec sec-alt">
        <div className="sec-in">
          <p className="sec-lbl">About the Academy</p>
          <h2 className="sec-h">A different kind of<br/>learning experience</h2>
          <p className="sec-sub">We combine rigorous CBSE standards with a child-centric, mentorship-first approach — making learning effective, personalised, and genuinely enjoyable.</p>
          <div className="why-g">
            {cms.about.map((item, i) => (
              <div key={i} className="why-c">
                <div className="why-ic" style={{background: item.IconBg, color: item.IconColor}}>
                  <i className={`fa-solid ${item.Icon}`}></i>
                </div>
                <h3>{item.Heading}</h3>
                <p>{item.Body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLASSES ── */}
      <section id="classes" className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Academic Programs</p>
          <h2 className="sec-h">Classes Offered</h2>
          <p className="sec-sub">Six class levels, each with a tailored curriculum, learning objectives, and teaching approach designed for that specific age group.</p>
          <div className="cls-g">
            {cms.classes.map(cls => (
              <div key={cls.Id} className="cls-c">
                <div className="cls-chip" style={{background:`${cls.Color}22`, color: cls.Color, border:`1px solid ${cls.Color}44`}}>{cls.Id}</div>
                <div className="cls-label">{cls.Label}</div>
                <div className="cls-age">Age {cls.Age}</div>
                <div className="cls-desc">{cls.Description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section id="subjects" className="sec sec-alt">
        <div className="sec-in">
          <p className="sec-lbl">What We Teach</p>
          <h2 className="sec-h">Five core subjects,<br/>taught exceptionally well</h2>
          <p className="sec-sub">Each subject has a dedicated structure — clear topics, defined learning goals, and proven teaching methods used by our expert mentors.</p>
          <div className="subj-g">
            {cms.subjects.map(s => (
              <div key={s.Name} className="subj-c">
                <div className="subj-hd">
                  <div className="subj-ic" style={{background:`${s.Color}18`, color: s.Color}}><i className={`fa-solid ${s.Icon}`}></i></div>
                  <span className="subj-nm">{s.Name}</span>
                </div>
                <div className="subj-row">
                  <div className="subj-item"><label>Topics Covered</label><p>{s.Topics}</p></div>
                  <div className="subj-item"><label>Learning Goal</label><p>{s.Goal}</p></div>
                  <div className="subj-item"><label>Teaching Method</label><p>{s.Method}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHEDULE ── */}
      <section id="schedule" className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Tuition Timings</p>
          <h2 className="sec-h">Available Batches</h2>
          <p className="sec-sub">Choose the schedule that fits your routine. Seat availability updates in real time — reserve yours during enrollment.</p>
          <div className="sched-g">
            {cms.schedules.map((s, i) => {
              const seats = Number(s.Seats);
              const dotCls = seats >= 4 ? 'seat-dot' : seats >= 2 ? 'seat-dot few' : 'seat-dot last';
              const modeColor = s.Mode==='Physical'?'rgba(34,197,94,.15)':s.Mode==='Online'?'rgba(59,130,246,.15)':'rgba(168,85,247,.15)';
              const modeText  = s.Mode==='Physical'?'#4ade80':s.Mode==='Online'?'#60a5fa':'#c084fc';
              return (
                <div key={i} className="sched-c">
                  <div className="sched-top">
                    <span className="sched-batch">{s.Batch}</span>
                    <span className="mode-tag" style={{background:modeColor, color:modeText}}>{s.Mode}</span>
                  </div>
                  <div className="sched-rows">
                    <div className="sched-row"><i className="fa-solid fa-calendar"></i>{s.Days}</div>
                    <div className="sched-row"><i className="fa-solid fa-clock"></i>{s.Time}</div>
                  </div>
                  <div className="seats" style={{color: seats>=4?'#4ade80':seats>=2?'#f97316':'#ef4444'}}>
                    <span className={dotCls}></span>{seats} seat{seats!==1?'s':''} available
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEES ── */}
      <section id="fees" className="sec sec-alt">
        <div className="sec-in">
          <p className="sec-lbl">Fee Structure</p>
          <h2 className="sec-h">Simple, transparent pricing</h2>
          <p className="sec-sub">No hidden charges. Pay monthly. Cancel anytime. All plans include access to the student portal and progress dashboard.</p>
          <div className="fees-g">
            {cms.fees.map((f, i) => {
              const isHighlight = String(f.Highlight).toUpperCase() === 'TRUE';
              const perks = typeof f.Perks === 'string' ? f.Perks.split('|') : (f.Perks || []);
              return (
                <div key={i} className={`fee-c${isHighlight ? ' hi' : ''}`}>
                  {isHighlight && <span className="fee-badge">Most Popular</span>}
                  <div className="fee-tier">{f.Tier}</div>
                  <div className="fee-price">{f.Price}</div>
                  <div className="fee-period">{f.Period} · per student</div>
                  <div className="fee-perks">
                    {perks.map((p, j) => <div key={j} className="fee-perk"><i className="fa-solid fa-check-circle"></i>{p.trim()}</div>)}
                  </div>
                  <a href="#enroll" className="btn btn-accent" style={{width:'100%',justifyContent:'center'}}><i className="fa-solid fa-user-plus"></i> Enroll Now</a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Parent Stories</p>
          <h2 className="sec-h">What families say</h2>
          <p className="sec-sub">Real words from the parents and students who are part of the ApexCBSE community.</p>
          <div className="test-g">
            {cms.testimonials.map((t, i) => (
              <div key={i} className="test-c">
                <div className="test-q">"</div>
                <p className="test-txt">{t.Text}</p>
                <div className="test-auth">
                  <div className="test-av"><i className="fa-solid fa-user"></i></div>
                  <div><div className="test-name">{t.Name}</div><div className="test-role">{t.Role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEACHERS ── */}
      <section id="teachers" className="sec sec-alt">
        <div className="sec-in">
          <p className="sec-lbl">Expert Mentors</p>
          <h2 className="sec-h">Meet your child's teachers</h2>
          <p className="sec-sub">Background-verified specialists dedicated to child-centred primary education and measurable academic outcomes.</p>
          <div className="teach-g">
            {cms.teachers.map(t => (
              <div key={t.Id} className="teach-c">
                {t.ImageUrl
                  ? <img src={t.ImageUrl} alt={t.Name} style={{width:'64px',height:'64px',borderRadius:'16px',objectFit:'cover',flexShrink:0}} />
                  : <div className="teach-av"><i className="fa-solid fa-user-tie"></i></div>
                }
                <div>
                  <div className="teach-id">{t.Id}</div>
                  <div className="teach-name">{t.Name}</div>
                  <div className="teach-qual">{t.Qualification} · {t.Experience} Experience</div>
                  <div className="teach-tag"><i className="fa-solid fa-chalkboard-user" style={{fontSize:'11px'}}></i>{t.Subjects}</div>
                  <div className="teach-bio">{t.Bio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Got Questions?</p>
          <h2 className="sec-h">Frequently Asked Questions</h2>
          <p className="sec-sub">Everything parents ask before enrolling — answered clearly and honestly.</p>
          <div className="faq-list">
            {cms.faqs.map((f, i) => (
              <div key={i} className="faq-item">
                <button className={`faq-q${openFaq===i?' open':''}`} onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  {f.Question}<i className="fa-solid fa-plus"></i>
                </button>
                {openFaq===i && <div className="faq-a">{f.Answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTAL BANNER ── */}
      <div className="pb">
        <div className="pb-in">
          <div>
            <h2>Already enrolled? Your dashboard is waiting.</h2>
            <p>View assignments, track progress, check schedules — all in one place.</p>
          </div>
          <a href="/portal" className="btn-white"><i className="fa-solid fa-arrow-right-to-bracket"></i> Open Student Portal</a>
        </div>
      </div>

      {/* ── ENROLL FORM ── */}
      <section id="enroll" className="sec sec-dark">
        <div className="sec-in">
          <p className="sec-lbl">Get Started</p>
          <h2 className="sec-h">Enrollment Registration</h2>
          <p className="sec-sub">Complete the form below. Your Student ID and login credentials are generated instantly on submission.</p>

          {formStatus.state === 'success' ? (
            <div className="success-card">
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'#fff',flexShrink:0}}><i className="fa-solid fa-circle-check"></i></div>
                <div>
                  <div style={{fontWeight:800,fontSize:'17px',color:'#fff'}}>Enrollment Successful! 🎉</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,.5)'}}>Your login credentials are ready — save them now</div>
                </div>
              </div>
              <div className="cred-g">
                <div className="cred-box"><div className="cred-lbl">Student ID</div><div className="cred-val" style={{color:'var(--teal)'}}>{formStatus.studentId}</div></div>
                <div className="cred-box"><div className="cred-lbl">Username</div><div className="cred-val" style={{color:'#fff'}}>{formStatus.username}</div></div>
                <div className="cred-box"><div className="cred-lbl">Temp Password</div><div className="cred-val" style={{color:'var(--accent)'}}>{formStatus.tempPassword}</div></div>
              </div>
              <p style={{fontSize:'12px',color:'rgba(255,255,255,.45)',marginBottom:'20px',lineHeight:1.7}}>⚠ Screenshot or write down these credentials. You will be prompted to set a new password on first login.</p>
              <a href="/portal" className="btn btn-accent"><i className="fa-solid fa-arrow-right-to-bracket"></i> Go to Student Portal</a>
            </div>
          ) : (
            <form onSubmit={handleEnroll}>
              <div className="form-wrap">
                {/* STEP INDICATOR */}
                <div className="steps">
                  {['Student','Parent','Course','Confirm'].map((s,i)=>(
                    <div key={i} className={`step-item${step>i+1?' done':step===i+1?' active':''}`}>
                      <div className="step-circle">{step>i+1?<i className="fa-solid fa-check"></i>:i+1}</div>
                      <span className="step-lbl">{s}</span>
                    </div>
                  ))}
                </div>

                {step===1 && (
                  <div>
                    <div className="fg-2">
                      <div className="fg"><label className="fl">Student Full Name *</label><input name="studentName" required className="fi" placeholder="e.g. Rohan Sharma" defaultValue={formData.studentName} /></div>
                      <div className="fg"><label className="fl">Date of Birth *</label><input name="dob" type="date" required className="fi" defaultValue={formData.dob} /></div>
                    </div>
                    <div className="fg-2">
                      <div className="fg"><label className="fl">Gender</label>
                        <select name="gender" className="fi" defaultValue={formData.gender}><option value="">Select…</option><option>Male</option><option>Female</option><option>Prefer not to say</option></select>
                      </div>
                      <div className="fg"><label className="fl">School Name</label><input name="schoolName" className="fi" placeholder="e.g. Delhi Public School" defaultValue={formData.schoolName} /></div>
                    </div>
                    <div className="fg"><label className="fl">Current Grade / Class *</label>
                      <select name="classLevel" required className="fi" defaultValue={formData.classLevel}>
                        <option value="">Select class…</option>
                        {cms.classes.map(cls => <option key={cls.Id} value={cls.Id}>{cls.Label}</option>)}
                      </select>
                    </div>
                    <div className="step-nav"><span></span><button type="button" className="btn-next" onClick={(e)=>saveStepAndAdvance(e,2)}>Next: Parent Info <i className="fa-solid fa-arrow-right"></i></button></div>
                  </div>
                )}

                {step===2 && (
                  <div>
                    <div className="fg-2">
                      <div className="fg"><label className="fl">Parent / Guardian Name *</label><input name="parentName" required className="fi" placeholder="e.g. Mr. Vijay Sharma" defaultValue={formData.parentName} /></div>
                      <div className="fg"><label className="fl">Email Address *</label><input name="email" type="email" required className="fi" placeholder="parent@email.com" defaultValue={formData.email} /></div>
                    </div>
                    <div className="fg-2">
                      <div className="fg"><label className="fl">Primary Phone *</label><input name="phone" type="tel" required className="fi" placeholder="+91 98765 43210" defaultValue={formData.phone} /></div>
                      <div className="fg"><label className="fl">Emergency Contact</label><input name="emergencyContact" type="tel" className="fi" placeholder="+91 00000 00000" defaultValue={formData.emergencyContact} /></div>
                    </div>
                    <div className="fg"><label className="fl">Home Address</label><input name="address" className="fi" placeholder="Flat/House No., Street, City" defaultValue={formData.address} /></div>
                    <div className="step-nav">
                      <button type="button" className="btn-back" onClick={()=>setStep(1)}><i className="fa-solid fa-arrow-left"></i> Back</button>
                      <button type="button" className="btn-next" onClick={(e)=>saveStepAndAdvance(e,3)}>Next: Course Selection <i className="fa-solid fa-arrow-right"></i></button>
                    </div>
                  </div>
                )}

                {step===3 && (
                  <div>
                    <div className="fg-2">
                      <div className="fg"><label className="fl">Preferred Teacher</label>
                        <select name="teacherId" className="fi" defaultValue={formData.teacherId}>
                          <option value="">No preference</option>
                          {cms.teachers.map(t => <option key={t.Id} value={t.Id}>{t.Name} ({t.Id})</option>)}
                        </select>
                      </div>
                      <div className="fg"><label className="fl">Preferred Batch</label>
                        <select name="timeSlot" className="fi" defaultValue={formData.timeSlot}>
                          <option value="">Select batch…</option>
                          {cms.schedules.map((s, i) => <option key={i} value={s.Batch}>{s.Batch} — {s.Time}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="fg"><label className="fl">Learning Mode</label>
                      <select name="learningMode" className="fi" defaultValue={formData.learningMode}>
                        <option value="">Select mode…</option>
                        <option value="Physical">Physical (In-person)</option>
                        <option value="Online">Online (Google Meet / Zoom)</option>
                        <option value="Hybrid">Hybrid (Mix of both)</option>
                      </select>
                    </div>
                    <div className="fg"><label className="fl">Subjects Required</label>
                      <div className="cb-g">
                        {cms.subjects.map(s => (
                          <label key={s.Name} className="cb-l">
                            <input type="checkbox" name="subjects" value={s.Name} defaultChecked={formData.subjects.includes(s.Name)} style={{accentColor:'var(--teal)'}} />
                            <span>{s.Name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="step-nav">
                      <button type="button" className="btn-back" onClick={()=>setStep(2)}><i className="fa-solid fa-arrow-left"></i> Back</button>
                      <button type="button" className="btn-next" onClick={(e)=>saveStepAndAdvance(e,4)}>Review & Confirm <i className="fa-solid fa-arrow-right"></i></button>
                    </div>
                  </div>
                )}

                {step===4 && (
                  <div>
                    <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.09)',borderRadius:'12px',padding:'20px',marginBottom:'20px'}}>
                      <p style={{fontSize:'12px',fontWeight:700,color:'var(--teal)',marginBottom:'14px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Review Your Details</p>
                      <div className="review-g">
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Student: </span>{formData.studentName || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>DOB: </span>{formData.dob || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Class: </span>{formData.classLevel || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>School: </span>{formData.schoolName || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Parent: </span>{formData.parentName || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Email: </span>{formData.email || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Phone: </span>{formData.phone || '—'}</div>
                        <div><span style={{color:'rgba(255,255,255,.4)'}}>Mode: </span>{formData.learningMode || '—'}</div>
                        <div style={{gridColumn:'1/-1'}}><span style={{color:'rgba(255,255,255,.4)'}}>Subjects: </span>{formData.subjects.length > 0 ? formData.subjects.join(', ') : '—'}</div>
                      </div>
                    </div>
                    <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'10px',padding:'14px 18px',marginBottom:'16px'}}>
                      <p style={{fontSize:'12px',color:'rgba(255,255,255,.4)',lineHeight:1.8}}>
                        By submitting you confirm all details are accurate. A student account will be created instantly and your login credentials will be displayed on screen. The registrar will contact you within 24 hours to confirm batch placement.
                      </p>
                    </div>
                    {formStatus.state==='error' && <div className="status-err">⚠ {formStatus.message}</div>}
                    <button type="submit" className="btn-submit" disabled={formStatus.state==='loading'}>
                      {formStatus.state==='loading' ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Creating your account…</> : <><i className="fa-solid fa-paper-plane"></i> Submit Enrollment & Create Account</>}
                    </button>
                    <div className="step-nav" style={{marginTop:'12px'}}>
                      <button type="button" className="btn-back" onClick={()=>setStep(3)}><i className="fa-solid fa-arrow-left"></i> Back</button>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="sec sec-alt">
        <div className="sec-in">
          <p className="sec-lbl">Get In Touch</p>
          <h2 className="sec-h">Contact Us</h2>
          <p className="sec-sub">Have a question before enrolling? Reach out — we respond within a few hours.</p>
          <div className="contact-g">
            {[
              { ic:'fa-brands fa-whatsapp', cl:'#4ade80',      label:'WhatsApp', val:'Chat Now',          href:`https://wa.me/${c.whatsappNumber}` },
              { ic:'fa-solid fa-phone',     cl:'#60a5fa',      label:'Phone',    val: c.phone,            href:`tel:${c.phone}` },
              { ic:'fa-solid fa-envelope',  cl:'var(--accent)', label:'Email',   val: c.email,            href:`mailto:${c.email}` },
              { ic:'fa-solid fa-location-dot', cl:'#f87171',   label:'Location', val: c.address,         href:'#' },
            ].map((item, i) => (
              <a key={i} href={item.href} target={item.href.startsWith('http')?'_blank':'_self'} rel="noopener noreferrer"
                style={{display:'flex',alignItems:'center',gap:'16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'14px',padding:'22px',textDecoration:'none',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-lg)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${item.cl}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',color:item.cl,flexShrink:0}}><i className={item.ic}></i></div>
                <div><div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--muted)',marginBottom:'3px'}}>{item.label}</div><div style={{fontSize:'15px',fontWeight:700,color:'var(--navy)'}}>{item.val}</div></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-in">
          <div>
            <div className="f-brand">ApexCBSE Academy</div>
            <p className="f-p">Dedicated foundational coaching built to scale child proficiency while keeping primary learning fun, engaging, and outcome-focused. CBSE aligned, KG to Class 5.</p>
          </div>
          <div>
            <p className="f-h">Academy</p>
            <a href="#about"    className="f-lnk">About Us</a>
            <a href="#classes"  className="f-lnk">Classes</a>
            <a href="#subjects" className="f-lnk">Subjects</a>
            <a href="#teachers" className="f-lnk">Teachers</a>
          </div>
          <div>
            <p className="f-h">Admission</p>
            <a href="#schedule" className="f-lnk">Schedules</a>
            <a href="#fees"     className="f-lnk">Fee Structure</a>
            <a href="#enroll"   className="f-lnk">Enroll Now</a>
            <a href="/portal"   className="f-lnk">Student Portal</a>
          </div>
          <div>
            <p className="f-h">Contact</p>
            <a href={`https://wa.me/${c.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="f-lnk" style={{color:'#4ade80'}}><i className="fa-brands fa-whatsapp"></i> WhatsApp</a>
            <a href={`tel:${c.phone}`} className="f-lnk"><i className="fa-solid fa-phone"></i> {c.phone}</a>
            <span className="f-lnk"><i className="fa-solid fa-envelope"></i> {c.email}</span>
            <span className="f-lnk"><i className="fa-solid fa-location-dot"></i> {c.address}</span>
          </div>
        </div>
        <div className="footer-bot">© 2026 ApexCBSE Academy. All Rights Reserved. CBSE Aligned · KG to Class 5.</div>
      </footer>
    </>
  );
}
