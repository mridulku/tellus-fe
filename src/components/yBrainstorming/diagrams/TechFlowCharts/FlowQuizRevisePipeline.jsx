import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// A custom node to allow verbose tooltips or expanded details
import VerboseNode from "../Business/Support/VerboseNode";

/**
 * FlowQuizRevisePipeline
 * -----------------------
 * A highly detailed diagram showing how the "Quiz + Revision" flow works:
 *  - from the front-end (StageView, StageManager, QuizComponent, ReviseComponent)
 *  - to the server-side APIs (/api/generate, /api/getQuiz, /api/submitQuiz, etc.)
 *  - to Firestore data (quizzes_demo, revisions_demo)
 */
export default function FlowQuizRevisePipeline() {
  // Register our custom node type
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // --------------------------------------------------
  // 1) Define the Node list (with positions + details)
  // --------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //
      // LANE 1 (Front-End / UI) - MainContent -> StageView -> StageManager
      {
        id: "UI1",
        type: "verboseNode",
        position: { x: 0, y: 0 },
        data: {
          label: "MainContent.jsx",
          details: `
**File**: \`MainContent.jsx\`
**Key Points**:
- Renders different activities based on \`type\` (e.g. "read" or "quiz").
- If \`type = quiz\`, it renders <StageView />.
- This is the entry point that eventually leads us into the quiz/revision pipeline.
**Relevant Code**:
\`\`\`jsx
<StageView examId={examId} activity={currentAct} />
\`\`\`
          `,
        },
      },
      {
        id: "UI2",
        type: "verboseNode",
        position: { x: 0, y: 200 },
        data: {
          label: "StageView.jsx",
          details: `
**File**: \`StageView.jsx\`
**Key Points**:
- Receives \`activity\` with \`quizStage\`.
- Renders <StageManager /> with \`quizStage\`, \`userId\`, \`examId\`.
- If \`quizStage\` is something else (not "analyze"), it might do something else or show a placeholder.

\`\`\`jsx
<StageManager
  examId={examId}
  activity={activity}
  quizStage={quizStage}
  userId={userId}
/>
\`\`\`
          `,
        },
      },
      {
        id: "UI3",
        type: "verboseNode",
        position: { x: 0, y: 400 },
        data: {
          label: "StageManager.jsx",
          details: `
**File**: \`StageManager.jsx\`
**Key Points**:
- The heart of the flow for a given \`quizStage\` (e.g. "analyze").
- Fetches quiz attempts (from \`quizzes_demo\`) and revision attempts (from \`revisions_demo\`).
- Decides which "mode" to display: "NO_QUIZ_YET", "NEED_REVISION", "CAN_TAKE_NEXT_QUIZ", or "QUIZ_COMPLETED".
- Renders either <QuizComponent /> or <ReviseComponent /> based on the mode.

**Logic**:
1. **Fetch** quiz attempts => \`/api/getQuiz\`
2. **Fetch** revision attempts => \`/api/getRevisions\`
3. **Compute** pass/fail => set \`mode\`.
4. Conditionally render:
   - "NO_QUIZ_YET" => <QuizComponent />
   - "NEED_REVISION" => <ReviseComponent />
   - "CAN_TAKE_NEXT_QUIZ" => next <QuizComponent />
   - "QUIZ_COMPLETED" => show success

**Relevant Code**:
\`\`\`jsx
const quizRes = await axios.get("/api/getQuiz", {...});
const revRes = await axios.get("/api/getRevisions", {...});
// determine pass/fail => set mode
// then:
<QuizComponent ... /> or <ReviseComponent ... />
\`\`\`
          `,
        },
      },

      //
      // LANE 2 (Front-End / UI) - Quiz & Revision Components
      {
        id: "QUIZ1",
        type: "verboseNode",
        position: { x: 300, y: 0 },
        data: {
          label: "QuizComponent.jsx",
          details: `
**File**: \`QuizComponent.jsx\`
**Purpose**:
- Requests GPT-based quiz data from \`/api/generate\` (with \`promptKey\` = e.g. "quizAnalyze").
- Displays multiple-choice questions and collects user responses.
- On submit, calculates score, calls \`/api/submitQuiz\`, and decides pass/fail.

**Key Steps**:
1. \`axios.post("/api/generate", { userId, subchapterId, promptKey })\`
2. Parse GPT JSON => render questions
3. On "Submit Quiz":
   - Evaluate correctness => \`score = \${correctCount} / \${totalQuestions}\`
   - \`axios.post("/api/submitQuiz", {...score...})\`
   - If pass => triggers \`onQuizComplete\`
   - If fail => triggers \`onQuizFail\`
          `,
        },
      },
      {
        id: "QUIZ2",
        type: "verboseNode",
        position: { x: 300, y: 200 },
        data: {
          label: "ReviseComponent.jsx",
          details: `
**File**: \`ReviseComponent.jsx\`
**Purpose**:
- Requests GPT-based revision content from \`/api/generate\` (with \`promptKey\` = e.g. "reviseAnalyze").
- Displays revision steps or tips.
- On "Done Revising":
   - Calls \`/api/submitRevision\` to record a revision doc in \`revisions_demo\`.
   - Then notifies parent (StageManager) to let the user re-attempt the quiz.

**Key Steps**:
1. \`axios.post("/api/generate", { userId, subchapterId, promptKey })\`
2. Parse GPT JSON => render revision instructions
3. "Done" => \`axios.post("/api/submitRevision", {...})\`
4. \`onRevisionDone\`
          `,
        },
      },

      //
      // LANE 3 (Server-Side APIs) - /api/generate
      {
        id: "API1",
        type: "verboseNode",
        position: { x: 600, y: 0 },
        data: {
          label: "POST /api/generate",
          details: `
**Location**: Express server
**Code**: \`app.post("/api/generate", ... )\`
**Purpose**:
- Combines subchapter summary, user activities, and a specific prompt (by \`promptKey\`) into a single final prompt.
- Calls OpenAI Chat Completion with GPT-4 (or any model).
- Returns:
  1) \`finalPrompt\`
  2) \`result\` => GPT textual response
  3) \`UIconfig\` => Additional config info stored in Firestore prompts doc

**Major Steps**:
1. Fetch \`promptText\` & \`UIconfig\` from \`prompts\` collection.
2. Fetch user activity logs from \`user_activities_demo\`.
3. Fetch subchapter summary from \`subchapters_demo\`.
4. Combine => \`finalPrompt\`.
5. Call \`openai.chat.completions.create\`.
6. Return JSON => { finalPrompt, result, UIconfig }.
          `,
        },
      },

      //
      // LANE 4 (Server-Side APIs) - /api/getQuiz, /api/submitQuiz
      {
        id: "API2",
        type: "verboseNode",
        position: { x: 900, y: 0 },
        data: {
          label: "GET /api/getQuiz",
          details: `
**Location**: Express server
**Code**: \`app.get("/api/getQuiz", ...)\`
**Purpose**:
- Query \`quizzes_demo\` by \`userId\`, \`subchapterId\`, \`quizType\`.
- Sort descending by \`attemptNumber\` (or timestamp).
- Return all attempts for that user+subchapter+type.

**Notes**:
- Called by StageManager to check existing quiz attempts.
- Response structure:
\`\`\`json
{ "attempts": [
   {
     "docId": "...",
     "userId": "...",
     "subchapterId": "...",
     "quizType": "...",
     "quizSubmission": [...],
     "score": "...",
     "totalQuestions": 5,
     "attemptNumber": 1,
     "timestamp": ...
   }
]}
\`\`\`
          `,
        },
      },
      {
        id: "API3",
        type: "verboseNode",
        position: { x: 900, y: 200 },
        data: {
          label: "POST /api/submitQuiz",
          details: `
**Location**: Express server
**Code**: \`app.post("/api/submitQuiz", ...)\`
**Purpose**:
- Store a new quiz attempt in \`quizzes_demo\`.
- Fields: \`userId, subchapterId, quizType, quizSubmission, score, totalQuestions, attemptNumber\`.
- Returns \`docId\` of created record.

**Notes**:
- Called from QuizComponent after user submits answers.
- This is how we keep a history of attempts.
          `,
        },
      },

      //
      // LANE 5 (Server-Side APIs) - /api/getRevisions, /api/submitRevision
      {
        id: "API4",
        type: "verboseNode",
        position: { x: 1200, y: 0 },
        data: {
          label: "GET /api/getRevisions",
          details: `
**Location**: Express server
**Code**: \`app.get("/api/getRevisions", ...)\`
**Purpose**:
- Query \`revisions_demo\` by \`userId\`, \`subchapterId\`, \`revisionType\`.
- Sort descending by \`revisionNumber\`.
- Return all matching revision attempts.

**Notes**:
- Called by StageManager to see if user has done a revision for each quiz attemptNumber.
          `,
        },
      },
      {
        id: "API5",
        type: "verboseNode",
        position: { x: 1200, y: 200 },
        data: {
          label: "POST /api/submitRevision",
          details: `
**Location**: Express server
**Code**: \`app.post("/api/submitRevision", ...)\`
**Purpose**:
- Insert a doc in \`revisions_demo\` with \`revisionType\` and \`revisionNumber\`.
- Called from \`ReviseComponent\` when user finishes revision.

**Notes**:
- Ties the revision attempt to a specific quiz attemptNumber (1, 2, 3...).
- Freed for next quiz attempt once revision is done.
          `,
        },
      },

      //
      // LANE 6 (Firestore Collections) - quizzes_demo, revisions_demo
      {
        id: "DB1",
        type: "verboseNode",
        position: { x: 1600, y: 0 },
        data: {
          label: "quizzes_demo",
          details: `
**Firestore Collection**:
Stores quiz attempts:
\`\`\`js
{
  userId: string,
  subchapterId: string,
  quizType: string, // e.g. 'analyze'
  quizSubmission: [ ...questionObjects... ],
  score: "3 / 5",
  totalQuestions: 5,
  attemptNumber: 2,
  timestamp: Date,
}
\`\`\`
Used by:
- GET /api/getQuiz
- POST /api/submitQuiz
          `,
        },
      },
      {
        id: "DB2",
        type: "verboseNode",
        position: { x: 1600, y: 200 },
        data: {
          label: "revisions_demo",
          details: `
**Firestore Collection**:
Stores revision attempts:
\`\`\`js
{
  userId: string,
  subchapterId: string,
  revisionType: string,  // e.g. 'analyze'
  revisionNumber: number,
  timestamp: Date,
}
\`\`\`
Used by:
- GET /api/getRevisions
- POST /api/submitRevision
          `,
        },
      },
      {
        id: "DB3",
        type: "verboseNode",
        position: { x: 1600, y: 400 },
        data: {
          label: "subchapters_demo",
          details: `
**Firestore Collection**:
Holds subchapter data, including "summary".
**Relevant**: 
- \`app.post("/api/generate"\) fetches the "summary" to build GPT prompt.
- \`StageManager\` uses \`subchapterId\` to tie user attempts to a specific piece of content.
          `,
        },
      },

      //
      // LANE 7 (Overall Logic Flow) - bridging the steps
      {
        id: "LO1",
        type: "verboseNode",
        position: { x: 2000, y: 0 },
        data: {
          label: "Overall Flow: 1) User Enters Quiz Stage",
          details: `
**Trigger**: 
- The user navigates to the "quiz" activity in MainContent, which calls StageView -> StageManager.

**StageManager** does:
1. Calls \`/api/getQuiz\` => get quiz attempts from quizzes_demo
2. Calls \`/api/getRevisions\` => get revision attempts from revisions_demo
3. Checks if user has passed or needs revision, etc.
          `,
        },
      },
      {
        id: "LO2",
        type: "verboseNode",
        position: { x: 2000, y: 200 },
        data: {
          label: "Overall Flow: 2) If No Quiz => Generate & Submit",
          details: `
**If** quizArr is empty => "NO_QUIZ_YET":
- Renders <QuizComponent />
- QuizComponent calls \`/api/generate\` to get GPT-based questions.
- After user picks answers => calls \`/api/submitQuiz\`.
- Score is saved in quizzes_demo => attemptNumber = 1
- Then StageManager re-fetches data => sees pass/fail.
          `,
        },
      },
      {
        id: "LO3",
        type: "verboseNode",
        position: { x: 2000, y: 400 },
        data: {
          label: "Overall Flow: 3) If Fail => Revision Cycle",
          details: `
**If** last attempt is failing => passThreshold not reached => "NEED_REVISION":
- Renders <ReviseComponent /> => calls \`/api/generate\` (with "reviseAnalyze").
- After user finishes => calls \`/api/submitRevision\`.
- This unblocks them => "CAN_TAKE_NEXT_QUIZ".

**Then** user sees next quiz attempt => attemptNumber + 1
          `,
        },
      },
      {
        id: "LO4",
        type: "verboseNode",
        position: { x: 2000, y: 600 },
        data: {
          label: "Overall Flow: 4) If Pass => 'QUIZ_COMPLETED'",
          details: `
**If** user passes => "QUIZ_COMPLETED":
- Show message "Congrats! You passed."
- Possibly move on to next stage or next subchapter.

**In summary**, each subchapter can have repeated quiz attempts + revision cycles, all orchestrated by StageManager.
          `,
        },
      },
    ];

    return nodes;
  }, []);

  // ------------------------------------------------
  // 2) Define Edges (connections between the nodes)
  // ------------------------------------------------
  const initialEdges = useMemo(() => {
    const edges = [
      // LANE 1: front-end main flow
      { id: "UI1->UI2", source: "UI1", target: "UI2" },
      { id: "UI2->UI3", source: "UI2", target: "UI3" },

      // LANE 2: quiz & revise components
      { id: "QUIZ1->QUIZ2", source: "QUIZ1", target: "QUIZ2" },

      // LANE 3: single node, no direct chain

      // LANE 4: getQuiz -> submitQuiz
      { id: "API2->API3", source: "API2", target: "API3" },

      // LANE 5: getRevisions -> submitRevision
      { id: "API4->API5", source: "API4", target: "API5" },

      // LANE 6: just link them top to bottom
      { id: "DB1->DB2", source: "DB1", target: "DB2" },
      { id: "DB2->DB3", source: "DB2", target: "DB3" },

      // LANE 7: overall logic
      { id: "LO1->LO2", source: "LO1", target: "LO2" },
      { id: "LO2->LO3", source: "LO2", target: "LO3" },
      { id: "LO3->LO4", source: "LO3", target: "LO4" },
    ];
    return edges;
  }, []);

  // ------------------------------------------------
  // 3) React Flow State & Render
  // ------------------------------------------------
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%", background: "#1e1e1e" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}