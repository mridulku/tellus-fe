import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// If you have a separate VerboseNode component, import it:
import VerboseNode from "../Business/Support/VerboseNode"; // or wherever your VerboseNode is located

export default function ExpressRoutesFlow() {
  // We won't have edges since these endpoints are mostly independent
  const edges = [];

  // We place each route in a "lane" with a distinct x-position. 
  // We'll stack them vertically with y increments of 150.
  // The lane order we used:
  // LANE 1: AI Routes
  // LANE 2: PDF & RAWBOOKS
  // LANE 3: Chapter & Subchapter
  // LANE 4: User & Onboarding
  // LANE 5: Adaptive Plan & Quiz
  // LANE 6: Misc / Utility

  const nodes = [
    //
    // LANE 1: AI ROUTES (x=0)
    //
    {
      id: "AI1",
      type: "verboseNode",
      data: {
        label: "POST /api/chat",
        details: `Expects: { message, history[] }
- Merges them into a GPT messages array
- Calls OpenAI with "gpt-3.5-turbo"
- Returns { reply: <string> }
Error => 500 on failure`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "AI2",
      type: "verboseNode",
      data: {
        label: "POST /api/judge",
        details: `Expects: { history[] }
- System prompt for "Evaluator"
- Analyzes user's communication
- Returns JSON-like feedback scores
Error => 500 on failure`,
      },
      position: { x: 0, y: 150 },
    },
    {
      id: "AI3",
      type: "verboseNode",
      data: {
        label: "POST /api/hint",
        details: `Expects: { history[] }
- "In-line Coach" short advice
- Merges history => GPT
- Returns { reply } with short tip`,
      },
      position: { x: 0, y: 300 },
    },

    //
    // LANE 2: PDF & RAWBOOKS (x=600)
    //
    {
      id: "PDF1",
      type: "verboseNode",
      data: {
        label: "POST /upload-pdf",
        details: `Multipart upload of PDF
- Parse PDF => separate pages
- For each page => store in Firestore "RawBooks"
- Return { success, pagesUploaded }`,
      },
      position: { x: 600, y: 0 },
    },
    {
      id: "PDF2",
      type: "verboseNode",
      data: {
        label: "GET /api/rawbooks/bookNames",
        details: `No query params
- Fetch all docs from "RawBooks"
- Collect distinct bookName
- Return array => { bookNames: [...] }`,
      },
      position: { x: 600, y: 150 },
    },
    {
      id: "PDF3",
      type: "verboseNode",
      data: {
        label: "GET /api/rawbooks/pages",
        details: `Query: bookName, startPage, endPage
- Range query in "RawBooks"
- Return { pages: [...] }`,
      },
      position: { x: 600, y: 300 },
    },

    //
    // LANE 3: Chapter & Subchapter (x=1200)
    //
    {
      id: "CH1",
      type: "verboseNode",
      data: {
        label: "POST /api/subChapters",
        details: `Body: { data: [] of objects }
- Create docs in "SubChapterNames"
- Return { success, count }`,
      },
      position: { x: 1200, y: 0 },
    },
    {
      id: "CH2",
      type: "verboseNode",
      data: {
        label: "POST /api/chapters",
        details: `Body: { data: [] of chapters }
- For each => add doc in "Chapters"
- Return { success, count }`,
      },
      position: { x: 1200, y: 150 },
    },
    {
      id: "CH3",
      type: "verboseNode",
      data: {
        label: "GET /api/chapters",
        details: `Query: bookName
- Firestore => "Chapters" where bookName
- Return array sorted by "chapterSerial"`,
      },
      position: { x: 1200, y: 300 },
    },
    {
      id: "CH4",
      type: "verboseNode",
      data: {
        label: "POST /api/subchaptername",
        details: `Body: { data: [] }
- For each => find matching Chapter => sub-collection SubChapters
- Return { success, count }`,
      },
      position: { x: 1200, y: 450 },
    },
    {
      id: "CH5",
      type: "verboseNode",
      data: {
        label: "GET /api/subchapternames",
        details: `Query: bookName, chapterName
- Find doc in "Chapters"
- Then read sub-collection "SubChapters"
- Return array`,
      },
      position: { x: 1200, y: 600 },
    },
    {
      id: "CH6",
      type: "verboseNode",
      data: {
        label: "POST /api/complete-subchapter",
        details: `Body: { userId, subChapterId, startReading?, endReading? }
- Updates subchapters_demo doc => set proficiency=reading/read
- Return success`,
      },
      position: { x: 1200, y: 750 },
    },
    {
      id: "CH7",
      type: "verboseNode",
      data: {
        label: "GET /api/subchapters/:id",
        details: `Path param: subChapterId
- Reads subchapter doc from 'subchapters_demo'
- Return subChapterName, summary, proficiency, times`,
      },
      position: { x: 1200, y: 900 },
    },

    //
    // LANE 4: User & Onboarding (x=1800)
    //
    {
      id: "UO1",
      type: "verboseNode",
      data: {
        label: "POST /login",
        details: `Body: { username, password }
- Compare password w/ hashed userData
- Return { success, token, firebaseCustomToken, user{} } or 401`,
      },
      position: { x: 1800, y: 0 },
    },
    {
      id: "UO2",
      type: "verboseNode",
      data: {
        label: "POST /complete-onboarding",
        details: `authenticateToken => user from JWT
- userDocRef.onboardingComplete=true
- Return { success: true }`,
      },
      position: { x: 1800, y: 150 },
    },
    {
      id: "UO3",
      type: "verboseNode",
      data: {
        label: "POST /api/learnerpersona",
        details: `authenticateToken => userId
- Body: { category, answers }
- Upsert doc in "learnerPersonas", set user.onboardingComplete
- Return success`,
      },
      position: { x: 1800, y: 300 },
    },
    {
      id: "UO4",
      type: "verboseNode",
      data: {
        label: "GET /api/learner-personas",
        details: `Query: userId
- Firestore => 'learnerPersonas' => doc => isOnboarded
- Return { success, data: { isOnboarded } }`,
      },
      position: { x: 1800, y: 450 },
    },
    {
      id: "UO5",
      type: "verboseNode",
      data: {
        label: "POST /onboardingassessment",
        details: `authenticateToken => userId
- Body => store in 'onboardingAssessments'
- Return { success }`,
      },
      position: { x: 1800, y: 600 },
    },
    {
      id: "UO6",
      type: "verboseNode",
      data: {
        label: "GET /api/learner-goal",
        details: `Query: userId
- "learnerPersonas" doc => doc.answers.preparationGoal
- Return { success, data: { preparationGoal } }`,
      },
      position: { x: 1800, y: 750 },
    },
    {
      id: "UO7",
      type: "verboseNode",
      data: {
        label: "GET /api/reading-speed",
        details: `Query: userId
- Reads "onboardingAssessments" => readingTimeSec
- Return { success, data: { readingTimeSec } }`,
      },
      position: { x: 1800, y: 900 },
    },
    {
      id: "UO8",
      type: "verboseNode",
      data: {
        label: "GET /api/has-read-first-subchapter",
        details: `Query: userId
- user_activities_demo => eventType="stopReading"
- Return { success, data: { hasReadFirstSubchapter }}`,
      },
      position: { x: 1800, y: 1050 },
    },
    {
      id: "UO9",
      type: "verboseNode",
      data: {
        label: "GET /api/has-completed-quiz",
        details: `Query: userId
- user_activities_demo => eventType="quizCompleted"
- Return boolean in data`,
      },
      position: { x: 1800, y: 1200 },
    },
    {
      id: "UO10",
      type: "verboseNode",
      data: {
        label: "POST /login-google",
        details: `Body: { idToken }
- Verify ID token => uid
- Upsert user doc => JWT + firebaseCustomToken
- Return success + user info`,
      },
      position: { x: 1800, y: 1350 },
    },
    {
      id: "UO11",
      type: "verboseNode",
      data: {
        label: "POST /create-learner-persona",
        details: `Body: { userId, wpm, dailyReadingTime }
- If not exist => create doc in learnerPersonas
- Return success`,
      },
      position: { x: 1800, y: 1500 },
    },
    {
      id: "UO12",
      type: "verboseNode",
      data: {
        label: "POST /api/learner-personas/onboard",
        details: `Body: { userId }
- Sets doc { isOnboarded:true } in 'learnerPersonas'
- Return success`,
      },
      position: { x: 1800, y: 1650 },
    },

    //
    // LANE 5: Adaptive Plan & Quiz (x=2400)
    //
    {
      id: "AP1",
      type: "verboseNode",
      data: {
        label: "GET /api/adaptive-plan",
        details: `Query: { planId }
- Search 'adaptive_demo', else 'adaptive_books'
- Return { planDoc } or 404 if not found`,
      },
      position: { x: 2400, y: 0 },
    },
    {
      id: "AP2",
      type: "verboseNode",
      data: {
        label: "GET /api/home-plan-id",
        details: `Query: { userId, bookId }
- 'adaptive_books' => docs => orderBy createdAt
- Return planIds array`,
      },
      position: { x: 2400, y: 150 },
    },
    {
      id: "AP3",
      type: "verboseNode",
      data: {
        label: "GET /api/adaptive-plan-id",
        details: `Query: { userId, bookId }
- 'adaptive_demo' => docs => orderBy createdAt
- Return planIds array`,
      },
      position: { x: 2400, y: 300 },
    },
    {
      id: "AP4",
      type: "verboseNode",
      data: {
        label: "GET /api/adaptive-plans",
        details: `Query: { userId, bookId? }
- 'adaptive_demo' => filter
- Return array of plan docs`,
      },
      position: { x: 2400, y: 450 },
    },
    {
      id: "AP5",
      type: "verboseNode",
      data: {
        label: "GET /api/user-progress",
        details: `Query: userId
- user_progress_demo => merges subchapters, chapters, books
- Return array => { userId, bookName, chapterName, subChapterName, isDone }`,
      },
      position: { x: 2400, y: 600 },
    },
    {
      id: "AP6",
      type: "verboseNode",
      data: {
        label: "POST /api/quizzes",
        details: `Body: { userId, subChapterId, questions[], score, ... }
- Store doc in quizzes_demo
- Return success`,
      },
      position: { x: 2400, y: 750 },
    },
    {
      id: "AP7",
      type: "verboseNode",
      data: {
        label: "GET /api/quizzes",
        details: `Query: { userId, subChapterId }
- Return most recent doc from quizzes_demo
- { success, data } or message if not found`,
      },
      position: { x: 2400, y: 900 },
    },
    {
      id: "AP8",
      type: "verboseNode",
      data: {
        label: "POST /api/user-activities",
        details: `Body: { userId, subChapterId, eventType, timestamp }
- Creates doc in user_activities_demo
- Return { success }`,
      },
      position: { x: 2400, y: 1050 },
    },
    {
      id: "AP9",
      type: "verboseNode",
      data: {
        label: "GET /api/user-activities",
        details: `Query: userId
- Return array of user_activities_demo sorted by timestamp desc`,
      },
      position: { x: 2400, y: 1200 },
    },
    {
      id: "AP10",
      type: "verboseNode",
      data: {
        label: "POST /api/submitQuiz",
        details: `Body: { userId, subchapterId, quizType, score, attemptNumber, ... }
- Store in quizzes_demo
- Return docId`,
      },
      position: { x: 2400, y: 1350 },
    },
    {
      id: "AP11",
      type: "verboseNode",
      data: {
        label: "GET /api/getQuiz",
        details: `Query: { userId, subchapterId, quizType }
- Return all or sorted attempts from quizzes_demo`,
      },
      position: { x: 2400, y: 1500 },
    },
    {
      id: "AP12",
      type: "verboseNode",
      data: {
        label: "POST /api/submitRevision",
        details: `Body: { userId, subchapterId, revisionType, revisionNumber }
- Insert doc in "revisions_demo"
- Return success`,
      },
      position: { x: 2400, y: 1650 },
    },
    {
      id: "AP13",
      type: "verboseNode",
      data: {
        label: "GET /api/getRevisions",
        details: `Query: { userId, subchapterId, revisionType }
- Return docs from 'revisions_demo' orderBy revisionNumber`,
      },
      position: { x: 2400, y: 1800 },
    },

    //
    // LANE 6: Misc / Utility (x=3000)
    //
    {
      id: "MX1",
      type: "verboseNode",
      data: {
        label: "GET /api/books-aggregated",
        details: `Query: userId, categoryId?
- Aggregates books->chapters->subCh for reading stats
- Return array with reading/proficiency stats`,
      },
      position: { x: 3000, y: 0 },
    },
    {
      id: "MX2",
      type: "verboseNode",
      data: {
        label: "GET /api/processing-data",
        details: `Query: userId
- For each user book => pdfExtract => pdfPages => chapters => subchap
- Return big nested structure`,
      },
      position: { x: 3000, y: 150 },
    },
    {
      id: "MX3",
      type: "verboseNode",
      data: {
        label: "GET /api/chapters-process",
        details: `Query: { bookId, userId }
- pdfSummaries => parse GPT JSON => return chapters array`,
      },
      position: { x: 3000, y: 300 },
    },
    {
      id: "MX4",
      type: "verboseNode",
      data: {
        label: "GET /api/process-book-data",
        details: `Query: userId, bookId
- Returns { chapters: [ { name, subchapters:[] }, ... ] } from chapters_demo + subchapters_demo`,
      },
      position: { x: 3000, y: 450 },
    },
    {
      id: "MX5",
      type: "verboseNode",
      data: {
        label: "GET /api/latest-book",
        details: `Query: userId
- "books_demo" => orderBy createdAt desc => limit(1)
- Return { bookId }`,
      },
      position: { x: 3000, y: 600 },
    },
    {
      id: "MX6",
      type: "verboseNode",
      data: {
        label: "GET /api/books-structure",
        details: `No query => fetch all "books_demo"
- For each => get chapters_demo => subchapters_demo
- Return nested structure`,
      },
      position: { x: 3000, y: 750 },
    },
    {
      id: "MX7",
      type: "verboseNode",
      data: {
        label: "GET /api/getPrompt",
        details: `Query: promptKey
- 'prompts' => doc => { promptKey, promptText }
- Return { prompt: {...} }`,
      },
      position: { x: 3000, y: 900 },
    },
    {
      id: "MX8",
      type: "verboseNode",
      data: {
        label: "POST /api/createPrompt",
        details: `Body: { promptKey, promptText }
- If unique => create doc in "prompts"
- Return { docId, message }`,
      },
      position: { x: 3000, y: 1050 },
    },
    {
      id: "MX9",
      type: "verboseNode",
      data: {
        label: "POST /revision",
        details: `Body: { subChapterId }
- fetchSubchapter => userActivities => GPT => revision suggestions
- Return GPT JSON result`,
      },
      position: { x: 3000, y: 1200 },
    },
    {
      id: "MX10",
      type: "verboseNode",
      data: {
        label: "POST /api/generate",
        details: `Body: { userId, subchapterId, promptKey }
- Merges prompt from 'prompts' + user activities + subchap summary => GPT
- Return { finalPrompt, result, UIconfig }`,
      },
      position: { x: 3000, y: 1350 },
    },
  ];

  // Define node types so ReactFlow knows how to render "verboseNode"
  const nodeTypes = {
    verboseNode: VerboseNode,
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}


