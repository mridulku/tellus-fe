/* ────────────────────────────────────────────────────────────────
   File: ActivityAccordion.jsx   (2025-04-30)
   • Summary squares always visible
   • “Configuration” inner-accordion visible **only** to the admin UID
───────────────────────────────────────────────────────────────── */
import React, { useState } from "react";
import {
  Accordion, AccordionSummary, AccordionDetails,
  Box, Typography, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useSelector }  from "react-redux";

import aggregatorLockedOverlay from "./aggregatorLockedOverlay";
import AggregatorInfoPanel     from "./AggregatorInfoPanel";
import QuizSubmissionDetails   from "./QuizSubmissionDetails";
import CompletionSummaryPanel  from "./CompletionSummaryPanel";

/* ─────────── hard-coded admin list ─────────── */
const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6Z"];

/* ─────────── small helpers ─────────── */
const Square = ({ label, value, tooltip }) => {
  const core = (
    <Box sx={{
      border:"1px solid #666", background:"#333", borderRadius:1,
      minHeight:64, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", px:1
    }}>
      <Typography variant="caption" sx={{ opacity:0.7 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight:600 }}>{value || "—"}</Typography>
    </Box>
  );
  return tooltip ? <Tooltip arrow title={tooltip}>{core}</Tooltip> : core;
};

const fmtSec = s=>{
  const m=Math.floor(s/60), sec=s%60;
  return m?`${m}m ${sec}s`:`${sec}s`;
};

const ms = ts => ts?._seconds?ts._seconds*1e3 : ts?.seconds?ts.seconds*1e3 : 0;

/* stage key */
const stageKeyOf = a =>
  (a.type||"").toLowerCase().includes("read") ? "reading" : (a.quizStage||"").toLowerCase();

/* merge quiz+revision */
const merge = (q=[],r=[]) => [
  ...q.map(o=>({...o,type:"quiz"})),
  ...r.map(o=>({...o,type:"revision"}))
].sort((a,b)=>ms(a.timestamp)-ms(b.timestamp));

/* compute concept stats (PASS / FAIL / NT) */
function computeConceptStats(allStats=[]){
  const set=new Set(), map=new Map();
  allStats.forEach(att=>{
    (att.conceptStats||[]).forEach(cs=>{
      set.add(cs.conceptName);
      if(!map.has(cs.conceptName)) map.set(cs.conceptName,"NT");
      if(cs.passOrFail==="PASS") map.set(cs.conceptName,"PASS");
      else if(cs.passOrFail==="FAIL" && map.get(cs.conceptName)!=="PASS")
        map.set(cs.conceptName,"FAIL");
    });
  });
  return {set,map};
}

