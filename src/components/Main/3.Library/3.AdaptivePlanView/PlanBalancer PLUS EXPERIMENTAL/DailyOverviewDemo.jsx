/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/0.Parent/DailyOverviewDemo.jsx
   v11 – history-tab summary widget
   ----------------------------------------------------------------
   • relies solely on @mui/material (no new deps)
   • plug-and-play: drop in, import stays identical
───────────────────────────────────────────────────────────────── */

import React, { useMemo, useState } from "react";
import {
  Box, Typography, LinearProgress,
  Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ───── fixed glyphs ─────────────────────────────────────────── */
const ICON_BOOK    = "📚";
const ICON_UNIT    = "📂";
const ICON_CHAPTER = "📄";
const ICON_CLOCK   = "⏱";
const ICON_CROSS   = "❌";
const ICON_ARROW   = "↗";

/* ───── stage → colour / icon map ────────────────────────────── */
const STAGE_META = {
  Read      : { color:"#BB86FC", icon:"📖" },
  Remember  : { color:"#80DEEA", icon:"🧠" },
  Understand: { color:"#FFD54F", icon:"🤔" },
  Apply     : { color:"#AED581", icon:"🔧" },
  Analyse   : { color:"#F48FB1", icon:"🔬" },
};

/* deterministic helper so demo is stable on each reload */
const rand = s => { const x = Math.sin(s)*10000; return x - Math.floor(x); };

/* ───── demo-data constants ──────────────────────────────────── */
const UNIT            = "Electrostatics";
const CHAPTER_LABEL   = "1. Kinematics";
const SUB_BASE        = ["Vectors","Graphs","Forces","Field Lines","Energy"];
const CONCEPTS        = ["Displacement","Velocity","Acceleration",
                         "Projectile","Relative Motion"];
const STAGE_ORDER     = ["Read","Remember","Understand","Apply","Analyse"];

/* makes one day with 5 tasks – seed gives repeatability */
function buildDay(seed, label){
  const tasks = STAGE_ORDER.map((stage, idx) => {
    const s    = seed*100 + idx;
    const meta = STAGE_META[stage];

    const subLabel = `1.${idx+1} ${SUB_BASE[idx % SUB_BASE.length]}`;

    /* base progress -------------------------------------------------- */
    const totalC = stage==="Read" ? 0 : 5;
    const doneC  = stage==="Read" ? 0 : Math.floor(rand(s+5)*totalC);
    const pct    = stage==="Read" ? 0 : Math.round(doneC / totalC * 100);

    /* special “Yesterday” demo statuses ----------------------------- */
    let status = "normal";
    if (label==="Yesterday"){
      if (stage==="Read" || stage==="Remember")              status = "done";
      else if (stage==="Understand" || stage==="Apply")      status = "partial";
      else if (stage==="Analyse")                            status = "none";
    }

    /* override for visual clarity ----------------------------------- */
    const finalDoneC = status==="done"   ? totalC :
                       status==="none"   ? 0      : doneC;
    const finalPct   = status==="done"   ? 100    :
                       status==="none"   ? 0      : pct;

    const totalMin   = 10;
    const spentMin   = status==="done" ? totalMin :
                       status==="none" ? 0        :
                       2 + (idx % 4) * 2;   // 2-8 min junk time

    return {
      id:`${seed}-${idx}`,
      stage, meta, status,
      subch:subLabel,

      subject : { name:"Physics", icon:ICON_BOOK },
      unit    : { name:UNIT,      icon:ICON_UNIT },
      chapter : { name:CHAPTER_LABEL, icon:ICON_CHAPTER },

      pct:finalPct,
      doneC:finalDoneC,
      totalC,
      spentMin,
      totalMin,
      conceptList: CONCEPTS.map((c,i)=>({ name:c, ok:i<finalDoneC }))
    };
  });

  return { label, tasks };
}

/* ───── build the three buckets ───────────────────────────────── */
const historyDays = [
  buildDay(1,"Yesterday"),
  buildDay(11,"2 days ago"),
  buildDay(12,"3 days ago"),
];

const todayDays   = [
  buildDay(2,"Today"),
];

const futureDays  = [
  buildDay(3,"Tomorrow"),
  buildDay(13,"+2 days"),
  buildDay(14,"+3 days"),
];

/* =====================================================================
   MAIN EXPORT
===================================================================== */
export default function DailyOverviewDemo(){

  const TAB_LIST = ["History","Today","Future"];
  const [tabIdx,setTabIdx] = useState(1);        // 0-hist, 1-today, 2-future

  const currentDays = useMemo(()=>{
    if      (tabIdx===0) return historyDays;
    else if (tabIdx===2) return futureDays;
    return todayDays;
  },[tabIdx]);

  /* ─── UI ─────────────────────────────────────────────────────── */
  return (
    <Box sx={{ color:"#fff" }}>

      {/* tab selector */}
      <Tabs
        value={tabIdx}
        onChange={(e,v)=>setTabIdx(v)}
        textColor="inherit"
        TabIndicatorProps={{ style:{ background:"#BB86FC" } }}
        sx={{ mb:2 }}
      >
        {TAB_LIST.map(label=>(
          <Tab key={label} label={label.toUpperCase()}/>
        ))}
      </Tabs>

      {/* day accordions */}
      {currentDays.map(day=>(
        <DayAccordion
          key={day.label}
          day={day}
          showSummary={tabIdx===0}   /* show widget only in History */
        />
      ))}
    </Box>
  );
}

/* =====================================================================
   Day accordion – identical card grid inside
   now optionally prepends a summary widget
===================================================================== */
function DayAccordion({ day, showSummary }){
  return (
    <Accordion
      defaultExpanded={day.label==="Today"}
      sx={{
        bgcolor:"#1a1a1a",
        border:"1px solid #444",
        mb:2,
        "&:before":{ display:"none" }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color:"#fff" }}/>}
        sx={{ color:"#fff" }}
      >
        <Typography sx={{ fontWeight:700, mr:1 }}>{day.label}</Typography>
        <Typography sx={{ opacity:.7, fontSize:13 }}>
          {day.tasks.length} tasks
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        {/* summary widget (history tab only) */}
        {showSummary && <SummaryWidget tasks={day.tasks}/>}

        {/* task grid */}
        <Box
          sx={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
            gap:1.5,
          }}
        >
          {day.tasks.map(t=>(
            <TaskCard key={t.id} task={t}/>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

/* =====================================================================
   Summary widget (new)
   – non-interactive, purely informational
===================================================================== */
function SummaryWidget({ tasks }){
  /* crunch numbers */
  const total       = tasks.length;
  const completed   = tasks.filter(t=>t.status==="done").length;
  const partial     = tasks.filter(t=>t.status==="partial").length;
  const notStarted  = tasks.filter(t=>t.status==="none").length;
  const spentMin    = tasks.reduce((s,t)=>s + (t.spentMin||0),0);

  return (
    <Box
      sx={{
        mb:2, p:1.5,
        bgcolor:"#262626",
        color:  "#fff",  
        border:"1px solid #555",
        borderRadius:2,
        display:"flex",
        flexWrap:"wrap",
        gap:2,
      }}
    >
      <SummaryItem label="Total tasks"  value={total}/>
      <SummaryItem label="Completed"    value={completed}/>
      <SummaryItem label="Partially done" value={partial}/>
      <SummaryItem label="Not started"  value={notStarted}/>
      <SummaryItem label="Time spent"   value={`${spentMin} min`}/>
    </Box>
  );
}

function SummaryItem({ label, value }){
  return (
    <Box sx={{ minWidth:110 }}>
      <Typography sx={{ fontSize:12, opacity:.7 }}>{label}</Typography>
      <Typography sx={{ fontSize:16, fontWeight:700 }}>{value}</Typography>
    </Box>
  );
}

/* =====================================================================
   Task card (unchanged layout – no badge icon)
===================================================================== */
function TaskCard({ task:t }){
  /* colour presets */
  let bg="#000", border=t.meta.color,
      statusLabel=null, subLabel=null;

  switch(t.status){
    case "done":
      bg="rgba(76,175,80,.15)";  border="#4CAF50";
      statusLabel="Completed";                   break;
    case "partial":
      bg="rgba(255,152,0,.15)";  border="#FF9800";
      statusLabel="Partially done";
      subLabel="Deferred to next day";           break;
    case "none":
      bg="rgba(244,67,54,.15)";  border="#F44336";
      statusLabel="Not started";
      subLabel="Deferred to next day";           break;
    default: /* normal cards */
  }

  return (
    <Box
      sx={{
        display:"flex", flexDirection:"column",
        height:225, p:1.2,
        bgcolor:bg,
        border:`2px solid ${border}`,
        borderRadius:2,
        transition:"transform .15s",
        "&:hover":{ transform:"translateY(-3px)" }
      }}
    >
      {/* sub-chapter header */}
      <Tooltip title={t.subch}>
        <Typography
          sx={{
            fontWeight:700, fontSize:".88rem",
            color:t.meta.color,
            whiteSpace:"nowrap", overflow:"hidden",
            textOverflow:"ellipsis", mb:.6,
          }}
        >
          {t.subch}
        </Typography>
      </Tooltip>

      {/* status labels */}
      {statusLabel && (
        <Typography sx={{ fontSize:11, fontWeight:700, color:border }}>
          {statusLabel}
        </Typography>
      )}
      {subLabel && (
        <Typography sx={{ fontSize:10, mb:.4, color:"#ccc" }}>
          {subLabel}
        </Typography>
      )}

      {/* stage row */}
      <Row icon={t.meta.icon} label={t.stage} bold color={t.meta.color}/>

      {/* hierarchy rows */}
      <Row icon={ICON_BOOK}    label="Physics"/>
      <Row icon={ICON_UNIT}    label={UNIT}/>
      <Row icon={ICON_CHAPTER} label={CHAPTER_LABEL}/>

      {/* time row */}
      <Row icon={ICON_CLOCK} label={`${t.spentMin}/${t.totalMin} min`}/>

      <Box sx={{ flex:1 }}/>

      {/* progress + concepts unless Read */}
      {t.stage!=="Read" && (
        <>
          <LinearProgress
            variant="determinate"
            value={t.pct}
            sx={{
              height:6, borderRadius:2,
              bgcolor:"#333",
              "& .MuiLinearProgress-bar":{ bgcolor:t.meta.color }
            }}
          />
          <Box
            sx={{
              mt:.4, fontSize:11,
              display:"flex", justifyContent:"space-between", color:"#fff"
            }}
          >
            <span>{t.pct}%</span>
            <Tooltip
              title={
                <Box sx={{ fontSize:12 }}>
                  {t.conceptList.map(c=>(
                    <Box key={c.name}>
                      {c.ok?"✅":"❌"} {c.name}
                    </Box>
                  ))}
                </Box>
              }
              arrow
            >
              <span style={{ cursor:"help", textDecoration:"underline" }}>
                {t.doneC}/{t.totalC} concepts
              </span>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
}

/* helper row */
function Row({ icon, label, bold=false, color="#fff" }){
  return (
    <Box sx={{ display:"flex", alignItems:"center", mb:.3 }}>
      <Box sx={{ width:18, textAlign:"center", mr:.6 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize:12,
          fontWeight:bold?700:400,
          color,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}