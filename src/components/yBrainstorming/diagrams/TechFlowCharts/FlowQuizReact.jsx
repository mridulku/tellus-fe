import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// Import your custom VerboseNode (same as you did in the ExpressRoutesFlow)
import VerboseNode from "../Business/Support/VerboseNode"; 

export default function FlowQuizReact() {
  // We’ll create four lanes representing each main file:
  //  1) QuestionTypePlayground
  //  2) QuestionGenerator
  //  3) QuestionRenderer
  //  4) QuestionGrader

  // Then, we’ll define the edges that connect them in the approximate order of data flow.

  const edges = [
    // Edges from QuestionTypePlayground to QuestionGenerator
    { id: "pg-generate", source: "playgroundGenerate", target: "generatorFunc", label: "calls generateQuestions()" },
    
    // Edges from QuestionTypePlayground to QuestionRenderer
    { id: "pg-render", source: "playgroundRenderForm", target: "rendererNode", label: "renders <QuestionRenderer/>" },

    // Edges from QuestionTypePlayground to QuestionGrader
    { id: "pg-grader", source: "playgroundSubmit", target: "graderFunc", label: "calls gradeQuestion()" },
  ];

  // Position the nodes in lanes (x-values) and step them down with y-values.
  // Lane 1 (x=0): QuestionTypePlayground
  // Lane 2 (x=700): QuestionGenerator
  // Lane 3 (x=1400): QuestionRenderer
  // Lane 4 (x=2100): QuestionGrader

  const nodes = [
    // LANE 1: QuestionTypePlayground
    {
      id: "playgroundMount",
      type: "verboseNode",
      data: {
        label: "QuestionTypePlayground (on mount)",
        details: `
- useEffect fetches questionTypes from Firestore 
- Stores them in state: questionTypes[]
- Also sets up states for subChapterId, openAiKey, numberOfQuestions, etc.
        `,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "playgroundGenerate",
      type: "verboseNode",
      data: {
        label: "handleGenerate()",
        details: `
- Called when user clicks "Generate Questions"
- Validates inputs: openAiKey, subChapterId, questionType
- Finds the chosen questionType doc
- Calls generateQuestions(...) from QuestionGenerator.js
- Stores returned questions in 'generatedQuestions' state
- Resets userAnswers[] and grading results
        `,
      },
      position: { x: 0, y: 150 },
    },
    {
      id: "playgroundRenderForm",
      type: "verboseNode",
      data: {
        label: "renderQuestionsAsForm()",
        details: `
- Renders each question from generatedQuestions.questions 
- Uses <QuestionRenderer /> for each question
- Maps userAnswers[] to each question's "value"
- Also renders a "Submit All" button => handleQuizSubmit()
        `,
      },
      position: { x: 0, y: 300 },
    },
    {
      id: "playgroundSubmit",
      type: "verboseNode",
      data: {
        label: "handleQuizSubmit()",
        details: `
- Called when user clicks "Submit All"
- Loops through each question + userAnswer
- Calls gradeQuestion(...) from QuestionGrader.js
- Stores all grading results in gradingResults[]
- Toggles showGradingResults = true
        `,
      },
      position: { x: 0, y: 450 },
    },

    // LANE 2: QuestionGenerator
    {
      id: "generatorFunc",
      type: "verboseNode",
      data: {
        label: "generateQuestions(...)",
        details: `
From QuestionGenerator.js:
1) Fetch subchapter doc => get summary
2) Build GPT prompt w/ questionTypeDoc + summary
3) Call OpenAI's API w/ user-provided openAiKey
4) Parse JSON => return { questions: [...] } or error
        `,
      },
      position: { x: 700, y: 150 },
    },

    // LANE 3: QuestionRenderer
    {
      id: "rendererNode",
      type: "verboseNode",
      data: {
        label: "<QuestionRenderer />",
        details: `
From QuestionRenderer.jsx:
- Receives questionObj, userAnswer, onUserAnswerChange
- Switches by questionObj.type => renders input elements
- For multipleChoice => radio buttons
- For shortAnswer, scenario, fillInBlank => text/textarea
- Calls onUserAnswerChange(...) to update parent state
        `,
      },
      position: { x: 1400, y: 300 },
    },

    // LANE 4: QuestionGrader
    {
      id: "graderFunc",
      type: "verboseNode",
      data: {
        label: "gradeQuestion(...)",
        details: `
From QuestionGrader.js:
1) Receives subchapterSummary, questionObj, userAnswer
2) Builds GPT prompt => asks for a JSON { score, feedback }
3) Calls OpenAI w/ user’s openAiKey
4) Parses JSON => returns numeric score + textual feedback
        `,
      },
      position: { x: 2100, y: 450 },
    },
  ];

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
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}