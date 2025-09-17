/* ───────────────────────────────────────────────────────────────
   File: src/components/DetailedBookViewer/PanelC.jsx
   v3 – mini-cards with synthetic meta (2025-04-28)
──────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import { useSelector }               from "react-redux";
import axios                         from "axios";

/* Firestore ---------------------------------------------------- */
import {
  doc, getDoc,
  collection, getDocs,
  query, where, orderBy, limit
} from "firebase/firestore";
import { db } from "../../../firebase";                       // ← adjust

/* MUI ---------------------------------------------------------- */
import {
  Box, Typography, IconButton, Button,
  CircularProgress, Dialog, DialogContent,
  Grid, Card, CardContent, CardActions, Chip
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

/* Player modal ------------------------------------------------- */
import PlanFetcher   from "../5.StudyModal/StudyModal";        // ← adjust

/* — exam → cloned-book field map (same as GuideOnboarding) — */
const FIELD_MAP = {
  NEET  : "clonedNeetBook",
  TOEFL : "clonedToeflBooks",
  // add more if needed…
};

/* — helper: stage done? — */
const doneLike = (v="") =>
  ["done","complete","pass"].some(t=>v.toLowerCase().includes(t));

const overallPct = (obj={})=>{
  const ids=Object.keys(obj); if(!ids.length) return 0;
  let sum=0;
  ids.forEach(id=>{
    const r=obj[id]||{}; let d=0;
    if(doneLike(r.reading))    d++;
    if(doneLike(r.remember))   d++;
    if(doneLike(r.understand)) d++;
    if(doneLike(r.apply))      d++;
    if(doneLike(r.analyze))    d++;
    sum += (d/5)*100;
  });
  return Math.round(sum/ids.length);
};

/* — card accent palette — */
const ACCENTS = ["#BB86FC","#F48FB1","#80DEEA","#AED581","#FFB74D"];

/* — fake meta generators (until backend supplies real data) — */
const SUBJECT_POOL = {
  NEET  : ["Physics","Chemistry","Biology"],
  TOEFL : ["Reading","Listening","Speaking","Writing"],
  DEFAULT:["Maths","English","Logic","GK"]
};
const LEVELS = ["Mastery","Revision","Glance"];

function randomPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

/** create a stable pseudo-random meta per plan */
function generateFakeMeta(pid, exam="DEFAULT"){
  const pool = SUBJECT_POOL[exam.toUpperCase()] || SUBJECT_POOL.DEFAULT;
  const main = randomPick(pool);
  const others = pool.filter(s=>s!==main)
                     .sort(()=>0.5-Math.random())
                     .slice(0,2);
  const level = randomPick(LEVELS);
  const days  = 15 + Math.floor(Math.random()*75);            // 15-90
  const mins  = 15 + Math.floor(Math.random()*10)*5;          // 15-60
  return {
    name     : `${main} ${level} Plan`,
    daysLeft : days,
    dailyMin : mins,
    subjects : [main,...others],
    level,
  };
}

/* — cloud function wrappers (unchanged) — */
async function buildAgg(userId,planId,bookId){
  await fetch(
    "https://us-central1-comm-app-ff74b.cloudfunctions.net/generateUserProgressAggregator2",
    { method:"POST", headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ userId, planId, bookId }) }
  );
}
async function fetchAgg(db,userId,planId,bookId){
  const col=collection(db,"aggregator_v2");
  const q=query(
    col,
    where("userId","==",userId),
    where("planId","==",planId),
    where("bookId","==",bookId),
    orderBy("createdAt","desc"),
    limit(1)
  );
  const snap=await getDocs(q);
  if(snap.empty) return { pct:0, ts:null };
  const d=snap.docs[0].data()||{};
  return {
    pct: overallPct(d.aggregatorResult||{}),
    ts : d.createdAt?.toDate?.() ??
         new Date(d.createdAt?._seconds*1000 || Date.now()),
  };
}