/* AttemptsByDate (same as before – shortened comments only) */
function AttemptsByDate({ attempts, onOpen }){
  if(!attempts?.length) return null;
  const byDay={};
  attempts.forEach(a=>{
    const day=new Date(ms(a.timestamp)).toISOString().slice(0,10);
    (byDay[day]??=[]).push(a);
  });

  return (
    <Box>
      {Object.entries(byDay).sort().map(([day,arr])=>(
        <Accordion key={day} sx={{background:"#555",color:"#fff",mb:1}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#fff"}}/>}>
            <Typography variant="body2" sx={{fontWeight:600}}>
              {day} ({arr.length} attempt{arr.length>1?"s":""})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{display:"flex",flexWrap:"wrap",gap:1}}>
              {arr.map((att,i)=>(
                <Box key={i} sx={{
                  display:"inline-flex",alignItems:"center",gap:0.5,
                  background:"#666",px:1,py:0.5,borderRadius:1,cursor:"pointer"
                }} onClick={e=>{e.stopPropagation();onOpen(att);}}>
                  <Typography variant="body2">
                    {(att.type==="quiz"?"Q":"R")}{att.attemptNumber||att.revisionNumber||1}
                  </Typography>
                  <InfoOutlinedIcon sx={{fontSize:"1rem"}}/>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

/* ConceptQuizTable (unchanged – omitted here for brevity; leave yours intact) */
function ConceptQuizTable({ conceptList, quizAttempts }){/* …same as previous… */}

/* ─────────── main component ─────────── */
export default function ActivityAccordion({
  index, activity, bookName="", timeMap, subchapterStatusMap, onClickActivity,
  setDebugOpen,setDebugTitle,setDebugData,
  setHistoryOpen,setHistoryTitle,setHistoryData,
  setPrevModalOpen,setPrevModalTitle,setPrevModalItems,
  setProgressOpen,setProgressTitle,setProgressData,
  setTimeDetailOpen,setTimeDetailTitle,setTimeDetailData,
  timeFetchLogs,statusFetchLogs,
}){
  /* user auth (for admin gate) */
   const uid   = useSelector(s => s.auth?.userId);
    const isAdmin = ADMIN_UIDS.includes(uid);

  /* base meta */
  const lumpsSec = timeMap[activity.activityId]||0;
  const expMin   = activity.timeNeeded||0;
  const header   = `Activity #${index+1} — ID: ${activity.activityId||"?"} (${activity.type})`;
  const locked   = (activity.aggregatorStatus||"").toLowerCase()==="locked";

  /* aggregator slices */
  const statusMap = subchapterStatusMap ?? {};          // ← NEW
  const aggObj    = statusMap[activity.subChapterId] || {};
  const stageKey = stageKeyOf(activity);
  const stageObj = (aggObj.quizStagesData||{})[stageKey]||{};
  const quizAttempts=stageObj.quizAttempts||[];
  const revAttempts =stageObj.revisionAttempts||[];
  const combined    = merge(quizAttempts,revAttempts);
  const conceptList = aggObj.concepts||[];

  /* progress & concept squares */
  const {set:conceptSet,map:statMap}=computeConceptStats(stageObj.allAttemptsConceptStats||[]);
  const totalCon=conceptSet.size||conceptList.length;
  const mastered=[...statMap.values()].filter(v=>v==="PASS").length;
  const progress = activity.completed ? 100 :
                   stageKey!=="reading" && totalCon ? Math.round(mastered/totalCon*100) : 0;
  const conceptTip = totalCon
    ? [...conceptSet].sort().map(c=>{
        const st=statMap.get(c)||"NT";
        const col=st==="PASS"?"#66bb6a":st==="FAIL"?"#ef5350":"#ccc";
        return `<div style='color:${col}'>${c} (${st})</div>`;
      }).join("")
    : "No concept data.";

  /* RAW dialog */
  const [rawOpen,setRawOpen]=useState(false), [rawTitle,setRawTitle]=useState(""),
        [rawData,setRawData]=useState(null);
  const openRaw=item=>{
    const p=item.type==="quiz"?"Q":"R";
    const n=item.attemptNumber||item.revisionNumber||1;
    setRawTitle(`${p}${n} ⇒ Raw Data`); setRawData(item); setRawOpen(true);
  };

  /* inner accordion */
  const [cfgOpen,setCfgOpen]=useState(false);

  return (
    <Box sx={{position:"relative",mb:1}}>
      {locked && aggregatorLockedOverlay()}

      <Accordion sx={{background:"#444",color:"#fff",border:"1px solid #666"}}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#fff"}}/>}>
          <Typography variant="body2" sx={{fontWeight:600}}>{header}</Typography>
        </AccordionSummary>

        <AccordionDetails>

          {/* ── summary squares ── */}
          <Box sx={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,mb:1}}>
            <Square label="Sub-chapter" value={activity.subChapterName||activity.subChapterId}/>
            <Square label="Type"        value={activity.type}/>
            <Square label="Book"        value={bookName||activity.bookName}/>
            <Square label="Concepts"    value={`${mastered}/${totalCon}`}
                    tooltip={<div dangerouslySetInnerHTML={{__html:conceptTip}}/>}/>
            <Square label="Progress"    value={`${progress}%`}/>
            <Square label="Time A / E"  value={`${fmtSec(lumpsSec)} / ${expMin}m`}/>
          </Box>

          {/* ── configuration (admin only) ── */}
          {isAdmin && (
            <Accordion
              expanded={cfgOpen}
              onChange={()=>setCfgOpen(o=>!o)}
              sx={{background:"#333",color:"#fff",border:"1px solid #555"}}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#fff"}}/>}>
                <Typography variant="body2" sx={{fontWeight:600}}>Configuration</Typography>
              </AccordionSummary>

              <AccordionDetails>

                {/* (1) Plan doc */}
                <Box sx={{mb:2,pl:1}}>
                  <Typography variant="subtitle2" sx={{mb:1}}>Plan Doc (Raw)</Typography>
                  <Box sx={{ml:2}}>
                    <pre style={{color:"#0f0",background:"#222",padding:8}}>
                      {JSON.stringify(activity,null,2)}
                    </pre>
                  </Box>
                </Box>

                {/* (2) Aggregator info */}
                <AggregatorInfoPanel
                  activity={activity}
                  timeMap={timeMap}
                  subchapterStatusMap={subchapterStatusMap}
                  setTimeDetailOpen={setTimeDetailOpen}
                  setTimeDetailTitle={setTimeDetailTitle}
                  setTimeDetailData={setTimeDetailData}
                  timeFetchLogs={timeFetchLogs}
                  statusFetchLogs={statusFetchLogs}
                />

                {/* (3) Concepts list */}
                <Box sx={{mt:2,pl:1}}>
                  <Typography variant="subtitle2" sx={{mb:1}}>Subchapter Concepts</Typography>
                  <Typography variant="body2" sx={{mb:1}}>
                    Found {conceptList.length} concept(s) for subChId={activity.subChapterId}.
                  </Typography>
                  {!!conceptList.length && (
                    <ul style={{marginLeft:"1.25rem"}}>
                      {conceptList.map(c=><li key={c.id}>{c.name||`Concept ${c.id}`}</li>)}
                    </ul>
                  )}
                </Box>

                {/* (4) Concept × Quiz table */}
                {stageKeyOf(activity)!=="reading" && quizAttempts.length && conceptList.length && (
                  <Box sx={{mt:2,pl:1}}>
                    <Typography variant="subtitle2" sx={{mb:1}}>Concept vs Quiz Attempts</Typography>
                    <ConceptQuizTable conceptList={conceptList} quizAttempts={quizAttempts}/>
                  </Box>
                )}

                {/* (5) Attempts by date */}
                {stageKeyOf(activity)!=="reading" && combined.length>0 && (
                  <Box sx={{mt:2,pl:1}}>
                    <Typography variant="subtitle2" sx={{mb:1}}>Attempts by Date</Typography>
                    <AttemptsByDate attempts={combined} onOpen={openRaw}/>
                  </Box>
                )}

                {/* (6) PlanFetcher link */}
                <Box sx={{mt:2}}>
                  <Typography variant="body2"
                    sx={{textDecoration:"underline",cursor:"pointer",color:"#ccc"}}
                    onClick={e=>{e.stopPropagation();onClickActivity(activity);}}>
                    Open PlanFetcher for this Activity
                  </Typography>
                </Box>

                {/* (7) Completion summary */}
                <Box sx={{mt:2}}>
                  <CompletionSummaryPanel
                    activity={activity}
                    aggregatorObj={aggObj}
                    conceptList={conceptList}
                    attempts={combined}
                  />
                </Box>

              </AccordionDetails>
            </Accordion>
          )}

        </AccordionDetails>
      </Accordion>

      {/* RAW dialog */}
      <Dialog open={rawOpen} onClose={()=>setRawOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{rawTitle}</DialogTitle>
        <DialogContent sx={{background:"#222",color:"#fff"}}>
          {rawData?(
            <>
              {rawData.type==="quiz" && rawData.quizSubmission && (
                <>
                  <Typography variant="body2" sx={{fontWeight:"bold",mb:1}}>
                    Detailed Q/A
                  </Typography>
                  <QuizSubmissionDetails attempt={rawData}/>
                </>
              )}
              <Typography variant="body2" sx={{fontWeight:"bold",mt:2}}>Raw JSON:</Typography>
              <pre style={{color:"#0f0",fontSize:"0.85rem",whiteSpace:"pre-wrap"}}>
                {JSON.stringify(rawData,null,2)}
              </pre>
            </>
          ):<Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{background:"#222"}}>
          <Button variant="contained" color="secondary" onClick={()=>setRawOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}