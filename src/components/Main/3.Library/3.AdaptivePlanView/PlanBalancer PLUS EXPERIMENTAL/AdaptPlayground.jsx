/* ------------------------------------------------------------------
   ONE-FILE sandbox – React 18, no TypeScript
   ------------------------------------------------------------------ */
   import React, { useState } from "react";
   import {
     Box, Accordion, AccordionSummary, AccordionDetails,
     Typography, Checkbox, TextField, Button, Divider
   } from "@mui/material";
   import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
   import prettyMs from "pretty-ms";
   
   import { rebalancePlan } from "./rebalancePlan";
   
   /* ---------- helper to start a tiny 5-day mock plan ---------- */
   const makePlan = () => ({
     id: "demo-plan",
     userId: "acbhbtiODoPPcks2CP6Z",
     dailyReadingTimeUsed: 30,
     planCreationDate: new Date("2025-04-29").toISOString().slice(0, 10),
     todayDate:        new Date("2025-04-29").toISOString().slice(0, 10),
     sessions: Array.from({ length: 5 }, (_, d) => ({
       sessionLabel: String(d + 1),
       locked: false,
       activities: [
         {
           activityId: `read-${d}`,
           type: "READ",
           timeNeeded: 8,
           completed: false,
           deferred: false,
           subChapterName: `SC${d + 1}`,
         },
         ...["remember", "understand", "apply", "analyze"].map((stage) => ({
           activityId: `q-${stage}-${d}`,
           type: "QUIZ",
           quizStage: stage,
           timeNeeded: 5,
           completed: false,
           deferred: false,
           subChapterName: `SC${d + 1}`,
         })),
       ],
     })),
   });
   
   /* ------------------------------------------------------------------ */
   export default function AdaptPlayground() {
     const [plan, setPlan]       = useState(makePlan());
     const [history, setHistory] = useState([]);
     const [runTime, setRunTime] = useState("");
   
     /* ------------- field mutators ------------- */
     const editField = (k, v) => setPlan(p => ({ ...p, [k]: v }));
   
     const editActivity = (s, a, fn) =>
       setPlan(p => {
         const c = structuredClone(p);
         fn(c.sessions[s].activities[a]);
         return c;
       });
   
     /* ------------- run re-balance ------------- */
     const handleRun = () => {
       const creation = new Date(plan.planCreationDate);
       const today    = new Date(plan.todayDate);
       const diffDays = Math.max(
         0,
         Math.floor((today - creation) / (24 * 3600 * 1e3))
       );
   
       let cur = structuredClone(plan);
       const t0 = performance.now();
       cur      = rebalancePlan(cur, diffDays, {});
       setRunTime(prettyMs(performance.now() - t0));
   
       setHistory(h => [plan, ...h]);   // snapshot before change
       setPlan(cur);
     };
   
     /* ------------- little helpers ------------- */
     const sumTime = s => s.activities.reduce((n, a) => n + (a.timeNeeded || 0), 0);
   
     const actLabel = a =>
       a.type === "READ" ? "READ" : `Q-${a.quizStage.toUpperCase()}`;
   
     /* ------------- UI ------------- */
     return (
       <Box sx={{ p: 2, color: "#fff", fontFamily: "Inter,Roboto,sans-serif" }}>
         <Typography variant="h6" sx={{ mb: 2 }}>Adaptive-Plan Playground</Typography>
   
         {/* top controls */}
         <Box sx={{ display:"flex", gap:2, flexWrap:"wrap", mb:2 }}>
           <TextField
             label="Plan creation"
             type="date" size="small"
             value={plan.planCreationDate}
             onChange={e=>editField("planCreationDate", e.target.value)}
             sx={{ input:{color:"#fff"} }}
           />
           <TextField
             label="Today"
             type="date" size="small"
             value={plan.todayDate}
             onChange={e=>editField("todayDate", e.target.value)}
             sx={{ input:{color:"#fff"} }}
           />
           <TextField
             label="Daily limit (min)"
             type="number" size="small"
             value={plan.dailyReadingTimeUsed}
             onChange={e=>editField("dailyReadingTimeUsed", Number(e.target.value))}
             sx={{ input:{color:"#fff"}, width:120 }}
           />
         </Box>
   
         {/* sessions */}
         {plan.sessions.map((sess, sIdx) => (
           <Accordion key={sIdx} defaultExpanded sx={{ bgcolor:"#1a1a1a", mb:1 }}>
             <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#fff"}}/>}>
               <Typography sx={{ flex:1, color:"#fff" }}>
                 Day {sess.sessionLabel} – {sess.activities.length} tasks
                 &nbsp;|&nbsp; {sumTime(sess)}/{plan.dailyReadingTimeUsed} min
                 {sess.locked && " • LOCKED"}
               </Typography>
             </AccordionSummary>
   
             <AccordionDetails>
               {sess.activities.map((a, aIdx) => (
                 sess.locked ? (
                   /* locked view */
                   <Typography key={a.activityId} sx={{ fontSize:14, color:"#ccc", ml:1 }}>
                     • {actLabel(a)} – {a.subChapterName}{" "}
                     {a.completed && <span style={{color:"#4caf50"}}>[✓ DONE]</span>}
                     {a.deferred  && <span style={{color:"#ffb300"}}>[↩ DEFERRED]</span>}
                     {a.processed && <span style={{color:"#90caf9"}}>[↻ PROCESSED]</span>}
                     {a.replicaIndex ? ` (replica ${a.replicaIndex})` : ""}
                   </Typography>
                 ) : (
                   /* editable row */
                   <Box key={a.activityId}
                        sx={{ display:"grid", gridTemplateColumns:"32px 32px 110px 140px 80px",
                              gap:1, alignItems:"center", mb:.8 }}>
                     <Checkbox checked={a.completed}
                               onChange={()=>editActivity(sIdx,aIdx,x=>x.completed=!x.completed)}
                               sx={{color:"#fff"}}/>
                     <Checkbox checked={a.deferred}
                               onChange={()=>editActivity(sIdx,aIdx,x=>x.deferred=!x.deferred)}
                               sx={{color:"#bbb"}}/>
                     <Typography sx={{fontSize:14}}>{actLabel(a)}</Typography>
                     <Typography sx={{fontSize:12,opacity:.8}}>
                       {a.subChapterName}
                     </Typography>
                     <TextField size="small" type="number" sx={{width:70,input:{color:"#fff"}}}
                                value={a.timeNeeded}
                                onChange={e=>editActivity(sIdx,aIdx,
                                   x=>x.timeNeeded=Number(e.target.value)||0)}/>
                   </Box>
                 )
               ))}
             </AccordionDetails>
           </Accordion>
         ))}
   
         <Button variant="contained" onClick={handleRun}>Re-balance</Button>
         {runTime && <Typography sx={{mt:1,fontSize:14}}>⏱ {runTime}</Typography>}
   
         {/* history snapshots */}
         {history.length>0 && (
           <>
             <Divider sx={{my:3,bgcolor:"#666"}}/>
             <Typography variant="subtitle1" sx={{mb:1}}>Previous snapshots</Typography>
             {history.map((snap,i)=>(
               <Accordion key={i} sx={{bgcolor:"#111",color:"#fff",mb:1}}>
                 <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#fff"}}/>}>
                   <Typography>Snapshot #{i+1}</Typography>
                 </AccordionSummary>
                 <AccordionDetails>
                   {snap.sessions.map(s=>(
                     <Box key={s.sessionLabel} sx={{mb:1}}>
                       <Typography sx={{fontWeight:600}}>
                         Day {s.sessionLabel}{s.locked?" (locked)":""}
                       </Typography>
                       {s.activities.map(a=>(
                         <Typography key={a.activityId} sx={{fontSize:13,ml:2}}>
                           • {actLabel(a)} – {a.subChapterName}
                           {a.deferred ? " [DEFERRED]"
                                       : a.completed ? " [✓ DONE]" : ""}
                           {a.processed ? " [PROCESSED]" : ""}
                           {a.replicaIndex ? ` (rep ${a.replicaIndex})` : ""}
                         </Typography>
                       ))}
                     </Box>
                   ))}
                 </AccordionDetails>
               </Accordion>
             ))}
           </>
         )}
       </Box>
     );
   }