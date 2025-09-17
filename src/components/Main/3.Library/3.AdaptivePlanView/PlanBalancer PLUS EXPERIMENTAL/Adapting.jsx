/* ────────────────────────────────────────────────────────────────
   File:  src/components/Adapting.jsx          (full component)
───────────────────────────────────────────────────────────────── */
import React, { useState } from "react";
import axios from "axios";
import {
  Box, Typography, Button, TextField,
  Accordion, AccordionSummary, AccordionDetails,
  Tooltip, Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* helper – Firestore TS → readable string */
const fmtTS = (v) => {
  if (!v || typeof v !== "object") return "—";
  const s = v.seconds ?? v._seconds;
  return typeof s === "number"
    ? new Date(s * 1000).toLocaleString()
    : "—";
};

/* tiny colour pill */
const Badge = ({ text, bg, fg = "#000" }) => (
  <Box
    component="span"
    sx={{
      fontSize: 11, fontWeight: 700,
      px: 0.8, py: 0.15, borderRadius: 1,
      bgcolor: bg, color: fg, ml: .5
    }}
  >
    {text}
  </Box>
);

/* ╭───────────────────────────────────────────────╮
   │ ActivityRow – one row + collapsible JSON view │
   ╰───────────────────────────────────────────────╯ */
function ActivityRow({ a }) {
  let badge   = "✗", clr="#E57373", badgeTip="Pending";
  if (a.completed)     { badge="✓"; clr="#4CAF50"; badgeTip="Done"; }
  else if (a.deferred) { badge="↩"; clr="#FFB300"; badgeTip="Deferred (copy made)"; }

  return (
    <details style={{ marginBottom: 6 }}>
      {/* summary === the existing compact row */}
      <summary style={{ listStyle:"none" }}>
        <Box
          sx={{
            display:"grid",
            gridTemplateColumns:"25px 110px 1fr 60px 70px",
            gap: 1,
            alignItems:"center",
            fontSize:13,
            cursor:"pointer",
            userSelect:"none"
          }}
        >
          <Tooltip title={badgeTip}>
            <span style={{ color: clr }}>{badge}</span>
          </Tooltip>

          <Typography sx={{ fontWeight:500 }}>
            {a.type==="READ" ? "READ" : `Q-${(a.quizStage||"").toUpperCase()}`}
          </Typography>

          <Typography
            sx={{ whiteSpace:"nowrap", overflow:"hidden",
                  textOverflow:"ellipsis", opacity:.85 }}
            title={a.subChapterName || a.subChapterId}
          >
            {a.subChapterName || a.subChapterId}
          </Typography>

          <Typography>{a.timeNeeded || 0}&nbsp;min</Typography>

          <Typography sx={{ fontSize:11, opacity:.6 }}>
            {a.replicaIndex ? `rep ${a.replicaIndex}` : ""}
          </Typography>
        </Box>
      </summary>

      {/* expanded content == raw JSON */}
      <Box
        sx={{
          bgcolor:"#161616",
          border:"1px solid #333",
          borderRadius:1,
          mt: .5, p: 1,
          fontSize:11, lineHeight:1.4,
          overflowX:"auto"
        }}
      >
        <pre style={{ margin:0, whiteSpace:"pre-wrap" }}>
{JSON.stringify(a, null, 2)}
        </pre>
      </Box>
    </details>
  );
}

/* ╭─────────────────────────────────────────╮
   │ PlanViewer – accordion per session       │
   ╰─────────────────────────────────────────╯ */
function PlanViewer({ plan }) {
  if (!plan?.sessions?.length) return null;
  const limit = plan.dailyReadingTimeUsed || 30;

  return (
    <Box sx={{ mt: 1 }}>
      {plan.sessions.map((ses, idx) => {
        const spent = ses.activities.reduce((s,a)=>s+(a.timeNeeded||0),0);
        const done  = ses.activities.filter(a=>a.completed).length;
        const def   = ses.activities.filter(a=>a.deferred).length;

        return (
          <Accordion
            key={idx}
            defaultExpanded={idx===0}
            sx={{ bgcolor:"#1a1a1a", color:"#fff", mb:1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color:"#fff" }}/>}
            >
              <Typography sx={{ flex:1 }}>
                Day&nbsp;{ses.sessionLabel}&nbsp;–&nbsp;
                {ses.activities.length} tasks&nbsp;|&nbsp;
                {spent}/{limit} min
                {ses.locked && <Badge text="LOCKED" bg="#616161" fg="#fff"/>}
              </Typography>
              {ses.locked && (
                <Typography sx={{ fontSize:12, mr:1 }}>
                  ✓{done}&nbsp;↩{def}&nbsp;✗{ses.activities.length-done-def}
                </Typography>
              )}
            </AccordionSummary>

            <AccordionDetails>
              {ses.activities.map(a => (
                <ActivityRow key={a.activityId+(a.replicaIndex||0)} a={a}/>
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

/* ╭─────────────────────────────────────────╮
   │ MAIN COMPONENT                          │
   ╰─────────────────────────────────────────╯ */
export default function Adapting({ userId, plan, planId }) {
  const [todayISO, setTodayISO] = useState(
    new Date().toISOString().slice(0,10)
  );
  const [outPlan, setOutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  /* POST → /api/rebalancePlan */
  const handleRun = async () => {
    setError(""); setOutPlan(null); setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rebalancePlan`,
        { planId, userId, todayISO }
      );
      if (!data?.plan) throw new Error("Server did not return {plan}");
      setOutPlan(data.plan);
    } catch (e) {
      console.error("rebalancePlan error", e);
      setError(e?.response?.data?.error || e.message || "unknown error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- render ---------------- */
  if (!plan) {
    return <Typography sx={{ color:"#fff", mt:2 }}>No plan loaded.</Typography>;
  }

  return (
    <Box sx={{ color:"#fff", mt:2 }}>
      <Typography variant="h6" sx={{ mb:2 }}>
        Adaptive Plan – Admin Inspector
      </Typography>

      <Typography variant="body2" sx={{ mb:2 }}>
        <strong>planId:</strong> {planId}<br/>
        <strong>userId:</strong> {userId}<br/>
        <strong>created:</strong> {fmtTS(plan.createdAt || plan.planCreationDate)}
      </Typography>

      <Box sx={{ display:"flex", gap:2, mb:2, flexWrap:"wrap" }}>
        <TextField
          label="Today"
          type="date"
          size="small"
          value={todayISO}
          onChange={e=>setTodayISO(e.target.value)}
          sx={{ input:{ color:"#fff" } }}
        />
        <Button variant="contained" disabled={loading} onClick={handleRun}>
          {loading ? "Re-balancing…" : "Run re-balance"}
        </Button>
        {error && <Typography sx={{ color:"salmon" }}>{error}</Typography>}
      </Box>

      {/* original */}
      <Divider sx={{ mb:2, bgcolor:"#555" }}/>
      <Typography variant="subtitle1">Current plan</Typography>
      <PlanViewer plan={plan}/>

      {/* result */}
      {outPlan && (
        <>
          <Divider sx={{ my:3, bgcolor:"#555" }}/>
          <Typography variant="subtitle1">Result after re-balance</Typography>
          <PlanViewer plan={outPlan}/>
        </>
      )}
    </Box>
  );
}