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

export default function FlowReduxPlan() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //
      // LANE 1: PlanFetcher (x=0)
      //
      {
        id: "PF1",
        type: "verboseNode",
        position: { x: 0, y: 0 },
        data: {
          label: "PlanFetcher: Props & Basic Setup",
          details: `
REQUIRED PROPS:
 - planId (the ID of the plan to fetch)
OPTIONAL PROPS:
 - userId => if present, dispatch(setUserId(userId))
 - backendURL (default "http://localhost:3001")
 - fetchUrl (default "/api/adaptive-plan")
 - daysUntilExam, sessionLength, initialSeconds=1500, onClose
 - initialActivityContext => (subChapterId, type) if we want to jump to that

LOCAL STATE:
 - secondsLeft: used to show a countdown or session timer
 - isCollapsed: toggles the left panel
          
On mount, we prepare the environment and store these props for later usage.
          `,
        },
      },
      {
        id: "PF2",
        type: "verboseNode",
        position: { x: 0, y: 200 },
        data: {
          label: "PlanFetcher: Redux Hooks",
          details: `
We import useDispatch and useSelector from "react-redux".

useSelector => grabs:
  - plan.status     (loading/succeeded/failed)
  - plan.error
  - plan.planDoc
  - plan.flattenedActivities
  - plan.currentIndex

We also define a local dispatch = useDispatch(), so we can:

  - dispatch(setUserId(...))
  - dispatch(fetchPlan(...))

These pieces of data drive our component's rendering logic:
  - planDoc controls whether we show the main UI or a 'no plan' message
  - status and error show loading spinner or errors
  - flattenedActivities + currentIndex help us show the correct day/chapter in other subcomponents.
          `,
        },
      },
      {
        id: "PF3",
        type: "verboseNode",
        position: { x: 0, y: 400 },
        data: {
          label: "PlanFetcher: Effects & Dispatches",
          details: `
1) **UserId effect**:
   If (userId) => dispatch(setUserId(userId)) in a useEffect([]).
   This updates authSlice in Redux to track the current user.

2) **Fetch plan on mount**:
   Another useEffect triggers if (planId) is non-empty. We call:
      dispatch(fetchPlan({
        planId,
        backendURL,
        fetchUrl,
        initialActivityContext
      }))
   The fetchPlan thunk does an Axios GET to \`\${backendURL}\${fetchUrl}?planId=...\`, 
   receives { planDoc }, merges with initialActivityContext, 
   then updates planSlice => planDoc, flattenedActivities, currentIndex, etc.
   If error => planSlice.error is set.

3) **Timer effect**:
   We have [secondsLeft, setSecondsLeft] in local state. We do:
      setInterval(() => setSecondsLeft(prev => Math.max(prev-1, 0)), 1000)
   Then clear on unmount. 
   This can show a countdown in the TopBar or session timer for reading.
          `,
        },
      },
      {
        id: "PF4",
        type: "verboseNode",
        position: { x: 0, y: 600 },
        data: {
          label: "PlanFetcher: Render & Layout",
          details: `
Final rendering logic:

- If status === "loading", show "Loading plan..."
- If error is non-null, show an error message in red
- If there's no planDoc and we're not loading or error, show "No plan loaded"

Otherwise, if planDoc is present:
  1) <TopBar daysUntilExam={...} sessionLength={...} secondsLeft={...} onClose={onClose} />
  2) A main area with:
       - Collapsible <LeftPanel isCollapsed=... />
       - <MainContent/> that picks the correct activity from flattenedActivities[currentIndex]
  3) <BottomBar /> which can show a progress bar or stepPercent

We also handle toggling isCollapsed to shrink or expand LeftPanel.
All combined, PlanFetcher orchestrates the entire "adaptive plan" UI.
          `,
        },
      },

      //
      // LANE 2: LeftPanel (x=600)
      //
      {
        id: "LP1",
        type: "verboseNode",
        data: {
          label: "LeftPanel: Redux Data & Local State",
          details: `
      We use useSelector to extract from planSlice:
       - planDoc => which includes planType ("book", "adaptive", etc.)
       - flattenedActivities => entire list of subCh tasks (with dayIndex, flatIndex)
       - currentIndex => user's currently active activity
      
      Local States:
       - selectedDayIndex => integer for which Day's activities are shown
       - expanded => an object or map storing which chapters are expanded { "ch-123": true }
       - isCollapsed => a boolean controlling whether the entire LeftPanel is collapsed or not
          `,
        },
        position: { x: 600, y: 0 },
      },
      {
        id: "LP2",
        type: "verboseNode",
        data: {
          label: "LeftPanel: Collapsible UI Structure",
          details: `
      1) If planDoc.planType === "book":
         - We treat the plan as a single session => only one day, so no day dropdown.
         - We display the chapters/sub-chapters for that single session directly.
      
      2) If planDoc.planType !== "book":
         - We show a dropdown to select dayIndex => "Day 1", "Day 2", etc.
         - This updates selectedDayIndex => we filter or display that day's activities.
      
      3) For each day => we group the activities by chapterId. Then we show a collapsible block for each chapter:
         - The block header is "Chapter Name" + total time
         - On click => toggles expanded[chKey] = !expanded[chKey]
         - Inside => we list each subchapter (or each activity if multiple tasks per subCh).
          `,
        },
        position: { x: 600, y: 200 },
      },
      {
        id: "LP3",
        type: "verboseNode",
        data: {
          label: "LeftPanel: dispatch(setCurrentIndex)",
          details: `
      When the user clicks a specific subchapter's "READ" or "QUIZ" row:
       - We retrieve that activity's flatIndex
       - dispatch(setCurrentIndex(flatIndex)) => planSlice updates currentIndex
       - The UI then re-renders, and MainContent shows the newly selected activity.
      
      Implementation detail:
        onClick={() => dispatch(setCurrentIndex(activity.flatIndex))}
          `,
        },
        position: { x: 600, y: 400 },
      },
      {
        id: "LP4",
        type: "verboseNode",
        data: {
          label: "LeftPanel: Panel Collapse & Expansion",
          details: `
      We have two layers of "collapse" logic:
      1) The entire LeftPanel can be collapsed to a narrow strip (isCollapsed). 
         - Toggled by an IconButton, e.g. <MenuIcon/> => setIsCollapsed(!isCollapsed).
         - If collapsed, we reduce the panel width from 300px to ~60px, hiding the details.
      
      2) Per-chapter expansions stored in expanded[chKey]. 
         - If expanded[ch-123] is true => we show that chapter's subchapters. Otherwise we hide them.
      
      This combination allows:
       - Minimizing the entire LeftPanel for more MainContent space
       - Within the panel, toggling each chapter individually for easier navigation.
          `,
        },
        position: { x: 600, y: 600 },
      },

      //
      // LANE 3: MainContent (x=1200)
      //
      {
        id: "MC1",
        type: "verboseNode",
        data: {
          label: "MainContent: Redux Subscription",
          details: `
      • We use useSelector to read:
        - flattenedActivities => array of all planned tasks across sessions
        - currentIndex => integer pointing to which activity is currently active
      
      • This ensures whenever Redux planSlice updates currentIndex (e.g. user clicked a sub-chapter), MainContent will re-render with the newly selected activity.
          `,
        },
        position: { x: 1200, y: 0 },
      },
      {
        id: "MC2",
        type: "verboseNode",
        data: {
          label: "MainContent: Determine Current Activity",
          details: `
      • We retrieve const currentAct = flattenedActivities[currentIndex].
      • If currentIndex < 0 or >= flattenedActivities.length, or the array is empty:
          - Show "No activity selected" or "Index out of range."
      • This guards against invalid indexes or empty plan scenarios.
          `,
        },
        position: { x: 1200, y: 150 },
      },
      {
        id: "MC3",
        type: "verboseNode",
        data: {
          label: "MainContent: Activity Type Switch (READ, QUIZ, etc.)",
          details: `
      • We check currentAct.type (or .toLowerCase()):
        1) if "read" => <ReadingView activity={currentAct} />
        2) if "quiz" => <QuizView activity={currentAct} />
        3) if "revise" => <ReviseView activity={currentAct} />
        4) if "analyze" => <AnalyzeView activity={currentAct} /> (if applicable)
        5) else => "Unknown Activity" block
      
      • This is how we dynamically render different interactive components based on the plan logic (reading, quizzing, or revision).
          `,
        },
        position: { x: 1200, y: 300 },
      },
      {
        id: "MC4",
        type: "verboseNode",
        data: {
          label: "MainContent: Sub-Views & Debug Overlays",
          details: `
      • Each sub-view (ReadingView, QuizView, ReviseView, AnalyzeView) may:
         - fetch more data from the server (e.g., subchapter details, GPT-based quiz)
         - track local states (e.g. reading time, quiz answers)
         - show optional debug overlays (like an "i" icon with JSON)
      
      • MainContent just passes the 'currentAct' object down as props.
      • The sub-views orchestrate their own logic; we treat them as black boxes from MainContent's perspective.
          `,
        },
        position: { x: 1200, y: 450 },
      },
      {
        id: "MC5",
        type: "verboseNode",
        data: {
          label: "MainContent: Handling Unknown or Incomplete Data",
          details: `
      • If currentAct is missing certain fields (e.g. subChapterId), we may display a fallback message or debug info.
      • This ensures the UI doesn't break if the user navigates to an incomplete plan or we have a mismatch in plan data.
      • Potentially we log or show an error boundary if critical fields are absent.
          `,
        },
        position: { x: 1200, y: 600 },
      },
      {
        id: "MC6",
        type: "verboseNode",
        data: {
          label: "MainContent: Layout & Container",
          details: `
      • Overall container styling:
         - backgroundColor: "#000" or "#1c1c1c"
         - color: "#fff", padding: "10px"
         - flexible height and overflow for reading large content
      • The chosen sub-view (<ReadingView/> etc.) is placed in a "contentArea" that may scroll independently.
      • This allows consistent, centralized styling for the main region of the app.
          `,
        },
        position: { x: 1200, y: 750 },
      },
      //
      // LANE 4: ReadingView (x=1800)
      //
      {
        id: "RV1",
        type: "verboseNode",
        data: {
          label: "ReadingView: Initialization & Data Fetch",
          details: `
      • Receives 'activity' prop from MainContent. 
        Typically includes: { subChapterId, type="READ", timeNeeded, ... }
      
      • On mount (useEffect), if subChapterId is valid:
         - Perform a GET request to \`/api/subchapters/\${subChapterId}\`
         - Retrieve metadata: { wordCount, summary, or other details }
         - Store in local state => \`subChapter\`
      
      • If any error or missing subChapterId, we handle gracefully (show fallback).
          `,
        },
        position: { x: 1800, y: 0 },
      },
      {
        id: "RV2",
        type: "verboseNode",
        data: {
          label: "ReadingView: Local Reading Timer & Tracking",
          details: `
      • We maintain a local reading state:
         - "empty" => not started,
         - "reading" => user is actively reading,
         - "read" => user has marked reading complete,
         - "proficient" => potentially from prior record
      
      • If user clicks "Start Reading":
         - Switch localProficiency to "reading"
         - Record localStartMs = Date.now()
         - Optionally POST to server => mark subChapter readStartTime
      
      • While "reading", we run a setInterval => readingSeconds = (now - startMs)/1000
         - Clears on "Stop Reading".
      
      • On "Stop Reading":
         - localProficiency = "read"
         - localEndMs = Date.now()
         - compute total reading duration => POST to server => readEndTime
         - We store finalReadingTime in local state => can show "8m read" summary
      
      • This logic is purely local to ReadingView, although we may also dispatch user activity to store if needed.
          `,
        },
        position: { x: 1800, y: 150 },
      },
      {
        id: "RV3",
        type: "verboseNode",
        data: {
          label: "ReadingView: Content Display & Expand/Collapse",
          details: `
      • subChapter may have a "summary" or "fullText". 
      • If localProficiency === "empty", we show a truncated preview:
         "Motion is ... (click to start reading)"
      
      • If "reading", we show the entire text plus a "Stop Reading" button.
      
      • Once "read", user can collapse or expand the text. 
         - e.g. a toggle "Expand Full Text" / "Collapse"
      
      • We also display a small debug overlay (an "i" icon) that, when hovered:
         - Shows JSON details of the 'activity' + 'subChapter' in a tooltip or popover
         - Useful for development/troubleshooting
      
      • In summary, ReadingView is:
         1) Fetch subChapter data
         2) Manage reading timer & states
         3) Render text (truncated or full), and expansion toggles
         4) Optionally show debug info
          `,
        },
        position: { x: 1800, y: 300 },
      },
      {
        id: "RV4",
        type: "verboseNode",
        data: {
          label: "ReadingView: Edge Cases & Finalization",
          details: `
      • If subChapter has 0 wordCount or no 'summary':
         - Display a fallback message "No content available"
      
      • If user tries to "Stop Reading" immediately (very short time), we may set a minimum readingSeconds or handle logic.
      
      • On unmount, we clear intervals (if any).
      
      • This ensures ReadingView doesn't keep running timers or partial states once user navigates away (selecting another activity).
          `,
        },
        position: { x: 1800, y: 450 },
      },

      //
      // LANE 5: QuizView (x=2400)
      //
      {
        id: "QV1",
        type: "verboseNode",
        data: {
          label: "QuizView: Initialization & GPT Quiz Retrieval",
          details: `
      • Receives \`activity\` prop => typically includes { subChapterId, type="QUIZ", ... }.
      • On mount (useEffect), we call \`POST /api/generate\` with:
           {
             userId,
             subchapterId: activity.subChapterId,
             promptKey: "quizAnalyze" or "quizX",
           }
         - Or whichever promptKey is relevant (e.g., "quizRemember", "quizApply").
      
      • The backend uses GPT or some internal logic to generate or retrieve a JSON quiz structure. 
      • We store the returned object in local state \`responseData\`.
      • If any error occurs, show an error message or fallback.
      
      • EXAMPLE of returned JSON:
         {
           questions: [
             { question: "What is X?", options: ["A", "B", "C"], correctAnswerIndex: 1 },
             ...
           ]
         }
      `,
        },
        position: { x: 2400, y: 0 },
      },
      {
        id: "QV2",
        type: "verboseNode",
        data: {
          label: "QuizView: Rendering Q&A",
          details: `
      • Once \`responseData\` is loaded, we parse the 'questions' array.
      • For each question, we display:
         - The question text
         - A list of radio buttons or checkboxes => user picks an option
      • We maintain local state \`selectedAnswers\`, an array of selected indices. 
         - e.g. selectedAnswers[qIndex] = chosenOptionIndex
      
      • We can also show partial UI hints, e.g. "You have answered X out of Y."
      
      • If the quiz JSON is missing or invalid, we provide a fallback "No quiz data" message.
      `,
        },
        position: { x: 2400, y: 150 },
      },
      {
        id: "QV3",
        type: "verboseNode",
        data: {
          label: "QuizView: Submit, Evaluation, and Persistence",
          details: `
      • On user click "Submit Quiz":
        1) We iterate over each question => compare selectedAnswers[qIndex] with the correctAnswerIndex => count # of correct responses
        2) Construct a \`quizSubmission\` object => { question, userAnswer, isCorrect, ... } for each item
        3) Calculate a final score string => e.g. "4 / 5"
      
      • We call \`POST /api/submitQuiz\` with:
         {
           userId,
           subchapterId: activity.subChapterId,
           quizType: "analyze" or "apply",
           quizSubmission,
           score: "4/5",
           totalQuestions: 5,
           attemptNumber,
         }
      • The server may store the attempt in a 'quiz_attempts' collection or database table. 
         - This helps keep track of how many times the user tried and their progress.
      `,
        },
        position: { x: 2400, y: 300 },
      },
      {
        id: "QV4",
        type: "verboseNode",
        data: {
          label: "QuizView: Pass/Fail Logic & User Flow",
          details: `
      • After computing the final score, we check if the user "passed".
         - e.g. passThreshold = 4 => if correctCount >= 4 => pass
      
      • If pass:
         - Show a "You Passed!" message
         - Optionally dispatch an action or call a callback => onQuizComplete() => might jump to next stage or close the quiz
      
      • If fail:
         - Show "You did not pass."
         - Possibly link to <ReviseView/> => guiding the user to attempt a revision or see hints
         - Or we call onQuizFail() => main UI can show a revision prompt
      
      • We can store the pass/fail result in local state or rely on upstream logic to display the next steps (like showing the <ReviseView/>).
      • Some variations:
         - We might allow multiple attempts => attemptNumber increments each time
         - We might show immediate feedback per question, or only after submission
      `,
        },
        position: { x: 2400, y: 450 },
      },
      {
        id: "QV5",
        type: "verboseNode",
        data: {
          label: "QuizView: Edge Cases & Debug",
          details: `
      • If the GPT or backend fails to produce valid JSON, we fallback to a safe message like "Quiz not available."
      • We may show a small debug overlay to quickly see the raw quiz data or the user’s chosen answers.
      • On unmount, we do not typically need to clean up intervals unless there's a timed quiz scenario. 
         - But if we do have a time-limited quiz, we'd manage those intervals similarly to ReadingView.
      • This ensures quiz usage is robust even if user quickly navigates away or there's incomplete data.
      `,
        },
        position: { x: 2400, y: 600 },
      },

      //
      // LANE 6: ReviseView (x=3000)
      //
      // LANE 6: ReviseView (x=3000)
{
    id: "RVV1",
    type: "verboseNode",
    data: {
      label: "ReviseView: GPT-Based Content Retrieval",
      details: `
  • Similar structure to QuizView, but the promptKey is "reviseX" (or "reviseAnalyze", "reviseApply", etc.).
  • On mount (useEffect), we call \`POST /api/generate\` with:
     {
       userId,
       subchapterId: activity.subChapterId,
       promptKey: "reviseX"
     }
  • The server or GPT returns structured JSON:
     {
       instructions: "...",
       steps: [ ... ],
       or any custom revision content
     }
  • We store it in local state => \`responseData\`. 
  • If there's an error or empty response, we fallback to "No revision data available."
  
  • This step is crucial to adaptively provide revision material depending on the user's quiz attempts or needed improvements.
      `,
    },
    position: { x: 3000, y: 0 },
  },
  {
    id: "RVV2",
    type: "verboseNode",
    data: {
      label: "ReviseView: Rendering & 'Mark Done' Flow",
      details: `
  • We parse the GPT-provided revision data. For example:
     {
       "revisionPoints": [
         "Re-read the concept definitions",
         "Try example exercises #3 and #4",
         ...
       ],
       "explanations": [...],
       ...
     }
  • We display it in a user-friendly layout. Possibly step-by-step instructions or expansions.
  
  • The user works through the revision content. Once they feel ready:
     - They click a "Done" or "Finish Revision" button
     - We call \`POST /api/submitRevision\` with:
         {
           userId,
           subchapterId: activity.subChapterId,
           revisionType: "analyze" or "apply",
           revisionNumber: <the attemptNumber matched to the quiz>
         }
     - The server updates the DB or logs that the user has completed a revision for that attempt.
  
  • After submission:
     - We may show a success message or automatically transition the user to the next quiz attempt.
     - If the logic requires multiple revision steps, we'd handle them in further states or via the plan doc.
  • Edge Cases:
     - If revision content is empty, we display a minimal "No revision needed" or "Cannot fetch revision data" message.
     - If user closes or navigates away, no further updates are done. 
     - We can add a debug overlay to see the raw GPT or server data if needed.
      `,
    },
    position: { x: 3000, y: 150 },
  },
  
  // LANE 7: planSlice (x=3600)
  {
    id: "PS1",
    type: "verboseNode",
    data: {
      label: "planSlice: State Shape & Purpose",
      details: `
  • planSlice manages the entire "adaptive plan" state:
     {
       planDoc: {...},   // the loaded plan document from the server
       flattenedActivities: [], // a 1D array of tasks (READ, QUIZ, REVISE, etc.)
       currentIndex: -1, // which activity user is currently viewing
       status: "idle" | "loading" | "succeeded" | "failed",
       error: null
     }
  
  • planDoc typically includes:
     - sessions: [ { sessionLabel: "Day 1", activities: [...] }, ... ]
     - userId, targetDate, planType, etc.
  • flattenedActivities is built from planDoc sessions => easier indexing
  • currentIndex tells UI which activity to display in MainContent
  • status/error handle loading & error states for fetch operations
  
  • This slice is combined in the Redux store => key = "plan"
      `,
    },
    position: { x: 3600, y: 0 },
  },
  {
    id: "PS2",
    type: "verboseNode",
    data: {
      label: "planSlice: fetchPlan (async thunk)",
      details: `
  • fetchPlan(args) => an asynchronous thunk that:
     1) calls \`GET /api/adaptive-plan?planId=...\`
     2) If the server returns { planDoc }, we pass it to addFlatIndexes => transforms sessions into flattenedActivities
     3) If initialActivityContext is provided, we attempt to set currentIndex to the matching subChapter/type
     4) On success => planDoc, flattenedActivities, currentIndex, status="succeeded"
     5) On failure => status="failed", error=errorMessage
  
  • This is triggered in PlanFetcher (and could be triggered elsewhere if re-fetch is needed).
      `,
    },
    position: { x: 3600, y: 150 },
  },
  {
    id: "PS3",
    type: "verboseNode",
    data: {
      label: "planSlice: setCurrentIndex Action",
      details: `
  • setCurrentIndex(index) => a simple reducer that updates state.currentIndex = index.
  • This triggers UI to re-render in LeftPanel, MainContent, TopBar, etc., 
    since all those components rely on currentIndex to show the correct activity.
  
  • Example usage:
     dispatch(setCurrentIndex(newIndex));
  
  • We also might add other actions, e.g., planSlice.actions.updateActivityProgress(...) if we want to store local progress in Redux.
  • The core logic is: "currentIndex" is the single source of truth for which activity is front and center in the UI.
      `,
    },
    position: { x: 3600, y: 300 },
  },
      //
      // LANE 8: authSlice (x=4200)
      //
 // LANE 8: authSlice (x=4200)
{
    id: "AS1",
    type: "verboseNode",
    data: {
      label: "authSlice: State Shape & Purpose",
      details: `
  • authSlice is a simple Redux slice storing user authentication or identity info.
  • Current shape:
     {
       userId: null,
       // future expansions: e.g. roles, tokens, etc.
     }
  • This is combined into the Redux store at 'auth', so any component can do:
     useSelector(state => state.auth.userId).
  
  • Typically, we only set userId via setUserId action. 
    This userId can be used by PlanFetcher or any other logic that needs to know which user is active.
  `,
    },
    position: { x: 4200, y: 0 },
  },
  {
    id: "AS2",
    type: "verboseNode",
    data: {
      label: "authSlice: setUserId Action",
      details: `
  • setUserId(userIdString):
     - A simple reducer that updates state.userId = userIdString.
  • Example usage in PlanFetcher:
     if (userId) {
       dispatch(setUserId(userId));
     }
  
  • This ensures the store knows the current user. 
  • Other potential expansions:
     - If we have a token or login flow, we might store them here as well.
  • For now, it's minimal. 
  `,
    },
    position: { x: 4200, y: 150 },
  },
  
  // LANE 9: store (x=4800)
  {
    id: "ST1",
    type: "verboseNode",
    data: {
      label: "configureStore: Combining Reducers",
      details: `
  • We use \`configureStore\` from '@reduxjs/toolkit' to create our Redux store.
  • reducers: {
      plan: planReducer,  // from planSlice
      auth: authReducer,  // from authSlice
      // more slices if needed
    }
  
  • Example:
     export const store = configureStore({
       reducer: {
         plan: planReducer,
         auth: authReducer
       }
     });
  
  • This aggregator is the single source of truth for all app-wide state, especially plan and user identity.
  `,
    },
    position: { x: 4800, y: 0 },
  },
  {
    id: "ST2",
    type: "verboseNode",
    data: {
      label: "Provider Setup & Global Access",
      details: `
  • In the top-level \`index.js\` or \`App.js\`, we wrap our root with:
     <Provider store={store}>
       <App/>
     </Provider>
  
  • This allows the entire React tree to access Redux with useSelector/useDispatch hooks.
  • Any component that needs plan state or userId can read from the store.
  • This is crucial for an app-wide architecture: it eliminates the need for prop drilling.
  `,
    },
    position: { x: 4800, y: 150 },
  },
  
  // LANE 10: TopBar (x=5400)
  {
    id: "TB1",
    type: "verboseNode",
    data: {
      label: "TopBar: Timer Display + Navigation Controls",
      details: `
  • <TopBar/> is a small top strip of UI that can show:
     1) The countdown timer or reading session time left (e.g. derived from PlanFetcher or local state).
     2) The "Prev" & "Next" arrow buttons:
        - dispatch(setCurrentIndex(currentIndex - 1)) or (currentIndex + 1)
        - This navigates among flattenedActivities in planSlice.
  
  • It might also accept props:
     - onClose => callback to close the entire plan UI or dialog
     - onFontSizeIncrease => optional text-size adjustments
     - daysUntilExam => can display "10 days left"
  • Typically uses useSelector for currentIndex if it wants to show some label like "Activity 3 of 10".
  `,
    },
    position: { x: 5400, y: 0 },
  },
  {
    id: "TB2",
    type: "verboseNode",
    data: {
      label: "TopBar: Debug Overlay & Additional Actions",
      details: `
  • Often includes an "i" (info) icon:
     - On hover => shows a Debug Overlay with the current activity's JSON (subChapterId, type, etc.) for troubleshooting.
  • Could contain a "star" or "bookmark" icon => user can mark a subChapter as favorite or flagged.
  • The "X" or close button (if in a modal context) => onClose() to exit plan mode.
  
  • This bar is meant to be lightweight but can hold important session/time controls. 
  • Variation: We might show a live clock, or a plan name, or other global info. 
  `,
    },
    position: { x: 5400, y: 150 },
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