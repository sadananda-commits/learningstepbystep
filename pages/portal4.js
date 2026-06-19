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
  // ── ASSIGNMENT SUBJECTS (Step 1 of the drill-down) ───────────────────────────
  // One row per subject shown on the Assignment section's subject-picker screen.
  // The topic *list* under each subject is never hardcoded — it's always derived
  // live from learningModules below (filtered by this exact Subject string), so
  // adding a brand-new subject is just: 1 row here + topic rows in learningModules
  // + step rows in learningSteps. No app code changes needed, ever.
  assignmentSubjects:[
    {Subject:'English Grammar',  Tagline:'Grammar, vocabulary & writing skills',     'Icon (FontAwesome solid)':'fa-spell-check',  Emoji:'📚', 'Color (Hex)':'#3b82f6', 'Display Order':1, Active:true},
    {Subject:'Mathematics',      Tagline:'Numbers, shapes & problem solving',         'Icon (FontAwesome solid)':'fa-calculator',   Emoji:'➗', 'Color (Hex)':'#f97316', 'Display Order':2, Active:true},
    {Subject:'Science',          Tagline:'Plants, the body & how the world works',    'Icon (FontAwesome solid)':'fa-flask',        Emoji:'🔬', 'Color (Hex)':'#22c55e', 'Display Order':3, Active:true},
    {Subject:'Social Studies',   Tagline:'History, geography & the world around us',  'Icon (FontAwesome solid)':'fa-earth-asia',   Emoji:'🌍', 'Color (Hex)':'#eab308', 'Display Order':4, Active:true},
    {Subject:'General Knowledge',Tagline:'Fun facts & general awareness',             'Icon (FontAwesome solid)':'fa-lightbulb',    Emoji:'💡', 'Color (Hex)':'#a855f7', 'Display Order':5, Active:true},
  ],
  // ── INTERACTIVE LEARNING ──────────────────────────────────────────────────
  // One row per topic. Teachers add a new daily topic by adding a new row here
  // (in the live sheet this is its own "Learning Modules" tab).
  learningModules:[
    {'Module ID':'LM01',Title:'Plant Life Cycle', Subject:'Science',     Class:'Class 5', 'Icon (FontAwesome solid)':'fa-seedling', Emoji:'🌱', 'Color (Hex)':'#22c55e', Introduction:"Plants begin as tiny seeds. With water, sunlight, and good soil, a seed grows into a seedling, then a tall mature plant. Mature plants grow flowers that make new seeds — and the whole cycle starts again!", 'Intro Image URL':'', 'Display Order':1, Active:true},
    {'Module ID':'LM02',Title:'Solar System',     Subject:'Science',     Class:'Class 5', 'Icon (FontAwesome solid)':'fa-globe',    Emoji:'🪐', 'Color (Hex)':'#22c55e', Introduction:"Our Solar System is the Sun and everything that travels around it — eight planets, their moons, and lots of smaller rocky and icy objects, all held in place by the Sun's gravity.", 'Intro Image URL':'', 'Display Order':2, Active:true},
    {'Module ID':'LM03',Title:'Water Cycle',      Subject:'Science',     Class:'Class 5', 'Icon (FontAwesome solid)':'fa-droplet',  Emoji:'💧', 'Color (Hex)':'#22c55e', Introduction:"Water is always on the move! It rises from oceans and rivers as vapor, cools into clouds, falls back down as rain, and flows back to the sea to begin the journey all over again.", 'Intro Image URL':'', 'Display Order':3, Active:true},
    {'Module ID':'LM04',Title:'Human Body',       Subject:'Science',     Class:'Class 5', 'Icon (FontAwesome solid)':'fa-person',   Emoji:'🫀', 'Color (Hex)':'#22c55e', Introduction:"Your body is a team of amazing parts working together — bones that hold you up, muscles that help you move, a heart that pumps blood, and lungs that bring in the air you breathe.", 'Intro Image URL':'', 'Display Order':4, Active:true},
    {'Module ID':'LM05',Title:'Fractions',        Subject:'Mathematics', Class:'Class 6', 'Icon (FontAwesome solid)':'fa-divide',   Emoji:'➗', 'Color (Hex)':'#f97316', Introduction:"A fraction shows part of a whole — like one slice of a pizza that's been cut into equal pieces. The bottom number counts all the slices; the top number counts the slices you have.", 'Intro Image URL':'', 'Display Order':5, Active:true},
    // ── English Grammar (Class 5) — 20 topics ──────────────────────────────
    // Source: Class 5 English Grammar Mastery Workbook. Topic 1 (Nouns) below
    // has its full 50-question progressive lesson built in learningSteps.
    // The remaining 19 are scaffolded with real intros so the full Topic list
    // is browsable today; their step content lands in upcoming stages — until
    // then, opening one shows the existing "no steps yet" message gracefully.
    {'Module ID':'LM06',Title:'Nouns',                       Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-tag',                Emoji:'🏷️', 'Color (Hex)':'#3b82f6', Introduction:"A noun is the name of a person, place, animal, thing, or idea. We use nouns every day when we talk about people, places, and objects around us.", 'Now You Try':"Write one sentence that uses a common noun, a proper noun, and an abstract noun together.", 'Intro Image URL':'', 'Display Order':6, Active:true},
    {'Module ID':'LM07',Title:'Pronouns',                    Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-user',               Emoji:'👤', 'Color (Hex)':'#3b82f6', Introduction:"A pronoun is a word that takes the place of a noun, like he, she, it, or they. Instead of repeating a name again and again, pronouns help our sentences flow more smoothly.", 'Intro Image URL':'', 'Display Order':7, Active:true},
    {'Module ID':'LM08',Title:'Verbs',                       Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-person-running',     Emoji:'🏃', 'Color (Hex)':'#3b82f6', Introduction:"A verb is an action word — it tells us what someone or something is doing, like run, jump, or sing. Every sentence needs a verb to come alive!", 'Intro Image URL':'', 'Display Order':8, Active:true},
    {'Module ID':'LM09',Title:'Adjectives',                  Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-palette',            Emoji:'🎨', 'Color (Hex)':'#3b82f6', Introduction:"An adjective is a word that describes a noun — it tells us what something looks, feels, or seems like, like tall, red, or happy. Adjectives add colour and detail to our sentences.", 'Intro Image URL':'', 'Display Order':9, Active:true},
    {'Module ID':'LM10',Title:'Adverbs',                     Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-bolt',                Emoji:'⚡', 'Color (Hex)':'#3b82f6', Introduction:"An adverb describes how, when, or where an action happens, like quickly, yesterday, or outside. Adverbs often answer the question \"how?\" about a verb.", 'Intro Image URL':'', 'Display Order':10, Active:true},
    {'Module ID':'LM11',Title:'Articles',                    Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-bookmark',           Emoji:'🔖', 'Color (Hex)':'#3b82f6', Introduction:"Articles are the small words a, an, and the that come before nouns. They help us know whether we're talking about any one thing in general, or one special, specific thing.", 'Intro Image URL':'', 'Display Order':11, Active:true},
    {'Module ID':'LM12',Title:'Prepositions',                Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-location-dot',       Emoji:'📍', 'Color (Hex)':'#3b82f6', Introduction:"A preposition is a word that shows where something is or how it relates to something else, like in, on, under, or behind. Prepositions help us describe positions and places.", 'Intro Image URL':'', 'Display Order':12, Active:true},
    {'Module ID':'LM13',Title:'Conjunctions',                Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-link',                Emoji:'🔗', 'Color (Hex)':'#3b82f6', Introduction:"A conjunction is a joining word, like and, but, or because. Conjunctions connect words, phrases, or whole sentences together so our ideas flow smoothly.", 'Intro Image URL':'', 'Display Order':13, Active:true},
    {'Module ID':'LM14',Title:'Subject and Predicate',       Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-scale-balanced',     Emoji:'⚖️', 'Color (Hex)':'#3b82f6', Introduction:"Every sentence has two main parts: the subject, which tells us who or what the sentence is about, and the predicate, which tells us what the subject does or is.", 'Intro Image URL':'', 'Display Order':14, Active:true},
    {'Module ID':'LM15',Title:'Types of Sentences',          Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-comment',            Emoji:'💭', 'Color (Hex)':'#3b82f6', Introduction:"Sentences come in different types depending on their job — telling, asking, exclaiming, or commanding. Knowing the type helps us choose the right punctuation too!", 'Intro Image URL':'', 'Display Order':15, Active:true},
    {'Module ID':'LM16',Title:'Punctuation',                 Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-pen',                 Emoji:'✏️', 'Color (Hex)':'#3b82f6', Introduction:"Punctuation marks — like full stops, question marks, commas, and exclamation marks — are the little signals that help readers know how to read a sentence.", 'Intro Image URL':'', 'Display Order':16, Active:true},
    {'Module ID':'LM17',Title:'Direct and Indirect Speech',  Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-comments',           Emoji:'💬', 'Color (Hex)':'#3b82f6', Introduction:"Direct speech repeats someone's exact words inside quotation marks. Indirect speech reports what someone said, without quoting them word for word. Both ways let us share what people say!", 'Intro Image URL':'', 'Display Order':17, Active:true},
    {'Module ID':'LM18',Title:'Synonyms',                    Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-arrows-rotate',      Emoji:'🔄', 'Color (Hex)':'#3b82f6', Introduction:"Synonyms are words that mean almost the same thing, like happy and glad. Knowing synonyms helps us choose just the right word and avoid repeating ourselves.", 'Intro Image URL':'', 'Display Order':18, Active:true},
    {'Module ID':'LM19',Title:'Antonyms',                    Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-arrows-left-right',  Emoji:'↔️', 'Color (Hex)':'#3b82f6', Introduction:"Antonyms are words with opposite meanings, like hot and cold, or big and small. Spotting antonyms helps us understand and describe differences clearly.", 'Intro Image URL':'', 'Display Order':19, Active:true},
    {'Module ID':'LM20',Title:'Homophones',                  Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-ear-listen',         Emoji:'👂', 'Color (Hex)':'#3b82f6', Introduction:"Homophones are words that sound exactly the same but have different spellings and meanings, like their and there. Learning them helps us write the correct word every time.", 'Intro Image URL':'', 'Display Order':20, Active:true},
    {'Module ID':'LM21',Title:'Vocabulary Building',         Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-book',                Emoji:'📖', 'Color (Hex)':'#3b82f6', Introduction:"Vocabulary building means learning new words and understanding what they mean, so we can read, write, and speak with more confidence and variety.", 'Intro Image URL':'', 'Display Order':21, Active:true},
    {'Module ID':'LM22',Title:'Sentence Formation',          Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-puzzle-piece',       Emoji:'🧩', 'Color (Hex)':'#3b82f6', Introduction:"Sentence formation is about putting words together in the right order, so our sentences make complete sense and clearly share our ideas.", 'Intro Image URL':'', 'Display Order':22, Active:true},
    {'Module ID':'LM23',Title:'Letter Writing',              Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-envelope',           Emoji:'✉️', 'Color (Hex)':'#3b82f6', Introduction:"Letter writing teaches us how to write a friendly, well-organised letter — with a greeting, a clear message, and a warm closing — to share news with someone we care about.", 'Intro Image URL':'', 'Display Order':23, Active:true},
    {'Module ID':'LM24',Title:'Reading Comprehension',       Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-book-open-reader',   Emoji:'📚', 'Color (Hex)':'#3b82f6', Introduction:"Reading comprehension is the skill of understanding what we read — finding facts, figuring out meanings, and following a story from beginning to end.", 'Intro Image URL':'', 'Display Order':24, Active:true},
    {'Module ID':'LM25',Title:'Creative Writing',            Subject:'English Grammar', Class:'Class 5', 'Icon (FontAwesome solid)':'fa-feather',            Emoji:'✍️', 'Color (Hex)':'#3b82f6', Introduction:"Creative writing lets our imagination shine! It's about telling our own stories, describing scenes vividly, and putting our ideas into well-organised paragraphs.", 'Intro Image URL':'', 'Display Order':25, Active:true},
  ],
  // One row per learning step, linked to a Module ID, in the order they should be taught
  // (in the live sheet this is its own "Learning Steps" tab).
  learningSteps:[
    // Plant Life Cycle
    // Plant Life Cycle — 8 Learning Sections × 3 progressive steps = 24 questions.
    // Optional columns demoed here: 'Learning Section' (groups steps under a sub-topic
    // heading), 'Learn More URL' / 'Learn More Label' (Step 5 — further reading link).
    // Section 1: What is a plant?
    {'Module ID':'LM01','Step Number':1,'Learning Section':'What is a plant?',Teaching:"Plants are living things that make their own food using sunlight, water, and air — they don't eat other living things the way animals do.",'Step Image URL':'',Question:"Which of these is true about plants?",'Option A':'They eat other living things','Option B':'They make their own food using sunlight','Option C':'They can walk to find food','Option D':'They are not living things','Correct Option':'B',Explanation:"Correct! Plants make their own food through a process called photosynthesis, using sunlight, water, and air.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':2,'Learning Section':'What is a plant?',Teaching:"Plants are found almost everywhere on Earth — in gardens, forests, deserts, and ponds — because different plants have adapted to survive in different places.",'Step Image URL':'',Question:"Where can plants be found?",'Option A':'Only in gardens','Option B':'Only in forests','Option C':'Almost everywhere, including deserts and ponds','Option D':'Only where it rains a lot','Correct Option':'C',Explanation:"Right! Plants have adapted to live in many environments, from dry deserts to wet ponds.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':3,'Learning Section':'What is a plant?',Teaching:"Like all living things, a plant is born, grows, reproduces, and eventually dies — this whole journey is called its life cycle.",'Step Image URL':'',Question:"What do we call the journey a plant takes from being born to producing new plants?",'Option A':'Plant life cycle','Option B':'Plant family','Option C':'Plant kingdom','Option D':'Plant habitat','Correct Option':'A',Explanation:"Yes! Every plant goes through stages, from seed to making new seeds — and that whole journey is its life cycle.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 2: What is a seed?
    {'Module ID':'LM01','Step Number':4,'Learning Section':'What is a seed?',Teaching:"A seed is a tiny package made by a plant that holds a baby plant inside, along with some stored food to help it start growing.",'Step Image URL':'',Question:"What does a seed contain inside it?",'Option A':'A baby plant and stored food','Option B':'Only water','Option C':'Only soil','Option D':'A fully grown plant','Correct Option':'A',Explanation:"Correct! Inside every seed is a tiny baby plant (the embryo) plus a small store of food for its first days of growth.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':5,'Learning Section':'What is a seed?',Teaching:"Seeds come in many shapes, sizes, and colours — from a tiny mustard seed to a large coconut seed.",'Step Image URL':'',Question:"Which statement about seeds is correct?",'Option A':'All seeds look exactly the same','Option B':'Seeds can be many different shapes, sizes and colours','Option C':'Seeds are always green','Option D':'Seeds are always round','Correct Option':'B',Explanation:"Right! Just compare a tiny mustard seed to a giant coconut seed — seeds vary hugely.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':6,'Learning Section':'What is a seed?',Teaching:"Most seeds have a tough outer covering called a seed coat, which protects the baby plant inside until conditions are right for it to grow.",'Step Image URL':'',Question:"What protects the baby plant inside a seed?",'Option A':'The leaf','Option B':'The seed coat','Option C':'The flower','Option D':'The root','Correct Option':'B',Explanation:"Yes! The tough seed coat shields the delicate embryo until it's time to sprout.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 3: How does germination occur?
    {'Module ID':'LM01','Step Number':7,'Learning Section':'How does germination occur?',Teaching:"Germination is the process where a seed wakes up and begins to sprout, starting its journey into a young plant.",'Step Image URL':'',Question:"What is germination?",'Option A':'A seed turning into a flower instantly','Option B':'A seed beginning to sprout and grow','Option C':'A plant losing its leaves','Option D':'A seed being eaten','Correct Option':'B',Explanation:"Correct! Germination is simply the first stage of growth, when the tiny plant inside the seed starts to grow.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':8,'Learning Section':'How does germination occur?',Teaching:"During germination, the seed coat splits open as a small root grows downward and a shoot grows upward.",'Step Image URL':'',Question:"What happens first as a seed germinates?",'Option A':'The seed coat splits and a root and shoot begin to grow','Option B':'The plant grows flowers immediately','Option C':'The seed turns to stone','Option D':'The seed flies away','Correct Option':'A',Explanation:"Right! The root grows down to anchor the plant and absorb water, while the shoot grows up toward the light.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':9,'Learning Section':'How does germination occur?',Teaching:"Not all seeds germinate at the same speed — some sprout in days, while others can take weeks, depending on the seed and the conditions around it.",'Step Image URL':'',Question:"Do all seeds take the same amount of time to germinate?",'Option A':'Yes, always exactly 7 days','Option B':'No, it varies by seed type and conditions','Option C':'No seed ever germinates','Option D':'Yes, all seeds take a year','Correct Option':'B',Explanation:"Correct! Germination time depends on the kind of seed and on conditions like temperature and moisture.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 4: What does a seed need to grow?
    {'Module ID':'LM01','Step Number':10,'Learning Section':'What does a seed need to grow?',Teaching:"A seed needs water, air, and the right temperature to germinate and start growing.",'Step Image URL':'',Question:"Which of these does a seed need to germinate?",'Option A':'Water, air and the right temperature','Option B':'Only darkness','Option C':'Only sand','Option D':'Loud noise','Correct Option':'A',Explanation:"Yes! Water softens the seed coat and activates growth, air provides oxygen, and warmth helps the process along.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':11,'Learning Section':'What does a seed need to grow?',Teaching:"Once a seedling has sprouted, it also needs sunlight to keep growing strong and healthy.",'Step Image URL':'',Question:"Why does a growing seedling need sunlight?",'Option A':'To make its own food through photosynthesis','Option B':'To make noise','Option C':'To change colour only','Option D':'Sunlight is not needed','Correct Option':'A',Explanation:"Correct! Once it has leaves, the young plant uses sunlight to make its own food and keep growing.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':12,'Learning Section':'What does a seed need to grow?',Teaching:"Good soil gives a growing plant nutrients to absorb and a stable place for its roots to anchor and spread.",'Step Image URL':'',Question:"What does soil provide to a growing plant?",'Option A':'Nutrients and a place for roots to anchor','Option B':'Only colour','Option C':'Only weight','Option D':'Nothing important','Correct Option':'A',Explanation:"Right! Soil holds the nutrients roots absorb and gives the plant a stable place to grow.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 5: What is a seedling?
    {'Module ID':'LM01','Step Number':13,'Learning Section':'What is a seedling?',Teaching:"A seedling is a young plant that has just sprouted from a seed, usually with its very first tiny leaves.",'Step Image URL':'',Question:"What do we call a young plant that has just sprouted?",'Option A':'A seedling','Option B':'A flower','Option C':'A fruit','Option D':'A root','Correct Option':'A',Explanation:"Correct! A seedling is the very first plant stage after germination, often just a thin stem with one or two small leaves.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':14,'Learning Section':'What is a seedling?',Teaching:"A seedling's first leaves help it start making its own food through photosynthesis as soon as possible.",'Step Image URL':'',Question:"What is the job of a seedling's first leaves?",'Option A':"To help it start making food via photosynthesis",'Option B':'To attract animals','Option C':'To make seeds immediately','Option D':'To protect the roots','Correct Option':'A',Explanation:"Yes! Those first small leaves are crucial — they let the seedling begin capturing sunlight to fuel its growth.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':15,'Learning Section':'What is a seedling?',Teaching:"Seedlings are delicate and can be easily damaged, so gardeners and farmers often protect them from harsh weather and hungry animals.",'Step Image URL':'',Question:"Why are seedlings considered delicate?",'Option A':'They are easily damaged by weather or animals','Option B':'They are made of stone','Option C':'They cannot be eaten by anything','Option D':'They are heavier than mature plants','Correct Option':'A',Explanation:"Correct! Young seedlings haven't yet developed the toughness of a mature plant.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 6: How does a mature plant form?
    {'Module ID':'LM01','Step Number':16,'Learning Section':'How does a mature plant form?',Teaching:"As a seedling keeps absorbing sunlight, water, and nutrients, it grows taller and develops a stronger stem, more leaves, and roots — becoming a mature plant.",'Step Image URL':'',Question:"What helps a seedling grow into a mature plant?",'Option A':'Continued sunlight, water and nutrients','Option B':'Staying in the dark','Option C':'Removing its roots','Option D':'Avoiding water','Correct Option':'A',Explanation:"Right! Steady access to sunlight, water, and nutrients lets the plant keep building new cells and growing larger.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':17,'Learning Section':'How does a mature plant form?',Teaching:"A mature plant has a fully developed root system, stem, and leaves, and is ready to reproduce by making flowers.",'Step Image URL':'',Question:"What makes a plant 'mature'?",'Option A':'It has fully developed roots, stem, leaves and can reproduce','Option B':'It has turned brown','Option C':'It has stopped growing forever','Option D':'It has lost all its leaves','Correct Option':'A',Explanation:"Correct! Maturity means the plant has everything it needs to support itself and start the next stage — making flowers and seeds.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':18,'Learning Section':'How does a mature plant form?',Teaching:"Different plants take very different amounts of time to mature — some herbs mature in weeks, while some trees take years.",'Step Image URL':'',Question:"Do all plants take the same time to become mature?",'Option A':'Yes, exactly one month for every plant','Option B':'No, it varies — some take weeks, others take years','Option C':'All plants mature in one day','Option D':'Plants never mature','Correct Option':'B',Explanation:"Yes! A tomato plant might mature in weeks, while an oak tree can take many years.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 7: How are flowers involved?
    {'Module ID':'LM01','Step Number':19,'Learning Section':'How are flowers involved?',Teaching:"Many mature plants grow flowers, which contain the parts needed to produce new seeds.",'Step Image URL':'',Question:"What is the main job of a flower in a plant's life cycle?",'Option A':'To help produce new seeds','Option B':'To make the plant taller','Option C':'To absorb water','Option D':"To protect the roots",'Correct Option':'A',Explanation:"Correct! Flowers contain the reproductive parts of a plant and are essential for making the next generation of seeds.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':20,'Learning Section':'How are flowers involved?',Teaching:"Pollination happens when pollen moves from one flower to another, often carried by insects like bees, or by the wind.",'Step Image URL':'',Question:"What is pollination?",'Option A':'Pollen moving from one flower to another','Option B':'A seed sprouting','Option C':'A leaf falling off','Option D':'Water entering the soil','Correct Option':'A',Explanation:"Right! Bees, butterflies, and wind are common carriers that move pollen between flowers, allowing seeds to form.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':21,'Learning Section':'How are flowers involved?',Teaching:"After successful pollination, a flower can develop into a fruit that holds the new seeds safely inside.",'Step Image URL':'',Question:"What can a pollinated flower develop into?",'Option A':'A fruit containing seeds','Option B':'A rock','Option C':'A root','Option D':'Soil','Correct Option':'A',Explanation:"Correct! Many fruits — like apples, tomatoes, and beans — are simply the part of the plant that grew to protect and carry seeds.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    // Section 8: How are new seeds produced?
    {'Module ID':'LM01','Step Number':22,'Learning Section':'How are new seeds produced?',Teaching:"Once pollination is complete, part of the flower develops into a fruit, and seeds form safely inside it, ready to start the cycle again.",'Step Image URL':'',Question:"Where do new seeds form after pollination?",'Option A':'Inside the developing fruit','Option B':'In the soil directly','Option C':'On the petals','Option D':'In the air','Correct Option':'A',Explanation:"Yes! The fertilised part of the flower swells into a fruit, and the seeds develop safely inside it.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':23,'Learning Section':'How are new seeds produced?',Teaching:"When the seeds are ready, they can spread to new places — carried by wind, water, animals, or simply falling to the ground nearby.",'Step Image URL':'',Question:"How can new seeds spread to grow elsewhere?",'Option A':'By wind, water, or animals carrying them','Option B':'They can only stay exactly where they formed','Option C':'They dissolve in rain','Option D':'They turn into rocks','Correct Option':'A',Explanation:"Correct! Seeds have clever ways of travelling — fluffy seeds float on wind, sticky seeds cling to animal fur, and some float on water.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
    {'Module ID':'LM01','Step Number':24,'Learning Section':'How are new seeds produced?',Teaching:"When a spread seed lands somewhere with the right water, air, and warmth, it can germinate — and the whole plant life cycle begins again.",'Step Image URL':'',Question:"What happens when a new seed lands in a good spot?",'Option A':'It can germinate and start the life cycle again','Option B':'It disappears forever','Option C':'It becomes a flower immediately without growing','Option D':'Nothing happens','Correct Option':'A',Explanation:"That's the beautiful part of the life cycle — every new seed has the potential to grow into a brand-new plant, starting the whole journey over again.",'Learn More URL':'https://www.ncert.nic.in/textbook/pdf/eeap105.pdf','Learn More Label':'Read the NCERT chapter: Seeds and Seeds',Active:true},
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
    // Fractions — 7 Learning Sections × 3 progressive steps = 21 questions.
    // Section 1: What is a fraction?
    {'Module ID':'LM05','Step Number':1,'Learning Section':'What is a fraction?',Teaching:"A fraction is a way to show a part of a whole — like one slice of a pizza that's been cut into equal pieces.",'Step Image URL':'',Question:"What does a fraction represent?",'Option A':'A whole number','Option B':'A part of a whole','Option C':'A type of shape','Option D':'A unit of weight','Correct Option':'B',Explanation:"Correct! A fraction always describes part of something that has been divided into equal pieces.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':2,'Learning Section':'What is a fraction?',Teaching:"For a fraction to make sense, the whole must be divided into equal-sized parts — not parts of different sizes.",'Step Image URL':'',Question:"Why must the parts of a whole be equal when we talk about fractions?",'Option A':'So each part represents the same amount','Option B':'Because equal parts look nicer','Option C':'Equal parts are always bigger','Option D':"It doesn't matter if parts are equal",'Correct Option':'A',Explanation:"Right! If the parts weren't equal, the fraction wouldn't describe a fair, consistent amount.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':3,'Learning Section':'What is a fraction?',Teaching:"We write a fraction using two numbers separated by a line, like 3/4 — this means 3 parts out of 4 equal parts.",'Step Image URL':'',Question:"How is a fraction written?",'Option A':'Two numbers separated by a line, like 3/4','Option B':'A single number like 34','Option C':'A percentage sign','Option D':'A decimal point only','Correct Option':'A',Explanation:"Yes! The line in 3/4 separates the two numbers that together describe the fraction.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 2: Numerator and denominator
    {'Module ID':'LM05','Step Number':4,'Learning Section':'Numerator and denominator',Teaching:"The bottom number of a fraction is called the denominator — it tells us how many equal parts the whole has been divided into.",'Step Image URL':'',Question:"What is the denominator?",'Option A':'The bottom number, showing total equal parts','Option B':'The top number','Option C':'The line in the middle','Option D':'The whole number itself','Correct Option':'A',Explanation:"Correct! The denominator sits on the bottom and shows the total number of equal parts.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':5,'Learning Section':'Numerator and denominator',Teaching:"The top number of a fraction is called the numerator — it tells us how many of those equal parts we're talking about.",'Step Image URL':'',Question:"What is the numerator?",'Option A':'The bottom number','Option B':'The top number, showing how many parts we have','Option C':'The whole','Option D':'A symbol','Correct Option':'B',Explanation:"Right! The numerator sits on top and counts how many of the equal parts we mean.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':6,'Learning Section':'Numerator and denominator',Teaching:"In the fraction 5/8, the numerator is 5 and the denominator is 8 — meaning 5 out of 8 equal parts.",'Step Image URL':'',Question:"In the fraction 5/8, what does the 8 represent?",'Option A':'The numerator','Option B':'The denominator, total equal parts','Option C':'The answer','Option D':'A remainder','Correct Option':'B',Explanation:"Correct! The 8 is the denominator — the total number of equal parts the whole was divided into.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 3: Equivalent fractions
    {'Module ID':'LM05','Step Number':7,'Learning Section':'Equivalent fractions',Teaching:"Equivalent fractions are different fractions that represent the same amount, like 1/2 and 2/4.",'Step Image URL':'',Question:"What are equivalent fractions?",'Option A':'Fractions that look the same but mean different things','Option B':'Different fractions that represent the same amount','Option C':'Fractions that can never be compared','Option D':'Only fractions with the same denominator','Correct Option':'B',Explanation:"Right! 1/2 and 2/4 look different but represent exactly the same amount of a whole.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':8,'Learning Section':'Equivalent fractions',Teaching:"You can find an equivalent fraction by multiplying or dividing both the numerator and denominator by the same number.",'Step Image URL':'',Question:"How can you find a fraction equivalent to 2/3?",'Option A':'Multiply only the numerator','Option B':'Multiply both the numerator and denominator by the same number','Option C':'Add 1 to the denominator only','Option D':'Subtract from the numerator','Correct Option':'B',Explanation:"Exactly! Multiplying 2/3 by 2/2 gives 4/6, which is equivalent.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':9,'Learning Section':'Equivalent fractions',Teaching:"Equivalent fractions are useful when we want to compare or add fractions that don't have the same denominator.",'Step Image URL':'',Question:"Why are equivalent fractions useful?",'Option A':'They help us compare or add fractions with different denominators','Option B':'They make fractions disappear','Option C':"They're only used in art class",'Option D':'They have no real use','Correct Option':'A',Explanation:"Yes! Rewriting fractions as equivalents with the same denominator makes comparing and adding much easier.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 4: Comparing fractions
    {'Module ID':'LM05','Step Number':10,'Learning Section':'Comparing fractions',Teaching:"When two fractions have the same denominator, the one with the bigger numerator is the larger fraction.",'Step Image URL':'',Question:"Which is bigger, 3/7 or 5/7?",'Option A':'3/7','Option B':'5/7','Option C':'They are equal','Option D':'Cannot be compared','Correct Option':'B',Explanation:"Right! Since both share the denominator 7, the fraction with the larger numerator, 5/7, is bigger.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':11,'Learning Section':'Comparing fractions',Teaching:"When fractions have different denominators, it helps to rewrite them with a common denominator before comparing.",'Step Image URL':'',Question:"What helps when comparing fractions with different denominators?",'Option A':'Ignoring the denominators','Option B':'Rewriting them with a common denominator','Option C':'Always picking the smaller numerator','Option D':'Adding the numerators together','Correct Option':'B',Explanation:"Yes! A common denominator lets you compare the numerators directly and fairly.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':12,'Learning Section':'Comparing fractions',Teaching:"A fraction close to 1, like 7/8, represents almost a whole, while a fraction close to 0, like 1/8, represents a very small part.",'Step Image URL':'',Question:"Which fraction represents almost a whole?",'Option A':'1/8','Option B':'7/8','Option C':'0/8','Option D':'1/2','Correct Option':'B',Explanation:"Correct! 7/8 means 7 out of 8 parts — very close to the complete whole.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 5: Adding fractions with the same denominator
    {'Module ID':'LM05','Step Number':13,'Learning Section':'Adding fractions with the same denominator',Teaching:"To add fractions with the same denominator, simply add the numerators and keep the denominator the same.",'Step Image URL':'',Question:"How do you add 1/5 and 2/5?",'Option A':'Add the numerators: 3/5','Option B':'Add the denominators: 1/10','Option C':'Multiply them: 2/25','Option D':'Subtract them: 1/5','Correct Option':'A',Explanation:"Right! Since the denominators match, you just add 1 + 2 to get 3/5.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':14,'Learning Section':'Adding fractions with the same denominator',Teaching:"If adding the numerators gives a number equal to or bigger than the denominator, the answer becomes a whole or a mixed number.",'Step Image URL':'',Question:"What is 3/4 + 2/4?",'Option A':'5/4, which is 1 and 1/4','Option B':'5/8','Option C':'1/4','Option D':'6/4 simplified to 6','Correct Option':'A',Explanation:"Yes! 3 + 2 = 5, so 5/4 — more than a whole — equals 1 whole and 1/4 left over.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':15,'Learning Section':'Adding fractions with the same denominator',Teaching:"Adding fractions with the same denominator works the same way no matter how many fractions you're adding together.",'Step Image URL':'',Question:"What is 1/6 + 2/6 + 1/6?",'Option A':'4/6','Option B':'4/18','Option C':'3/6','Option D':'1/6','Correct Option':'A',Explanation:"Correct! Add all the numerators — 1 + 2 + 1 = 4 — to get 4/6.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 6: Subtracting fractions with the same denominator
    {'Module ID':'LM05','Step Number':16,'Learning Section':'Subtracting fractions with the same denominator',Teaching:"To subtract fractions with the same denominator, subtract the numerators and keep the denominator the same.",'Step Image URL':'',Question:"What is 4/9 minus 1/9?",'Option A':'3/9','Option B':'5/9','Option C':'4/0','Option D':'3/18','Correct Option':'A',Explanation:"Right! Subtract the numerators, 4 − 1 = 3, keeping the denominator 9.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':17,'Learning Section':'Subtracting fractions with the same denominator',Teaching:"Just like with addition, the denominators must already match before you can subtract two fractions this way.",'Step Image URL':'',Question:"Can you directly subtract 1/3 from 1/2 the same way?",'Option A':'No — the denominators are different, so they must be made equal first','Option B':'Yes, always subtract numerators directly','Option C':'No, fractions can never be subtracted','Option D':'Yes, just subtract the denominators','Correct Option':'A',Explanation:"Correct! With different denominators, you first need a common denominator before subtracting.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':18,'Learning Section':'Subtracting fractions with the same denominator',Teaching:"Subtracting a fraction from a whole, like 1 minus 3/8, means thinking of the whole as 8/8 first.",'Step Image URL':'',Question:"What is 1 minus 3/8?",'Option A':'5/8','Option B':'3/8','Option C':'1/8','Option D':'4/8','Correct Option':'A',Explanation:"Yes! Thinking of 1 as 8/8, subtracting 3/8 leaves 5/8.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // Section 7: Fractions in everyday life
    {'Module ID':'LM05','Step Number':19,'Learning Section':'Fractions in everyday life',Teaching:"Fractions show up everywhere in daily life — sharing food, reading recipe measurements, or telling time, like a half hour.",'Step Image URL':'',Question:"Which of these is an everyday example of a fraction?",'Option A':'Sharing half a chocolate bar with a friend','Option B':'Counting whole apples only','Option C':'Naming the colour of a fruit','Option D':'Measuring temperature in degrees','Correct Option':'A',Explanation:"Right! Splitting something into equal shares, like half a chocolate bar, is a fraction in action.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':20,'Learning Section':'Fractions in everyday life',Teaching:"A clock uses fractions too — a quarter past the hour means 1/4 of the way around the clock face.",'Step Image URL':'',Question:"What does 'a quarter past' mean on a clock?",'Option A':'1/4 of the way around the clock face','Option B':'The whole hour has passed','Option C':'Half the day is over','Option D':'3/4 of the hour remains','Correct Option':'A',Explanation:"Correct! A quarter past means 15 minutes, which is 1/4 of a 60-minute hour.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    {'Module ID':'LM05','Step Number':21,'Learning Section':'Fractions in everyday life',Teaching:"Recipes often use fractions for ingredients, like 3/4 cup of flour, helping cooks measure exactly the right amount.",'Step Image URL':'',Question:"Why do recipes often use fractions?",'Option A':'To measure ingredients precisely','Option B':'To make cooking harder','Option C':'Fractions are never used in recipes','Option D':'To avoid using cups','Correct Option':'A',Explanation:"Yes! Fractions let a recipe describe a precise amount, like 3/4 cup, instead of guessing.",'Learn More URL':'https://ncert.nic.in/textbook/pdf/fegp107.pdf','Learn More Label':'Read the NCERT Maths chapter: Fractions',Active:true},
    // ── English Grammar: Topic 1 — Nouns (50 questions, 5 sections) ───────
    {'Module ID':'LM06','Step Number':1,'Learning Section':'Common Nouns',Teaching:"Common nouns name people, places, animals, or things in a general way — not one special, particular one. School, boy, and dog are all common nouns.",'Step Image URL':'',Question:"Which word is a common noun?",'Option A':"Quickly",'Option B':"Pretty",'Option C':"School",'Option D':"Run",'Correct Option':'C',Explanation:"Correct! School names a place in general — that's exactly what a common noun does.",Active:true},
    {'Module ID':'LM06','Step Number':2,'Learning Section':'Common Nouns',Teaching:"Common nouns can name everyday objects too, like a ball, a book, or a pencil.",'Step Image URL':'',Question:"Which word is a common noun?",'Option A':"Ball",'Option B':"Played",'Option C':"Loudly",'Option D':"Tall",'Correct Option':'A',Explanation:"Right! Ball names a thing — a common noun for any ball, not one special ball.",Active:true},
    {'Module ID':'LM06','Step Number':3,'Learning Section':'Common Nouns',Teaching:"When you spot a common noun inside a sentence, look for the word that names a person, place, or thing — even with lots of other words around it.",'Step Image URL':'',Question:"Find the common noun: \"The boy kicked the ball happily.\"",'Option A':"kicked",'Option B':"happily",'Option C':"ball",'Option D':"quickly",'Correct Option':'C',Explanation:"Correct! Ball is the thing being named in the sentence — the common noun.",Active:true},
    {'Module ID':'LM06','Step Number':4,'Learning Section':'Common Nouns',Teaching:"Things you can see and touch around your home — like a chair, a table, or a lamp — are common nouns too.",'Step Image URL':'',Question:"Which word is a common noun?",'Option A':"Quickly",'Option B':"Soft",'Option C':"Sing",'Option D':"Chair",'Correct Option':'D',Explanation:"Yes! Chair names a thing — a common noun.",Active:true},
    {'Module ID':'LM06','Step Number':5,'Learning Section':'Common Nouns',Teaching:"Jobs people do, like doctor, teacher, or farmer, are common nouns because they describe any person who does that job, not one specific person.",'Step Image URL':'',Question:"Which word is a common noun?",'Option A':"Doctor",'Option B':"Quickly",'Option C':"Happy",'Option D':"Jump",'Correct Option':'A',Explanation:"Right! Doctor names a job that many different people can do — it's a common noun, not the name of one specific person.",Active:true},
    {'Module ID':'LM06','Step Number':6,'Learning Section':'Common Nouns',Teaching:"You can often complete a sentence with a common noun by thinking of a general thing that fits — like an animal, object, or place.",'Step Image URL':'',Question:"Complete with a common noun: \"I saw a ____ near the pond.\"",'Option A':"Quickly",'Option B':"Duck",'Option C':"Blue",'Option D':"Swimming",'Correct Option':'B',Explanation:"Correct! Duck names an animal — a common noun that fits perfectly near a pond.",Active:true},
    {'Module ID':'LM06','Step Number':7,'Learning Section':'Common Nouns',Teaching:"Even in a sentence full of action words, there's often a common noun hiding — usually the person, animal, or thing doing the action.",'Step Image URL':'',Question:"Which sentence has a common noun?",'Option A':"She sang sweetly.",'Option B':"He ran fast.",'Option C':"The bird flew away.",'Option D':"They laughed loudly.",'Correct Option':'C',Explanation:"Right! Bird is a common noun — it names an animal in general.",Active:true},
    {'Module ID':'LM06','Step Number':8,'Learning Section':'Common Nouns',Teaching:"Some words name a place in general — like market, village, or river — while others name one special place. General place names are common nouns.",'Step Image URL':'',Question:"Which word names a place in general (a common noun)?",'Option A':"Delhi",'Option B':"Monday",'Option C':"Quickly",'Option D':"Market",'Correct Option':'D',Explanation:"Yes! Market is a general place name, so it's a common noun — unlike Delhi, which names one particular city.",Active:true},
    {'Module ID':'LM06','Step Number':9,'Learning Section':'Common Nouns',Teaching:"Everyday school supplies — like a pencil, eraser, or bag — are common nouns because they name things in general.",'Step Image URL':'',Question:"Which of these is a common noun?",'Option A':"Pencil",'Option B':"Carefully",'Option C':"Bright",'Option D':"Jumped",'Correct Option':'A',Explanation:"Correct! Pencil names a thing — a common noun.",Active:true},
    {'Module ID':'LM06','Step Number':10,'Learning Section':'Common Nouns',Teaching:"A word like teacher names any person who does that job — it's a common noun. A word like Raju names one particular person — that's a proper noun, coming up next.",'Step Image URL':'',Question:"Which word names any person doing a job (a common noun)?",'Option A':"Raju",'Option B':"Teacher",'Option C':"Monday",'Option D':"Delhi",'Correct Option':'B',Explanation:"Right! Teacher names any person doing that job — a common noun.",Active:true},
    {'Module ID':'LM06','Step Number':11,'Learning Section':'Proper Nouns',Teaching:"Proper nouns name one specific person, place, or thing — and they always start with a capital letter. Ganga is the name of one particular river.",'Step Image URL':'',Question:"Which word is a proper noun?",'Option A':"mountain",'Option B':"river",'Option C':"city",'Option D':"Ganga",'Correct Option':'D',Explanation:"Correct! Ganga names one particular river — a proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':12,'Learning Section':'Proper Nouns',Teaching:"What makes a word a proper noun isn't just its capital letter — it's that the word names one particular, special thing instead of a general category.",'Step Image URL':'',Question:"Why is \"Delhi\" a proper noun?",'Option A':"It names one particular city.",'Option B':"It is a place.",'Option C':"It starts with a capital by chance.",'Option D':"It is a long word.",'Correct Option':'A',Explanation:"Right! Delhi is a proper noun because it names one particular city, not cities in general.",Active:true},
    {'Module ID':'LM06','Step Number':13,'Learning Section':'Proper Nouns',Teaching:"Every common noun can be matched with an example that's a proper noun — like boy (common) and Ramesh (proper), one specific boy.",'Step Image URL':'',Question:"Which pair matches a common noun with its proper noun?",'Option A':"school – Monday",'Option B':"river – fast",'Option C':"boy – Ramesh",'Option D':"dog – bark",'Correct Option':'C',Explanation:"Yes! Ramesh is the specific name for a boy — pairing a common noun with its proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':14,'Learning Section':'Proper Nouns',Teaching:"Festivals like Diwali, Holi, and Eid are proper nouns because each one names one particular, special celebration.",'Step Image URL':'',Question:"Choose the proper noun: \"We celebrate Diwali every year.\"",'Option A':"celebrate",'Option B':"every",'Option C':"year",'Option D':"Diwali",'Correct Option':'D',Explanation:"Correct! Diwali names a specific festival — a proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':15,'Learning Section':'Proper Nouns',Teaching:"Country names, like India, are always proper nouns because each one names a single, specific country.",'Step Image URL':'',Question:"Which word must start with a capital letter as a proper noun?",'Option A':"teacher",'Option B':"festival",'Option C':"India",'Option D':"country",'Correct Option':'C',Explanation:"Right! India is a specific country, so it's a proper noun and must be capitalised.",Active:true},
    {'Module ID':'LM06','Step Number':16,'Learning Section':'Proper Nouns',Teaching:"Because proper nouns name something specific, they must always start with a capital letter — even in the middle of a sentence.",'Step Image URL':'',Question:"Which sentence uses a proper noun correctly?",'Option A':"We live in mumbai.",'Option B':"We live in a city.",'Option C':"We live in a Mumbai.",'Option D':"We live in Mumbai.",'Correct Option':'D',Explanation:"Yes! Mumbai is a specific city, so it needs a capital letter — that's the only option that gets it right.",Active:true},
    {'Module ID':'LM06','Step Number':17,'Learning Section':'Proper Nouns',Teaching:"When a sentence mentions someone's name — like Meena, Ravi, or Asha — that name is a proper noun, even surrounded by ordinary words.",'Step Image URL':'',Question:"Spot the proper noun: \"My friend Meena loves to read story books.\"",'Option A':"Meena",'Option B':"friend",'Option C':"loves",'Option D':"books",'Correct Option':'A',Explanation:"Correct! Meena is the friend's specific name — a proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':18,'Learning Section':'Proper Nouns',Teaching:"Days of the week, like Monday, are proper nouns because each one names one specific day — but words for general time periods, like holiday, are common nouns.",'Step Image URL':'',Question:"Which of these is NOT a proper noun?",'Option A':"Monday",'Option B':"holiday",'Option C':"December",'Option D':"Asia",'Correct Option':'B',Explanation:"Right! Holiday is general — it doesn't name one specific day — so it's the one that is NOT a proper noun here.",Active:true},
    {'Module ID':'LM06','Step Number':19,'Learning Section':'Proper Nouns',Teaching:"A single sentence can contain more than one proper noun — count carefully for the names of specific people and places.",'Step Image URL':'',Question:"\"Ravi visited the Taj Mahal last summer.\" How many proper nouns?",'Option A':"1",'Option B':"2",'Option C':"3",'Option D':"4",'Correct Option':'B',Explanation:"Correct! Ravi and Taj Mahal are both proper nouns — that's two.",Active:true},
    {'Module ID':'LM06','Step Number':20,'Learning Section':'Proper Nouns',Teaching:"The capital letter on a proper noun is a signal to the reader: this word names something specific and special, not just any example of its kind.",'Step Image URL':'',Question:"Why do proper nouns always start with a capital letter?",'Option A':"They are long words.",'Option B':"They are hard to spell.",'Option C':"They name something specific and special.",'Option D':"They start sentences.",'Correct Option':'C',Explanation:"Yes! Proper nouns name something specific and special — that capital letter is a clue.",Active:true},
    {'Module ID':'LM06','Step Number':21,'Learning Section':'Collective Nouns',Teaching:"Collective nouns name a whole group of people or animals as one unit. Different animals get their own special group names — a flock for sheep, a herd for cows.",'Step Image URL':'',Question:"Correct collective noun for a group of sheep?",'Option A':"Herd",'Option B':"Flock",'Option C':"Swarm",'Option D':"Pack",'Correct Option':'B',Explanation:"Right! A group of sheep is a flock.",Active:true},
    {'Module ID':'LM06','Step Number':22,'Learning Section':'Collective Nouns',Teaching:"Groups of people working or playing together also get their own collective noun, like a team of players or a class of students.",'Step Image URL':'',Question:"Correct collective noun for a group of players?",'Option A':"Family",'Option B':"Library",'Option C':"Team",'Option D':"Class",'Correct Option':'C',Explanation:"Correct! A group of players is a team.",Active:true},
    {'Module ID':'LM06','Step Number':23,'Learning Section':'Collective Nouns',Teaching:"A swarm is the special collective noun used for a buzzing group of insects, like bees.",'Step Image URL':'',Question:"\"A ____ of bees flew over the garden.\"",'Option A':"herd",'Option B':"swarm",'Option C':"flock",'Option D':"team",'Correct Option':'B',Explanation:"Yes! A group of bees is a swarm.",Active:true},
    {'Module ID':'LM06','Step Number':24,'Learning Section':'Collective Nouns',Teaching:"Soldiers marching together as a group are called an army — that's their collective noun.",'Step Image URL':'',Question:"Correct collective noun for a group of soldiers?",'Option A':"Army",'Option B':"Class",'Option C':"Bunch",'Option D':"Fleet",'Correct Option':'A',Explanation:"Correct! A group of soldiers is an army.",Active:true},
    {'Module ID':'LM06','Step Number':25,'Learning Section':'Collective Nouns',Teaching:"A group of students sitting together to learn is simply called a class.",'Step Image URL':'',Question:"\"A ____ of students stood up to sing.\"",'Option A':"herd",'Option B':"swarm",'Option C':"class",'Option D':"pack",'Correct Option':'C',Explanation:"Right! A group of students is a class.",Active:true},
    {'Module ID':'LM06','Step Number':26,'Learning Section':'Collective Nouns',Teaching:"Matching the right collective noun to the right animal matters — cows are described as a herd, not a flock or a swarm.",'Step Image URL':'',Question:"Which sentence uses a collective noun correctly?",'Option A':"A flock of cows grazed.",'Option B':"A swarm of cows grazed.",'Option C':"A team of cows grazed.",'Option D':"A herd of cows grazed.",'Correct Option':'D',Explanation:"Correct! Cows are described as a herd.",Active:true},
    {'Module ID':'LM06','Step Number':27,'Learning Section':'Collective Nouns',Teaching:"Ships travelling together are called a fleet — a collective noun just for vehicles like ships and boats.",'Step Image URL':'',Question:"Correct collective noun for a group of ships?",'Option A':"Army",'Option B':"Pack",'Option C':"Fleet",'Option D':"Bunch",'Correct Option':'C',Explanation:"Right! A group of ships is a fleet.",Active:true},
    {'Module ID':'LM06','Step Number':28,'Learning Section':'Collective Nouns',Teaching:"Not every collective noun is for living things — small objects that are grouped together can have one too, like a bunch of keys.",'Step Image URL':'',Question:"Collective noun for \"a group of keys\"?",'Option A':"Bunch",'Option B':"Herd",'Option C':"Flock",'Option D':"Team",'Correct Option':'A',Explanation:"Yes! A group of keys is a bunch.",Active:true},
    {'Module ID':'LM06','Step Number':29,'Learning Section':'Collective Nouns',Teaching:"A collection is the word used when many similar objects, like books, are gathered together.",'Step Image URL':'',Question:"The librarian arranged the new ____ of books.",'Option A':"herd",'Option B':"flock",'Option C':"swarm",'Option D':"collection",'Correct Option':'D',Explanation:"Correct! Books grouped together are called a collection.",Active:true},
    {'Module ID':'LM06','Step Number':30,'Learning Section':'Collective Nouns',Teaching:"Birds flying together as a group are called a flock — just like sheep.",'Step Image URL':'',Question:"Which sentence correctly uses a collective noun?",'Option A':"A swarm of birds flew south.",'Option B':"A flock of birds flew south.",'Option C':"A herd of birds flew south.",'Option D':"A team of birds flew south.",'Correct Option':'B',Explanation:"Right! Birds are described as a flock.",Active:true},
    {'Module ID':'LM06','Step Number':31,'Learning Section':'Abstract Nouns',Teaching:"Abstract nouns name feelings, ideas, or qualities — things you can't see or touch, but can definitely feel. Happiness is a feeling, so it's an abstract noun.",'Step Image URL':'',Question:"Which word is an abstract noun?",'Option A':"Table",'Option B':"Flower",'Option C':"Garden",'Option D':"Happiness",'Correct Option':'D',Explanation:"Correct! Happiness is a feeling — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':32,'Learning Section':'Abstract Nouns',Teaching:"A quality like honesty can't be picked up or touched — it's something you notice in how a person acts, which makes it an abstract noun.",'Step Image URL':'',Question:"Which names a quality you cannot touch (abstract)?",'Option A':"Honesty",'Option B':"Book",'Option C':"Pencil",'Option D':"Chair",'Correct Option':'A',Explanation:"Right! Honesty is a quality, untouchable — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':33,'Learning Section':'Abstract Nouns',Teaching:"When a sentence describes a quality someone shows — like kindness — that quality word is the abstract noun in the sentence.",'Step Image URL':'',Question:"\"Her kindness made everyone smile.\" Which word is the abstract noun?",'Option A':"smile",'Option B':"everyone",'Option C':"kindness",'Option D':"made",'Correct Option':'C',Explanation:"Correct! Kindness is the quality being described.",Active:true},
    {'Module ID':'LM06','Step Number':34,'Learning Section':'Abstract Nouns',Teaching:"Concrete nouns name things you can touch, like a table. Abstract nouns name things you can't touch, like courage. Spotting the difference helps you sort nouns quickly.",'Step Image URL':'',Question:"Which pair has one concrete and one abstract noun?",'Option A':"table – courage",'Option B':"dog – cat",'Option C':"ball – chair",'Option D':"river – mountain",'Correct Option':'A',Explanation:"Yes! Table is concrete, while courage is abstract — that's the matching pair.",Active:true},
    {'Module ID':'LM06','Step Number':35,'Learning Section':'Abstract Nouns',Teaching:"Friendship is a feeling shared between people — you can't hold it in your hand, which is exactly what makes it an abstract noun.",'Step Image URL':'',Question:"Which word is an abstract noun?",'Option A':"Mango",'Option B':"Window",'Option C':"Friendship",'Option D':"School",'Correct Option':'C',Explanation:"Correct! Friendship is a feeling, or idea — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':36,'Learning Section':'Abstract Nouns',Teaching:"Strong feelings like anger are abstract nouns because they describe something you experience inside, not something you can hold.",'Step Image URL':'',Question:"Which of these words is an abstract noun?",'Option A':"Garden",'Option B':"Anger",'Option C':"River",'Option D':"Mango",'Correct Option':'B',Explanation:"Right! Anger is a feeling — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':37,'Learning Section':'Abstract Nouns',Teaching:"Look for the word that names a quality someone shows, rather than a person, animal, or object — that word is the abstract noun in the sentence.",'Step Image URL':'',Question:"Which sentence has an abstract noun?",'Option A':"The cat sat on the mat.",'Option B':"Her honesty surprised the teacher.",'Option C':"He bought a new bicycle.",'Option D':"The flowers bloomed.",'Correct Option':'B',Explanation:"Correct! Honesty is the quality named in this sentence.",Active:true},
    {'Module ID':'LM06','Step Number':38,'Learning Section':'Abstract Nouns',Teaching:"Joy, like happiness and anger, is something you feel deep inside — not something you can pick up, which makes it abstract.",'Step Image URL':'',Question:"Which names something you feel but can't touch?",'Option A':"Table",'Option B':"Pencil",'Option C':"Joy",'Option D':"Chair",'Correct Option':'C',Explanation:"Yes! Joy is felt, not touched — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':39,'Learning Section':'Abstract Nouns',Teaching:"When soldiers are described as brave, the quality they show — courage — is the abstract noun in that sentence.",'Step Image URL':'',Question:"\"The soldiers showed great courage in battle.\" Which word is the abstract noun?",'Option A':"soldiers",'Option B':"battle",'Option C':"showed",'Option D':"courage",'Correct Option':'D',Explanation:"Correct! Courage is the quality named in the sentence.",Active:true},
    {'Module ID':'LM06','Step Number':40,'Learning Section':'Abstract Nouns',Teaching:"Peace is an idea or feeling of calm — you can't touch it, but you can definitely sense it, which makes it an abstract noun.",'Step Image URL':'',Question:"Which word is an abstract noun?",'Option A':"Apple",'Option B':"Mountain",'Option C':"Bicycle",'Option D':"Peace",'Correct Option':'D',Explanation:"Right! Peace is an idea or feeling — an abstract noun.",Active:true},
    {'Module ID':'LM06','Step Number':41,'Learning Section':'Mixed Practice',Teaching:"Now let's mix all four types together! In a sentence with several nouns, look closely at each one — is it general, specific, a group, or a feeling?",'Step Image URL':'',Question:"\"Rahul joined a team of young scientists.\" Which word is a proper noun?",'Option A':"team",'Option B':"scientists",'Option C':"Rahul",'Option D':"young",'Correct Option':'C',Explanation:"Correct! Rahul is a specific person's name — a proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':42,'Learning Section':'Mixed Practice',Teaching:"Remember: a collective noun names a whole group acting as one unit — like a committee making a decision together.",'Step Image URL':'',Question:"\"The committee discussed the project's success.\" Which word is a collective noun?",'Option A':"committee",'Option B':"project",'Option C':"success",'Option D':"discussed",'Correct Option':'A',Explanation:"Right! Committee names a group.",Active:true},
    {'Module ID':'LM06','Step Number':43,'Learning Section':'Mixed Practice',Teaching:"Even in a sentence about a whole village, the abstract noun is still the feeling or quality being described — not the people or place.",'Step Image URL':'',Question:"\"Her courage helped the whole village.\" Which word is an abstract noun?",'Option A':"village",'Option B':"helped",'Option C':"whole",'Option D':"courage",'Correct Option':'D',Explanation:"Correct! Courage is the quality named.",Active:true},
    {'Module ID':'LM06','Step Number':44,'Learning Section':'Mixed Practice',Teaching:"To sort a common noun from the rest, ask: does this word name something general, rather than one specific thing, group, or feeling?",'Step Image URL':'',Question:"Which word in this list is a common noun?",'Option A':"Friendship",'Option B':"Asia",'Option C':"river",'Option D':"Monday",'Correct Option':'C',Explanation:"Yes! River is a general name — a common noun.",Active:true},
    {'Module ID':'LM06','Step Number':45,'Learning Section':'Mixed Practice',Teaching:"A sentence can hold more than one type of noun at once. Identify each noun's job separately — which one is the group, and which one is the specific name?",'Step Image URL':'',Question:"\"The class cheered when Priya scored a goal.\" Identify the collective noun and proper noun.",'Option A':"cheered (collective), goal (proper)",'Option B':"class (collective), Priya (proper)",'Option C':"goal (collective), class (proper)",'Option D':"Priya (collective), class (proper)",'Correct Option':'B',Explanation:"Correct! Class is the group (collective noun), and Priya is the specific name (proper noun).",Active:true},
    {'Module ID':'LM06','Step Number':46,'Learning Section':'Mixed Practice',Teaching:"Scan each sentence for a word that names a feeling or quality, rather than a person, place, group, or object.",'Step Image URL':'',Question:"Which sentence contains an abstract noun?",'Option A':"The army marched into the town.",'Option B':"Honesty is the best policy.",'Option C':"The herd crossed the river.",'Option D':"Meena bought a new bicycle.",'Correct Option':'B',Explanation:"Right! Honesty is the abstract noun here.",Active:true},
    {'Module ID':'LM06','Step Number':47,'Learning Section':'Mixed Practice',Teaching:"Don't let a proper noun like a place name distract you from spotting the collective noun in the same sentence.",'Step Image URL':'',Question:"\"A swarm of bees frightened Rohan near Juhu beach.\" Which word is a collective noun?",'Option A':"swarm",'Option B':"Rohan",'Option C':"Juhu",'Option D':"bees",'Correct Option':'A',Explanation:"Correct! Swarm names the group of bees.",Active:true},
    {'Module ID':'LM06','Step Number':48,'Learning Section':'Mixed Practice',Teaching:"When sorting a list of nouns by type, look for the one word that's capitalised because it names something one-of-a-kind.",'Step Image URL':'',Question:"Sort by type: kindness, Mumbai, herd, pencil. Which is a proper noun?",'Option A':"kindness",'Option B':"herd",'Option C':"Mumbai",'Option D':"pencil",'Correct Option':'C',Explanation:"Yes! Mumbai is one particular city — a proper noun.",Active:true},
    {'Module ID':'LM06','Step Number':49,'Learning Section':'Mixed Practice',Teaching:"A sentence celebrating a group's win often contains both a collective noun for the group and an abstract noun for how everyone feels.",'Step Image URL':'',Question:"\"The team's victory filled the players with joy.\" Which word is a collective noun?",'Option A':"team",'Option B':"players",'Option C':"victory",'Option D':"joy",'Correct Option':'A',Explanation:"Correct! Team names the group of players.",Active:true},
    {'Module ID':'LM06','Step Number':50,'Learning Section':'Mixed Practice',Teaching:"For the final challenge, sort every noun type in one sentence at once: who is named specifically, what feeling is described, and what group is mentioned?",'Step Image URL':'',Question:"\"Anjali's kindness inspired the whole class in Pune.\" Which option correctly labels the nouns?",'Option A':"Anjali (common), kindness (proper), class (abstract), Pune (collective)",'Option B':"Anjali (collective), kindness (common), class (proper), Pune (abstract)",'Option C':"Anjali (abstract), kindness (proper), class (common), Pune (collective)",'Option D':"Anjali (proper), kindness (abstract), class (collective), Pune (proper)",'Correct Option':'D',Explanation:"Excellent! Anjali and Pune are proper nouns (specific names), kindness is abstract (a quality), and class is collective (a group) — you've mastered all four noun types!",Active:true},
  ],
};

// Recognizes every common way a Sheets cell can spell "inactive": boolean false,
// numeric 0, or the text 'No'/'FALSE'/'Inactive' in any capitalization. A blank or
// missing cell (e.g. a tab that doesn't have this column at all) defaults to
// active, so it never silently hides rows that simply haven't set this field.
function isRowActive(v) {
  if (v === undefined || v === null || v === '') return true;
  if (v === false || v === 0) return false;
  const s = String(v).trim().toLowerCase();
  return !(s === 'false' || s === 'no' || s === 'n' || s === '0' || s === 'inactive');
}

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

function AssignmentSubjectsGrid({ subjects, statsFor, onOpen }) {
  if (!subjects.length) {
    return <div className="card" style={{textAlign:'center',color:'var(--muted)',fontSize:'13px'}}>No subjects configured yet — check back once your teacher adds one!</div>;
  }
  return (
    <div className="asgn-subj-grid">
      {subjects.map(s => {
        const { total, completed } = statsFor(s.Subject);
        return (
          <div key={s.Subject} className="asgn-subj-card" role="button" tabIndex={0}
            onClick={() => onOpen(s.Subject)}
            onKeyDown={e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); onOpen(s.Subject); } }}>
            <div className="asgn-subj-icon" style={{background:`${s['Color (Hex)']}22`,color:s['Color (Hex)']}}>
              {s.Emoji || <i className={`fa-solid ${s['Icon (FontAwesome solid)']||'fa-book'}`} />}
            </div>
            <div style={{flex:1}}>
              <div className="asgn-subj-name">{s.Subject}</div>
              <p className="asgn-subj-tag">{s.Tagline}</p>
            </div>
            <div className="asgn-subj-count">
              {total>0 ? <><span className="n">{completed}/{total}</span><span className="l">Topics</span></> : <span className="asgn-subj-soon">Coming Soon</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
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

function LearningModulePlayer({ module, steps, progress, onSave, onExit, backLabel='Back to topics' }) {
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
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> {backLabel}</button>
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
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> {backLabel}</button>
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
    // Group the concept recap by Learning Section (falls back to one flat group if a
    // module doesn't define sections, e.g. older/simpler modules).
    const conceptGroups = [];
    steps.forEach(s => {
      const label = s['Learning Section'] || null;
      const last = conceptGroups[conceptGroups.length-1];
      if (last && last.label === label) last.items.push(s);
      else conceptGroups.push({ label, items: [s] });
    });
    return (
      <div className="content">
        <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> {backLabel}</button>
        <div className="card">
          <div className="lp-score-ring"><span className="n">{correctCount}/{total}</span><span className="l">{pct}% Correct</span></div>
          <p className="lp-encourage">{encourage}</p>
          <div className="sec-divider">Concepts You Learned</div>
          {conceptGroups.map((g,gi) => (
            <div key={gi} style={g.label?{marginBottom:'14px'}:undefined}>
              {g.label && <div className="lp-concept-section-lbl">{g.label}</div>}
              {g.items.map(s => <div key={s['Step Number']} className="lp-concept-item"><i className="fa-solid fa-circle-check" /> {s.Teaching}</div>)}
            </div>
          ))}
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
          {module['Now You Try'] && (
            <div className="lp-try-card">
              <div className="lp-try-lbl"><i className="fa-solid fa-pen-fancy" /> Now You Try</div>
              <p>{module['Now You Try']}</p>
            </div>
          )}
          <div className="lp-actions">
            <button className="btn-t" onClick={retake}><i className="fa-solid fa-rotate-right" /> Retake Topic</button>
            <button className="btn-outline" onClick={onExit}><i className="fa-solid fa-arrow-left" /> {backLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LESSON (teach a fact, then ask about it) ──
  const opts = ['A','B','C','D'];
  return (
    <div className="content">
      <button className="lp-back" onClick={onExit}><i className="fa-solid fa-arrow-left" /> {backLabel}</button>
      <div className="card">
        <div className="lp-step-lbl">Step {idx+1} of {total} · {step['Learning Section'] || module.Title}</div>
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
            {step['Learn More URL'] && (
              <a className="lp-learnmore" href={step['Learn More URL']} target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-book-open" /> {step['Learn More Label'] || 'Learn more'} <i className="fa-solid fa-arrow-up-right-from-square" />
              </a>
            )}
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
  const [notifs,      setNotifs]      = useState(FALLBACK.notifications.filter(n=>isRowActive(n.Active)));
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeAssignmentSubject, setActiveAssignmentSubject] = useState(null);
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
          assignmentSubjects: data.assignmentSubjects?.length ? data.assignmentSubjects : FALLBACK.assignmentSubjects,
          learningModules: data.learningModules?.length ? data.learningModules : FALLBACK.learningModules,
          learningSteps:   data.learningSteps?.length   ? data.learningSteps   : FALLBACK.learningSteps,
        };
        setCfg(merged);
        setNotifs(merged.notifications.filter(n=>isRowActive(n.Active)));
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
  const NAV        = cfg.navigation.filter(t => isRowActive(t.Active));
  const statCards  = cfg.dashStats.filter(s => isRowActive(s.Active) && s['Metric Key'] && ['attendance_pct','submissions_pct','avg_score','pending_tasks'].includes(s['Metric Key']));
  const ratioStats = cfg.dashStats.filter(s => isRowActive(s.Active) && s['Metric Key'] && s['Metric Key'].startsWith('ratio_'));
  const SUBJ       = cfg.subjects.filter(s => isRowActive(s.Active));
  const AMON       = cfg.attMonthly;
  const ASTAT      = cfg.attStats;
  const ASGN       = cfg.assignments.filter(a => isRowActive(a.Active));
  const SCHED      = cfg.schedule.filter(s => isRowActive(s.Active));
  const PFIELDS    = cfg.profileFields;
  const LMOD    = (cfg.learningModules||[]).filter(m=>isRowActive(m.Active)).sort((a,b)=>(Number(a['Display Order'])||0)-(Number(b['Display Order'])||0));
  const ALLLSTEPS = (cfg.learningSteps||[]).filter(s=>isRowActive(s.Active));
  const stepsFor = moduleId => ALLLSTEPS.filter(s=>s['Module ID']===moduleId).sort((a,b)=>(Number(a['Step Number'])||0)-(Number(b['Step Number'])||0));
  // Step 1 of the drill-down: subjects come from their own config rows, but the
  // topic COUNT and progress shown on each subject card is always computed live
  // from LMOD — so a brand-new subject just needs a row here + topic rows above,
  // no app code changes.
  const ASGN_SUBJ = (cfg.assignmentSubjects||[]).filter(s=>isRowActive(s.Active)).sort((a,b)=>(Number(a['Display Order'])||0)-(Number(b['Display Order'])||0));
  const topicsForSubject = subjectName => LMOD.filter(m=>m.Subject===subjectName);
  const subjectStats = subjectName => {
    const topics = topicsForSubject(subjectName);
    const completed = topics.filter(m => learnProgress[m['Module ID']]?.completedAt).length;
    return { total: topics.length, completed };
  };
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

  // Leaving the Assignments tab always returns to Subject selection (Step 1) next time it's opened.
  useEffect(() => { if (tab !== 'assignments') { setActiveModuleId(null); setActiveAssignmentSubject(null); } }, [tab]);

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
    /* ── Assignment drill-down: Subject grid + breadcrumb (Step 1) ───────── */
    .asgn-subj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:8px;}
    .asgn-subj-card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:20px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:16px;}
    .asgn-subj-card:hover{border-color:rgba(0,198,167,.35);box-shadow:0 14px 30px rgba(0,0,0,.32);transform:translateY(-2px);}
    .asgn-subj-card:focus-visible{outline:2px solid var(--teal);outline-offset:2px;}
    .asgn-subj-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;}
    .asgn-subj-name{font-family:var(--fd);font-size:16px;font-weight:900;color:#fff;margin-bottom:3px;}
    .asgn-subj-tag{font-size:12px;color:rgba(255,255,255,.5);line-height:1.5;}
    .asgn-subj-count{text-align:center;flex-shrink:0;}
    .asgn-subj-count .n{display:block;font-family:var(--fd);font-size:18px;font-weight:900;color:var(--teal);}
    .asgn-subj-count .l{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-top:2px;}
    .asgn-subj-soon{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:100px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);border:1px solid var(--border);white-space:nowrap;}
    .asgn-breadcrumb{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;margin-bottom:18px;flex-wrap:wrap;}
    .asgn-crumb{color:var(--muted);cursor:pointer;transition:color .2s;}
    .asgn-crumb:hover{color:var(--teal);}
    .asgn-crumb-sep{font-size:9px;color:var(--border);}
    .asgn-crumb-current{color:#fff;}
    .lp-try-card{background:rgba(0,198,167,.06);border:1px solid rgba(0,198,167,.2);border-radius:var(--r);padding:16px 18px;margin:18px 0;}
    .lp-try-lbl{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--teal);margin-bottom:8px;}
    .lp-try-card p{font-size:13px;color:rgba(255,255,255,.75);line-height:1.6;}
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
    .lp-learnmore{display:inline-flex;align-items:center;gap:7px;margin-top:10px;font-size:12px;font-weight:700;color:var(--teal);text-decoration:none;}
    .lp-learnmore:hover{text-decoration:underline;}
    .lp-learnmore i:last-child{font-size:9px;opacity:.7;}
    .lp-score-ring{width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;margin:0 auto 18px;border:6px solid rgba(0,198,167,.18);}
    .lp-score-ring .n{font-family:var(--fd);font-size:30px;font-weight:900;color:#fff;line-height:1;}
    .lp-score-ring .l{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;}
    .lp-encourage{text-align:center;font-size:15px;font-weight:700;color:#fff;}
    .lp-concept-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;color:rgba(255,255,255,.75);line-height:1.6;}
    .lp-concept-item:last-child{border-bottom:none;}
    .lp-concept-item i{color:var(--teal);margin-top:2px;flex-shrink:0;}
    .lp-concept-section-lbl{font-size:11px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 2px;}
    .lp-mistake{background:var(--surf2);border:1px solid var(--border);border-radius:11px;padding:14px 16px;margin-bottom:10px;}
    .lp-mistake-q{font-size:13.5px;font-weight:700;color:#fff;margin-bottom:6px;}
    .lp-mistake-row{font-size:12.5px;color:rgba(255,255,255,.6);margin-bottom:3px;}
    .lp-actions{display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap;}
    @media(max-width:640px){.lm-grid{grid-template-columns:1fr;}.asgn-subj-grid{grid-template-columns:1fr;}.lp-opts{grid-template-columns:1fr;}.lp-hero{padding:28px 18px;}}
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
                `assignmentSubjects`, `learningModules` and `learningSteps` arrays
                (see FALLBACK above for the exact shape) so teachers can author
                subjects/topics from the Sheet. Until then this gracefully runs
                on the FALLBACK content. A POST /api/student/progress endpoint
                doesn't exist yet either — progress below is fully functional
                via localStorage per student, but won't sync across devices
                until that route is built.

                DRILL-DOWN FLOW (Subject → Topic → Lesson): adding a brand-new
                subject or topic never needs a code change here — just add rows
                to assignmentSubjects / learningModules / learningSteps above
                (or their matching Sheet tabs once wired up). */}
            {tab==='assignments' && (<>
              {/* STEP 1 — Subject selection (the section's home view) */}
              {!activeAssignmentSubject && (
                <div className="main-top"><div><div className="pg-h">Learning &amp; Assignments</div><div className="pg-s">Choose a subject to start your guided lesson, or view your homework below.</div></div></div>
              )}
              {/* STEP 2 / 3 — breadcrumb once a subject (and maybe a topic) is selected */}
              {activeAssignmentSubject && (
                <div className="asgn-breadcrumb">
                  <span className="asgn-crumb" onClick={()=>{setActiveAssignmentSubject(null);setActiveModuleId(null);}}>Assignments</span>
                  <i className="fa-solid fa-chevron-right asgn-crumb-sep" />
                  {activeModuleId ? (
                    <>
                      <span className="asgn-crumb" onClick={()=>setActiveModuleId(null)}>{activeAssignmentSubject}</span>
                      <i className="fa-solid fa-chevron-right asgn-crumb-sep" />
                      <span className="asgn-crumb-current">{LMOD.find(m=>m['Module ID']===activeModuleId)?.Title}</span>
                    </>
                  ) : (
                    <span className="asgn-crumb-current">{activeAssignmentSubject}</span>
                  )}
                </div>
              )}

              {!activeAssignmentSubject ? (
                /* ── STEP 1: Subject grid + Homework (unchanged section) ── */
                <div className="content">
                  <div className="sec-divider" style={{marginTop:0}}>Choose a Subject</div>
                  <AssignmentSubjectsGrid subjects={ASGN_SUBJ} statsFor={subjectStats} onOpen={setActiveAssignmentSubject} />

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
              ) : !activeModuleId ? (
                /* ── STEP 2: Topic grid, filtered to the chosen subject ── */
                <div className="content">
                  <button className="lp-back" onClick={()=>setActiveAssignmentSubject(null)}><i className="fa-solid fa-arrow-left" /> Back to Subjects</button>
                  <div className="sec-divider" style={{marginTop:0}}>{activeAssignmentSubject} Topics</div>
                  <LearningModulesGrid modules={topicsForSubject(activeAssignmentSubject)} stepsFor={stepsFor} progressMap={learnProgress} onOpen={setActiveModuleId} />
                </div>
              ) : (
                /* ── STEP 3: Introduction → Progressive Learning → Completion ── */
                <LearningModulePlayer
                  module={LMOD.find(m=>m['Module ID']===activeModuleId)}
                  steps={stepsFor(activeModuleId)}
                  progress={learnProgress[activeModuleId]}
                  onSave={patch=>saveLearnProgress(activeModuleId, patch)}
                  onExit={()=>setActiveModuleId(null)}
                  backLabel={`Back to ${activeAssignmentSubject} Topics`}
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
