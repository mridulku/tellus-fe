/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/0.Parent/Child2.jsx
   v7 –   pushes fetched plan into Redux so AdaptPG2’s “Today” view
          hydrates on first render (pointer-events fix kept)
───────────────────────────────────────────────────────────────── */
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon         from "@mui/icons-material/Check";

import StatsPanel           from "../1.StatsPanel/StatsPanel";
import DailyPlan            from "../2.DailyPlan/DailyPlan";
import ProgressView         from "../3.ProgressView/ProgressView";
import AdminPanel           from "../4.AdminPanel/AdminPanel";
import TimelinePanel        from "../TimelineView/TimelinePanel";
import AdaptPG              from "../AdaptPGComponent/AdaptPG/AdaptPG";
import AdaptPG2             from "../AdaptPGComponent/AdaptPG2/AdaptPG2";
import AdaptPlayground      from "../PlanBalancer PLUS EXPERIMENTAL/AdaptPlayground";
import ConceptProgressTable from "../ConceptProgressTable/ConceptProgressTable";
import ConceptProgressTableOld from "../ConceptProgressTable/ConceptProgressTableOld";

import Adapting             from "../PlanBalancer PLUS EXPERIMENTAL/Adapting";
import AggregatorPanel      from "../PlanBalancer PLUS EXPERIMENTAL/AggregatorPanel";
import DailyOverviewDemo    from "../PlanBalancer PLUS EXPERIMENTAL/DailyOverviewDemo";


import ConceptProgressTableHeavy from "../ConceptProgressTable/ConceptProgressTableHeavy";

import PlanFetcher from "../../../5.StudyModal/StudyModal";
import { db }      from "../../../../../firebase";

/* ⬇️ NEW: Redux hooks / action */
import { useDispatch } from "react-redux";
import { setPlanDoc }  from "../../../../../store/planSlice"; // adjust path if needed

