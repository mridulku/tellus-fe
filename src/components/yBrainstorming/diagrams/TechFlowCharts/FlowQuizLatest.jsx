import React, { useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "../Business/Support/VerboseNode";       // your custom tooltip node
import { getLayoutedElements } from "../Business/Support/layoutHelper"; // your Dagre-based layout helper

/**
 * FlowDetailedQuiz
 *
 * This updated flow chart shows:
 * 1) StageManager steps (fetchData, computeState => decide mode)
 * 2) StageManager rendering => QuizComponent or ReviseComponent
 * 3) QuizComponent’s new approach: auto-fetch quizConfigs doc + questionTypes => generate questions
 * 4) Quiz submission => grading => store in /api/submitQuiz
 * 5) Revision flow => /api/submitRevision => updated state
 * 6) The relevant server endpoints: getQuiz, getRevisions, submitQuiz, etc.
 *
 * Hover each node for tooltips describing that step's logic.
 */

const nodeTypes = { verboseNode: VerboseNode };

export default function FlowQuizLatest() {
  /**
   * 1) NODES
   * Each node has an `id`, a short `label`, and `details` for the tooltip.
   * We'll connect them to illustrate the updated flow.
   */
  const initialNodes = useMemo(
    () => [
      {
        id: "stageManagerInit",
        type: "verboseNode",
        data: {
          label: "StageManager: Initialization",
          details: `
[StageManager.jsx]
Props: (examId, activity, quizStage, userId). 
Defines local states: loading, error, quizAttempts[], revisionAttempts[], mode, etc.
If subChapterId/userId missing => cannot proceed.
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "stageManagerFetchData",
        type: "verboseNode",
        data: {
          label: "StageManager: fetchData()",
          details: `
[StageManager.jsx -> useEffect => fetchData()]
1) GET /api/getQuiz?userId=&subchapterId=&quizType= => quizAttempts[]
2) GET /api/getRevisions?userId=&subchapterId=&revisionType= => revisionAttempts[]
3) computeState(...) => sets "mode":
   - NO_QUIZ_YET
   - QUIZ_COMPLETED
   - NEED_REVISION
   - CAN_TAKE_NEXT_QUIZ
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "stageManagerComputeState",
        type: "verboseNode",
        data: {
          label: "StageManager: computeState(...)",
          details: `
Examines the latest quiz attempt => parse "score" as X/Y => compare with pass ratio (0.6, 0.7, etc.)
If passed => mode="QUIZ_COMPLETED"
If not => check if revision done => mode="NEED_REVISION" or "CAN_TAKE_NEXT_QUIZ"
If no quiz => mode="NO_QUIZ_YET"
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "stageManagerModes",
        type: "verboseNode",
        data: {
          label: "StageManager: Render by 'mode'",
          details: `
If mode="NO_QUIZ_YET" => <QuizComponent ...> attemptNumber=1
If mode="QUIZ_COMPLETED" => success msg
If mode="NEED_REVISION" => <ReviseComponent ...>
If mode="CAN_TAKE_NEXT_QUIZ" => <QuizComponent ...> attemptNumber=last+1
        `,
        },
        position: { x: 0, y: 0 },
      },

      {
        id: "quizComponentMount",
        type: "verboseNode",
        data: {
          label: "QuizComponent: on mount => auto fetch quizConfigs doc",
          details: `
[QuizComponent.jsx]
1) build docId => e.g. "quizGeneralRemember" (capitalizing examId & quizStage)
2) fetch questionTypes from "questionTypes" collection
3) fetch doc from "quizConfigs/<docId>"
   => e.g. { multipleChoice: 3, fillInBlank: 2, ... }
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "quizComponentGenerate",
        type: "verboseNode",
        data: {
          label: "QuizComponent: auto-generate questions",
          details: `
For each (typeName => countVal):
  1) find questionTypeDoc in questionTypes
  2) call generateQuestions(...) with subChapterId, openAiKey, questionTypeDoc, count
  => merges all returned questions => set to generatedQuestions
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "generateQuestions",
        type: "verboseNode",
        data: {
          label: "generateQuestions(...)",
          details: `
[QuizQuestionGenerator.js]
- fetch subchapterDemo doc => subchapterSummary
- build GPT prompt:
   "I want you to produce X questions of type '...' 
    subchapter summary: ...
    expectedJsonStructure: ..."
- call OpenAI => parse JSON => { questions: [...] }
- returns success + questions
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "quizRender",
        type: "verboseNode",
        data: {
          label: "QuizComponent: Render & userAnswers",
          details: `
- For each question in generatedQuestions => <QuizQuestionRenderer ...>
- userAnswers[] holds user selections/typed responses
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "quizSubmitHandle",
        type: "verboseNode",
        data: {
          label: "QuizComponent: handleSubmit => grading => store",
          details: `
1) Group questions by 'type'
2) call gradeQuestionsOfType(...) => GPT-based grading
3) compute total score => "X/5"
4) POST /api/submitQuiz => { userId, subchapterId, quizType, quizSubmission, score, attemptNumber }
5) set showGradingResults=true => show user feedback
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "gradeQuestionsOfType",
        type: "verboseNode",
        data: {
          label: "gradeQuestionsOfType(...) (multi-call GPT)",
          details: `
[QuizQuestionGrader.js]
- for each question type => 
   build a big "batch" GPT prompt 
   => returns {score, feedback} array
- merges all results => final total
        `,
        },
        position: { x: 0, y: 0 },
      },

      {
        id: "reviseComponent",
        type: "verboseNode",
        data: {
          label: "ReviseComponent",
          details: `
If user fails => StageManager => mode="NEED_REVISION"
<ReviseComponent> => user does revision
 => POST /api/submitRevision => { userId, subchapterId, revisionType, revisionNumber }
 => StageManager fetchData => sees revision => mode="CAN_TAKE_NEXT_QUIZ"
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "stageManagerTimeline",
        type: "verboseNode",
        data: {
          label: "StageManager: timeline + attempts",
          details: `
StageManager can show all quiz attempts + revision attempts in a timeline.
Each quiz => Q# with score, color-coded pass/fail
Matching revision => R# in a different color
        `,
        },
        position: { x: 0, y: 0 },
      },

      {
        id: "apiGetQuiz",
        type: "verboseNode",
        data: {
          label: "/api/getQuiz => read attempts",
          details: `
GET /api/getQuiz => queries "quizzes_demo" 
where userId, subchapterId, quizType => returns array of attempts 
StageManager uses this to find latest attempt, decide pass/fail, etc.
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "apiSubmitQuiz",
        type: "verboseNode",
        data: {
          label: "/api/submitQuiz => store attempts",
          details: `
POST /api/submitQuiz => 
writes doc to "quizzes_demo" with userId, subchapterId, quizType, 
quizSubmission, score, attemptNumber, timestamp
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "apiGetRevisions",
        type: "verboseNode",
        data: {
          label: "/api/getRevisions => read revision logs",
          details: `
GET /api/getRevisions => queries "revisions_demo"
StageManager uses that to see if user has revised after last failing attempt
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "apiSubmitRevision",
        type: "verboseNode",
        data: {
          label: "/api/submitRevision => store revision",
          details: `
POST /api/submitRevision => 
writes doc { userId, subchapterId, revisionType, revisionNumber, timestamp }
 => "revisions_demo"
 => StageManager sees it => next mode => "CAN_TAKE_NEXT_QUIZ"
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "quizConfigsDoc",
        type: "verboseNode",
        data: {
          label: "quizConfigs/<docId>",
          details: `
Firestore doc e.g. "quizGeneralApply":
{
  "multipleChoice": 3,
  "fillInBlank": 2,
  "scenario": 1,
  // possibly difficulty, topicKeywords, etc.
}
QuizComponent fetches it => generateQuestions for each type => merges final quiz.
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "questionTypes",
        type: "verboseNode",
        data: {
          label: "questionTypes collection",
          details: `
Firestore "questionTypes":
Docs like { name: "multipleChoice", expectedJsonStructure: {...} }
Used by generateQuestions(...) to embed the correct JSON shape instructions in GPT prompt.
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "subchaptersDoc",
        type: "verboseNode",
        data: {
          label: "subchapters_demo/<subChapterId>",
          details: `
Doc with { summary: "...some text..." }
generateQuestions fetches .summary => includes in GPT prompt for context
        `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "openAICall",
        type: "verboseNode",
        data: {
          label: "OpenAI GPT call",
          details: `
Inside generateQuestions:
axios.post("https://api.openai.com/v1/chat/completions", 
 { model:"gpt-3.5-turbo", messages: [...], ...}, 
 { headers: Authorization: "Bearer ..." })
 => returns JSON with "questions": [...]
        `,
        },
        position: { x: 0, y: 0 },
      },
    ],
    []
  );

  /**
   * 2) EDGES
   * We'll connect them top->bottom to reflect a logical flow.
   */
  const initialEdges = useMemo(
    () => [
      { id: "smInit->smFetch", source: "stageManagerInit", target: "stageManagerFetchData" },
      { id: "smFetch->smCompute", source: "stageManagerFetchData", target: "stageManagerComputeState" },
      { id: "smCompute->smModes", source: "stageManagerComputeState", target: "stageManagerModes" },
      { id: "smModes->quizCompMount", source: "stageManagerModes", target: "quizComponentMount" },
      { id: "quizCompMount->quizConfigsDoc", source: "quizComponentMount", target: "quizConfigsDoc" },
      { id: "quizCompMount->questionTypes", source: "quizComponentMount", target: "questionTypes" },
      { id: "quizCompMount->quizComponentGenerate", source: "quizComponentMount", target: "quizComponentGenerate" },
      { id: "quizComponentGenerate->generateQuestions", source: "quizComponentGenerate", target: "generateQuestions" },
      { id: "generateQuestions->subchaptersDoc", source: "generateQuestions", target: "subchaptersDoc" },
      { id: "generateQuestions->openAICall", source: "generateQuestions", target: "openAICall" },
      { id: "quizComponentGenerate->quizRender", source: "quizComponentGenerate", target: "quizRender" },
      { id: "quizRender->quizSubmit", source: "quizRender", target: "quizSubmitHandle" },
      { id: "quizSubmit->gradeMultiCall", source: "quizSubmitHandle", target: "gradeQuestionsOfType" },
      { id: "quizSubmit->apiSubmitQuiz", source: "quizSubmitHandle", target: "apiSubmitQuiz" },
      { id: "smModes->reviseComp", source: "stageManagerModes", target: "reviseComponent" },
      { id: "reviseComp->apiSubmitRevision", source: "reviseComponent", target: "apiSubmitRevision" },
      { id: "stageManagerModes->stageManagerTimeline", source: "stageManagerModes", target: "stageManagerTimeline" },

      // Server endpoints used by StageManager
      { id: "apiGetQuiz->smFetch", source: "apiGetQuiz", target: "stageManagerFetchData" },
      { id: "apiGetRevisions->smFetch", source: "apiGetRevisions", target: "stageManagerFetchData" },

      // server => store attempts
      // we won't do direct arrow from server => front-end but we can show existence
    ],
    []
  );

  // 3) Use React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4) Auto-layout on mount with Dagre
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB"
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line
  }, []);

  // 5) If user draws new edges
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: "#1e1e1e" }}
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    backgroundColor: "#222",
  },
};