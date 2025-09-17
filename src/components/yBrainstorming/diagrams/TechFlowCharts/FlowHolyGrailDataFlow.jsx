import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "../Business/Support/VerboseNode"; // If you have a custom node

export default function FlowHolyGrailDataFlow() {
  // ----------------------------------------
  // 1) EDGES
  //   Draw lines to show references: e.g., subchapters_demo subChapterId -> subchapterConcepts, etc.
  // ----------------------------------------
  const edges = [
    // Book -> Chapter
    {
      id: "edge-books-chapters",
      source: "books_demo",
      target: "chapters_demo",
      label: "bookId (Parent→Child)",
      style: { strokeWidth: 2 },
    },
    // Chapter -> Subchapter
    {
      id: "edge-chapters-subchapters",
      source: "chapters_demo",
      target: "subchapters_demo",
      label: "chapterId (Parent→Child)",
      style: { strokeWidth: 2 },
    },
    // Subchapter -> SubchapterConcepts
    {
      id: "edge-subch-subchconcepts",
      source: "subchapters_demo",
      target: "subchapterConcepts",
      label: "subChapterId",
      style: { strokeWidth: 2 },
    },
    // Subchapter -> Quizzes
    {
      id: "edge-subch-quizzes",
      source: "subchapters_demo",
      target: "quizzes_demo",
      label: "subchapterId in quizzes",
      style: { strokeDasharray: "4 2" },
    },
    // Subchapter -> Revisions
    {
      id: "edge-subch-revisions",
      source: "subchapters_demo",
      target: "revisions_demo",
      label: "subchapterId in revisions",
      style: { strokeDasharray: "4 2" },
    },
    // Adaptive Plan -> Subchapter reference (implicit in sessions.activities)
    {
      id: "edge-adaptive-subchapters",
      source: "adaptive_demo",
      target: "subchapters_demo",
      label: "activities[].subChapterId",
      style: { strokeDasharray: "3 3", stroke: "#999" },
    },
    // (Optional) If you want to show userId references, you could add user->collection edges, etc.
  ];

  // ----------------------------------------
  // 2) NODES
  //   Each node is a "verboseNode" so the user sees big tooltips on hover
  //   We'll group them by "lanes," placing them at different x-coordinates.
  // ----------------------------------------
  const nodes = [
    // ===============================
    // LANE 1: BOOKS / CHAPTERS / SUBCHAPTERS
    // ===============================

    {
      id: "books_demo",
      type: "verboseNode",
      position: { x: 50, y: 0 },
      data: {
        label: "books_demo",
        details: `Collection storing top-level Book docs.
Key Fields:
- name: "Book Title"
- userId: which user "owns" this cloned copy
- createdAt: timestamp
Relationships:
- "bookId" used as a parent ref in chapters_demo
Relevant Code:
- createBookDoc (onDocumentCreated => pdfExtracts/{docId})
- cloneStandardBook (onRequest) => duplicates standard book structure for new user`,
      },
    },
    {
      id: "chapters_demo",
      type: "verboseNode",
      position: { x: 50, y: 220 },
      data: {
        label: "chapters_demo",
        details: `Stores Chapter docs per Book.
Key Fields:
- name: "Chapter 1"
- bookId: reference to books_demo
- userId
- createdAt
Relationships:
- "chapterId" used as parent ref in subchapters_demo
Relevant Code:
- segmentChapters => creates chapters_demo docs from PDF analysis
- createSubChaptersDemoOnCreate => references chapterDemoId`,
      },
    },
    {
      id: "subchapters_demo",
      type: "verboseNode",
      position: { x: 50, y: 440 },
      data: {
        label: "subchapters_demo",
        details: `Stores each Subchapter doc.
Key Fields:
- name: subchapter title
- chapterId => link to chapters_demo
- userId, bookId
- summary => often the final text (after GPT rewriting)
- wordCount => used to estimate reading time
Relationships:
- "subChapterId" => subchapterConcepts
- references from quizzes_demo, revisions_demo
Relevant Code:
- sliceMarkerTextForSubchapter => merges pages for a subchapter
- repurposeSubChapterWithContext => GPT rewriting
- updateSubChaptersDemoOnUpdate => sets "summary", wordCount
- conceptExtractionRequested => triggers extractConceptsOnFlag`,
      },
    },
    {
      id: "subchapterConcepts",
      type: "verboseNode",
      position: { x: 50, y: 660 },
      data: {
        label: "subchapterConcepts",
        details: `Child docs for subchapters.
Key Fields:
- subChapterId => which subchapter
- name => concept name
- summary => short explanation
- subPoints => array of bullet points
Relevant Code:
- extractConceptsOnFlag => GPT extracts major concepts => subchapterConcepts
- bulkExtractConceptsForBook => sets conceptExtractionRequested on each subchapter`,
      },
    },

    // ===============================
    // LANE 2: QUIZZES & REVISIONS
    // ===============================
    {
      id: "quizzes_demo",
      type: "verboseNode",
      position: { x: 460, y: 200 },
      data: {
        label: "quizzes_demo",
        details: `Stores each quiz attempt for a user + subchapter.
Key Fields:
- userId
- subchapterId
- quizType => "remember" | "understand" | ...
- attemptNumber => incremental
- score => "80%" or numeric
- quizSubmission => array of questions w/ conceptName & userAnswer
Relevant Code:
- /api/submitQuiz => writes doc
- /api/getQuiz => fetches attempts
- StageManager in front-end => passes quiz results
- We parse conceptName to see which concepts user got correct or not`,
      },
    },
    {
      id: "revisions_demo",
      type: "verboseNode",
      position: { x: 460, y: 420 },
      data: {
        label: "revisions_demo",
        details: `Tracks revision sessions after quiz attempts fail or user wants to revisit.
Key Fields:
- userId
- subchapterId
- revisionType => same as quizType
- revisionNumber => matches quiz attemptNumber
- timestamp
Relevant Code:
- /api/submitRevision => creates doc
- /api/getRevisions => fetches them
- StageManager => checks if revision for latest quiz attempt was done => move to next stage`,
      },
    },

    // ===============================
    // LANE 3: ADAPTIVE DEMO (PLANS)
    // ===============================
    {
      id: "adaptive_demo",
      type: "verboseNode",
      position: { x: 880, y: 300 },
      data: {
        label: "adaptive_demo",
        details: `Each doc is an adaptive plan for the user.
Key Fields:
- userId
- bookId
- examId => e.g. "general", "TOEFL"
- sessions => array of daily tasks
   .activities => each references subChapterId, quizStage, timeNeeded
- wpmUsed, dailyReadingTimeUsed, level => plan parameters
- maxDayCount => how many days to schedule
Relevant Code:
- generateAdaptivePlan2 => builds sessions[] from subchapters + user's reading speed
- get or list these plan docs => front-end can show daily tasks
Relationships:
- sessions[].subChapterId => link to subchapters_demo
- user can track progress with quizzes/revisions`,
      },
    },

    // ===============================
    // LANE 4: PDF PROCESSING & BACKEND UTILS
    // ===============================
    {
      id: "pdfExtracts",
      type: "verboseNode",
      position: { x: 1300, y: 0 },
      data: {
        label: "pdfExtracts",
        details: `Intermediate storage for uploaded PDFs.
Key Fields:
- filePath => in Cloud Storage
- markerText => combined text of pages
- userId
- createdAt
Used by:
- onPDFUpload => parse PDF => store pages in pdfPages => create pdfExtract doc
- addMarkersAndSummarize => calls GPT to identify top-level chapters
- createBookDoc => might create a new book for user if needed
`,
      },
    },
    {
      id: "pdfPages",
      type: "verboseNode",
      position: { x: 1300, y: 220 },
      data: {
        label: "pdfPages",
        details: `Stores each page from the PDF after parse.
Key Fields:
- pdfDocId => link to pdfExtracts doc
- pageNumber
- text => the content
Used by:
- addMarkersAndSummarize => merges pages => GPT
- segmentChapters => we create chapters by page ranges
`,
      },
    },
    {
      id: "pdfSummaries",
      type: "verboseNode",
      position: { x: 1300, y: 440 },
      data: {
        label: "pdfSummaries",
        details: `GPT summary of entire PDF, segmented into chapters with startPage..endPage.
Key Fields:
- pdfDocId => link to pdfExtracts
- summary => JSON from GPT: { chapters: [..., {title, summary, startPage, endPage}] }
- createdAt
Used by:
- segmentChapters => actually creates docs in pdfChapters + chapters_demo
`,
      },
    },
    {
      id: "pdfChapters",
      type: "verboseNode",
      position: { x: 1300, y: 660 },
      data: {
        label: "pdfChapters",
        details: `Breakdown of the PDF's chapters post-GPT.
Key Fields:
- pdfDocId, pdfSummariesDocId
- chapterDemoId => link to chapters_demo
- title, summary
- startPage, endPage
- fullText, fullTextMarkers => text w/ markers
Used by:
- sliceMarkerTextForChapter => generate sub-chapters
- addMarkersToFullText => inserts [INDEX=xyz] markers
- summarizeFullTextMarkers => second-level GPT step
`,
      },
    },
    {
      id: "pdfSubSummaries",
      type: "verboseNode",
      position: { x: 1300, y: 880 },
      data: {
        label: "pdfSubSummaries",
        details: `GPT sub-chapter breakdown from pdfChapters.
Key Fields:
- pdfChapterId
- subChaptersJson => { subChapters: [{title, summary, startMarker, endMarker}, ...] }
Used by:
- segmentSubChapters => create pdfSubChapters + subchapters_demo
`,
      },
    },
    {
      id: "pdfSubChapters",
      type: "verboseNode",
      position: { x: 1300, y: 1100 },
      data: {
        label: "pdfSubChapters",
        details: `Stores sub-chapter breakdown from GPT.
Key Fields:
- pdfChapterId
- title, summary
- startMarker, endMarker => page-range or text indexes
- fullText => optionally stored
- subChapterId => link to subchapters_demo
Used by:
- repurposeSubChapterWithContext => re-writes partial text with neighboring context
- createSubChaptersDemoOnCreate => new doc in subchapters_demo`,
      },
    },

    // ===============================
    // LANE 5: CLONING & USER TRIGGERS
    // ===============================
    {
      id: "cloneStandardBook",
      type: "verboseNode",
      position: { x: 1700, y: 50 },
      data: {
        label: "cloneStandardBook (HTTP)",
        details: `Cloud Function that duplicates a "standard" book into a new user's own books_demo/chapters_demo/subchapters_demo structure.
Steps:
1) Read standardBookId, targetUserId
2) Copy doc in books_demo => new doc => userId=targetUserId
3) For each chapter => copy => new chapter doc => userId=targetUserId
4) For each subchapter => copy => new doc => ...
5) For each subchapterConcept => copy => ...
Reference Code:
- exports.cloneStandardBook = onRequest(...)
Used by:
- Possibly to initialize brand-new users with standard content`,
      },
    },
    {
      id: "cloneToeflBooksOnUserCreate",
      type: "verboseNode",
      position: { x: 1700, y: 300 },
      data: {
        label: "cloneToeflBooksOnUserCreate (onDocumentCreated users/{userId})",
        details: `When a new user doc is created:
1) We call cloneStandardBook multiple times (for each standardBookId)
2) The user ends up with 4 cloned TOEFL books
3) We store cloned results in user doc
Relevant Code:
- exports.cloneToeflBooksOnUserCreate`,
      },
    },
    {
      id: "bulkExtractConceptsForBook",
      type: "verboseNode",
      position: { x: 1700, y: 550 },
      data: {
        label: "bulkExtractConceptsForBook (onDocumentUpdated books_demo/{bookId})",
        details: `Triggers if "conceptExtractionRequested" changes false->true:
1) Finds all subchapters_demo for that book
2) Sets conceptExtractionRequested=true for each subchapter
3) The extractConceptsOnFlag function on subchapters_demo then calls GPT
Relevant Code:
- exports.bulkExtractConceptsForBook`,
      },
    },

    // ===============================
    // LANE 6: ADDITIONAL TRIGGERS & UTILS
    // ===============================
    {
      id: "extractConceptsOnFlag",
      type: "verboseNode",
      position: { x: 2100, y: 50 },
      data: {
        label: "extractConceptsOnFlag (onDocumentUpdated subchapters_demo/{docId})",
        details: `If conceptExtractionRequested goes false->true:
1) We gather subchapter's summary
2) Send GPT prompt => parse JSON => store in subchapterConcepts
3) Mark conceptExtractionComplete=true
Error handling => conceptExtractionError
Reference Code:
- exports.extractConceptsOnFlag`,
      },
    },
    {
      id: "generateAdaptivePlan2",
      type: "verboseNode",
      position: { x: 2100, y: 350 },
      data: {
        label: "generateAdaptivePlan2 (onRequest)",
        details: `HTTP endpoint for building an adaptive plan doc in 'adaptive_demo'.
Steps:
1) Input: userId, targetDate, examId, wpm, dailyReadingTime...
2) Fetch user persona => e.g. wpm, dailyReadingTime if not overridden
3) Gather all subchapters (optionally filtering by selectedBooks, etc.)
4) Build sessions => each day gets tasks (READ, QUIZ) 
5) Insert doc in 'adaptive_demo'
Used by front-end or server to create a custom schedule.`,
      },
    },
    {
      id: "user_activities_demo",
      type: "verboseNode",
      position: { x: 2100, y: 650 },
      data: {
        label: "user_activities_demo",
        details: `Logs user reading events, quiz completions, etc.
Key Fields:
- userId
- subChapterId
- eventType => "startReading", "stopReading", "quizCompleted", ...
- timestamp
Used by:
- /api/user-activities => track progress or day by day usage
- revision suggestions logic, etc.`,
      },
    },
  ];

  // We'll define the nodeTypes
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