/* ───────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */
export default function PanelC({
  userId           = "",
  onOpenOnboarding = ()=>{},
}){
  const examType      = useSelector(s=>s.exam?.examType);
  const backendURL    = import.meta.env.VITE_BACKEND_URL;

  /* 1. bookId & name ------------------------------------------- */
  const [bookId,setBookId]     = useState(null);
  const [bookName,setBookName] = useState("Loading…");
  const [errBook,setErrBook]   = useState(null);
  const [busyBook,setBusyBook] = useState(false);

  useEffect(()=>{
    if(!userId||!examType) return;
    (async()=>{
      setBusyBook(true); setErrBook(null);
      try{
        const snap=await getDoc(doc(db,"users",userId));
        if(!snap.exists()) throw new Error("user doc missing");

        const entry = snap.data()[FIELD_MAP[examType.toUpperCase()]];
        const id    = Array.isArray(entry)? entry?.[0]?.newBookId : entry?.newBookId;
        if(!id) throw new Error("newBookId missing");
        setBookId(id);

        const bSnap=await getDoc(doc(db,"books_demo",id));
        setBookName(bSnap.exists()? (bSnap.data()?.name || "Unnamed Book") : "Unnamed Book");
      }catch(e){ setErrBook(e.message||String(e)); }
      finally   { setBusyBook(false); }
    })();
  },[userId,examType]);

  /* 2. plan IDs ------------------------------------------------- */
  const [planIds,setPlanIds]   = useState([]);
  const [busyPlans,setBusyPlans]=useState(false);

  useEffect(()=>{
    if(!userId||!bookId) return;
    (async()=>{
      setBusyPlans(true);
      try{
        const res=await axios.get(
          `${backendURL}/api/adaptive-plan-id`,
          { params:{ userId, bookId } }
        );
        setPlanIds(res.data?.planIds || []);
      }catch(e){ console.error("planId fetch:",e); setPlanIds([]); }
      finally  { setBusyPlans(false); }
    })();
  },[userId,bookId,backendURL]);

  /* 3. fake metadata (computed once per plan list) -------------- */
  const [metaMap,setMetaMap] = useState({});   // { planId: meta }
  useEffect(()=>{
    if(planIds.length===0) { setMetaMap({}); return; }
    const mm={};
    planIds.forEach(pid=>{
      mm[pid]=generateFakeMeta(pid,examType);
    });
    setMetaMap(mm);
  },[planIds,examType]);

  /* 4. aggregator per plan -------------------------------------- */
  const [aggMap,setAggMap]   = useState({});   // { planId: {pct,ts} }
  const [busyAgg,setBusyAgg] = useState(false);

  useEffect(()=>{
    if(!userId||!bookId||planIds.length===0) return;
    setBusyAgg(true);
    Promise.all(
      planIds.map(async pid=>{
        try{
          await buildAgg(userId,pid,bookId);
          const {pct}=await fetchAgg(db,userId,pid,bookId);
          return [pid,{pct}];
        }catch(e){
          console.error("agg",pid,e);
          return [pid,{pct:0}];
        }
      })
    ).then(entries=>{
      const obj={}; entries.forEach(([k,v])=>{ obj[k]=v; });
      setAggMap(obj); setBusyAgg(false);
    });
  },[userId,bookId,planIds]);

  /* 5. player modal --------------------------------------------- */
  const [currentPlan,setCurrentPlan]=useState(null);

  /* 6. early returns -------------------------------------------- */
  if(busyBook) return <Box sx={styles.wrapper}><CircularProgress/></Box>;
  if(errBook||!bookId) return <Box sx={styles.wrapper}>{errBook||"No book."}</Box>;

  /* 7. render ---------------------------------------------------- */
  return (
    <Box sx={styles.wrapper}>

      {/* header */}
      <Box sx={{ display:"flex", alignItems:"center", mb:2 }}>
        <Typography variant="h6" sx={{ fontWeight:"bold" }}>
          {bookName}
        </Typography>
        <IconButton
          size="small"
          sx={{ color:"#4caf50", ml:"auto" }}
          title="Create / Upload Material"
          onClick={onOpenOnboarding}
        >
          <AddIcon/>
        </IconButton>
      </Box>

      {/* plan grid */}
      {(busyPlans||busyAgg)
        ? <CircularProgress/>
        : planIds.length===0
          ? <Typography>No plans yet. Use “+” to create one.</Typography>
          : (
            <Grid container spacing={2}>
              {planIds.map((pid,idx)=>{
                const accent = ACCENTS[idx % ACCENTS.length];
                const meta   = metaMap[pid] || {};
                const pct    = aggMap[pid]?.pct ?? 0;
                return (
                  <Grid item xs={12} sm={6} md={4} key={pid}>
                    <Card sx={{
                      bgcolor:"#1a1a1a",
                      color:"#fff",
                      border:`2px solid ${accent}40`,
                    }}>
                      <CardContent sx={{ textAlign:"center", pb:1 }}>
                        {/* Icon */}
                        <Box sx={{ fontSize:"2.2rem" }}>
                          {["📘","📙","📗","📕","📒"][idx%5]}
                        </Box>

                        {/* Plan name */}
                        <Typography
                          sx={{
                            mt:.5,
                            fontWeight:"bold",
                            whiteSpace:"nowrap",
                            overflow:"hidden",
                            textOverflow:"ellipsis",
                          }}>
                          {meta.name || pid}
                        </Typography>

                        {/* Subtitle */}
                        <Typography variant="body2" sx={{ opacity:.8 }}>
                          ⏰ {meta.daysLeft} d • {meta.dailyMin} min/day
                        </Typography>

                        {/* Progress ring */}
                        <CircularProgress
                          variant="determinate"
                          value={pct}
                          size={70}
                          thickness={4}
                          sx={{ mt:1.5, color:accent }}
                        />
                        <Typography sx={{ mt:.5, fontSize:14 }}>
                          {pct}% done
                        </Typography>

                        {/* Subject chips */}
                        <Box sx={{
                          mt:1,
                          display:"flex",
                          flexWrap:"wrap",
                          justifyContent:"center",
                          gap:.5
                        }}>
                          {(meta.subjects||[]).map(sub=>(
                            <Chip
                              key={sub}
                              size="small"
                              label={sub}
                              sx={{
                                bgcolor:"#333",
                                color:"#fff",
                                fontSize:11,
                                height:20,
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>

                      <CardActions sx={{ justifyContent:"center", pb:1.5 }}>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrowIcon/>}
                          size="small"
                          sx={{
                            bgcolor:accent,
                            color:"#000",
                            fontWeight:"bold",
                            "&:hover":{ bgcolor:accent },
                          }}
                          onClick={()=>setCurrentPlan(pid)}
                        >
                          {pct ? "Resume" : "Start"}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )
      }

      {/* modal */}
      <Dialog
        fullScreen
        open={!!currentPlan}
        onClose={()=>setCurrentPlan(null)}
      >
        <DialogContent sx={{ p:0, bgcolor:"#000" }}>
          {currentPlan && (
            <PlanFetcher
              planId={currentPlan}
              userId={userId}
              onClose={()=>setCurrentPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ----------------------------------------------------------------
   Styles
---------------------------------------------------------------- */
const styles = {
  wrapper:{
    width:"100%",
    height:"100%",
    p:3,
    bgcolor:"#000",
    color:"#fff",
    boxSizing:"border-box",
    overflowY:"auto",
  },
};