// BottomBar.jsx  (v2 – pale pills + quiz-stage)
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

/* ── accent colours kept only for the stage pill ── */
const STAGE_CLR = {
  reading  : "#AB91FF",
  remember : "#4DD0E1",
  understand:"#FFE082",
  apply    : "#AED581",
  analyze  : "#F48FB1",
  default  : "#9E9E9E",
};

/* ── bar + button styles ── */
const barStyle = {
  display:"flex", alignItems:"center", justifyContent:"space-between",
  padding:"8px 16px", height:50,
  background:"#222 linear-gradient(180deg,#2a2a2a,#222)", color:"#fff",
  boxSizing:"border-box", fontFamily:"sans-serif",
};
const arrowBtn = {
  cursor:"pointer", fontSize:"1.1rem",
  padding:"4px 6px",
  background:"#333", border:"1px solid #555", borderRadius:"50%",
  display:"flex", alignItems:"center", justifyContent:"center",
  color:"#fff",
};
const pill = (bg, fg="#fff") => ({
  backgroundColor:bg, color:fg,
  padding:"4px 8px", borderRadius:4,
  fontSize:"0.8rem", whiteSpace:"nowrap",
});

export default function BottomBar({
  stepPercent=0, currentIndex=0,
  totalSteps=1, dailyTime=0,
}) {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities } = useSelector(s=>s.plan) || {};
  const [showTT, setShowTT] = useState(false);

  /* onboarding plans hide bar */
  if((planDoc?.level||"").toLowerCase()==="onboarding") return null;

  /* nav helpers */
  const handlePrev = () =>
    currentIndex>0 && dispatch(setCurrentIndex(currentIndex-1));
  const handleNext = () =>
    flattenedActivities && currentIndex<flattenedActivities.length-1 &&
    dispatch(setCurrentIndex(currentIndex+1));

  const disablePrev = currentIndex<=0;
  const disableNext = !flattenedActivities || currentIndex>=flattenedActivities.length-1;

  /* current activity meta */
  let chapter="Unknown", subchap="Unknown", stageLabel="Activity", stageClr=STAGE_CLR.default;
  if(flattenedActivities?.[currentIndex]){
    const a = flattenedActivities[currentIndex];
    chapter = a.chapterName    || chapter;
    subchap = a.subChapterName || subchap;

    const t = (a.type||"").toLowerCase();
    if(t.includes("read")){
      stageLabel = "Reading";
      stageClr   = STAGE_CLR.reading;
    } else if(t.includes("quiz")){
      /* SHOW QUIZ-STAGE IF PRESENT */
      const qs   = (a.quizStage||"").toLowerCase();
      const nice = qs ? qs[0].toUpperCase()+qs.slice(1) : "Quiz";
      stageLabel = `Quiz · ${nice}`;
      stageClr   = STAGE_CLR[qs] || STAGE_CLR.default;
    } else if(t.includes("rev")){
      stageLabel = "Revision";
      stageClr   = STAGE_CLR.remember;
    }
  }

  /* time helper */
  const fmt = s=>{
    if(s>=3600){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
      return `${h}h ${m}m`; }
    if(s>=60){const m=Math.floor(s/60),ss=String(s%60).padStart(2,"0");
      return `${m}m ${ss}s`; }
    return `${s}s`;
  };

  return(
    <div style={barStyle}>
      {/* left – progress */}
      <span style={{fontSize:"0.8rem",fontWeight:700}}>
        Task {currentIndex+1} / {totalSteps} ({stepPercent}%)
      </span>

      {/* centre – arrows + pills */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={{...arrowBtn,opacity:disablePrev?0.3:1}}
                disabled={disablePrev} onClick={handlePrev}>&lt;</button>

        {/* pale grey pills for hierarchy */}
        <span style={pill("#424242")}>{chapter}</span>
        <span style={pill("#616161")}>{subchap}</span>
        {/* coloured stage pill */}
        <span style={pill(stageClr, "#000")}>{stageLabel}</span>

        <button style={{...arrowBtn,opacity:disableNext?0.3:1}}
                disabled={disableNext} onClick={handleNext}>&gt;</button>
      </div>

      {/* right – timer with tooltip */}
      <div style={{position:"relative",cursor:"default"}}
           onMouseEnter={()=>setShowTT(true)}
           onMouseLeave={()=>setShowTT(false)}>
        <span style={{fontSize:"1.2rem",marginRight:4}}>🕒</span>
        <span style={{fontWeight:600}}>{fmt(dailyTime)}</span>

        {showTT&&(
          <div style={{
            position:"absolute",top:"120%",right:0,
            background:"#333",color:"#fff",
            fontSize:"0.75rem",padding:"4px 8px",
            borderRadius:4,whiteSpace:"nowrap"
          }}>
            Today's Study Time: {fmt(dailyTime)}
          </div>
        )}
      </div>
    </div>
  );
}