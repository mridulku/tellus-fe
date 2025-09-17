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
{
  id: "A1",
  type: "verboseNode",
  position: { x: 0, y: 0 },
  data: {
    label: "LandingPage: Overall Structure & useEffect",
    details: `
• The main landing page for users who are not logged in.
• On mount => checks if localStorage has a “token.”
   => If found, navigate("/dashboard").
   => This effectively redirects signed-in users away from the landing.
• Maintains local state openSignIn => toggles the AuthSignIn modal.
• Renders a large composition of sections in a single file:
   1) <LandingAppBar/> => top navbar
   2) <HeroSection/>
   3) <PainGainSection/>
   4) <LearningJourneySection/>
   5) <StatsAndProofSection/>
   6) <WhyWeAreDifferentSection/>
   7) <SeeItInActionSection/>
   8) <FeaturesSection/>
   9) <TestimonialSection/>
   10) <AdaptiveProcessSection/> => wraps <PanelAdaptiveProcess/>
   11) <Footer/>
   12) <Dialog open={openSignIn} => <AuthSignIn/>
 
Thus the entire marketing content is inline with a single "Sign In" modal for new users.
    `,
  },
},
{
  id: "A2",
  type: "verboseNode",
  position: { x: 0, y: 200 },
  data: {
    label: "LandingAppBar: Navbar + Drawer",
    details: `
• A simple sticky <AppBar> with:
   - a brand name talk-ai.co (click => navigate("/"))
   - a “Sign In” button on large screens
   - a hamburger MenuIcon for smaller screens => toggles a top Drawer
• In the Drawer => user can click “Sign In” => calls onOpenSignIn => opens the sign-in modal
• No advanced logic beyond toggling drawerOpen & handle navigate calls.
    `,
  },
},
{
  id: "A3",
  type: "verboseNode",
  position: { x: 0, y: 400 },
  data: {
    label: "HeroSection: Big Banner & CTA",
    details: `
• A large hero banner with:
   - an H2 “Adaptive Learning for Everyone”
   - a short paragraph about AI-driven personalization
   - a CTA <Button onClick={onOpenSignIn} variant="contained">
     => triggers the sign-in modal
• Styled with minHeight=80vh, background gradient, big typography, etc.
    `,
  },
},
{
  id: "A4",
  type: "verboseNode",
  position: { x: 0, y: 600 },
  data: {
    label: "PainGainSection & LearningJourneySection",
    details: `
• PainGainSection => “Common Frustrations vs Our Solution,” with 2 <Paper> columns:
   left => typical problems, right => what we solve
• LearningJourneySection => 5 stages: “Assess, Focus, Practice, Track, Succeed,” displayed in a grid of <Paper> cards or 2 rows
• Both use MUI <Grid>, <Paper>, <Typography> to present bullet points.
    `,
  },
},
{
  id: "A5",
  type: "verboseNode",
  position: { x: 0, y: 800 },
  data: {
    label: "StatsAndProofSection + WhyWeAreDifferent + SeeItInAction",
    details: `
• StatsAndProofSection => 4 "stats" in a 2x2 <Grid> (like "5,000+ Learners," "88% Score Improvement," etc.)
• WhyWeAreDifferent => side-by-side <Paper> listing typical E-Learning vs “Our AI platform” bullet comparisons
• SeeItInAction => embedding a YouTube iframe for a “demo,” plus some text about PDF -> quiz transformation
    `,
  },
},
{
  id: "A6",
  type: "verboseNode",
  position: { x: 0, y: 1000 },
  data: {
    label: "FeaturesSection & TestimonialSection",
    details: `
• FeaturesSection => 3 feature cards with icons (EmojiObjects, ThumbUp, RocketLaunch):
   "AI-Powered Insights," "Personalized Feedback," "Rapid Mastery."
• TestimonialSection => A small box with a user quote: "I improved exam scores by 20% in 4 weeks..."
• All are simple presentational layouts using MUI <Grid> or <Paper>.
    `,
  },
},
{
  id: "A7",
  type: "verboseNode",
  position: { x: 0, y: 1200 },
  data: {
    label: "AdaptiveProcessSection => <PanelAdaptiveProcess/> + Footer + AuthSignIn Dialog",
    details: `
• Finally, we show <PanelAdaptiveProcess/> in a box => "How Our Adaptive Learning Works"
• Then <Footer/> => minimal text & "© year MyAdaptiveApp"
• The sign-in modal => <Dialog open={openSignIn} => <AuthSignIn/> 
   - The user can close or proceed with sign-in.

Hence the LandingPage is a big marketing funnel with a single "Sign In" entry point.
    `,
  },
},

