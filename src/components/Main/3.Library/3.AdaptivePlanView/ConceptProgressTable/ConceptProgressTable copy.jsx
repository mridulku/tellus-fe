/***********************************************************************
 * ConceptProgressTable.jsx – v10
 * --------------------------------------------------------------------
 * • Journey pill (sub-chapter level) stays beside the breadcrumb.
 * • Table now has 6 columns:
 *       Concept | Weight | Stage-Status | Quiz-History | Confidence | Next-Rev
 * • Weight, Quiz-History, Confidence, Next-Revision are **static
 *   placeholders** for now (shown in green/orange chips & dots).
 * • All data-fetch, loading, retry and concept-status logic from v9
 *   remains unchanged.
 ***********************************************************************/

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch }            from "react-redux";
import {
  selectSubChList,
  selectConcepts,
} from "../../../../../store/planSlice";
import { fetchAggregatorForSubchapter }        from "../../../../../store/aggregatorSlice";

import {
  Box, Typography,
  FormControl, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Tooltip
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/* ──────────────── colours ──────────────── */
const CLR = {
  reading:"#BB86FC", remember:"#80DEEA", understand:"#FFD54F", apply:"#AED581", analyze:"#F48FB1",
  hi:"#66BB6A", med:"#FFA726", low:"#EF5350",
  pass:"#4CAF50", fail:"#E53935", nt:"#888",
  lock:"#c62828", done:"#2e7d32", dark:"#444"
};
const STAGES = ["reading","remember","understand","apply","analyze"];

/* ═════════ helper: tiny chip ═════════ */
const TinyChip = ({label,bg=CLR.dark,color="#000"})=>(
  <Chip size="small" label={label}
        sx={{bgcolor:bg,color,fontSize:11,m:0.15,"& .MuiChip-label":{px:.8}}}/>
);

/* ═════════ 1. Journey pill (unchanged from v9) ═════════ */
function JourneyPill({pct={}}){
  const state={}, getCur=()=>{
    let gate=true,cur="analyze";
    STAGES.forEach(st=>{
      const v=pct[st];
      if(st==="reading"){
        const r=v==null?0:v; state[st]=r===100?100:r; gate=r===100; return;
      }
      if(!gate){state[st]="LOCKED";return;}
      if(v==null){state[st]=0;gate=false;}
      else if(v>=100){state[st]=100;}
      else{state[st]=v;gate=false;}
      if(state[st]!=="LOCKED"&&state[st]<100) cur=st;
    });return cur;
  };
  const cur=getCur();
  const lbl=state[cur]==="LOCKED"?"Locked"
           :state[cur]===100?"Done":`${state[cur]}%`;

  const tip=(
    <Box sx={{fontSize:13}}>
      {STAGES.map(k=>{
        const v=state[k];
        const t=v==="LOCKED"?"🔒 locked":v===100?"✅ 100 %":`${v}%`;
        return <div key={k} style={{color:CLR[k]}}>
          <strong style={{textTransform:"capitalize"}}>{k}</strong>: {t}
        </div>;
      })}
    </Box>
  );

  return (
    <Tooltip arrow title={tip}>
      <Box sx={{display:"inline-flex",alignItems:"center",gap:.6,cursor:"default"}}>
        <TinyChip label={`${cur[0].toUpperCase()}${cur.slice(1)} ${lbl}`}
                  bg={CLR[cur]} color="#000"/>
        <InfoOutlinedIcon sx={{fontSize:16,color:"#bbb"}}/>
      </Box>
    </Tooltip>
  );
}

/* ═════════ 2. Stage-status chip for a concept ═════════ */
function conceptStatusChip({stage, readingDone, result}){
  if(!readingDone)    return <TinyChip label="📖 Reading…" bg={CLR.reading} color="#000"/>;
  if(stage==="done")  return <TinyChip label="🎉 Done"     bg={CLR.done}    color="#000"/>;
  if(result==="PASS") return <TinyChip label="✅"          bg={CLR.apply}   color="#000"/>;
  if(result==="FAIL") return <TinyChip label="❌"          bg={CLR.lock}    color="#fff"/>;
  return <TinyChip label="—" bg={CLR.dark} color="#fff"/>;
}

/* ═════════ 3. static placeholder columns ═════════ */
//   Weight  (Med)
const weightChip = <TinyChip label="Med"  bg={CLR.med} color="#000"/>;
//   Confidence (High)
const confChip   = <TinyChip label="High" bg={CLR.hi}  color="#000"/>;
//   Quiz-History (three green dots + tooltip)
const Dot=()=><Box sx={{width:10,height:10,borderRadius:"50%",bgcolor:CLR.pass}}/>;
const histTip=(<Box sx={{fontSize:13,lineHeight:1.4}}>
  <div>Attempt&nbsp;1&nbsp;: ✅ Pass</div>
  <div>Attempt&nbsp;2&nbsp;: ✅ Pass</div>
  <div>Attempt&nbsp;3&nbsp;: ✅ Pass</div>
</Box>);
const HistoryCell=()=>(
  <Tooltip title={histTip} arrow>
    <Box sx={{display:"flex",gap:.6,justifyContent:"center"}}><Dot/><Dot/><Dot/></Box>
  </Tooltip>
);

/* ═════════ 4. tiny helpers from v9 (readingPct, stagePct, buildConceptMap) ═════════ */
const readingPct=rec=>{
  if(!rec) return 0;
  if(rec.locked) return null;
  const s=(rec.status||"").toLowerCase();
  if(s==="done") return 100;
  if(s==="in-progress") return 50;
  return 0;
};
function parseRatio(str=""){
  const t=str.trim(); if(!t) return NaN;
  if(t.endsWith("%")){const n=parseFloat(t);return isNaN(n)?NaN:n/100;}
  if(t.includes("/")){const [n,d]=t.split("/").map(parseFloat);return d>0?n/d:NaN;}
  const n=parseFloat(t); return isNaN(n)?NaN:(n<=1?n:n/100);
}
function buildConceptMap(arr=[]){
  const m=new Map();
  arr.forEach(att=>(att.conceptStats||[]).forEach(c=>{
    if(!m.has(c.conceptName)||m.get(c.conceptName)!=="PASS") m.set(c.conceptName,c.passOrFail);
  }));
  return m;
}
function stagePct(blob,stage){
  const node=blob?.quizStagesData?.[stage];
  if(node?.overallPct!=null){
    const raw=node.overallPct; return Math.min(100,Math.round(raw<=1?raw*100:raw));
  }
  if(node?.allAttemptsConceptStats?.length){
    const m=buildConceptMap(node.allAttemptsConceptStats);
    const total=m.size,pass=[...m.values()].filter(v=>v==="PASS").length;
    if(total) return Math.round(pass/total*100);
  }
  const att=node?.quizAttempts||[]; if(att.length){
    const r=parseRatio(att[0].score); if(!isNaN(r)) return Math.min(100,Math.round(r*100));
  }
  return null;
}

/* ═════════ 5. component ═════════ */
export default function ConceptProgressTable(){

  /* redux & fetch (unchanged) */
  const dispatch=useDispatch();
  const subChapters=useSelector(selectSubChList);
  const conceptsArr=useSelector(selectConcepts);
  const subMap     =useSelector(s=>s.aggregator.subchapterMap);
  const subErrors  =useSelector(s=>s.aggregator.subchapterErrors);

  const [selSubId,setSelSubId]=useState(subChapters[0]?.subChapterId||"");
  const [loadingSub,setLoadingSub]=useState({});

  useEffect(()=>{
    if(!selSubId) return;
    setLoadingSub(ls=>({...ls,[selSubId]:true}));
    dispatch(fetchAggregatorForSubchapter({subChapterId:selSubId}))
      .finally(()=>setLoadingSub(ls=>({...ls,[selSubId]:false})));
  },[selSubId,dispatch]);

  const subOpts=useMemo(()=>subChapters.map(sc=>({
    value:sc.subChapterId,
    label:`${sc.book} › ${sc.grouping} › ${sc.subChapter}`
  })),[subChapters]);

  const meta=useMemo(()=>subChapters.find(s=>s.subChapterId===selSubId)||{},
                     [selSubId,subChapters]);
  const conceptList=useMemo(()=>conceptsArr.filter(c=>c.subChapterId===selSubId)
                                           .map(c=>c.conceptName)
                                           .sort((a,b)=>(a||"").localeCompare(b||"")),
                            [selSubId,conceptsArr]);

  const blob=subMap[selSubId]||{};
  const readingRec=blob.taskInfo?.find(t=>(t.stageLabel||"").toLowerCase()==="reading");

  const pctObj={
    reading   :readingPct(readingRec),
    remember  :stagePct(blob,"remember"),
    understand:stagePct(blob,"understand"),
    apply     :stagePct(blob,"apply"),
    analyze   :stagePct(blob,"analyze")
  };

  /* determine active stage & concept PASS/FAIL map */
  const readingDone=pctObj.reading===100;
  let active="reading";
  if(readingDone){
    for(const st of ["remember","understand","apply","analyze"])
      if(pctObj[st]==null||pctObj[st]<100){active=st;break;}
    if(pctObj.analyze===100) active="done";
  }
  let conceptMap=new Map();
  if(active!=="reading"&&active!=="done"&&blob.quizStagesData?.[active]?.allAttemptsConceptStats)
    conceptMap=buildConceptMap(blob.quizStagesData[active].allAttemptsConceptStats);

  const isLoading=loadingSub[selSubId];
  const hasErr=!!subErrors[selSubId];
  const showEmpty=!isLoading&&!hasErr&&conceptList.length===0;

  /* placeholder next-revision date (today+10 d) */
  const nextRevISO=useMemo(()=>{const d=new Date();d.setDate(d.getDate()+10);return d;},[selSubId]);
  const nextRevStr=`${nextRevISO.toLocaleDateString("en-GB",{day:"2-digit",month:"short"})} (10 d)`;

  /* render */
  return(
    <Box sx={{p:3,color:"#fff"}}>
      <Typography variant="h6" gutterBottom>Concept Catalogue</Typography>

      <FormControl variant="standard" sx={{minWidth:380,mb:2}}>
        <Select value={selSubId} onChange={e=>setSelSubId(e.target.value)}
                disableUnderline
                sx={{bgcolor:"#222",color:"#fff",px:1,py:.5,
                     "& .MuiSelect-icon":{color:"#fff"}}}>
          {subOpts.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </Select>
      </FormControl>

      {hasErr&&<Box sx={{color:"red",mb:2}}> {subErrors[selSubId]} </Box>}

      {selSubId&&(
        <Box sx={{mb:1,fontSize:14,color:"#bbb",display:"flex",alignItems:"center",gap:1.2,flexWrap:"wrap"}}>
          <span><b>Book:</b> {meta.book||"—"} &nbsp;|&nbsp;
            <b>Subject:</b> {meta.subject||"—"} &nbsp;|&nbsp;
            <b>Grouping:</b> {meta.grouping||"—"} &nbsp;|&nbsp;
            <b>Chapter:</b> {meta.chapter||"—"}
          </span>
          <JourneyPill pct={pctObj}/>
        </Box>
      )}

      <Table size="small" sx={{bgcolor:"#111"}}>
        <TableHead>
          <TableRow sx={{bgcolor:"#222"}}>
            <Th>Concept</Th>
            <Th align="center">Weight</Th>
            <Th align="center">Status&nbsp;({active==="done"?"All":active})</Th>
            <Th align="center">Quiz&nbsp;Hist.</Th>
            <Th align="center">Conf.</Th>
            <Th align="center">Next&nbsp;Rev.</Th>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading&&<TableRow><Td colSpan={6} align="center">Loading…</Td></TableRow>}

          {!isLoading&&conceptList.map(c=>(
            <TableRow key={c} hover sx={{"&:nth-of-type(odd)":
                                          {backgroundColor:"#181818"}}}>
              <Td>{c}</Td>
              <Td align="center">{weightChip}</Td>
              <Td align="center">{conceptStatusChip({
                                   stage:active,
                                   readingDone,
                                   result:conceptMap.get(c)||"NOT_TESTED"})}
              </Td>
              <Td align="center"><HistoryCell/></Td>
              <Td align="center">{confChip}</Td>
              <Td align="center">{nextRevStr}</Td>
            </TableRow>
          ))}

          {showEmpty&&<TableRow><Td colSpan={6} align="center">
            No concepts available for this sub-chapter.
          </Td></TableRow>}
        </TableBody>
      </Table>
    </Box>
  );
}

/* tiny cells */
const Th=({children,align="left"})=>
  <TableCell align={align} sx={{fontWeight:700,color:"#FFD700"}}>{children}</TableCell>;
const Td=({children,align="left"})=>
  <TableCell align={align} sx={{color:"#fff"}}>{children}</TableCell>;