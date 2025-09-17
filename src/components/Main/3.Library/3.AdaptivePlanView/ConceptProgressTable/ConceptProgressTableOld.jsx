/***********************************************************************
 * ConceptProgressTable.jsx                                            *
 *                                                                     *
 * — Keeps your 4 filters, breadcrumb rows and styling intact.         *
 * — Adds two new columns:                                             *
 *       ▸ Quiz History (3 coloured dots + tooltip)                    *
 *       ▸ Next Revision (formatted date + “Xd”)                       *
 * — Confidence is now a High/Med/Low chip (same style as Weight).     *
 **********************************************************************/
import React, { useMemo, useState } from "react";
import {
  Box, FormControl, Select, MenuItem, Typography,
  Table, TableHead, TableRow, TableCell, TableBody,
  Tooltip, Chip
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { curriculum }   from "./dummyCurriculum";

/* ───────── colour palette (unchanged + a few extras) ───────── */
const CLR = {
  reading:"#BB86FC", remember:"#80DEEA", understand:"#FFD54F",
  apply:"#AED581",   analyze:"#F48FB1",
  hi:"#66BB6A", med:"#FFA726", low:"#EF5350",
  pass:"#4CAF50", fail:"#E53935", nt:"#999"
};

/* ───────── High / Med / Low helpers (Weight + Conf) ───────── */
const band = v => v==null?"—":v>=67?"High":v>=34?"Med":"Low";
const bandClr = t => t==="High"?CLR.hi:t==="Med"?CLR.med:CLR.low;
const bandChip = v => {
  const txt = band(v);
  return txt==="—" ? "—" :
    <Chip size="small" label={txt}
      sx={{bgcolor:bandClr(txt),color:"#000",fontSize:11,fontWeight:700,
           "& .MuiChip-label":{px:.8}}}/>;
};
const weightChip = bandChip;
const confChip   = bandChip;

/* ───────── Journey badge (current stage only) ───────── */
const STAGES = ["reading","remember","understand","apply","analyze"];
function JourneyCell({stages={}}){
  const cur = STAGES.find(k=>stages[k]==null||stages[k]<100) || "analyze";
  const pct = stages[cur]??0;
  const lbl = stages[cur]==null?"Locked":stages[cur]===100?"Done":`${pct}%`;

  const tip = (
    <Box sx={{fontSize:13}}>
      {STAGES.map(k=>{
        const v = stages[k];
        const txt = v==null?"🔒 locked":v===100?"✅ 100 %":`${v}%`;
        return <div key={k} style={{color:CLR[k]}}>
          <strong style={{textTransform:"capitalize"}}>{k}</strong>: {txt}
        </div>;
      })}
    </Box>
  );

  return (
    <Tooltip arrow title={tip}>
      <Box sx={{display:"inline-flex",alignItems:"center",gap:.5}}>
        <Chip size="small"
          label={`${cur[0].toUpperCase()}${cur.slice(1)} ${lbl}`}
          sx={{bgcolor:CLR[cur],color:"#000",fontSize:11,"& .MuiChip-label":{px:.8}}}/>
        <InfoOutlinedIcon sx={{fontSize:16,color:"#bbb"}}/>
      </Box>
    </Tooltip>
  );
}

/* ───────── Quiz-history cell (last 3 attempts) ───────── */
const Dot = ({ok})=>(
  <Box sx={{
    width:10,height:10,borderRadius:"50%",
    bgcolor: ok==null?CLR.nt : ok?CLR.pass:CLR.fail,
    display:"inline-block"}}/>
);

function HistoryCell({attempts=[]}){
  const last3=[...attempts].slice(-3);
  while(last3.length<3) last3.unshift(null);

  const tip=(
    <Box sx={{fontSize:13}}>
      {attempts.length===0?"No attempts yet":
        attempts.map((ok,i)=>(
          <div key={i}>
            Attempt&nbsp;{i+1}: {ok===true?"✅ Pass":ok===false?"❌ Fail":"—"}
          </div>
        ))}
    </Box>
  );

  return (
    <Tooltip arrow title={tip}>
      <Box sx={{display:"flex",gap:.6,justifyContent:"center"}}>
        {last3.map((ok,i)=><Dot key={i} ok={ok}/>)}
      </Box>
    </Tooltip>
  );
}

/* ───────── day-difference helper for Next Revision ───────── */
const daysFromNow = iso => Math.round((new Date(iso)-Date.now())/864e5);

/* ───────── flatten curriculum (unchanged) ───────── */
const match=(want,val)=>want==="__ALL__"||want===val;
const flatten=(filt)=>{
  const out=[];
  Object.entries(curriculum).forEach(([s,tps])=>{
    if(!match(filt.subject,s)) return;
    tps.forEach(tp=>{
      if(!match(filt.topic,tp.topic)) return;
      tp.chapters.forEach(ch=>{
        if(!match(filt.chapter,ch.name)) return;
        ch.subs.forEach(sc=>{
          if(!match(filt.subch,sc.name)) return;
          sc.conceptList.forEach(c=>out.push({
            subject:s,topic:tp.topic,chapter:ch.name,subch:sc.name,...c
          }));
        });
      });
    });
  });
  out.sort((a,b)=>`${a.subject}|${a.topic}|${a.chapter}|${a.subch}`
                   .localeCompare(`${b.subject}|${b.topic}|${b.chapter}|${b.subch}`));
  return out;
};

/* ───────── MAIN COMPONENT ───────── */
export default function ConceptProgressTableOld(){
  /* filters (same as before) */
  const subjects=Object.keys(curriculum);
  const [subject,setSubject]=useState("__ALL__");
  const [topic,setTopic]=useState("__ALL__");
  const [chapter,setChapter]=useState("__ALL__");
  const [subch,setSubch]=useState("__ALL__");

  const topicOpt = useMemo(()=>subject==="__ALL__"?["__ALL__"]:
    ["__ALL__",...curriculum[subject].map(t=>t.topic)],[subject]);
  const chapOpt = useMemo(()=>{
    if(subject==="__ALL__"||topic==="__ALL__") return ["__ALL__"];
    return ["__ALL__",...curriculum[subject].find(t=>t.topic===topic)?.chapters.map(c=>c.name)];
  },[subject,topic]);
  const subOpt  = useMemo(()=>{
    if(subject==="__ALL__"||topic==="__ALL__"||chapter==="__ALL__") return ["__ALL__"];
    return ["__ALL__",...curriculum[subject].find(t=>t.topic===topic)
            ?.chapters.find(c=>c.name===chapter)?.subs.map(s=>s.name)];
  },[subject,topic,chapter]);

  const rows=useMemo(()=>flatten({subject,topic,chapter,subch}),
                    [subject,topic,chapter,subch]);

  return(
    <Box sx={{ p:2, bgcolor:"transparent", color:"#fff", height:"100%", overflow:"auto" }}>

      {/* filters */}
      <Filters {...{subjects,subject,setSubject,topic,setTopic,
                    chapter,setChapter,subch,setSubch,
                    topicOpt,chapOpt,subOpt}}/>

      {rows.length===0? <Typography>No concepts match the filter.</Typography>:
        <Table size="small" sx={{bgcolor:"#111"}}>
          <TableHead>
            <TableRow sx={{ position:"sticky", top:0, zIndex:1, bgcolor:"rgba(255,255,255,.05)", backdropFilter:"blur(4px)" }}>

              <Head text="Concept"/>
              <Head text="Wt"           align="center"/>
              <Head text="Journey"      align="center"/>
              <Head text="Quiz Hist."   align="center"/>
              <Head text="Conf"         align="center"/>
              <Head text="Next Rev."    align="center"/>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r,i)=>{
              const prev=rows[i-1];
              const hdr= !prev||prev.subject!==r.subject||prev.topic!==r.topic
                         ||prev.chapter!==r.chapter||prev.subch!==r.subch;

              return (
                <React.Fragment key={i}>
                  {hdr&&(
                    <TableRow sx={{bgcolor:"#222"}}>
                      <TableCell colSpan={6} sx={{color:"#FFD700",fontWeight:600}}>
                        {`${r.subject} › ${r.topic} › ${r.chapter} › ${r.subch}`}
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow hover>
                    <Cell>{r.name}</Cell>
                    <Cell align="center">{weightChip(r.weight)}</Cell>
                    <TableCell align="center"><JourneyCell stages={r.stages}/></TableCell>
                    <TableCell align="center"><HistoryCell attempts={r.quizAttempts}/></TableCell>
                    <Cell align="center">{confChip(r.confidence)}</Cell>
                    <Cell align="center">
                      {r.nextRevDate
                        ? `${new Date(r.nextRevDate)
                              .toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}
                           (${daysFromNow(r.nextRevDate)} d)`
                        : "—"}
                    </Cell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>}
    </Box>
  );
}

/* ───────── small presentational helpers ───────── */
const Head=({text,align="left"})=>
  <TableCell align={align}
    sx={{color:"#FFD700",fontWeight:700,borderBottom:"2px solid #555"}}>
    {text}
  </TableCell>;

const Cell=({children,align="left"})=>
  <TableCell align={align} sx={{color:"#fff"}}>{children}</TableCell>;

const FilterBox = ({label,value,options,onChange})=>(
  <FormControl variant="standard" sx={{minWidth:140}}>
    <Typography sx={{fontSize:12,mb:.3,color:"#bbb"}}>{label}</Typography>
    <Select value={value} onChange={e=>onChange(e.target.value)} disableUnderline
      sx={{bgcolor:"#222",borderRadius:1,color:"#fff",fontSize:14,px:1,py:0.3,
           "& .MuiSelect-icon":{color:"#fff"}}}
      MenuProps={{PaperProps:{sx:{bgcolor:"#222",color:"#fff"}}}}>
      {options.map(o=><MenuItem key={o} value={o}>{o==="__ALL__"?"All":o}</MenuItem>)}
    </Select>
  </FormControl>
);

const Filters = (p)=>(
  <Box sx={{display:"flex",gap:2,flexWrap:"wrap",mb:3}}>
    <FilterBox label="Subject"    value={p.subject} options={["__ALL__",...p.subjects]}
      onChange={v=>{p.setSubject(v);p.setTopic("__ALL__");p.setChapter("__ALL__");p.setSubch("__ALL__");}}/>
    <FilterBox label="Topic"      value={p.topic}   options={p.topicOpt}
      onChange={v=>{p.setTopic(v);p.setChapter("__ALL__");p.setSubch("__ALL__");}}/>
    <FilterBox label="Chapter"    value={p.chapter} options={p.chapOpt}
      onChange={v=>{p.setChapter(v);p.setSubch("__ALL__");}}/>
    <FilterBox label="Sub-chapter" value={p.subch}  options={p.subOpt}
      onChange={p.setSubch}/>
  </Box>
);