// LANE B: AuthSignIn (x=600)
{
  id: "B1",
  type: "verboseNode",
  position: { x: 600, y: 0 },
  data: {
    label: "AuthSignIn: Main Logic",
    details: `
• A small sign-in form:
   - email/password fields => calls handleEmailPasswordSignIn => /login => returns { token, firebaseCustomToken }
   - sign in with Google => signInWithPopup => /login-google => returns tokens
• On success:
   1) signInWithCustomToken => set auth.currentUser => get userId => localStorage.setItem("userId")
   2) createLearnerPersonaIfNeeded => POST => /create-learner-persona
   3) localStorage.setItem("token") => server JWT
   4) navigate("/dashboard")
• States:
   - username, password => text inputs
   - loadingEmailPassword, loadingGoogle => spinners
   - errorMsg => <Alert> if sign in fails
    `,
  },
},
{
  id: "B2",
  type: "verboseNode",
  position: { x: 600, y: 200 },
  data: {
    label: "AuthSignIn: Email/Password Flow",
    details: `
• handleEmailPasswordSignIn => calls POST /login => { success, token, firebaseCustomToken, user }
   - If success => signInWithCustomToken(auth, firebaseCustomToken)
   - Then localStorage.setItem("token", token)
   - Then navigate("/dashboard")
• If error => set errorMsg => shows red alert
    `,
  },
},
{
  id: "B3",
  type: "verboseNode",
  position: { x: 600, y: 400 },
  data: {
    label: "AuthSignIn: Google Sign-In Flow",
    details: `
• handleGoogleSignIn => signInWithPopup(auth, provider=GoogleAuthProvider)
   => obtains ID token from Firebase => POST /login-google => server returns { token, firebaseCustomToken }
   => again signInWithCustomToken => store token => navigate
• This merges your user’s Google account with a server session token
    `,
  },
},
{
  id: "B4",
  type: "verboseNode",
  position: { x: 600, y: 600 },
  data: {
    label: "AuthSignIn: createLearnerPersonaIfNeeded",
    details: `
• After successful sign-in => we do a small POST => /create-learner-persona { userId, wpm=200, dailyReadingTime=30 }
• If it fails, we log an error but continue. 
• This ensures each new user has a basic persona doc. 
• Could be extended to store default exam/subject or user preferences.
    `,
  },
},

// LANE C: PanelAdaptiveProcess (x=1200)
{
  id: "C1",
  type: "verboseNode",
  position: { x: 1200, y: 0 },
  data: {
    label: "PanelAdaptiveProcess: Basic Info Panel",
    details: `
• A single function returning a container with 6 steps:
   1) Upload Book(s)
   2) We Break It Down
   3) Provide Requirements
   4) Generate Plan
   5) We Learn More About You
   6) Deliver & Iterate
• Each step => (icon + title + description) plus a vertical arrow "↓"
    `,
  },
},
{
  id: "C2",
  type: "verboseNode",
  position: { x: 1200, y: 200 },
  data: {
    label: "PanelAdaptiveProcess: No props or side-effects",
    details: `
• It's purely presentational, describing your adaptive approach in bullet form
• Typically placed at bottom of the landing or in any help page
• Uses simple inline styles => a "panelContainerStyle" with backgroundColor=rgba(255,255,255,0.1)
• Renders steps in a vertical stack => each step is a box with icon, title, description
    `,
  },
},
{
  id: "C3",
  type: "verboseNode",
  position: { x: 1200, y: 400 },
  data: {
    label: "PanelAdaptiveProcess: Potential expansions",
    details: `
• Could add animations or clickable expansions for each step.
• Could integrate a small tooltip or a "learn more" link for each stage.
• Currently a static representation of your adaptive flow.
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