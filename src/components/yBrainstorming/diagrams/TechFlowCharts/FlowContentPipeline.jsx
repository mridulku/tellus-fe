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

import VerboseNode from "../Business/Support/VerboseNode"; // Your custom tooltip node

/**
 * FlowComponentsBreakdown
 * -----------------------
 * Renders multiple "vertical" flows side by side:
 *   - PlanFetcher
 *   - LeftPanel
 *   - MainContent
 *   - ReadingView, QuizView, ReviseView
 *   - planSlice
 *   - authSlice
 *   - store
 *   - TopBar
 * 
 * Each lane is a separate set of nodes/edges stacked vertically (top to bottom).
 * We do NOT create edges across lanes, so each lane stands alone.
 */

export default function FlowPreLogin() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //

      // LANE A: LandingPage (x=0)
// ========== LANE A: onPDFUpload (x=0) ==========
{
    id: "A1",
    type: "verboseNode",
    position: { x: 0, y: 0 },
    data: {
      label: "onPDFUpload: Trigger => GCS PDF Finalized",
      details: `
  • Triggered when a PDF is uploaded to a Cloud Storage bucket.
  • Extracts metadata => userId, category, courseName
  • If contentType !== 'pdf', skip.
  • Download the PDF to /tmp, parse with pdf-parse => produce fullText.
  • Then we split text => lines => paragraphs => store them in pdfPages (one doc per paragraph).
  • Then create a doc in pdfExtracts with combined text + user/course info.
  Hence we “ingest” the PDF into Firestore as paragraphs (pdfPages) plus a summary doc in pdfExtracts.
      `,
    },
  },
  {
    id: "A2",
    type: "verboseNode",
    position: { x: 0, y: 200 },
    data: {
      label: "onPDFUpload: Steps Outline",
      details: `
  1) if (not pdf) => return
  2) Download => parse => lines => paragraphs
  3) For each paragraph => create doc in pdfPages => { pdfDocId, pageNumber, text }
  4) Summarize finalText => store in pdfExtracts => { text, userId, category, ... }
   
  Hence any subsequent logic can reference pdfExtracts + pdfPages to process further or to link with a book doc.
      `,
    },
  },
  
  // ========== LANE B: countTokens (x=600) ==========
  {
    id: "B1",
    type: "verboseNode",
    position: { x: 600, y: 0 },
    data: {
      label: "countTokens: onDocumentCreated => pdfExtracts/{docId}",
      details: `
  • Triggered whenever a new doc in pdfExtracts is created.
  • We read docSnap => data.markerText => if present => pass to Tiktoken => count tokens => update doc with tokenCount.
  Hence we do a quick token usage check for the stored text.
      `,
    },
  },
  {
    id: "B2",
    type: "verboseNode",
    position: { x: 600, y: 200 },
    data: {
      label: "countTokens: Steps Outline",
      details: `
  1) If markerText => encode => tokens.length => tokenCount
  2) pdfExtracts/{docId}.update({ tokenCount, tokenCountedAt })
  3) If no markerText => skip
  Hence it’s a small function that logs or stores how large the PDF text is in GPT token terms.
      `,
    },
  },
  
  // ========== LANE C: addMarkersAndSummarize (x=1200) ==========
  {
    id: "C1",
    type: "verboseNode",
    position: { x: 1200, y: 0 },
    data: {
      label: "addMarkersAndSummarize: onDocumentCreated => pdfExtracts/{docId}",
      details: `
  • Triggered after a new doc is created in pdfExtracts.
  • We fetch all pdfPages => combine them => store as markerText => call GPT => store summary in pdfSummaries.
      `,
    },
  },
  {
    id: "C2",
    type: "verboseNode",
    position: { x: 1200, y: 200 },
    data: {
      label: "addMarkersAndSummarize: Steps Outline",
      details: `
  1) docSnap => data => pdfDocId
  2) Query pdfPages => combine text => pdfExtracts/{docId}.update({ markerText })
  3) GPT => createChatCompletion => JSON structure with chapters => store result in pdfSummaries => { summary, pdfDocId }
  Hence we produce a top-level “chapter” summary from entire PDF.
      `,
    },
  },
  
  // ========== LANE D: segmentChapters (x=1800) ==========
  {
    id: "D1",
    type: "verboseNode",
    position: { x: 1800, y: 0 },
    data: {
      label: "segmentChapters: onDocumentCreated => pdfSummaries/{summaryId}",
      details: `
  • Triggered after we store GPT summary in pdfSummaries => the JSON has [ { title, summary, startPage, endPage } ].
  • We parse that JSON => for each “chapter” => fetch pages => create pdfChapters => also create chapters_demo 
   ( linking to books_demo doc by “bookId” ).
      `,
    },
  },
  {
    id: "D2",
    type: "verboseNode",
    position: { x: 1800, y: 200 },
    data: {
      label: "segmentChapters: Steps Outline",
      details: `
  1) docSnap => data => pdfDocId, summary (GPT JSON)
  2) parse JSON => chapters array
  3) fetch pdfExtracts => find bookId => fetch books_demo => userId
  4) for each chapter => combine pages => store in pdfChapters => also create chapters_demo => link doc IDs
  Hence we break the PDF into large “chapters.” 
      `,
    },
  },
  
  // ========== LANE E: createBookDoc (x=2400) ==========
  {
    id: "E1",
    type: "verboseNode",
    position: { x: 2400, y: 0 },
    data: {
      label: "createBookDoc: onDocumentCreated => pdfExtracts/{docId}",
      details: `
  • Another trigger if we want to create a books_demo doc from the new pdfExtracts doc => courseName => "books_demo".
  • We also store the newly created book ID in pdfExtracts => "bookDemoId".
      `,
    },
  },
  {
    id: "E2",
    type: "verboseNode",
    position: { x: 2400, y: 200 },
    data: {
      label: "createBookDoc: Steps Outline",
      details: `
  1) docSnap => data => courseName, userId, category
  2) find categories_demo => matching "name" => if found => categoryId
  3) create in books_demo => { categoryId, name: courseName, userId }
  4) update pdfExtracts/{docId} => { bookDemoId: newBookRef.id }
  Hence we link the PDF to a "Book" record. 
      `,
    },
  },
  
  // ========== LANE F: sliceMarkerTextForChapter (x=3000) ==========
  {
    id: "F1",
    type: "verboseNode",
    position: { x: 3000, y: 0 },
    data: {
      label: "sliceMarkerTextForChapter: onDocumentCreated => pdfChapters/{chapterId}",
      details: `
  • When a new doc is created in pdfChapters => we combine the pages [startPage..endPage] => store in "fullText"
    of that chapter doc => "textCreatedAt" timestamp.
      `,
    },
  },
  {
    id: "F2",
    type: "verboseNode",
    position: { x: 3000, y: 200 },
    data: {
      label: "sliceMarkerTextForChapter: Steps Outline",
      details: `
  1) docSnap => data => pdfDocId, startPage, endPage
  2) query pdfPages => pageNumber in [startPage..endPage]
  3) combine text => store in pdfChapters doc => fullText
  Hence each chapter doc now has a single big string for that chapter’s pages.
      `,
    },
  },
  
  // ========== LANE G: addMarkersToFullText (x=3600) ==========
  {
    id: "G1",
    type: "verboseNode",
    position: { x: 3600, y: 0 },
    data: {
      label: "addMarkersToFullText: onDocumentUpdated => pdfChapters/{chapterId}",
      details: `
  • Trigger if "fullText" changes => we insert [INDEX=xxx] every 500 chars => store in fullTextMarkers.
      `,
    },
  },
  {
    id: "G2",
    type: "verboseNode",
    position: { x: 3600, y: 200 },
    data: {
      label: "addMarkersToFullText: Steps Outline",
      details: `
  1) if newFullText != oldFullText => "insertMarkers" => fullTextMarkers
  2) docRef.update({ fullTextMarkers, markersCreatedAt })
  Hence we place artificial markers for sub-chapter segmentation or future chunking.
      `,
    },
  },
  
  // ========== LANE H: summarizeFullTextMarkers (x=4200) ==========
  {
    id: "H1",
    type: "verboseNode",
    position: { x: 4200, y: 0 },
    data: {
      label: "summarizeFullTextMarkers: onDocumentCreated => pdfChapters/{chapterId}",
      details: `
  • If sub-chapter text is large => we can ask GPT to produce a sub-chapter breakdown
     (“subChapters” array).
  • We read "fullTextMarkers" => send prompt => store result in pdfSubSummaries.
      `,
    },
  },
  {
    id: "H2",
    type: "verboseNode",
    position: { x: 4200, y: 200 },
    data: {
      label: "summarizeFullTextMarkers: Steps Outline",
      details: `
  1) docSnap => data => markers
  2) GPT prompt => parse => subChapters => store in pdfSubSummaries => { pdfChapterId, subChaptersJson }
  Hence we get another level of chunking from the chapter’s text.
      `,
    },
  },
  
  // ========== LANE I: segmentSubChapters (x=4800) ==========
  {
    id: "I1",
    type: "verboseNode",
    position: { x: 4800, y: 0 },
    data: {
      label: "segmentSubChapters: onDocumentCreated => pdfSubSummaries/{subSummaryId}",
      details: `
  • We parse the GPT JSON => subChapters => for each => create pdfSubChapters => { pdfChapterId, startMarker, endMarker }
  • Possibly link the same bookId, pdfSummariesDocId, etc. for continuity
      `,
    },
  },
  {
    id: "I2",
    type: "verboseNode",
    position: { x: 4800, y: 200 },
    data: {
      label: "segmentSubChapters: Steps Outline",
      details: `
  1) docSnap => data => pdfChapterId, subChaptersJson
  2) parse => subChapters => for each => create pdfSubChapters doc => store “title, summary, startMarker, endMarker”
  Hence we further break down each chapter into smaller “sub-chapters.” 
      `,
    },
  },
  
  // ========== LANE J: sliceMarkerTextForSubchapter (x=5400) ==========
  {
    id: "J1",
    type: "verboseNode",
    position: { x: 5400, y: 0 },
    data: {
      label: "sliceMarkerTextForSubchapter: onDocumentCreated => pdfSubChapters/{subChapterId}",
      details: `
  • We see subChapter => pdfChapterId, startMarker, endMarker => 
    we fetch pdfPages in [startMarker..endMarker] => combine => store in subChapter doc => fullText
      `,
    },
  },
  {
    id: "J2",
    type: "verboseNode",
    position: { x: 5400, y: 200 },
    data: {
      label: "sliceMarkerTextForSubchapter: Steps Outline",
      details: `
  1) docSnap => data => pdfChapterId => fetch that doc => pdfDocId
  2) from pdfDocId => query pdfPages in [startMarker..endMarker]
  3) combine => subChapterDoc.update({ fullText })
  Hence we get the final text for each sub-chapter.
      `,
    },
  },
  
  // ========== LANE K: createSubChaptersDemoOnCreate (x=6000) ==========
  {
    id: "K1",
    type: "verboseNode",
    position: { x: 6000, y: 0 },
    data: {
      label: "createSubChaptersDemoOnCreate: onDocumentCreated => pdfSubChapters/{subChapterId}",
      details: `
  • We also store each new sub-chapter in subchapters_demo => bridging with chapters_demo => linking to bookId, userId.
      `,
    },
  },
  {
    id: "K2",
    type: "verboseNode",
    position: { x: 6000, y: 200 },
    data: {
      label: "createSubChaptersDemoOnCreate: Steps Outline",
      details: `
  1) docSnap => data => pdfChapterId => fetch pdfChapters => chapterDemoId => fetch chapters_demo => { bookId, userId }
  2) doc subchapters_demo/{subChapterId} => { subChapterId, chapterId=chapterDemoId, bookId, userId, name }
  Hence subchapters_demo becomes the final “public” or “UI-facing” sub-ch docs.
      `,
    },
  },
  
  // ========== LANE L: repurposeSubChapterWithContext (x=6600) ==========
  {
    id: "L1",
    type: "verboseNode",
    position: { x: 6600, y: 0 },
    data: {
      label: "repurposeSubChapterWithContext: onDocumentUpdated => pdfSubChapters/{subChapterId}",
      details: `
  • If fullText changes => we fetch the previous page, next page => send GPT prompt to smoothly “rewrite” the sub-chapter => store in fullTextFinal.
      `,
    },
  },
  {
    id: "L2",
    type: "verboseNode",
    position: { x: 6600, y: 200 },
    data: {
      label: "repurposeSubChapterWithContext: Steps Outline",
      details: `
  1) if afterData.fullText != beforeData.fullText => gather prev/next page => GPT => “smooth transitions”
  2) store the result in fullTextFinal => repurposeContextAt
  Hence we produce a final polished text for the sub-chapter.
      `,
    },
  },
  
  // ========== LANE M: updateSubChaptersDemoOnUpdate (x=7200) ==========
  {
    id: "M1",
    type: "verboseNode",
    position: { x: 7200, y: 0 },
    data: {
      label: "updateSubChaptersDemoOnUpdate: onDocumentUpdated => pdfSubChapters/{subChapterId}",
      details: `
  • If fullTextFinal changes => compute wordCount => update subchapters_demo => summary=fullTextFinal
      `,
    },
  },
  {
    id: "M2",
    type: "verboseNode",
    position: { x: 7200, y: 200 },
    data: {
      label: "updateSubChaptersDemoOnUpdate: Steps Outline",
      details: `
  1) if newFullTextFinal != oldFullTextFinal => getWordCount => 
  2) subchapters_demo/{subChapterId}.update({ summary=fullTextFinal, wordCount })
  Hence the final text is stored in the user-facing doc + wordCount for scheduling or analysis.
      `,
    },
  },




    ];

    return nodes;
  }, []);

  // ----------------------------------------------------------------
  // 2) DEFINE EDGES
  //    Within each lane, we connect top -> bottom. No cross-lane edges.
  // ----------------------------------------------------------------
  const initialEdges = useMemo(() => {
    const edges = [
      // PlanFetcher lane
      { id: "PF1->PF2", source: "PF1", target: "PF2" },
      { id: "PF2->PF3", source: "PF2", target: "PF3" },
      { id: "PF3->PF4", source: "PF3", target: "PF4" },

      // LeftPanel lane
      { id: "LP1->LP2", source: "LP1", target: "LP2" },
      { id: "LP2->LP3", source: "LP2", target: "LP3" },
      { id: "LP3->LP4", source: "LP3", target: "LP4" },

      // MainContent lane
      { id: "MC1->MC2", source: "MC1", target: "MC2" },
      { id: "MC2->MC3", source: "MC2", target: "MC3" },

      // ReadingView lane
      { id: "RV1->RV2", source: "RV1", target: "RV2" },
      { id: "RV2->RV3", source: "RV2", target: "RV3" },

      // QuizView lane
      { id: "QV1->QV2", source: "QV1", target: "QV2" },
      { id: "QV2->QV3", source: "QV2", target: "QV3" },
      { id: "QV3->QV4", source: "QV3", target: "QV4" },

      // ReviseView lane
      { id: "RVV1->RVV2", source: "RVV1", target: "RVV2" },

      // planSlice lane
      { id: "PS1->PS2", source: "PS1", target: "PS2" },
      { id: "PS2->PS3", source: "PS2", target: "PS3" },

      // authSlice lane
      { id: "AS1->AS2", source: "AS1", target: "AS2" },

      // store lane
      { id: "ST1->ST2", source: "ST1", target: "ST2" },

      // TopBar lane
      { id: "TB1->TB2", source: "TB1", target: "TB2" },
    ];

    return edges;
  }, []);

  // ----------------------------------------------------------------
  // 3) STATE + RENDER
  // ----------------------------------------------------------------
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // No automatic layout; everything is manually positioned in columns
  // so we skip any useEffect to do layout.

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