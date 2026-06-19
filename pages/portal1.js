import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';


// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS LIVE FETCH (via server-side API route — no CORS issues)
// Edit the sheet → refresh the page → changes appear instantly.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAllSheetData() {
  const res = await fetch('/api/portal-config', { cache: 'no-store' });
  if (!res.ok) throw new Error(`portal-config API returned ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK DATA (shown if Google Sheets is unreachable)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK = {
  settings: {
    SiteName:'Student Portal', AcademyName:'ApexCBSE Academy',
    BackLinkLabel:'Back to Academy', BackLinkURL:'/',
    LoginHeading:'Student Portal', LoginSubheading:'Sign in to access your personal dashboard',
    LoginButtonLabel:'Access My Dashboard', LoadingButtonText:'Verifying…',
    SidebarSectionLabel:'My Academy', SignOutLabel:'Sign Out',
    WelcomeGreeting:'Good day, {firstName}! 👋', EnrolmentStatus:'Active',
    DashboardSubtitle:"Welcome back — here's your academic snapshot.",
    DashboardNextClasses:'3',
    UploadZonePrimary:'Click to select a file, or drag and drop',
    UploadZoneSub:'Supports PDF, DOC, JPG, PNG',
    UploadSuccessTemplate:'"{filename}" submitted successfully!',
    UploadValidationError:'Select a file first.',
    AttHighColor:'#4ade80', AttMidColor:'#00c6a7', AttLowColor:'#f5a623',
    DefaultClassLevel:'Class 3', AuthAPIEndpoint:'/api/student/auth',
    ConnectionErrorMsg:'Connection failed. Is the server running?',
  },
  navigation:[
    {ID:'dashboard',     Label:'Dashboard',        'Icon (FontAwesome solid)':'fa-chart-pie',      Active:true,Order:1},
    {ID:'progress',      Label:'Academic Progress', 'Icon (FontAwesome solid)':'fa-chart-line',     Active:true,Order:2},
    {ID:'attendance',    Label:'Attendance',        'Icon (FontAwesome solid)':'fa-calendar-check', Active:true,Order:3},
    {ID:'assignments',   Label:'Assignments',       'Icon (FontAwesome solid)':'fa-book-open',      Active:true,Order:4},
    {ID:'schedule',      Label:'Upcoming Classes',  'Icon (FontAwesome solid)':'fa-clock',          Active:true,Order:5},
    {ID:'notifications', Label:'Notifications',     'Icon (FontAwesome solid)':'fa-bell',           Active:true,Order:6},
    {ID:'profile',       Label:'My Profile',        'Icon (FontAwesome solid)':'fa-user-circle',    Active:true,Order:7},
  ],
  dashStats:[
    {'Metric Key':'attendance_pct',   Label:'Attendance',               Value:'85%','Sub-label':'This term',      'Display Order':1,Active:true},
    {'Metric Key':'submissions_pct',  Label:'Submissions',              Value:'88%','Sub-label':'On time',        'Display Order':2,Active:true},
    {'Metric Key':'avg_score',        Label:'Avg Score',                Value:'65', 'Sub-label':'Across subjects','Display Order':3,Active:true},
    {'Metric Key':'pending_tasks',    Label:'Pending Tasks',            Value:'5',  'Sub-label':'Assignments',    'Display Order':4,Active:true},
    {'Metric Key':'ratio_attendance', Label:'Attendance (Ratio Chart)', Value:'85', 'Sub-label':'',               'Display Order':5,Active:true},
    {'Metric Key':'ratio_submissions',Label:'Submissions (Ratio Chart)',Value:'88', 'Sub-label':'',               'Display Order':6,Active:true},
    {'Metric Key':'ratio_quiz_avg',   Label:'Quiz Avg (Ratio Chart)',   Value:'78', 'Sub-label':'',               'Display Order':7,Active:true},
  ],
  subjects:[
    {Subject:'English',     'Progress %':50,'Total Topics':12,'Topics Done':6, 'Color (Hex)':'#3b82f6','Display Order':1,Active:true},
    {Subject:'Mathematics', 'Progress %':60,'Total Topics':15,'Topics Done':9, 'Color (Hex)':'#f97316','Display Order':2,Active:true},
    {Subject:'Science',     'Progress %':82,'Total Topics':10,'Topics Done':8, 'Color (Hex)':'#22c55e','Display Order':3,Active:true},
    {Subject:'Geography',   'Progress %':85,'Total Topics':8, 'Topics Done':4, 'Color (Hex)':'#eab308','Display Order':4,Active:true},
    {Subject:'History',     'Progress %':70,'Total Topics':10,'Topics Done':7, 'Color (Hex)':'#a855f7','Display Order':5,Active:true},
  ],
  attStats:[
    {Metric:'classes_conducted',Value:'47', Label:'Classes Conducted','Display Order':1},
    {Metric:'classes_attended', Value:'44', Label:'Classes Attended', 'Display Order':2},
    {Metric:'attendance_rate',  Value:'94%',Label:'Attendance Rate',  'Display Order':3},
  ],
  attMonthly:[
    {Month:'January', 'Month Short':'Jan','Attendance %':96, 'Display Order':1},
    {Month:'February','Month Short':'Feb','Attendance %':88, 'Display Order':2},
    {Month:'March',   'Month Short':'Mar','Attendance %':100,'Display Order':3},
    {Month:'April',   'Month Short':'Apr','Attendance %':92, 'Display Order':4},
    {Month:'May',     'Month Short':'May','Attendance %':84, 'Display Order':5},
    {Month:'June',    'Month Short':'Jun','Attendance %':96, 'Display Order':6},
  ],
  assignments:[
    {'Assignment ID':'A001',Subject:'Mathematics',Title:'Worksheet 3 — Fractions',      'Due Date':'Today',   Status:'pending',  Grade:'','Color (Hex)':'#f97316',Active:true},
    {'Assignment ID':'A002',Subject:'English',    Title:'Essay: My Favourite Season',    'Due Date':'Tomorrow',Status:'pending',  Grade:'','Color (Hex)':'#3b82f6',Active:true},
    {'Assignment ID':'A003',Subject:'Science',    Title:'Draw & Label: Human Body',      'Due Date':'Jun 8',   Status:'submitted',Grade:'','Color (Hex)':'#22c55e',Active:true},
    {'Assignment ID':'A004',Subject:'Geography',  Title:'Map Activity: Indian Landforms','Due Date':'Jun 10',  Status:'graded',   Grade:'A','Color (Hex)':'#eab308',Active:true},
    {'Assignment ID':'A005',Subject:'History',    Title:'Timeline: Freedom Movement',    'Due Date':'Jun 12',  Status:'pending',  Grade:'','Color (Hex)':'#a855f7',Active:true},
  ],
  schedule:[
    {'Class ID':'S001',Subject:'Mathematics',Teacher:'Mrs. Anjali Sharma',Date:'Today',   Time:'4:00 PM – 5:30 PM', Mode:'Physical','Color (Hex)':'#f97316',Active:true},
    {'Class ID':'S002',Subject:'Science',    Teacher:'Mrs. Anjali Sharma',Date:'Today',   Time:'5:45 PM – 7:00 PM', Mode:'Online',  'Color (Hex)':'#22c55e',Active:true},
    {'Class ID':'S003',Subject:'English',    Teacher:'Mr. Pradeep Nair',  Date:'Tomorrow',Time:'4:00 PM – 5:30 PM', Mode:'Physical','Color (Hex)':'#3b82f6',Active:true},
    {'Class ID':'S004',Subject:'History',    Teacher:'Mr. Pradeep Nair',  Date:'Jun 7',   Time:'10:00 AM – 11:30 AM',Mode:'Online', 'Color (Hex)':'#a855f7',Active:true},
    {'Class ID':'S005',Subject:'Geography',  Teacher:'Mrs. Anjali Sharma',Date:'Jun 8',   Time:'4:00 PM – 5:00 PM', Mode:'Hybrid', 'Color (Hex)':'#eab308',Active:true},
  ],
  notifications:[
    {ID:'N001',Type:'assignment',Icon:'fa-book',    Title:'New Assignment Posted', Body:'Mathematics Worksheet 4 is now available for download.',             Timestamp:'2 hrs ago', Unread:true, Active:true},
    {ID:'N002',Type:'schedule',  Icon:'fa-calendar',Title:'Schedule Change',       Body:"Friday's Science class moved to 5:00 PM due to teacher availability.",Timestamp:'Yesterday', Unread:true, Active:true},
    {ID:'N003',Type:'result',    Icon:'fa-star',    Title:'Assignment Graded',     Body:'Your Geography Map Activity has been graded — you scored A!',        Timestamp:'2 days ago',Unread:false,Active:true},
    {ID:'N004',Type:'reminder',  Icon:'fa-bell',    Title:'Exam Reminder',         Body:'Unit Test in English this Friday. Please revise Chapters 4–6.',      Timestamp:'3 days ago',Unread:false,Active:true},
    {ID:'N005',Type:'message',   Icon:'fa-comment', Title:'Teacher Message',       Body:"Well done on last week's Science test! Keep it up, Rohan!",          Timestamp:'4 days ago',Unread:false,Active:true},
  ],
  profileFields:[
    {'Field Key':'class_level',  Label:'Class',   Value:'Class 3',         'Read-Only':'No', Visible:true},
    {'Field Key':'enrolled_date',Label:'Enrolled',Value:'January 2026',    'Read-Only':'Yes',Visible:true},
    {'Field Key':'email',        Label:'Email',   Value:'parent@email.com','Read-Only':'No', Visible:true},
    {'Field Key':'phone',        Label:'Phone',   Value:'+91 98765 43210', 'Read-Only':'No', Visible:true},
  ],
  // ── INTERACTIVE LEARNING ──────────────────────────────────────────────────
  // One row per topic. Teachers add a new daily topic by adding a new row here
  // (in the live sheet this is its own "Learning Modules" tab).
  learningModules:[
    {'Module ID':'LM01',Title:'Plant Life Cycle', Subject:'Science',     'Icon (FontAwesome solid)':'fa-seedling', Emoji:'🌱', 'Color (Hex)':'#22c55e', Introduction:"Plants begin as tiny seeds. With water, sunlight, and good soil, a seed grows into a seedling, then a tall mature plant. Mature plants grow flowers that make new seeds — and the whole cycle starts again!", 'Intro Image URL':'', 'Display Order':1, Active:true},
    {'Module ID':'LM02',Title:'Solar System',     Subject:'Science',     'Icon (FontAwesome solid)':'fa-globe',    Emoji:'🪐', 'Color (Hex)':'#22c55e', Introduction:"Our Solar System is the Sun and everything that travels around it — eight planets, their moons, and lots of smaller rocky and icy objects, all held in place by the Sun's gravity.", 'Intro Image URL':'', 'Display Order':2, Active:true},
    {'Module ID':'LM03',Title:'Water Cycle',      Subject:'Science',     'Icon (FontAwesome solid)':'fa-droplet',  Emoji:'💧', 'Color (Hex)':'#22c55e', Introduction:"Water is always on the move! It rises from oceans and rivers as vapor, cools into clouds, falls back down as rain, and flows back to the sea to begin the journey all over again.", 'Intro Image URL':'', 'Display Order':3, Active:true},
    {'Module ID':'LM04',Title:'Human Body',       Subject:'Science',     'Icon (FontAwesome solid)':'fa-person',   Emoji:'🫀', 'Color (Hex)':'#22c55e', Introduction:"Your body is a team of amazing parts working together — bones that hold you up, muscles that help you move, a heart that pumps blood, and lungs that bring in the air you breathe.", 'Intro Image URL':'', 'Display Order':4, Active:true},
    {'Module ID':'LM05',Title:'Fractions',        Subject:'Mathematics', 'Icon (FontAwesome solid)':'fa-divide',   Emoji:'➗', 'Color (Hex)':'#f97316', Introduction:"A fraction shows part of a whole — like one slice of a pizza that's been cut into equal pieces. The bottom number counts all the slices; the top number counts the slices you have.", 'Intro Image URL':'', 'Display Order':5, Active:true},
  ],
  // One row per learning step, linked to a Module ID, in the order they should be taught
  // (in the live sheet this is its own "Learning Steps" tab).
  learningSteps:[
    // Plant Life Cycle
    {'Module ID':'LM01','Step Number':1,Teaching:"Plants start their life as a tiny seed buried in the soil.",'Step Image URL':'',Question:"What is the first stage of a plant's life cycle?",'Option A':'Flower','Option B':'Seed','Option C':'Leaf','Option D':'Fruit','Correct Option':'B',Explanation:"Correct! Every plant begins its life as a seed.",Active:true},
    {'Module ID':'LM01','Step Number':2,Teaching:"A seed needs water and sunlight to sprout into a young seedling.",'Step Image URL':'',Question:"What does a seed need to grow into a seedling?",'Option A':'Water and sunlight','Option B':'Only darkness','Option C':'Only sand','Option D':'Cold air','Correct Option':'A',Explanation:"That's right! Water and sunlight give the seed the energy it needs to sprout.",Active:true},
    {'Module ID':'LM01','Step Number':3,Teaching:"A fully grown plant produces flowers, and those flowers make new seeds.",'Step Image URL':'',Question:"What do mature plants produce to start the cycle again?",'Option A':'Roots','Option B':'Flowers and seeds','Option C':'Bark','Option D':'Thorns','Correct Option':'B',Explanation:"Yes! Flowers make seeds, and those seeds can grow into brand-new plants.",Active:true},
    // Solar System
    {'Module ID':'LM02','Step Number':1,Teaching:"The Sun is a giant, glowing star at the center of our Solar System.",'Step Image URL':'',Question:"What is at the center of the Solar System?",'Option A':'Earth','Option B':'The Moon','Option C':'The Sun','Option D':'Mars','Correct Option':'C',Explanation:"Exactly! The Sun sits at the center, and everything else travels around it.",Active:true},
    {'Module ID':'LM02','Step Number':2,Teaching:"Planets travel around the Sun along a path called an orbit.",'Step Image URL':'',Question:"What do we call the path a planet takes around the Sun?",'Option A':'An orbit','Option B':'A tunnel','Option C':'A bridge','Option D':'A spiral','Correct Option':'A',Explanation:"Right! Every planet follows its own orbit around the Sun.",Active:true},
    {'Module ID':'LM02','Step Number':3,Teaching:"Earth is the third planet from the Sun — just the right distance for liquid water.",'Step Image URL':'',Question:"Which planet is third in line from the Sun?",'Option A':'Venus','Option B':'Earth','Option C':'Jupiter','Option D':'Mercury','Correct Option':'B',Explanation:"Correct! Earth is the third planet — close enough to the Sun to support life.",Active:true},
    // Water Cycle
    {'Module ID':'LM03','Step Number':1,Teaching:"The Sun heats water in oceans and lakes, turning it into invisible vapor — this is evaporation.",'Step Image URL':'',Question:"What happens when the Sun heats water in a lake?",'Option A':'It freezes','Option B':'It evaporates','Option C':'It disappears forever','Option D':'It turns into rock','Correct Option':'B',Explanation:"Yes! Heat from the Sun turns liquid water into vapor — that's evaporation.",Active:true},
    {'Module ID':'LM03','Step Number':2,Teaching:"Water vapor rises and cools high in the sky, clumping together to form clouds — this is condensation.",'Step Image URL':'',Question:"What forms when water vapor cools high in the sky?",'Option A':'Clouds','Option B':'Sand','Option C':'Ice cubes','Option D':'Rainbows','Correct Option':'A',Explanation:"Correct! Cooled water vapor clumps together to form clouds.",Active:true},
    {'Module ID':'LM03','Step Number':3,Teaching:"When clouds get too heavy with water, it falls back to Earth as rain — this is precipitation.",'Step Image URL':'',Question:"What do we call water falling from clouds as rain?",'Option A':'Evaporation','Option B':'Condensation','Option C':'Precipitation','Option D':'Pollution','Correct Option':'C',Explanation:"That's it! Precipitation is water falling back to Earth as rain, snow, or hail.",Active:true},
    // Human Body
    {'Module ID':'LM04','Step Number':1,Teaching:"Your bones form a frame called the skeleton, which supports and protects your body.",'Step Image URL':'',Question:"What do we call the frame of bones that supports your body?",'Option A':'Skeleton','Option B':'Muscle','Option C':'Skin','Option D':'Brain','Correct Option':'A',Explanation:"Right! Your skeleton holds your body up and protects organs like your heart.",Active:true},
    {'Module ID':'LM04','Step Number':2,Teaching:"Your heart pumps blood to every part of your body, carrying oxygen and nutrients.",'Step Image URL':'',Question:"What is the main job of the heart?",'Option A':'To help you think','Option B':'To pump blood','Option C':'To digest food','Option D':'To help you hear','Correct Option':'B',Explanation:"Correct! The heart pumps blood that carries oxygen all over your body.",Active:true},
    {'Module ID':'LM04','Step Number':3,Teaching:"Your lungs take in air so your blood can collect the oxygen inside it.",'Step Image URL':'',Question:"Which body part helps you breathe in air?",'Option A':'Lungs','Option B':'Liver','Option C':'Stomach','Option D':'Ears','Correct Option':'A',Explanation:"Yes! Your lungs bring oxygen from the air you breathe into your blood.",Active:true},
    // Fractions
    {'Module ID':'LM05','Step Number':1,Teaching:"If a pizza is cut into 4 equal slices and you take 1, you have 1 out of 4 — written as 1/4.",'Step Image URL':'',Question:"A pizza has 4 equal slices and you eat 1. What fraction did you eat?",'Option A':'1/2','Option B':'1/4','Option C':'4/1','Option D':'2/4','Correct Option':'B',Explanation:"Correct! 1 slice out of 4 total slices is written as 1/4.",Active:true},
    {'Module ID':'LM05','Step Number':2,Teaching:"The bottom number of a fraction, the denominator, tells us how many equal parts the whole is split into.",'Step Image URL':'',Question:"In the fraction 3/8, what does the 8 tell us?",'Option A':'How many parts we have','Option B':'How many equal parts there are in total','Option C':'The size of one part','Option D':'Nothing important','Correct Option':'B',Explanation:"Right! The denominator (8) shows the total number of equal parts in the whole.",Active:true},
    {'Module ID':'LM05','Step Number':3,Teaching:"The top number of a fraction, the numerator, tells us how many of those equal parts we mean.",'Step Image URL':'',Question:"In the fraction 3/8, what does the 3 represent?",'Option A':'The total number of parts','Option B':'How many parts we have','Option C':'The size of the whole','Option D':'A whole number','Correct Option':'B',Explanation:"Yes! The numerator (3) tells us how many of the 8 equal parts we're talking about.",Active:true},
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE LEARNING — topic grid, intro, step-by-step lesson, completion
// ─────────────────────────────────────────────────────────────────────────────
function ModuleStatusBadge({ progress, total }) {
  if (!progress || !progress.startedAt) {
    return <span className="lm-status notstarted"><i className="fa-solid fa-circle-play" /> Not Started</span>;
  }
  if (progress.completedAt) {
    return <span className="lm-status completed"><i className="fa-solid fa-circle-check" /> Completed · {progress.correct}/{total}</span>;
  }
  return <span className="lm-status inprogress"><i className="fa-solid fa-hourglass-half" /> {progress.completionPct||0}% In Progress</span>;
}

function LearningModulesGrid({ modules, stepsFor, progressMap, onOpen }) {
  if (!modules.length) {
    return <div className="card" style={{textAlign:'center',color:'var(--muted)',fontSize:'13px'}}>No learning topics yet — check back once your teacher adds one!</div>;
  }
  return (
    <div className="lm-grid">
      {modules.map(m => {
        const id = m['Module ID'];
        const total = stepsFor(id).length;
        const progress = progressMap[id];
        return (
          <div key={id} className="lm-card" role="button" tabIndex={0}
            onClick={() => onOpen(id)}
            onKeyDown={e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); onOpen(id); } }}>
            <div className="lm-icon" style={{background:`${m['Color (Hex)']}22`,color:m['Color (Hex)']}}>
              {m.Emoji || <i className={`fa-solid ${m['Icon (FontAwesome solid)']||'fa-book'}`} />}
            </div>
            <div>
              <div className="lm-subj">{m.Subject}</div>
              <div className="lm-title">{m.Title}</div>
              <p className="lm-teaser">{m.Introduction}</p>
            </div>
            <ModuleStatusBadge progress={progress} total={total} />
          </div>
        );
      })}
    </div>
  );
}

function LearningModulePlayer({ module, steps, progress, onSave, onExit }) {
  const total = steps.length;
  const attemptedCount = progress?.answers ? Object.keys(progress.answers).length : 0;
  const isComplete = !!progress?.completedAt;

  const [view,     setView]     = useState('intro'); // intro | lesson | complete
  const [idx,      setIdx]      = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked,   setLocked]   = useState(false);
  const [answers,  setAnswers]  = useState(progress?.answers || {});

  if (!module || !total) {
    return (
      <div className="content">
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> Back to topics</button>
        <div className="card" style={{textAlign:'center',color:'var(--muted)'}}>This topic has no steps yet — check back soon.</div>
      </div>
    );
  }

  const step = steps[idx];

  const begin = fromIdx => {
    setIdx(fromIdx); setSelected(null); setLocked(false);
    if (!progress?.startedAt) onSave({ startedAt:new Date().toISOString(), attempted:0, correct:0, incorrect:0, completionPct:0, answers:{} });
    setView('lesson');
  };

  const retake = () => {
    setAnswers({});
    onSave({ startedAt:new Date().toISOString(), completedAt:null, attempted:0, correct:0, incorrect:0, completionPct:0, answers:{} });
    begin(0);
  };

  const choose = letter => {
    if (locked) return;
    const isCorrect = letter === step['Correct Option'];
    setSelected(letter); setLocked(true);
    const nextAnswers = { ...answers, [step['Step Number']]: {
      selected: letter, isCorrect, question: step.Question, correctOpt: step['Correct Option'], explanation: step.Explanation,
      options: { A:step['Option A'], B:step['Option B'], C:step['Option C'], D:step['Option D'] },
    }};
    setAnswers(nextAnswers);
    const attempted = Object.keys(nextAnswers).length;
    const correct   = Object.values(nextAnswers).filter(a=>a.isCorrect).length;
    onSave({ attempted, correct, incorrect: attempted-correct, completionPct: Math.round((attempted/total)*100), answers: nextAnswers });
  };

  const goNext = () => {
    if (idx + 1 < total) { setIdx(idx+1); setSelected(null); setLocked(false); }
    else { onSave({ completedAt:new Date().toISOString(), completionPct:100 }); setView('complete'); }
  };

  // ── INTRO ──
  if (view === 'intro') {
    return (
      <div className="content">
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> Back to topics</button>
        <div className="card lp-hero">
          <div className="lp-hero-icon" style={{background:`${module['Color (Hex)']}22`,color:module['Color (Hex)']}}>
            {module.Emoji || <i className={`fa-solid ${module['Icon (FontAwesome solid)']||'fa-book'}`} />}
          </div>
          <h2>{module.Title}</h2>
          <p>{module.Introduction}</p>
          <div className="lp-actions">
            {isComplete ? (
              <>
                <button className="btn-t" onClick={retake}><i className="fa-solid fa-rotate-right" /> Retake Topic</button>
                <button className="btn-outline" onClick={() => { setAnswers(progress.answers||{}); setView('complete'); }}><i className="fa-solid fa-list-check" /> Review My Answers</button>
              </>
            ) : attemptedCount > 0 ? (
              <button className="btn-t" onClick={() => begin(attemptedCount)}><i className="fa-solid fa-play" /> Continue · Step {attemptedCount+1} of {total}</button>
            ) : (
              <button className="btn-t" onClick={() => begin(0)}><i className="fa-solid fa-play" /> Start Learning</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──
  if (view === 'complete') {
    const finalAnswers = Object.keys(answers).length ? answers : (progress?.answers || {});
    const correctCount = Object.values(finalAnswers).filter(a=>a.isCorrect).length;
    const pct = total ? Math.round((correctCount/total)*100) : 0;
    const mistakes = Object.values(finalAnswers).filter(a=>!a.isCorrect);
    const encourage = pct>=90 ? `Excellent work! You're a ${module.Subject} star!`
      : pct>=70 ? 'Great job — you really understand this topic!'
      : pct>=50 ? "Nice effort! A bit more practice and you'll have it mastered."
      : "Good try! Let's look at what tripped you up below.";
    return (
      <div className="content">
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> Back to topics</button>
        <div className="card">
          <div className="lp-score-ring"><span className="n">{correctCount}/{total}</span><span className="l">{pct}% Correct</span></div>
          <p className="lp-encourage">{encourage}</p>
          <div className="sec-divider">Concepts You Learned</div>
          {steps.map(s => <div key={s['Step Number']} className="lp-concept-item"><i className="fa-solid fa-circle-check" /> {s.Teaching}</div>)}
          {mistakes.length > 0 ? (
            <>
              <div className="sec-divider">Review Your Mistakes</div>
              {mistakes.map((m,i) => (
                <div key={i} className="lp-mistake">
                  <div className="lp-mistake-q">{m.question}</div>
                  <div className="lp-mistake-row">Your answer: <span style={{color:'#f87171',fontWeight:700}}>{m.options[m.selected]}</span></div>
                  <div className="lp-mistake-row">Correct answer: <span style={{color:'#4ade80',fontWeight:700}}>{m.options[m.correctOpt]}</span></div>
                  <div className="lp-mistake-row">{m.explanation}</div>
                </div>
              ))}
            </>
          ) : <div className="sec-divider">Perfect Score — No Mistakes!</div>}
          <div className="lp-actions">
            <button className="btn-t" onClick={retake}><i className="fa-solid fa-rotate-right" /> Retake Topic</button>
            <button className="btn-outline" onClick={onExit}><i className="fa-solid fa-arrow-left" /> Back to All Topics</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LESSON (teach a fact, then ask about it) ──
  const opts = ['A','B','C','D'];
  return (
    <div className="content">
      <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> Back to topics</button>
      <div className="card">
        <div className="lp-step-lbl">Step {idx+1} of {total} · {module.Title}</div>
        <div className="lp-bar-outer"><div className="lp-bar-fill" style={{width:`${((locked?idx+1:idx)/total)*100}%`}} /></div>
        <div className="lp-teach"><i className="fa-solid fa-lightbulb" /><p>{step.Teaching}</p></div>
        <div className="lp-q">{step.Question}</div>
        <div className="lp-opts">
          {opts.map(letter => {
            const text = step[`Option ${letter}`];
            if (!text) return null;
            let cls = 'lp-opt';
            if (locked && letter === step['Correct Option']) cls += ' correct';
            else if (locked && letter === selected) cls += ' incorrect';
            return (
              <button key={letter} className={cls} disabled={locked} onClick={() => choose(letter)}>
                <span className="lp-letter">{letter}</span>{text}
              </button>
            );
          })}
        </div>
        {locked && (
          <div className={`lp-feedback ${selected===step['Correct Option']?'good':'bad'}`}>
            <i className={`fa-solid ${selected===step['Correct Option']?'fa-circle-check':'fa-circle-info'}`} />
            <p><strong>{selected===step['Correct Option']?'Correct! ':'Not quite. '}</strong>{step.Explanation}</p>
          </div>
        )}
        <div style={{textAlign:'right'}}>
          <button className="btn-t" onClick={goNext} disabled={!locked} style={!locked?{opacity:.4,cursor:'not-allowed'}:{}}>
            {idx+1 < total ? <>Next Question <i className="fa-solid fa-arrow-right" /></> : <>Finish Topic <i className="fa-solid fa-flag-checkered" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Portal() {
  const [cfg,         setCfg]         = useState(FALLBACK);
  const [cfgReady,    setCfgReady]    = useState(false);
  const [authed,      setAuthed]      = useState(false);
  const [tab,         setTab]         = useState('dashboard');
  const [profile,     setProfile]     = useState({ name:'', id:'', classLevel:'Class 3' });
  const [loginErr,    setLoginErr]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [uploadName,  setUploadName]  = useState('');
  const [uploadDone,  setUploadDone]  = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);
  const [notifs,      setNotifs]      = useState(FALLBACK.notifications);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [learnProgress,  setLearnProgress]  = useState({});

  const subjectRef = useRef(null);
  const attendRef  = useRef(null);
  const ratioRef   = useRef(null);

  // ── Fetch from Google Sheets on mount ────────────────────────────────────────
  useEffect(() => {
    fetchAllSheetData()
      .then(data => {
        // Validate that the response has the expected shape before applying it
        if (!data || typeof data !== 'object' || !data.settings) {
          console.warn('[portal] Unexpected data shape from portal-config, using fallback');
          setCfgReady(true);
          return;
        }
        // Merge with FALLBACK so any missing keys are still populated
        const merged = {
          settings:      { ...FALLBACK.settings,      ...(data.settings      || {}) },
          navigation:    data.navigation?.length      ? data.navigation      : FALLBACK.navigation,
          dashStats:     data.dashStats?.length       ? data.dashStats       : FALLBACK.dashStats,
          subjects:      data.subjects?.length        ? data.subjects        : FALLBACK.subjects,
          attStats:      data.attStats?.length        ? data.attStats        : FALLBACK.attStats,
          attMonthly:    data.attMonthly?.length      ? data.attMonthly      : FALLBACK.attMonthly,
          assignments:   data.assignments?.length     ? data.assignments     : FALLBACK.assignments,
          schedule:      data.schedule?.length        ? data.schedule        : FALLBACK.schedule,
          notifications: data.notifications?.length   ? data.notifications   : FALLBACK.notifications,
          profileFields: data.profileFields?.length   ? data.profileFields   : FALLBACK.profileFields,
          learningModules: data.learningModules?.length ? data.learningModules : FALLBACK.learningModules,
          learningSteps:   data.learningSteps?.length   ? data.learningSteps   : FALLBACK.learningSteps,
        };
        setCfg(merged);
        setNotifs(merged.notifications);
        const cl = merged.profileFields.find(f => f['Field Key'] === 'class_level');
        setProfile(p => ({ ...p, classLevel: cl?.Value || merged.settings.DefaultClassLevel || 'Class 3' }));
        setCfgReady(true);
      })
      .catch(err => {
        console.warn('[portal] Sheet fetch failed, using fallback:', err.message);
        setCfgReady(true); // still show portal with fallback data
      });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const S          = cfg.settings;
  const NAV        = cfg.navigation;
  const statCards  = cfg.dashStats.filter(s => s['Metric Key'] && ['attendance_pct','submissions_pct','avg_score','pending_tasks'].includes(s['Metric Key']));
  const ratioStats = cfg.dashStats.filter(s => s['Metric Key'] && s['Metric Key'].startsWith('ratio_'));
  const SUBJ       = cfg.subjects;
  const AMON       = cfg.attMonthly;
  const ASTAT      = cfg.attStats;
  const ASGN       = cfg.assignments;
  const SCHED      = cfg.schedule;
  const PFIELDS    = cfg.profileFields;
  const isRowActive = v => !(v===false || v==='FALSE' || v==='false' || v===0 || v==='0');
  const LMOD    = (cfg.learningModules||[]).filter(m=>isRowActive(m.Active)).sort((a,b)=>(Number(a['Display Order'])||0)-(Number(b['Display Order'])||0));
  const ALLLSTEPS = (cfg.learningSteps||[]).filter(s=>isRowActive(s.Active));
  const stepsFor = moduleId => ALLLSTEPS.filter(s=>s['Module ID']===moduleId).sort((a,b)=>(Number(a['Step Number'])||0)-(Number(b['Step Number'])||0));
  const nextN      = parseInt(S.DashboardNextClasses, 10) || 3;
  const unreadCount = notifs.filter(n => n.Unread).length;
  const attColor   = p => p >= 95 ? (S.AttHighColor||'#4ade80') : p >= 85 ? (S.AttMidColor||'#00c6a7') : (S.AttLowColor||'#f5a623');
  const greeting   = (S.WelcomeGreeting || 'Good day, {firstName}! 👋').replace('{firstName}', profile.name.split(' ')[0] || '');
  const uploadMsg  = (S.UploadSuccessTemplate || '"{filename}" submitted successfully!').replace('{filename}', uploadName);

  // ── Charts ────────────────────────────────────────────────────────────────────
  const destroyCharts = useCallback(() => {
    [subjectRef, attendRef, ratioRef].forEach(r => { if (r.current) { r.current.destroy(); r.current = null; } });
  }, []);

  const initCharts = useCallback(() => {
    destroyCharts();
    if (!window.Chart || !cfgReady) return;
    const sEl = document.getElementById('subjectChart');
    const aEl = document.getElementById('attendChart');
    const rEl = document.getElementById('ratioChart');

    if (sEl && SUBJ.length) subjectRef.current = new window.Chart(sEl, {
      type: 'bar',
      data: { labels: SUBJ.map(s => s.Subject), datasets: [{ label:'Progress %', data: SUBJ.map(s => s['Progress %']), backgroundColor: SUBJ.map(s => s['Color (Hex)']), borderRadius: 8, borderWidth: 0 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,max:100,grid:{color:'rgba(255,255,255,.06)'},ticks:{color:'#94a3b8',font:{size:11}}}, x:{grid:{display:false},ticks:{color:'#94a3b8',font:{size:11}}} } },
    });

    if (aEl && AMON.length) attendRef.current = new window.Chart(aEl, {
      type: 'line',
      data: { labels: AMON.map(m => m['Month Short']), datasets: [{ label:'Attendance %', data: AMON.map(m => m['Attendance %']), borderColor:'#00c6a7', backgroundColor:'rgba(0,198,167,.1)', tension:.4, fill:true, pointBackgroundColor:'#00c6a7', pointRadius:5 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:false,min:70,max:105,grid:{color:'rgba(255,255,255,.06)'},ticks:{color:'#94a3b8',font:{size:11}}}, x:{grid:{display:false},ticks:{color:'#94a3b8',font:{size:11}}} } },
    });

    if (rEl && ratioStats.length) ratioRef.current = new window.Chart(rEl, {
      type: 'doughnut',
      data: { labels: ratioStats.map(r => r.Label.replace(' (Ratio Chart)','')), datasets: [{ data: ratioStats.map(r => Number(r.Value)||0), backgroundColor:['rgba(0,198,167,.85)','rgba(168,85,247,.85)','rgba(245,166,35,.85)'], borderWidth:0, hoverOffset:6 }] },
      options: { responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{size:12}, boxWidth:12, padding:14 } } } },
    });
  }, [cfgReady, SUBJ, AMON, ratioStats, destroyCharts]);

  useEffect(() => {
    if (!authed || !cfgReady || !(tab==='dashboard'||tab==='progress'||tab==='attendance')) return;
    // Poll until Chart.js is loaded (handles race with afterInteractive script)
    let attempts = 0;
    const tryInit = () => {
      if (window.Chart) { initCharts(); return; }
      if (++attempts < 20) setTimeout(tryInit, 150);
    };
    const t = setTimeout(tryInit, 100);
    return () => clearTimeout(t);
  }, [authed, tab, cfgReady, initCharts]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setLoginErr(''); setLoading(true);
    const u = e.target.username.value.trim(), p = e.target.password.value.trim();
    try {
      const res  = await fetch(S.AuthAPIEndpoint||'/api/student/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p}) });
      const data = await res.json();
      if (res.ok && data.authenticated) { setProfile(prev => ({...prev, name:data.username, id:data.studentId})); setAuthed(true); }
      else setLoginErr(data.message || 'Invalid credentials.');
    } catch { setLoginErr(S.ConnectionErrorMsg || 'Connection failed.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    destroyCharts(); setAuthed(false); setTab('dashboard');
    setProfile({ name:'', id:'', classLevel: S.DefaultClassLevel||'Class 3' });
    setLoginErr('');
  };

  // ── Interactive Learning: per-student progress ───────────────────────────────
  // Persisted to localStorage (so it survives a refresh) and best-effort synced
  // to a backend if one exists — see the note above the Assignments tab JSX for
  // what to build server-side to make this durable across devices.
  useEffect(() => {
    if (!profile.id) { setLearnProgress({}); return; }
    try {
      const raw = localStorage.getItem(`learnProgress:${profile.id}`);
      setLearnProgress(raw ? JSON.parse(raw) : {});
    } catch { setLearnProgress({}); }
  }, [profile.id]);

  const saveLearnProgress = useCallback((moduleId, patch) => {
    setLearnProgress(prev => {
      const merged = { ...(prev[moduleId]||{}), ...patch };
      const next = { ...prev, [moduleId]: merged };
      try { localStorage.setItem(`learnProgress:${profile.id}`, JSON.stringify(next)); } catch {}
      fetch('/api/student/progress', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ studentId: profile.id, moduleId, ...merged }),
      }).catch(() => {}); // no backend yet? fine — localStorage already has it.
      return next;
    });
  }, [profile.id]);

  // Leaving the Assignments tab always returns to the topic list next time it's opened.
  useEffect(() => { if (tab !== 'assignments') setActiveModuleId(null); }, [tab]);

  const notifStyle = type => ({
    bg: type==='assignment'?'rgba(59,130,246,.15)':type==='result'?'rgba(34,197,94,.15)':type==='reminder'?'rgba(245,166,35,.15)':type==='schedule'?'rgba(239,68,68,.15)':'rgba(168,85,247,.15)',
    cl: type==='assignment'?'#60a5fa':type==='result'?'#4ade80':type==='reminder'?'#f5a623':type==='schedule'?'#f87171':'#c084fc',
  });

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  const SK = ({ w='100%', h='18px', r='6px', mb='0' }) => (
    <div style={{width:w,height:h,borderRadius:r,marginBottom:mb,background:'rgba(255,255,255,.06)',animation:'skpulse 1.4s ease-in-out infinite'}} />
  );

  // ── CSS ───────────────────────────────────────────────────────────────────────
  const CSS = `
    @keyframes skpulse{0%,100%{opacity:1}50%{opacity:.35}}
    *{box-sizing:border-box;margin:0;padding:0;}
    :root{--navy:#0a0f2c;--navy-mid:#121a3e;--surf:#161d3f;--surf2:#1e2850;--teal:#00c6a7;--accent:#f5a623;--text:#e2e8f0;--muted:#64748b;--border:rgba(255,255,255,.08);--r:14px;--fd:'Playfair Display',Georgia,serif;--fb:'DM Sans',system-ui,sans-serif;}
    html,body{height:100%;font-family:var(--fb);background:var(--navy);color:var(--text);-webkit-font-smoothing:antialiased;}
    .lw{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--navy);position:relative;overflow:hidden;}
    .lbg{position:absolute;inset:0;background:radial-gradient(ellipse 55% 55% at 70% 30%,rgba(0,198,167,.12) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 20% 70%,rgba(245,166,35,.08) 0%,transparent 60%);}
    .lb{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:24px;padding:48px 40px;width:100%;max-width:420px;position:relative;backdrop-filter:blur(12px);}
    .li{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--teal),#0099cc);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;margin:0 auto 20px;}
    .lh{font-family:var(--fd);font-size:26px;font-weight:900;text-align:center;color:#fff;margin-bottom:6px;}
    .ls{font-size:13px;color:var(--muted);text-align:center;margin-bottom:32px;}
    .field{margin-bottom:16px;}
    .fl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);margin-bottom:6px;display:block;}
    .fw{position:relative;}
    .fi{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:13px;}
    .inp{width:100%;padding:12px 14px 12px 38px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:14px;font-family:var(--fb);outline:none;transition:all .2s;}
    .inp::placeholder{color:rgba(255,255,255,.25);}
    .inp:focus{border-color:var(--teal);background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(0,198,167,.15);}
    .lbtn{width:100%;padding:14px;background:linear-gradient(135deg,var(--teal),#0099cc);border:none;border-radius:11px;color:#fff;font-family:var(--fb);font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;}
    .lbtn:hover{opacity:.9;transform:translateY(-1px);}
    .lbtn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
    .lerr{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#f87171;border-radius:10px;padding:12px;font-size:13px;font-weight:600;text-align:center;margin-top:14px;}
    .bk{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:24px;font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s;}
    .bk:hover{color:var(--teal);}
    .dash{display:flex;height:100vh;overflow:hidden;}
    .sb{width:240px;background:var(--navy-mid);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
    .sb-head{padding:18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;}
    .sb-av{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--teal),#0099cc);display:flex;align-items:center;justify-content:center;font-size:17px;color:#fff;flex-shrink:0;}
    .sb-name{font-size:14px;font-weight:700;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .sb-id{font-size:11px;color:var(--muted);}
    .sb-sec{padding:14px 12px 4px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.22);}
    .sb-nav{padding:0 10px 10px;}
    .nb{width:100%;display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;border:none;background:transparent;color:rgba(255,255,255,.48);font-family:var(--fb);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;text-align:left;margin-bottom:2px;position:relative;}
    .nb:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85);}
    .nb.active{background:rgba(0,198,167,.12);color:var(--teal);border:1px solid rgba(0,198,167,.2);}
    .nb i{width:16px;text-align:center;font-size:13px;}
    .nb-badge{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:#ef4444;color:#fff;font-size:9px;font-weight:800;min-width:18px;height:18px;border-radius:100px;display:flex;align-items:center;justify-content:center;padding:0 4px;}
    .sb-ft{padding:10px;border-top:1px solid var(--border);}
    .lo-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:transparent;color:rgba(255,255,255,.4);font-family:var(--fb);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;transition:all .2s;}
    .lo-btn:hover{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#f87171;}
    .main{flex:1;overflow-y:auto;background:var(--navy);}
    .main-top{padding:28px 32px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .pg-h{font-family:var(--fd);font-size:24px;font-weight:900;color:#fff;}
    .pg-s{font-size:13px;color:var(--muted);margin-top:3px;}
    .content{padding:28px 32px;}
    .card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:22px;}
    .card-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:18px;display:flex;align-items:center;gap:7px;}
    .sr{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
    .sc{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:18px;}
    .sc-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:7px;}
    .sc-v{font-family:var(--fd);font-size:26px;font-weight:900;color:#fff;line-height:1;}
    .sc-s{font-size:11px;color:var(--muted);margin-top:5px;}
    .cr{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:22px;}
    .cv{height:200px;}
    .sp-item{margin-bottom:16px;}
    .sp-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;}
    .sp-name{font-size:14px;font-weight:600;color:#fff;}
    .sp-meta{font-size:12px;color:var(--muted);}
    .sp-bar{height:8px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;}
    .sp-fill{height:100%;border-radius:100px;transition:width .8s ease;}
    .att-g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;}
    .att-c{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:18px;text-align:center;}
    .att-n{font-family:var(--fd);font-size:28px;font-weight:900;line-height:1;margin-bottom:5px;}
    .att-l{font-size:12px;color:var(--muted);}
    .month-g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:20px;}
    .m-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
    .m-bar-outer{width:100%;height:60px;background:rgba(255,255,255,.05);border-radius:6px;overflow:hidden;display:flex;align-items:flex-end;}
    .m-bar{width:100%;border-radius:6px;transition:height .6s ease;}
    .m-lbl{font-size:10px;color:var(--muted);font-weight:600;}
    .m-pct{font-size:10px;color:var(--teal);font-weight:700;}
    .asgn-item{background:var(--surf2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:12px;display:flex;align-items:center;gap:14px;}
    .asgn-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
    .asgn-body{flex:1;}
    .asgn-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;}
    .asgn-meta{font-size:12px;color:var(--muted);}
    .asgn-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:100px;white-space:nowrap;}
    .asgn-badge.pending{background:rgba(245,166,35,.12);color:var(--accent);border:1px solid rgba(245,166,35,.25);}
    .asgn-badge.submitted{background:rgba(0,198,167,.1);color:var(--teal);border:1px solid rgba(0,198,167,.2);}
    .asgn-badge.graded{background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.2);}
    .upload-zone{border:2px dashed rgba(255,255,255,.12);border-radius:var(--r);padding:36px;text-align:center;transition:all .2s;cursor:pointer;display:block;}
    .upload-zone:hover{border-color:var(--teal);background:rgba(0,198,167,.04);}
    .sch-item{background:var(--surf2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:12px;display:flex;align-items:center;gap:16px;}
    .sch-color{width:4px;height:52px;border-radius:4px;flex-shrink:0;}
    .sch-body{flex:1;}
    .sch-subj{font-size:15px;font-weight:700;color:#fff;margin-bottom:2px;}
    .sch-meta{font-size:12px;color:var(--muted);}
    .sch-right{text-align:right;}
    .sch-time{font-size:13px;font-weight:700;color:#fff;margin-bottom:3px;}
    .sch-date{font-size:11px;color:var(--muted);}
    .notif-item{background:var(--surf2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:flex-start;gap:14px;position:relative;}
    .notif-item.unread{border-color:rgba(0,198,167,.25);}
    .notif-ic{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
    .notif-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;}
    .notif-body{font-size:13px;color:var(--muted);line-height:1.6;}
    .notif-time{font-size:11px;color:rgba(255,255,255,.3);margin-top:6px;}
    .unread-dot{position:absolute;top:14px;right:14px;width:8px;height:8px;background:var(--teal);border-radius:50%;}
    .prof-g{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .prof-field{display:flex;flex-direction:column;gap:6px;}
    .prof-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);}
    .prof-val{font-size:14px;color:#fff;font-weight:500;}
    .prof-inp{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:10px 13px;color:#fff;font-size:14px;font-family:var(--fb);outline:none;width:100%;transition:all .2s;}
    .prof-inp:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,198,167,.15);}
    .btn-t{background:linear-gradient(135deg,var(--teal),#0099cc);border:none;border-radius:10px;padding:11px 22px;color:#fff;font-family:var(--fb);font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:7px;}
    .btn-t:hover{opacity:.9;transform:translateY(-1px);}
    .btn-outline{background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 22px;color:rgba(255,255,255,.7);font-family:var(--fb);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:7px;}
    .btn-outline:hover{border-color:var(--teal);color:var(--teal);}
    .wbanner{background:linear-gradient(135deg,rgba(0,198,167,.15),rgba(0,153,204,.1));border:1px solid rgba(0,198,167,.2);border-radius:var(--r);padding:22px 26px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    .wbanner h2{font-family:var(--fd);font-size:20px;font-weight:900;color:#fff;margin-bottom:4px;}
    .wbanner p{font-size:13px;color:rgba(255,255,255,.6);}
    .av-big{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--teal),#0099cc);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;flex-shrink:0;}
    @media(max-width:900px){.sr{grid-template-columns:repeat(2,1fr);}.cr{grid-template-columns:1fr;}.att-g{grid-template-columns:1fr 1fr;}.prof-g{grid-template-columns:1fr;}}
    @media(max-width:640px){.sb{width:0;overflow:hidden;}.main-top{padding:16px;}.content{padding:16px;}.sr{grid-template-columns:1fr 1fr;}}
    /* ── Interactive Learning ─────────────────────────────────────────── */
    .sec-divider{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:30px 0 16px;}
    .sec-divider::after{content:'';flex:1;height:1px;background:var(--border);}
    .lm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-bottom:8px;}
    .lm-card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:20px;cursor:pointer;transition:all .2s;text-align:left;display:flex;flex-direction:column;gap:12px;}
    .lm-card:hover{border-color:rgba(0,198,167,.35);box-shadow:0 14px 30px rgba(0,0,0,.32);transform:translateY(-2px);}
    .lm-card:focus-visible{outline:2px solid var(--teal);outline-offset:2px;}
    .lm-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;}
    .lm-subj{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);}
    .lm-title{font-family:var(--fd);font-size:17px;font-weight:900;color:#fff;margin:2px 0 2px;}
    .lm-teaser{font-size:12px;color:rgba(255,255,255,.5);line-height:1.55;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .lm-status{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:5px;width:fit-content;}
    .lm-status.notstarted{background:rgba(255,255,255,.06);color:rgba(255,255,255,.45);border:1px solid var(--border);}
    .lm-status.inprogress{background:rgba(245,166,35,.12);color:var(--accent);border:1px solid rgba(245,166,35,.25);}
    .lm-status.completed{background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.2);}
    .lp-back{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--muted);background:none;border:none;cursor:pointer;margin-bottom:18px;transition:color .2s;padding:0;}
    .lp-back:hover{color:var(--teal);}
    .lp-hero{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:36px 28px;}
    .lp-hero-icon{width:88px;height:88px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:44px;}
    .lp-hero h2{font-family:var(--fd);font-size:24px;font-weight:900;color:#fff;}
    .lp-hero p{font-size:14px;color:rgba(255,255,255,.65);line-height:1.7;max-width:480px;}
    .lp-step-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px;}
    .lp-bar-outer{width:100%;height:8px;background:rgba(255,255,255,.07);border-radius:100px;overflow:hidden;margin-bottom:20px;}
    .lp-bar-fill{height:100%;border-radius:100px;background:var(--teal);transition:width .4s ease;}
    .lp-teach{background:rgba(0,198,167,.07);border:1px solid rgba(0,198,167,.18);border-radius:12px;padding:16px 18px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;}
    .lp-teach i{color:var(--teal);font-size:16px;margin-top:2px;}
    .lp-teach p{font-size:14px;color:#fff;line-height:1.65;}
    .lp-q{font-family:var(--fd);font-size:17px;font-weight:800;color:#fff;margin-bottom:16px;line-height:1.5;}
    .lp-opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;}
    .lp-opt{background:var(--surf2);border:1.5px solid var(--border);border-radius:11px;padding:13px 16px;text-align:left;font-family:var(--fb);font-size:13.5px;font-weight:600;color:rgba(255,255,255,.85);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:10px;}
    .lp-opt:hover:not(:disabled){border-color:rgba(0,198,167,.4);background:rgba(255,255,255,.04);}
    .lp-opt:disabled{cursor:default;}
    .lp-opt .lp-letter{width:22px;height:22px;border-radius:7px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
    .lp-opt.correct{border-color:rgba(34,197,94,.5);background:rgba(34,197,94,.1);color:#4ade80;}
    .lp-opt.correct .lp-letter{background:#22c55e;color:#fff;}
    .lp-opt.incorrect{border-color:rgba(239,68,68,.5);background:rgba(239,68,68,.1);color:#f87171;}
    .lp-opt.incorrect .lp-letter{background:#ef4444;color:#fff;}
    .lp-feedback{border-radius:12px;padding:16px 18px;margin-bottom:18px;display:flex;gap:12px;align-items:flex-start;}
    .lp-feedback.good{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);}
    .lp-feedback.bad{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);}
    .lp-feedback i{font-size:18px;margin-top:1px;}
    .lp-feedback.good i{color:#4ade80;}
    .lp-feedback.bad i{color:#f87171;}
    .lp-feedback p{font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.85);}
    .lp-feedback strong{color:#fff;}
    .lp-score-ring{width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;margin:0 auto 18px;border:6px solid rgba(0,198,167,.18);}
    .lp-score-ring .n{font-family:var(--fd);font-size:30px;font-weight:900;color:#fff;line-height:1;}
    .lp-score-ring .l{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;}
    .lp-encourage{text-align:center;font-size:15px;font-weight:700;color:#fff;}
    .lp-concept-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;color:rgba(255,255,255,.75);line-height:1.6;}
    .lp-concept-item:last-child{border-bottom:none;}
    .lp-concept-item i{color:var(--teal);margin-top:2px;flex-shrink:0;}
    .lp-mistake{background:var(--surf2);border:1px solid var(--border);border-radius:11px;padding:14px 16px;margin-bottom:10px;}
    .lp-mistake-q{font-size:13.5px;font-weight:700;color:#fff;margin-bottom:6px;}
    .lp-mistake-row{font-size:12.5px;color:rgba(255,255,255,.6);margin-bottom:3px;}
    .lp-actions{display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap;}
    @media(max-width:640px){.lm-grid{grid-template-columns:1fr;}.lp-opts{grid-template-columns:1fr;}.lp-hero{padding:28px 18px;}}
  `;

  const mergedProfile = [
    { label:'Full Name',  val:profile.name,  readonly:true },
    { label:'Student ID', val:profile.id,    readonly:true },
    ...PFIELDS.map(f => ({ label:f.Label, val:f.Value, readonly: f['Read-Only']==='Yes'||f['Read-Only']===true })),
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{`${S.SiteName} | ${S.AcademyName}`}</title>
        <style>{CSS}</style>
      </Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />

      {!authed ? (
        <div className="lw">
          <div className="lbg" />
          <div className="lb">
            <div className="li"><i className="fa-solid fa-shield-halved" /></div>
            <h1 className="lh">{S.LoginHeading}</h1>
            <p className="ls">{S.LoginSubheading}</p>
            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="fl">Username or Student ID</label>
                <div className="fw"><i className="fa-solid fa-user fi" /><input name="username" required className="inp" placeholder="e.g. rohan.sharma or APX262834" /></div>
              </div>
              <div className="field">
                <label className="fl">Password</label>
                <div className="fw"><i className="fa-solid fa-lock fi" /><input name="password" type="password" required className="inp" placeholder="••••••••" /></div>
              </div>
              <button type="submit" className="lbtn" disabled={loading}>
                {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> {S.LoadingButtonText}</> : S.LoginButtonLabel}
              </button>
              {loginErr && <div className="lerr">⚠ {loginErr}</div>}
            </form>
            <Link href={S.BackLinkURL||'/'} className="bk"><i className="fa-solid fa-arrow-left" /> {S.BackLinkLabel}</Link>
          </div>
        </div>
      ) : (
        <div className="dash">

          {/* SIDEBAR */}
          <aside className="sb">
            <div className="sb-head">
              <div className="sb-av"><i className="fa-solid fa-user-graduate" /></div>
              <div><div className="sb-name">{profile.name}</div><div className="sb-id">{profile.id}</div></div>
            </div>
            <p className="sb-sec">{S.SidebarSectionLabel}</p>
            <nav className="sb-nav">
              {NAV.map(t => (
                <button key={t.ID} className={`nb${tab===t.ID?' active':''}`} onClick={() => setTab(t.ID)}>
                  <i className={`fa-solid ${t['Icon (FontAwesome solid)']}`} /> {t.Label}
                  {t.ID==='notifications' && unreadCount>0 && <span className="nb-badge">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <div className="sb-ft">
              <button className="lo-btn" onClick={handleLogout}><i className="fa-solid fa-power-off" /> {S.SignOutLabel}</button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="main">

            {/* DASHBOARD */}
            {tab==='dashboard' && (<>
              <div className="main-top"><div><div className="pg-h">Dashboard</div><div className="pg-s">{S.DashboardSubtitle}</div></div></div>
              <div className="content">
                <div className="wbanner">
                  <div><h2>{greeting}</h2><p>{profile.classLevel} · Student ID: {profile.id} · Enrollment: {S.EnrolmentStatus}</p></div>
                  <div className="av-big"><i className="fa-solid fa-user-graduate" /></div>
                </div>
                <div className="sr">
                  {!cfgReady ? [1,2,3,4].map(i=><div key={i} className="sc"><SK h="60px" /></div>)
                  : statCards.map((s,i) => (
                    <div key={i} className="sc">
                      <div className="sc-l">{s.Label}</div>
                      <div className="sc-v" style={s['Metric Key']==='pending_tasks'?{color:'#f97316'}:{}}>{s.Value}</div>
                      <div className="sc-s">{s['Sub-label']}</div>
                    </div>
                  ))}
                </div>
                <div className="cr">
                  <div className="card"><div className="card-t"><i className="fa-solid fa-chart-bar" /> Subject Progress</div><div className="cv"><canvas id="subjectChart" /></div></div>
                  <div className="card"><div className="card-t"><i className="fa-solid fa-circle-half-stroke" /> Performance Ratios</div><div className="cv"><canvas id="ratioChart" /></div></div>
                </div>
                <div className="card">
                  <div className="card-t"><i className="fa-solid fa-clock" /> Next {nextN} Classes</div>
                  {SCHED.slice(0,nextN).map((u,i)=>(
                    <div key={i} className="sch-item">
                      <div className="sch-color" style={{background:u['Color (Hex)']}} />
                      <div className="sch-body"><div className="sch-subj">{u.Subject}</div><div className="sch-meta">{u.Teacher} · {u.Mode}</div></div>
                      <div className="sch-right"><div className="sch-time">{u.Time}</div><div className="sch-date">{u.Date}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* ACADEMIC PROGRESS */}
            {tab==='progress' && (<>
              <div className="main-top"><div><div className="pg-h">Academic Progress</div><div className="pg-s">Subject-wise completion and performance metrics.</div></div></div>
              <div className="content">
                <div className="cr" style={{marginBottom:'22px'}}>
                  <div className="card"><div className="card-t"><i className="fa-solid fa-chart-bar" /> Completion by Subject</div><div className="cv"><canvas id="subjectChart" /></div></div>
                  <div className="card"><div className="card-t"><i className="fa-solid fa-circle-half-stroke" /> Overall Ratios</div><div className="cv"><canvas id="ratioChart" /></div></div>
                </div>
                <div className="card">
                  <div className="card-t"><i className="fa-solid fa-list-check" /> Detailed Progress</div>
                  {SUBJ.map(s=>(
                    <div key={s.Subject} className="sp-item">
                      <div className="sp-hd">
                        <span className="sp-name">{s.Subject}</span>
                        <span className="sp-meta">{s['Topics Done']} / {s['Total Topics']} topics · <span style={{color:s['Color (Hex)'],fontWeight:700}}>{s['Progress %']}%</span></span>
                      </div>
                      <div className="sp-bar"><div className="sp-fill" style={{width:`${s['Progress %']}%`,background:s['Color (Hex)']}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* ATTENDANCE */}
            {tab==='attendance' && (<>
              <div className="main-top"><div><div className="pg-h">Attendance</div><div className="pg-s">Track your class attendance and monthly trends.</div></div></div>
              <div className="content">
                <div className="att-g">
                  {ASTAT.map((a,i)=>{
                    const colors=['var(--teal)','#4ade80','var(--accent)'];
                    return <div key={i} className="att-c"><div className="att-n" style={{color:colors[i]}}>{a.Value}</div><div className="att-l">{a.Label}</div></div>;
                  })}
                </div>
                <div className="card" style={{marginBottom:'22px'}}>
                  <div className="card-t"><i className="fa-solid fa-chart-line" /> Monthly Attendance Trend</div>
                  <div className="cv"><canvas id="attendChart" /></div>
                </div>
                <div className="card">
                  <div className="card-t"><i className="fa-solid fa-calendar" /> Month-by-Month Breakdown</div>
                  <div className="month-g">
                    {AMON.map(m=>(
                      <div key={m['Month Short']} className="m-bar-wrap">
                        <div className="m-bar-outer">
                          <div className="m-bar" style={{height:`${m['Attendance %']-65}%`,background:attColor(m['Attendance %'])}} />
                        </div>
                        <div className="m-lbl">{m['Month Short']}</div>
                        <div className="m-pct">{m['Attendance %']}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}

            {/* ASSIGNMENTS */}
            {/* NOTE: server-side, extend GET /api/portal-config to also return
                `learningModules` and `learningSteps` arrays (see FALLBACK above
                for the exact shape) so teachers can author topics from the
                Sheet. Until then this gracefully runs on the FALLBACK content.
                A POST /api/student/progress endpoint doesn't exist yet either —
                progress below is fully functional via localStorage per student,
                but won't sync across devices until that route is built. */}
            {tab==='assignments' && (<>
              {!activeModuleId && (
                <div className="main-top"><div><div className="pg-h">Learning &amp; Assignments</div><div className="pg-s">Learn each topic step-by-step, then view, download, and submit your homework.</div></div></div>
              )}
              {!activeModuleId ? (
                <div className="content">
                  <div className="sec-divider" style={{marginTop:0}}>Interactive Learning Topics</div>
                  <LearningModulesGrid modules={LMOD} stepsFor={stepsFor} progressMap={learnProgress} onOpen={setActiveModuleId} />

                  <div className="sec-divider">Homework &amp; Submissions</div>
                  <div className="card" style={{marginBottom:'22px'}}>
                    <div className="card-t"><i className="fa-solid fa-list" /> All Assignments</div>
                    {ASGN.map(a=>(
                      <div key={a['Assignment ID']} className="asgn-item">
                        <div className="asgn-dot" style={{background:a['Color (Hex)']}} />
                        <div className="asgn-body">
                          <div className="asgn-title">{a.Title}</div>
                          <div className="asgn-meta">{a.Subject} · Due: {a['Due Date']}{a.Grade?` · Grade: ${a.Grade}`:''}</div>
                        </div>
                        <span className={`asgn-badge ${a.Status}`}>{a.Status==='graded'?`✓ ${a.Grade||'Graded'}`:a.Status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="card-t"><i className="fa-solid fa-cloud-arrow-up" /> Submit Homework</div>
                    <label className="upload-zone" htmlFor="hwFile">
                      <div style={{fontSize:'30px',color:'var(--muted)',marginBottom:'10px'}}><i className="fa-solid fa-cloud-arrow-up" /></div>
                      <p style={{fontSize:'14px',color:'rgba(255,255,255,.6)',marginBottom:'6px'}}>{S.UploadZonePrimary}</p>
                      <p style={{fontSize:'12px',color:'var(--muted)'}}>{S.UploadZoneSub}</p>
                    </label>
                    <input id="hwFile" type="file" style={{display:'none'}} onChange={e=>{setUploadName(e.target.files[0]?.name||'');setUploadDone(false);}} />
                    {uploadName && <p style={{fontSize:'13px',color:'var(--teal)',marginTop:'12px',fontWeight:600}}><i className="fa-solid fa-paperclip" /> {uploadName}</p>}
                    <div style={{textAlign:'center',marginTop:'16px'}}>
                      <button className="btn-t" onClick={()=>{ if(!uploadName){alert(S.UploadValidationError);return;} setUploadDone(true); }}>
                        <i className="fa-solid fa-paper-plane" /> Submit Assignment
                      </button>
                    </div>
                    {uploadDone && <div style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',color:'#4ade80',borderRadius:'10px',padding:'13px',fontSize:'13px',fontWeight:600,marginTop:'14px',textAlign:'center'}}>✅ {uploadMsg}</div>}
                  </div>
                </div>
              ) : (
                <LearningModulePlayer
                  module={LMOD.find(m=>m['Module ID']===activeModuleId)}
                  steps={stepsFor(activeModuleId)}
                  progress={learnProgress[activeModuleId]}
                  onSave={patch=>saveLearnProgress(activeModuleId, patch)}
                  onExit={()=>setActiveModuleId(null)}
                />
              )}
            </>)}

            {/* SCHEDULE */}
            {tab==='schedule' && (<>
              <div className="main-top"><div><div className="pg-h">Upcoming Classes</div><div className="pg-s">Your scheduled sessions for the coming days.</div></div></div>
              <div className="content">
                <div className="card">
                  <div className="card-t"><i className="fa-solid fa-calendar-days" /> Schedule</div>
                  {SCHED.map((u,i)=>(
                    <div key={i} className="sch-item">
                      <div className="sch-color" style={{background:u['Color (Hex)']}} />
                      <div className="sch-body"><div className="sch-subj">{u.Subject}</div><div className="sch-meta"><i className="fa-solid fa-user" style={{fontSize:'11px',marginRight:4}} />{u.Teacher}</div></div>
                      <div className="sch-right">
                        <div className="sch-time">{u.Time}</div><div className="sch-date">{u.Date}</div>
                        <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',marginTop:4,display:'inline-block',
                          background:u.Mode==='Physical'?'rgba(34,197,94,.12)':u.Mode==='Online'?'rgba(59,130,246,.12)':'rgba(168,85,247,.12)',
                          color:u.Mode==='Physical'?'#4ade80':u.Mode==='Online'?'#60a5fa':'#c084fc'}}>{u.Mode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* NOTIFICATIONS */}
            {tab==='notifications' && (<>
              <div className="main-top">
                <div><div className="pg-h">Notifications</div><div className="pg-s">{unreadCount} unread message{unreadCount!==1?'s':''}.</div></div>
                {unreadCount>0 && <button className="btn-outline" onClick={()=>setNotifs(n=>n.map(x=>({...x,Unread:false})))}><i className="fa-solid fa-check-double" /> Mark all read</button>}
              </div>
              <div className="content">
                <div className="card">
                  {notifs.map((n,i)=>{
                    const ns=notifStyle(n.Type);
                    return (
                      <div key={i} className={`notif-item${n.Unread?' unread':''}`}>
                        <div className="notif-ic" style={{background:ns.bg,color:ns.cl}}><i className={`fa-solid ${n.Icon}`} /></div>
                        <div style={{flex:1}}>
                          <div className="notif-title">{n.Title}</div>
                          <div className="notif-body">{n.Body}</div>
                          <div className="notif-time">{n.Timestamp}</div>
                        </div>
                        {n.Unread && <div className="unread-dot" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* PROFILE */}
            {tab==='profile' && (<>
              <div className="main-top">
                <div><div className="pg-h">My Profile</div><div className="pg-s">Manage your account details and preferences.</div></div>
                <button className="btn-outline" onClick={()=>setProfileEdit(!profileEdit)}><i className={`fa-solid ${profileEdit?'fa-xmark':'fa-pen'}`} /> {profileEdit?'Cancel':'Edit Profile'}</button>
              </div>
              <div className="content">
                <div className="card" style={{marginBottom:'20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'28px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
                    <div style={{width:'72px',height:'72px',borderRadius:'20px',background:'linear-gradient(135deg,var(--teal),#0099cc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',color:'#fff',flexShrink:0}}>
                      <i className="fa-solid fa-user-graduate" />
                    </div>
                    <div>
                      <div style={{fontFamily:'var(--fd)',fontSize:'22px',fontWeight:900,color:'#fff',marginBottom:'4px'}}>{profile.name}</div>
                      <div style={{fontSize:'13px',color:'var(--muted)',marginBottom:'6px'}}>{profile.id} · {profile.classLevel}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:700,padding:'4px 12px',borderRadius:'100px',background:'rgba(0,198,167,.1)',color:'var(--teal)',border:'1px solid rgba(0,198,167,.2)'}}>
                        <i className="fa-solid fa-circle" style={{fontSize:'8px'}} /> {S.EnrolmentStatus} Student
                      </div>
                    </div>
                  </div>
                  <div className="card-t"><i className="fa-solid fa-id-card" /> Account Details</div>
                  <div className="prof-g">
                    {mergedProfile.map((f,i)=>(
                      <div key={i} className="prof-field">
                        <span className="prof-label">{f.label}</span>
                        {profileEdit && !f.readonly
                          ? <input defaultValue={f.val} className="prof-inp" />
                          : <span className="prof-val">{f.val}</span>}
                      </div>
                    ))}
                  </div>
                  {profileEdit && <div style={{marginTop:'24px'}}><button className="btn-t" onClick={()=>setProfileEdit(false)}><i className="fa-solid fa-check" /> Save Changes</button></div>}
                </div>
                <div className="card">
                  <div className="card-t"><i className="fa-solid fa-lock" /> Change Password</div>
                  <div className="prof-g">
                    <div className="prof-field"><span className="prof-label">Current Password</span><input type="password" className="prof-inp" placeholder="••••••••" /></div>
                    <div className="prof-field"><span className="prof-label">New Password</span><input type="password" className="prof-inp" placeholder="••••••••" /></div>
                    <div className="prof-field"><span className="prof-label">Confirm Password</span><input type="password" className="prof-inp" placeholder="••••••••" /></div>
                  </div>
                  <div style={{marginTop:'20px'}}><button className="btn-t"><i className="fa-solid fa-key" /> Update Password</button></div>
                </div>
              </div>
            </>)}

          </main>
        </div>
      )}
    </>
  );
}
