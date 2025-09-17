// AskAIChat.jsx  – GPT-powered, state-full version
import React, { useEffect, useRef, useState } from "react";
import {
  Box, Chip, CircularProgress, IconButton, Paper, TextField,
  Tooltip, Collapse
} from "@mui/material";
import SendIcon       from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import HistoryIcon    from "@mui/icons-material/History";

/* ---------------- preset helpers ---------------- */
const SYS_PROMPT = `You are a helpful subject-matter tutor.
Ground every answer in the provided context when it exists.
If the question is unrelated, politely say so. Reply in markdown.`;

const TEMPLATES = [
  "Summarise this in two sentences.",
  "Explain like I'm 12.",
  "Give me a real-world analogy.",
  "List 3 key take-aways.",
  "Write 2 practice questions."
];

const snippet = (t="") => (t.length<=70 ? t : `${t.slice(0,30)} … ${t.slice(-30)}`);

/* ---------------- OpenAI helper ---------------- */
async function chatWithGPT(messages) {
  const apiKey = import.meta.env.VITE_OPENAI_KEY;          // .env / build secret
  if (!apiKey) throw new Error("OPENAI key missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model       : "gpt-3.5-turbo",
      messages,
      temperature : 0.4
    })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "No answer";
}

/* =================================================================== */
export default function AskAIChat({ contextText, selection, mode, onModeChange })
{
  /* ------------- conversation state ------------- */
  const makeStarter = (ctx) => ([
    { role:"system",    content: SYS_PROMPT },
    { role:"assistant", content:`Context:\n${ctx}` }
  ]);

  const [thread, setThread]   = useState(makeStarter(contextText)); // full GPT thread
  const [input , setInput]    = useState("");
  const [busy  , setBusy]     = useState(false);
  const [error , setError]    = useState("");

  /* session history (unchanged) */
  const [history , setHistory] = useState(
    () => JSON.parse(localStorage.getItem("aiHistory")||"[]")
  );
  const [showHist, setShowHist] = useState(false);

  /* auto-scroll */
  const endRef = useRef(null);
  useEffect(()=> endRef.current?.scrollIntoView({behavior:"smooth"}), [thread,busy]);

  /* reset conversation if page / selection context changes */
  useEffect(()=>{
    setThread(makeStarter(contextText));
    setInput("");
    setError("");
  },[contextText]);

  /* ------------- send a prompt ------------- */
  async function send(msg){
    const q = msg.trim();
    if(!q) return;

    const next = [...thread, { role:"user", content:q }];
    setThread(next);
    setInput("");
    setBusy(true);  setError("");

    /* ---- slice tail if you fear token blow-up (keep last 10 turns) ---- */
    const MAX_TURNS = 10;
    const safeNext  = next.slice(-1-MAX_TURNS*2); // user+assistant per turn

    try{
      const answer = await chatWithGPT(safeNext);
      setThread([...next, { role:"assistant", content:answer }]);
    }catch(e){
      console.error(e);
      setError("⚠️ GPT request failed");
    }finally{
      setBusy(false);
    }
  }

  /* template chips */
  const replacement = mode==="selection" ? "this passage" : "this page";
  const useTemplate = (tpl)=> send(tpl.replace("this", replacement));

  /* ------------- history helpers ------------- */
  const saveToHistory = ()=>{
    const firstUser = thread.find(m=>m.role==="user");
    if(!firstUser) return;
    const rec  = { ts:Date.now(), title:firstUser.content.slice(0,60), thread };
    const next = [rec, ...history].slice(0,20);
    setHistory(next);
    localStorage.setItem("aiHistory", JSON.stringify(next));
  };

  const newChat = ()=>{ saveToHistory(); setThread(makeStarter(contextText)); setShowHist(false); };
  const loadChat = (rec)=>{ setThread(rec.thread); setShowHist(false); setError(""); };

  const firstTurn = thread.length<=2; // only system+context so far

  /* ------------------------- UI ------------------------- */
  return (
    <Box sx={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* top bar */}
      <Box sx={{mb:1,display:"flex",gap:1}}>
        <Tooltip title="History">
          <IconButton size="small" onClick={()=>setShowHist(o=>!o)}
                      sx={{bgcolor:"#272727",color:"#FFD700"}}>
            <HistoryIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
        <Tooltip title="New chat">
          <IconButton size="small" onClick={newChat}
                      sx={{bgcolor:"#272727",color:"#FFD700"}}>
            <RestartAltIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
      </Box>

      {/* inline history */}
      <Collapse in={showHist} unmountOnExit
                sx={{mb:1,maxHeight:140,overflowY:"auto"}}>
        {history.length===0
          ? <Box sx={{p:1,fontSize:13,opacity:.6}}>No past chats.</Box>
          : history.map(h=>(
              <Paper key={h.ts} variant="outlined" onClick={()=>loadChat(h)}
                     sx={{p:1,mb:1,bgcolor:"#1d1d1d",cursor:"pointer",
                          "&:hover":{bgcolor:"#272727"}}}>
                <Box sx={{fontSize:12,opacity:.65}}>
                  {new Date(h.ts).toLocaleString()}
                </Box>
                <Box sx={{fontSize:13}}>{h.title}</Box>
              </Paper>
            ))}
      </Collapse>

      {/* message list (skip system+context) */}
      <Box sx={{flex:1,overflowY:"auto",pr:1,mb:1}}>
        {thread.slice(2).map((m,i)=>(
          <Paper key={i} elevation={0}
                 sx={{
                   p:1.2, mb:.8, maxWidth:"80%",
                   alignSelf: m.role==="user"?"flex-end":"flex-start",
                   bgcolor : m.role==="user"?"primary.main":"#1e1e1e",
                   color   : m.role==="user"?"#fff":"#ddd",
                   borderRadius:2,
                   borderTopRightRadius: m.role==="user"?0:2,
                   borderTopLeftRadius : m.role==="user"?2:0,
                   whiteSpace:"pre-wrap", fontSize:14}}>
            {m.content}
          </Paper>
        ))}
        {busy && <CircularProgress size={20}
                  sx={{display:"block",mx:"auto",my:1,color:"primary.light"}}/>}
        {error && <Box sx={{color:"#f66",fontSize:13,textAlign:"center",my:1}}>{error}</Box>}
        <div ref={endRef}/>
      </Box>

      {/* preset templates */}
      {firstTurn && (
        <Box sx={{mb:1,display:"flex",flexWrap:"wrap",gap:1}}>
          {TEMPLATES.map(tpl=>(
            <Chip key={tpl} size="small"
                  label={tpl.replace("this",replacement)}
                  sx={{bgcolor:"#2a2a2a",color:"primary.light","&:hover":{bgcolor:"#333"}}}
                  onClick={()=>useTemplate(tpl)} disabled={busy}/>
          ))}
        </Box>
      )}

      {/* composer */}
      <Box component="form" onSubmit={e=>{e.preventDefault(); send(input);}}
           sx={{display:"flex",gap:1}}>
        <TextField fullWidth size="small" placeholder="Type your question…"
                   value={input} onChange={e=>setInput(e.target.value)}
                   disabled={busy}
                   sx={{
                     "& .MuiInputBase-root":{bgcolor:"#222",color:"#fff"},
                     "& fieldset":{borderColor:"#444"}
                   }}/>
        <IconButton type="submit" disabled={!input.trim()||busy}
                    sx={{bgcolor:"primary.main",color:"#fff",
                         "&:hover":{bgcolor:"primary.dark"}}}>
          <SendIcon fontSize="small"/>
        </IconButton>
      </Box>

      {/* context pills (only before first send) */}
      {firstTurn && (
        <Box sx={{mt:1,display:"flex",alignItems:"center",gap:1}}>
          <span style={{fontSize:13,opacity:.7}}>Include:</span>
          <Chip label="Whole passage" size="small"
                onClick={()=>onModeChange("page")}
                disabled={mode==="page"}
                sx={{bgcolor:mode==="page"?"primary.main":"#272727",
                     color:mode==="page"?"#fff":"#bbb"}}/>
          <Chip label={selection?`Selected – ${snippet(selection)}`:"Selected text"}
                size="small"
                onClick={()=>selection&&onModeChange("selection")}
                disabled={!selection||mode==="selection"}
                sx={{bgcolor:mode==="selection"?"primary.main":"#272727",
                     color:!selection?"#555":mode==="selection"?"#fff":"#bbb"}}/>
        </Box>
      )}
    </Box>
  );
}