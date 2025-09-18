import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, Divider, Slider, TextField,
  Tabs, Tab, CircularProgress, Snackbar, Alert
} from "@mui/material";

const OPENAI_MODEL = "gpt-4o-mini"; // swap if desired

async function callOpenAIChat(messages) {
  const key = import.meta.env.VITE_OPENAI_KEY;
  if (!key) throw new Error("Missing VITE_OPENAI_KEY");
  // NOTE: For production, proxy via your backend to protect the key & avoid CORS.
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || "";
}

export default function RMMultiTurn({ task, onSubmit, onSkip, onFlag, meta }) {
  // --- Tab state
  const [tab, setTab] = useState("rate"); // "rate" | "chat"

  // --- Static "rate provided dialogue" (unchanged)
  const [ratings, setRatings] = useState(
    (task.turns || []).map(() => ({ help: 4, harmless: 4 }))
  );
  const setTurn = (i, key, val) =>
    setRatings(prev => { const c=[...prev]; c[i]={...c[i],[key]:val}; return c; });

  // --- Live chat with per-turn gating
  const [chat, setChat] = useState(() =>
    (task.seedChat || []).map(m => ({ role: m.role, content: m.content }))
  ); // messages: {role, content, rating?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingRating, setAwaitingRating] = useState(false);
  const [lastAssistantIndex, setLastAssistantIndex] = useState(null);
  const [turnRating, setTurnRating] = useState({ help: 4, harmless: 4 });
  const [turnNotes, setTurnNotes] = useState("");
  const chatEndRef = useRef(null);

  const [rewardOpen, setRewardOpen] = useState(false);

  const systemPrompt = useMemo(
    () => task?.systemPrompt || "You are a helpful, honest, harmless assistant. Follow safety policies; refuse disallowed requests.",
    [task]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading, awaitingRating]);

  const sendChat = async () => {
    if (!input.trim() || loading || awaitingRating) return;
    const userMsg = input.trim();
    setInput("");
    // Push user message
    setChat(prev => [...prev, { role: "user", content: userMsg }]);

    try {
      setLoading(true);
      const messages = [
        { role: "system", content: systemPrompt },
        ...chat.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg },
      ];
      const reply = await callOpenAIChat(messages);
      // Push assistant reply and mark that a rating is required
      setChat(prev => {
        const idx = prev.length;
        const next = [...prev, { role: "assistant", content: reply, rating: null }];
        setLastAssistantIndex(idx);
        return next;
      });
      setTurnRating({ help: 4, harmless: 4 });
      setTurnNotes("");
      setAwaitingRating(true);
    } catch (err) {
      // graceful mock fallback
      setChat(prev => {
        const idx = prev.length;
        const next = [...prev, { role: "assistant", content: "(mock) Model reply unavailable; simulated answer.", rating: null }];
        setLastAssistantIndex(idx);
        return next;
      });
      setTurnRating({ help: 4, harmless: 4 });
      setTurnNotes("");
      setAwaitingRating(true);
    } finally {
      setLoading(false);
    }
  };

  const saveTurnRating = () => {
    if (lastAssistantIndex == null) return;
    setChat(prev =>
      prev.map((m, i) =>
        i === lastAssistantIndex ? { ...m, rating: { ...turnRating, notes: turnNotes } } : m
      )
    );
    setAwaitingRating(false);
  };

  const ratedAssistantTurns = chat.filter(m => m.role === "assistant" && m.rating).length;
  const totalAssistantTurns = chat.filter(m => m.role === "assistant").length;

  const finishChatAndSubmit = () => {
    // One final payload containing both: provided-turn ratings + live chat transcript/ratings
    setRewardOpen(true);
    onSubmit({
      providedDialogueRatings: ratings,
      liveChat: chat, // includes rating per assistant turn if saved
    });
  };

  return (
    <Box>
      {meta && (
        <Typography variant="caption" color="text.secondary">
          Task {meta.index + 1}/{meta.total}
          {typeof meta?.project?.payPerTaskCents === "number" && <> • Earns +₹{(meta.project.payPerTaskCents / 100).toFixed(2)}</>}
        </Typography>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
        Reward Model — Multi-Turn Chat (per-turn gated ratings)
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title || "Rate dialogue turns"}</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
        <Tab value="rate" label="Rate Provided Dialogue" />
        <Tab value="chat" label="Live Chat (gated)" />
      </Tabs>

      {/* Tab 1: Provided dialogue */}
      {tab === "rate" && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            {(task.turns || []).map((t, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Turn {i + 1}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                  <strong>User:</strong> {t.user}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                  <strong>Assistant:</strong> {t.assistant}
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ mt: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography gutterBottom>Helpfulness</Typography>
                    <Slider min={1} max={7} value={ratings[i].help} valueLabelDisplay="auto"
                            onChange={(_, v) => setTurn(i, "help", v)} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography gutterBottom>Harmlessness</Typography>
                    <Slider min={1} max={7} value={ratings[i].harmless} valueLabelDisplay="auto"
                            onChange={(_, v) => setTurn(i, "harmless", v)} />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </>
      )}

      {/* Tab 2: Live chat with gating */}
      {tab === "chat" && (
        <>
          <Divider sx={{ my: 2 }} />
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 360, overflow: "auto" }}>
            <Stack spacing={1.5}>
              {chat.map((m, idx) => (
                <Box key={idx}>
                  <Typography variant="caption" color="text.secondary">
                    {m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{m.content}</Typography>
                  {m.role === "assistant" && m.rating && (
                    <Typography variant="caption" color="success.main">
                      ✓ Rated — H:{m.rating.help} • Sa:{m.rating.harmless}{m.rating.notes ? " • notes saved" : ""}
                    </Typography>
                  )}
                </Box>
              ))}
              {loading && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">Thinking…</Typography>
                </Stack>
              )}
              <div ref={chatEndRef} />
            </Stack>
          </Paper>

          {/* Gated rating UI — shows only when awaitingRating */}
          {awaitingRating && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "grey.50" }}>
              <Typography variant="subtitle2">Rate the last assistant turn</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography gutterBottom>Helpfulness</Typography>
                  <Slider min={1} max={7} value={turnRating.help} valueLabelDisplay="auto"
                          onChange={(_, v) => setTurnRating(r => ({ ...r, help: v }))} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography gutterBottom>Harmlessness</Typography>
                  <Slider min={1} max={7} value={turnRating.harmless} valueLabelDisplay="auto"
                          onChange={(_, v) => setTurnRating(r => ({ ...r, harmless: v }))} />
                </Box>
              </Stack>
              <TextField
                fullWidth
                sx={{ mt: 2 }}
                label="Notes (optional)"
                value={turnNotes}
                onChange={(e) => setTurnNotes(e.target.value)}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button variant="contained" onClick={saveTurnRating}>Save rating</Button>
              </Stack>
            </Paper>
          )}

          {/* Composer (disabled until rating is saved) */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              placeholder={awaitingRating ? "Rate the last assistant reply to continue…" : "Type a user message"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || awaitingRating}
            />
            <Button variant="contained" onClick={sendChat} disabled={loading || awaitingRating || !input.trim()}>
              Send
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Rated {ratedAssistantTurns}/{totalAssistantTurns} assistant turns in this session.
          </Typography>
        </>
      )}

      {/* Footer actions (apply to either tab) */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={finishChatAndSubmit} disabled={loading || awaitingRating}>
          Finish & Submit
        </Button>
        <Button onClick={onSkip}>Skip</Button>
        <Button color="warning" onClick={onFlag}>Flag</Button>
      </Stack>

      <Snackbar
        open={rewardOpen}
        autoHideDuration={1200}
        onClose={() => setRewardOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          Saved
        </Alert>
      </Snackbar>
    </Box>
  );
}