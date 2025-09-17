// FlowGeneratePlan.jsx (Version 9)
import React, { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "../Business/Support/VerboseNode";
import { getLayoutedElements } from "../Business/Support/layoutHelper";

const nodeTypes = { verboseNode: VerboseNode };

export default function FlowGeneratePlanV9() {
  const initialNodes = useMemo(() => [
    {
      id: "1",
      type: "verboseNode",
      data: {
        label: "1) Basic Input & Query",
        details: `REQUIRED:
 userId (missing => 400 error)
 targetDate (invalid => 400 error)
 
OPTIONAL:
 planType => default "none-basic"
 wpmOverride, dailyReadingTimeOverride, quizTimeOverride=5, maxDaysOverride
 selectedBooks[], selectedChapters[], selectedSubChapters[]
 singleBookIdFromBody => "bookId"

We compute defaultMaxDayCount = daysBetween(today,targetDate). 
If userId or targetDate missing => error, else proceed.`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "2",
      type: "verboseNode",
      data: {
        label: "2) Validate & Overwrites",
        details: `Check if overrides are provided:
 - maxDaysOverride => maxDayCount
 - wpmOverride => finalWpm
 - dailyReadingTimeOverride => finalDailyReadingTime
 - quizTimeOverride => quizTime (default=5)
 - planType => default "none-basic"
We also form arrayOfBookIds from selectedBooks or singleBookId if present (else we fetch all).`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "3",
      type: "verboseNode",
      data: {
        label: "3) Fetch Persona",
        details: `We query "learnerPersonas" for userId.
If empty => 404/400 error.
We expect personaData.wpm & dailyReadingTime.
 finalWpm= wpmOverride || personaData.wpm
 finalDailyReadingTime= dailyReadingTimeOverride || personaData.dailyReadingTime
If still missing => error again.`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "4",
      type: "verboseNode",
      data: {
        label: "4) Fetch Books + SubCh",
        details: `We query "books_demo":
  if arrayOfBookIds => docId "in" those
  else fetch all.

Then for each Book => fetch chapters in "chapters_demo"
 optionally filter by selectedChapters
 => subchapters in "subchapters_demo"
 optionally filter by selectedSubChapters
 => sorted => booksData[].`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "5",
      type: "verboseNode",
      data: {
        label: "5) mapPlanTypeToStages",
        details: `Given planType => e.g. "none-basic","none-advanced","some-moderate"
We switch => returns { startStage, finalStage }
 e.g. "none-advanced" => {remember->analyze}
This defines the skill boundaries user must progress through.`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "6",
      type: "verboseNode",
      data: {
        label: "6) Build Activities w/ SubCh iteration (Detailed)",
        details: `At this stage, we construct an array "allActivities" that holds every task (READ or QUIZ) needed for the user.
    
    Process:
    1) allActivities = []
    2) We loop over each Book in "booksData" (fetched earlier):
       - for each Chapter in that book
         - for each Subchapter:
             a) We check "sub.currentStage" => if it's undefined or missing, default to "none"
             b) We call getActivitiesForSub2(sub, { userCurrentStage, startStage, finalStage, wpm=finalWpm, quizTime })
    
             This function (detailed in node #7) figures out what tasks are needed based on how far the user has progressed and how far they need to go:
               • Possibly a READ task if user is behind "remember" stage
               • Then multiple QUIZ tasks (e.g. "remember", "understand", "apply", "analyze") to reach finalStage
             c) The returned list might be empty if userCurrentStage >= finalStage, or it might contain one READ plus multiple QUIZ tasks.
    
             For instance, if userCurrentStage="none", startStage="remember", finalStage="apply", then:
               - We get a READ task plus QUIZ for "remember" stage, QUIZ for "understand" stage, QUIZ for "apply" stage
               - The quiz tasks differ by "quizStage": e.g. "remember" vs. "understand"
    
    3) We push all returned tasks for that subchapter into allActivities. So some subchapters might yield 0 tasks (if user is already beyond finalStage), while others could yield 1 READ + multiple QUIZ tasks.
    
    4) By the end, "allActivities" is a unified list containing every activity the user needs across all books/chapters/subchapters.
    
    Therefore, this step results in a big array of tasks, each item typically shaped like:
     {
       type: "READ" or "QUIZ",
       quizStage: "remember"|"understand"|"apply"|"analyze" (if type=QUIZ),
       timeNeeded: <computed minutes>,
       subChapterId,
       bookId,
       chapterId,
       ...
     }
    We do not yet limit or schedule them by day here; we merely enumerate them all. The next step (#7) deeply explains how getActivitiesForSub2 actually decides these tasks, and step #8 shows how we distribute them into sessions.`
  },
  position: { x: 0, y: 0 },
},
{
  id: "7",
  type: "verboseNode",
  data: {
    label: "7) getActivitiesForSub2 (Expanded Explanation)",
    details: `At this point, we have a single subchapter plus some config:
{
  userCurrentStage, // e.g. "none","remember","apply"
  startStage,       // from planType => "remember" or "understand", etc.
  finalStage,       // e.g. "analyze"
  wpm = finalWpm,   // user's words-per-minute reading speed
  quizTime = 5      // time each QUIZ step typically needs
}

We aim to produce an array of tasks (READ and/or QUIZ) for this subchapter:

1) Convert "userCurrentStage" => stageIndex
   - e.g. "none"=0, "remember"=1, "understand"=2, "apply"=3, "analyze"=4
2) Convert "startStage" => startIndex, "finalStage" => finalIndex
   - e.g. if planType is "none-advanced", we get {startStage:"remember", finalStage:"analyze"} => startIndex=1, finalIndex=4
3) If user is already at or beyond finalIndex (stageIndex >= finalIndex):
   - The user doesn't need any tasks => return []

4) Check if user is behind "remember":
   - If stageIndex<1 && startIndex<=1 => we create a READ task:
     readTime = if sub.wordCount known => ceil(sub.wordCount / wpm), else fallback => 5
     tasks.push({ type:"READ", timeNeeded: readTime })
   This means if user hasn't even reached the "remember" stage and the plan suggests we at least want them to "remember," we ask them to read the subchapter.

5) For every stage from "user's next needed stage" to finalStage:
   - We define nextStageNeeded = max(stageIndex+1, startIndex).
   - For st in [ nextStageNeeded ... finalIndex ]:
       tasks.push({
         type: "QUIZ",
         quizStage: numberToStage(st),   // e.g. 1=>"remember",2=>"understand"
         timeNeeded: quizTime           // default=5, or override
       })
   So if the user is currently "none" (0) but we want them up to "apply"(3),
   they might get QUIZ tasks for "remember"(1), "understand"(2), "apply"(3).

6) Return this tasks array. Possibly:
   [
     { type:"READ", timeNeeded:8 },
     { type:"QUIZ", quizStage:"remember", timeNeeded:5 },
     { type:"QUIZ", quizStage:"understand", timeNeeded:5 },
     { type:"QUIZ", quizStage:"apply", timeNeeded:5 }
   ]

Hence "getActivitiesForSub2" is how a single subchapter yields 0 or more tasks, based on how far the user has progressed (userCurrentStage) and how far we want them to go (finalStage). The final result merges into allActivities[] in Step 6.`
  },position: { x: 0, y: 0 },
},
    {
      id: "8",
      type: "verboseNode",
      data: {
        label: "8) Session Distribution (Verbose Explanation)",
        details: `We have allActivities[] from the previous step. Each item has:
  type ("READ" or "QUIZ"), timeNeeded (like 5 min), subChapterId, etc.

We want to group these tasks into daily "sessions," each limited by:
  dailyTimeMins = finalDailyReadingTime
  dayIndex up to maxDayCount.

**Narrative**:
- Start dayIndex=1, currentDay= { activities:[], timeUsed=0, usedSubs: new Set() }
- We look at pendingTasks (copy of allActivities).
- While we have tasks AND dayIndex <= maxDayCount:
   1) We try to place tasks that haven't been used yet if leftoverTime >= that task's time. 
      Also we don't reuse the same subChapter if we prefer unique subCh. 
      If placed => remove from pendingTasks, increment timeUsed, mark subCh as used => break from loop.
   2) If we can't place a "new" subCh's tasks, we attempt "same sub-ch" tasks to fill leftover (less strict?), if that fails => finalizeDay().
   3) finalizeDay() => push { sessionLabel= dayIndex.toString(), activities: currentDay.activities }, dayIndex++ => new currentDay.
- If dayIndex > maxDayCount => we stop assigning tasks.
- At the end, if currentDay.activities is not empty => finalizeDay() one last time.

**Result** => sessions[], each describing that day's tasks. The user has dayIndex "1", "2", etc. each with timeUsed up to dailyTimeMins (or leftover). This ensures we don’t exceed the user’s daily limit & attempt new subchap first for variety.`,
      },
      position: { x: 0, y: 0 },
    },
    {
      id: "9",
      type: "verboseNode",
      data: {
        label: "9) Write planDoc => Return",
        details: `Finally we compose planDoc = {
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  planName: "Adaptive Plan(v2) for user " + userId,
  userId, targetDate,
  sessions,
  maxDayCount,
  wpmUsed=finalWpm,
  dailyReadingTimeUsed= finalDailyReadingTime,
  level= planType,
  bookId= singleBookIdFromBody || (selectedBooks&&selectedBooks[0]) || "",
  ...
}
We do newRef= db.collection("adaptive_demo").add(planDoc).
Return => { message:"Successfully generated plan.", planId: newRef.id, planDoc }.

Hence user gets JSON => planId + planDoc => done!`,
      },
      position: { x: 0, y: 0 },
    },
  ], []);

  // 2) A linear top->bottom set of edges
  const initialEdges = useMemo(() => [
    { id: "1->2", source: "1", target: "2" },
    { id: "2->3", source: "2", target: "3" },
    { id: "3->4", source: "3", target: "4" },
    { id: "4->5", source: "4", target: "5" },
    { id: "5->6", source: "5", target: "6" },
    { id: "6->7", source: "6", target: "7" },
    { id: "7->8", source: "7", target: "8" },
    { id: "8->9", source: "8", target: "9" },
  ], []);

  // 3) Manage nodes/edges in React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4) On mount => apply top->bottom layout
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, "TB");
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // run once
    // eslint-disable-next-line
  }, []);

  // 5) if user draws a new edge
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

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
        style={{ background: "#1c1c1c" }}
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
    background: "#222",
  },
};