/* ---------- tiny helpers just for counts on the chip ---------- */
const dateOnly   = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays    = (d, n) => new Date(+d + n * 86400000);
const fmt        = d => d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
/* ---------------------------------------------------------------- */
export default function Child2({
  userId,
  bookId,
  planId   = "",
  isAdmin  = false,
  colorScheme = {},
}) {
  /* top-level look */
  const containerStyle = {
    backgroundColor : "transparent",
    color           : colorScheme.textColor || "#FFD700",
    padding         : "1rem",
    minHeight       : "100vh",
    boxSizing       : "border-box",
  };

  /* fetch the plan once we have a planId */
  const [plan, setPlan]           = useState(null);
  const [loadingPlan, setLoad]    = useState(false);

  /* ⬇️ NEW: get a dispatch fn (used after fetch succeeds) */
  const dispatch = useDispatch();

  useEffect(() => {
    if (!planId) { setPlan(null); return; }
    (async () => {
      setLoad(true);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          { params: { planId } }
        );
        const doc = data?.planDoc || null;
        setPlan(doc);

        /* ----------------------------------------------------------
           Push the fetched plan into the Redux store so thunks in
           aggregatorSlice can see state.plan.planDoc immediately.
        ----------------------------------------------------------- */
        if (doc) dispatch(setPlanDoc({ ...doc, id: planId }));
      } catch {
        setPlan(null);
      } finally {
        setLoad(false);
      }
    })();
  }, [planId, dispatch]);

  /* derive counts for Today / History / Future (memoised) */
  const todayCounts = useMemo(() => {
    if (!plan?.sessions?.length) return { today:0, history:0, future:0 };
    const created = dateOnly(
      new Date((plan.createdAt?.seconds ?? plan.createdAt?._seconds ?? 0) * 1000)
    );
    const today   = dateOnly(new Date());
    let todayN=0, historyN=0, futureN=0;

    plan.sessions.forEach(sess => {
      const idx  = Number(sess.sessionLabel) - 1;
      const date = addDays(created, idx);
      if (+date === +today)          todayN++;
      else if (date < today)         historyN++;
      else                           futureN++;
    });
    return { today: todayN, history: historyN, future: futureN };
  }, [plan]);

  /* ----------------------------------------------------------------
     UI state (tabs, view-mode, dialog, etc.)
  ----------------------------------------------------------------- */
  const [activeTab, setActiveTab]   = useState(0);  // 0 = Tasks
  const [viewMode,  setViewMode]    = useState("today");
  const [anchorEl,  setAnchorEl]    = useState(null);

  /* Plan-player dialog state */
  const [showDlg, setShowDlg]       = useState(false);
  const [dlgPlan, setDlgPlan]       = useState("");
  const [dlgAct,  setDlgAct]        = useState(null);

  const openFetcher = (pid, act=null) => {
    console.trace("[DEBUG] PlanFetcher requested for", pid);
    setDlgPlan(pid);
    setDlgAct(act);
    setShowDlg(true);
  };

  /* ---- tab config ------------------------------------------------ */
  const TAB_CONF = [
    { label:"Tasks",        comp: renderAdaptPG2 },
    { label:"Concept Map",  comp: () =>
        <ConceptProgressTable userId={userId} plan={plan} planId={planId} colorScheme={colorScheme}/> },
    { label:"Concept Map Old", admin:true,  comp: () =>
          <ConceptProgressTableOld userId={userId} plan={plan} planId={planId} colorScheme={colorScheme}/> },
          { label:"Concept Map Heavy", admin:true,  comp: () =>
            <ConceptProgressTableHeavy userId={userId} plan={plan} planId={planId} colorScheme={colorScheme}/> },
  
    { label:"Activity",     comp: renderTimeline },
    { label:"Progress",    admin:true, comp: renderProgress },
    { label:"Admin",       admin:true, comp: renderAdmin },
    { label:"AdaptPlayground", admin:true, comp: renderAdaptPlayground },
    { label:"Daily Plan Dummy", admin:true, comp: renderDaily },
    { label:"Daily Overview", admin:true, comp: () =>
        <DailyOverviewDemo userId={userId} plan={plan} planId={planId} colorScheme={colorScheme}/> },
    { label:"AdaptPG",     admin:true, comp: renderAdaptPG },
    { label:"Adapting",    admin:true, comp: renderAdapting },
    { label:"Aggregator",  admin:true, comp: renderAggregator }
  ];
  const VISIBLE_TABS = TAB_CONF.filter(t => !t.admin || isAdmin);

  /* =================================================================
     RENDER
  ================================================================== */
  return (
    <div style={containerStyle}>
      {/* plan-specific header strip */}
      <StatsPanel
        db={db}
        userId={userId}
        bookId={bookId}
        planId={planId}
        colorScheme={colorScheme}
        onResume={openFetcher} 
      />

      {/* global tab strip + in-tab day-picker */}
      <Box sx={{ display:"flex", alignItems:"center", mb:1 }}>
        <Tabs
          value={activeTab}
          onChange={(_e,v)=>setActiveTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style:{ backgroundColor:colorScheme.heading || "#FFD700"} }}
        >
          {VISIBLE_TABS.map(t =>
            <Tab
              key={t.label}
              disableRipple
              label={
                t.label === "Tasks" ? (
                  <Box sx={{ display:"flex", alignItems:"center", gap:.5, pointerEvents:"auto" }}>
                    {/* the word “Tasks” stays inert so clicks fall through to Tab */}
                    <span style={{ pointerEvents:"none" }}>Tasks</span>

                    {/* picker only visible while Tasks is the active tab */}
                    {activeTab===0 && (
                      <Chip
                        label={
                          viewMode==="today"
                            ? "Today"
                            : viewMode==="history"
                              ? `History (${todayCounts.history})`
                              : `Future (${todayCounts.future})`
                        }
                        icon={<ArrowDropDownIcon />}
                        size="small"
                        sx={{
                          bgcolor:"#2b2b2b", color:"#fff", fontWeight:600,
                          height:24, cursor:"pointer", ml:1,
                          "& .MuiChip-icon":{ mr:-.35 }
                        }}
                        /* prevent parent Tab from intercepting the click */
                        onMouseDown={e=>e.stopPropagation()}
                        onClick={e=>{
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  t.admin ? `${t.label} 🛠` : t.label
                )
              }
            />
          )}
        </Tabs>
      </Box>

      {/* menu for Today / History / Future */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
            onClose={()=>setAnchorEl(null)} keepMounted>
        {["today","history","future"].map(k=>(
          <MenuItem key={k}
                    selected={viewMode===k}
                    onClick={()=>{setViewMode(k); setAnchorEl(null);}}>
            <ListItemIcon sx={{minWidth:28}}>
              {viewMode===k && <CheckIcon fontSize="small"/>}
            </ListItemIcon>
            <ListItemText>
              {k==="today" ? "Today" :
               k==="history" ? `History (${todayCounts.history})` :
                               `Future (${todayCounts.future})`}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* body */}
      {loadingPlan
        ? <div>Loading plan…</div>
        : planId && plan
            ? VISIBLE_TABS[activeTab].comp()
            : <div>No plan selected.</div>}

      {/* full-screen player dialog */}
      <Dialog open={showDlg} onClose={()=>setShowDlg(false)} fullScreen>
        <DialogContent sx={{ p:0, bgcolor:"#000" }}>
          {dlgPlan &&
            <PlanFetcher planId={dlgPlan} initialActivityContext={dlgAct}
                         userId={userId} onClose={()=>setShowDlg(false)}/>}
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ---------- render helpers (bodies unchanged) ------------------- */
  function renderDaily()          { return <DailyPlan       userId={userId} plan={plan} planId={planId}/>; }
  function renderProgress()       { return <ProgressView    db={db} userId={userId} planId={planId} bookId={bookId}/>; }
  function renderTimeline()       { return <TimelinePanel   db={db} userId={userId} planId={planId} bookId={bookId}/>; }
  function renderAdmin()          { return <AdminPanel      db={db} plan={plan} planId={planId} bookId={bookId} userId={userId}/>; }
  function renderAdaptPG()        { return <AdaptPG         userId={userId} plan={plan} planId={planId}/>; }
  function renderAdaptPG2()       { return <AdaptPG2        userId={userId} plan={plan} planId={planId} viewMode={viewMode}/>; }
  function renderAdaptPlayground(){ return <AdaptPlayground userId={userId} plan={plan} planId={planId}/>; }
  function renderAdapting()       { return <Adapting        userId={userId} plan={plan} planId={planId}/>; }
  function renderAggregator()     { return <AggregatorPanel db={db} userId={userId} planId={planId} bookId={bookId}/>; }
}