// src/components/Main/0.tellus/wizard/ProjectWizard.jsx
import React, { useMemo, useState } from "react";
import {
  Box, Typography, Stepper, Step, StepLabel, Button, TextField, Select, MenuItem,
  Grid, Divider, RadioGroup, FormControlLabel, Radio, FormLabel, Checkbox, Switch,
  Chip, Slider, InputLabel, FormControl, OutlinedInput, Tooltip, Paper, Alert,
  LinearProgress, Tabs, Tab
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/* ──────────────────────────────────────────────────────────────────────────
 *  DUMMY DATA (swap with API later)
 * ────────────────────────────────────────────────────────────────────────── */
const DUMMY_MODELS = [
  { id: "gpt-4o-mini", name: "OpenAI • gpt-4o-mini", provider: "openai" },
  { id: "claude-3-haiku", name: "Anthropic • Claude 3 Haiku", provider: "anthropic" },
  { id: "llama3-8b", name: "Meta • Llama 3 8B", provider: "meta" },
];

const DUMMY_POOLS = [
  { id: "pool-pro", name: "Vetted Pro Pool" },
  { id: "pool-crowd", name: "Crowd Pool" },
  { id: "pool-internal", name: "Internal Raters" },
];

const DUMMY_LANGUAGES = ["English", "Spanish", "Hindi", "French", "German", "Japanese"];
const DUMMY_DOMAINS = ["General", "Coding", "Medical", "Legal", "Finance", "Safety"];
const DUMMY_SENIORITY = ["Junior", "Standard", "Senior", "Expert"];

const RUBRIC_PRESET = ["helpfulness", "harmlessness", "honesty", "formatting"];
const SAFETY_LABELS_PRESET = ["toxicity", "harassment", "hate", "pii", "dangerous"];

/* ──────────────────────────────────────────────────────────────────────────
 *  Small helpers
 * ────────────────────────────────────────────────────────────────────────── */
function Section({ title, sub, children, dense }) {
  return (
    <Paper elevation={1} sx={{ p: dense ? 2 : 3, mb: 3, borderRadius: 2, border: "1px solid #eee" }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
      {sub && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{sub}</Typography>}
      {children}
    </Paper>
  );
}

function QCard({ title, helper, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{title}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "inline-flex", gap: 0.5, alignItems: "center" }}>
          <InfoOutlinedIcon fontSize="inherit" /> {helper}
        </Typography>
      )}
      <Box sx={{ mt: helper ? 1 : 0 }}>{children}</Box>
    </Paper>
  );
}

function Hint({ children }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <InfoOutlinedIcon fontSize="inherit" /> {children}
    </Typography>
  );
}

function dollars(cents) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function countJSONLOrLines(text) {
  if (!text?.trim()) return 0;
  const rows = text.trim().split(/\n+/g);
  let jsonl = 0;
  for (const r of rows) { try { JSON.parse(r); jsonl++; } catch {} }
  return jsonl > 0 ? jsonl : rows.length;
}

const safeInt = (v, def = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

/* ──────────────────────────────────────────────────────────────────────────
 *  Preview Runner (minimal; simulates without keys, uses OpenAI if provided)
 * ────────────────────────────────────────────────────────────────────────── */
function PreviewRunner({ config, openAIKey }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const add = (m) => setLog((L) => [...L, m]);

  const runOnce = async () => {
    setBusy(true); setLog([]);
    const { goal, workflow, data } = config;

    const prompt =
      (data.promptsText?.split("\n")[0] || "").trim() ||
      (goal.main === "rm" && goal.variant === "dialogue" ? "(start a short conversation)" : "Explain transformers simply.");

    add(`Goal: ${goal.main} • ${goal.variant || ""}`);
    add(`Prompt: ${prompt}`);

    const callOpenAI = async (messages, sampling) => {
      // Simulate unless you pass VITE_OPENAI_KEY
      if (!openAIKey) {
        await new Promise((r) => setTimeout(r, 300));
        return { role: "assistant", content: "〈Simulated model response〉" };
      }
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAIKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: sampling?.temperature ?? 0.7,
          top_p: sampling?.top_p ?? 0.95,
          max_tokens: sampling?.max_tokens ?? 256,
        }),
      });
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || "(empty)";
      return { role: "assistant", content };
    };

    try {
      if (goal.main === "sft") {
        if (workflow.sft.mode === "author") {
          add("Annotator will author prompts (and optionally answers).");
        } else {
          if (data.productionMode === "model") {
            const m = [{ role: "user", content: prompt }];
            const reply = await callOpenAI(m, data.sampling);
            add(`Model → ${reply.content}`);
          } else {
            add("Human will write the answer (no model used).");
          }
        }
      }

      if (goal.main === "rm") {
        if (goal.variant === "pairwise" || goal.variant === "single") {
          const n = goal.variant === "pairwise" ? 2 : 1;
          for (let i = 0; i < n; i++) {
            if (data.productionMode === "model") {
              const reply = await callOpenAI([{ role: "user", content: prompt }], data.sampling);
              add(`Candidate ${i === 0 ? "A" : "B"} → ${reply.content}`);
            } else {
              add(`Candidate ${i === 0 ? "A" : "B"} → (from uploaded / human)`);
            }
          }
          add(
            goal.variant === "pairwise"
              ? `Rater chooses A/B${workflow.rm.requireJustification ? " with justification" : ""}.`
              : `Rater scores on ${workflow.rm.rubrics.join(", ")} scale ${workflow.rm.scaleMin}–${workflow.rm.scaleMax}.`
          );
        } else if (goal.variant === "dialogue") {
          const turns = workflow.rm.dialogueTurns || 4;
          add(`Dialogue for ${turns} turns; rater provides per-turn or overall ratings.`);
          for (let t = 1; t <= turns; t++) {
            if (t % 2 === 1) add(`Annotator → (asks a question / follows hints)`);
            else {
              const reply = await callOpenAI([{ role: "user", content: `(turn ${t}) ${prompt}` }], data.sampling);
              add(`Model → ${reply.content}`);
            }
          }
        }
      }

      if (goal.main === "safety") {
        add(`Rater will label content: ${workflow.safety.labels.join(", ")}${workflow.safety.severity ? " + severity" : ""}.`);
      }
    } catch (e) {
      add(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Preview</Typography>
      {busy && <LinearProgress sx={{ mb: 1 }} />}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Paper variant="outlined" sx={{ p: 1, minHeight: 160, maxHeight: 260, overflow: "auto" }}>
            {log.length === 0 ? (
              <Typography variant="caption" color="text.secondary">Click “Run once” to simulate.</Typography>
            ) : (
              log.map((l, i) => <Typography variant="body2" key={i} sx={{ whiteSpace: "pre-wrap" }}>• {l}</Typography>)
            )}
          </Paper>
        </Box>
        <Box sx={{ width: 200 }}>
          <Button variant="contained" onClick={runOnce} disabled={busy} fullWidth>Run once</Button>
          {!openAIKey && (
            <Alert severity="info" sx={{ mt: 1 }}>
              No <code>VITE_OPENAI_KEY</code> — preview simulates model outputs.
            </Alert>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Main Wizard
 * ────────────────────────────────────────────────────────────────────────── */
export default function ProjectWizard() {
  const steps = [
    "Goal",
    "Data & Model",
    "Workflow & Rating",
    "People & Pay",
    "Gamification",         // NEW
    "Policies",
    "Review & Preview"
  ];
  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    basics: { name: "", description: "", owner: "", dueDate: "", tags: "" },

    // sft: write|author, rm: single|pairwise|dialogue, safety: policy
    goal: { main: "rm", variant: "pairwise" },

    data: {
      // unified field name used everywhere
      productionMode: "model", // model | uploaded | none
      models: ["gpt-4o-mini"],
      sampling: { temperature: 0.7, top_p: 0.95, max_tokens: 512 },
      uploadedJSONL: "",
      plannedCount: 100,
      promptsText: "",
    },

    workflow: {
      sft: { mode: "write", multiTurn: false, nudge: "Write helpful, honest, harmless answers.", completeRule: "single_submit" },
      rm: {
        rubrics: [...RUBRIC_PRESET],
        requireJustification: true,
        allowTie: true,
        scaleMin: 1, scaleMax: 7,
        dialogueTurns: 4,
        perTurn: false,
        stopRule: "max_turns",
        followupQuestion: "",
      },
      safety: { labels: [...SAFETY_LABELS_PRESET], severity: true },
    },

    people: {
      pools: ["pool-crowd"],
      expertise: { languages: ["English"], domains: ["General"], seniority: ["Standard"] },
      extraOpinions: 1,   // extra reviewers per item (redundancy)
      agreementN: 1,      // opinions required to agree
      qaSpotPercent: 5,   // known answers
      qaAuditPercent: 10, // random checks
      dailyQuota: 50,
      turnaroundHours: 72,
      payUnit: "per_item", // per_item | per_turn | per_rating
      payCents: 8,
      maxBudgetCents: 0,     // 0 = no cap
      alertThresholdPct: 90, // warn when crossing %
      warmupCalibPercent: 0, // optional warm-up batch
      showGoldImmediateFeedback: true,
    },

    gamification: {
      enabled: false,
      leaderboard: { enabled: false, anonymized: true },
      badges: { enabled: true },
      streaks: { enabled: true, graceDays: 1, weeklyGoal: 5 },
      milestone: { enabled: true, thresholds: [50, 200, 500] }, // items
      showInAnnotatorUI: true,
      allowOptOut: true,
    },

    policies: {
      piiRedaction: true,
      contentFilters: { enabled: true, thresholds: { toxicity: 0.8, violence: 0.7 } },
      showGuidelinesInTask: true,
      autoRefusalHints: true,
      policyDocUrl: "",
    },
  });

  const openAIKey = import.meta?.env?.VITE_OPENAI_KEY;

  const update = (path, value) => {
    setForm((prev) => {
      const copy = structuredClone(prev);
      let node = copy;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return copy;
    });
  };

  /* ── Estimates ─────────────────────────────────────────────────────────── */
  const stimuliCount = useMemo(() => {
    const c = countJSONLOrLines(form.data.promptsText);
    if (c > 0) return c;
    return form.goal.main === "rm" && form.goal.variant === "dialogue"
      ? form.data.plannedCount
      : (form.data.plannedCount || 0);
  }, [form.data.promptsText, form.data.plannedCount, form.goal]);

  const perItemUnits = useMemo(() => {
    if (form.goal.main === "sft") return 1;
    if (form.goal.main === "rm") {
      if (form.goal.variant === "single") return 1;
      if (form.goal.variant === "pairwise") return 2;
      if (form.goal.variant === "dialogue") return Math.max(1, Math.ceil((form.workflow.rm.dialogueTurns || 4) / 2));
    }
    return 1; // safety labeling
  }, [form.goal, form.workflow.rm.dialogueTurns]);

  const redundancy = Math.max(1, safeInt(form.people.extraOpinions)) * Math.max(1, safeInt(form.people.agreementN));
  const estimatedUnits = Math.max(0, stimuliCount) * Math.max(1, perItemUnits);
  const baseTotalCents = estimatedUnits * redundancy * Math.max(1, safeInt(form.people.payCents));
  // simple gamification cost uplift (e.g., small bonus pool), purely illustrative
  const gamificationUplift = form.gamification.enabled ? Math.round(baseTotalCents * 0.03) : 0;
  const estimatedTotalCents = baseTotalCents + gamificationUplift;

  const budgetCap = safeInt(form.people.maxBudgetCents);
  const budgetWarn =
    budgetCap > 0 ? Math.round((estimatedTotalCents / budgetCap) * 100) : 0;
  const overBudget = budgetCap > 0 && estimatedTotalCents > budgetCap;
  const nearBudget = budgetCap > 0 && !overBudget && budgetWarn >= Math.max(1, safeInt(form.people.alertThresholdPct));

  /* ── STEP 1: Goal ─────────────────────────────────────────────────────── */
  const StepGoal = () => (
    <Section title="What do you want to run?" sub="Pick the goal. You can fine-tune options in later steps.">
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormLabel>Goal</FormLabel>
          <RadioGroup
            value={form.goal.main}
            onChange={(e) => {
              const main = e.target.value;
              const variant = main === "sft" ? "write" : main === "rm" ? "pairwise" : "policy";
              update(["goal", "main"], main);
              update(["goal", "variant"], variant);
            }}
          >
            <FormControlLabel value="sft" control={<Radio />} label="SFT (Supervised Fine-Tuning)" />
            <FormControlLabel value="rm" control={<Radio />} label="Reward Modeling (ratings / comparisons / dialogue)" />
            <FormControlLabel value="safety" control={<Radio />} label="Safety / Policy labeling" />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} md={8}>
          {form.goal.main === "sft" && (
            <>
              <FormLabel>SFT Variant</FormLabel>
              <RadioGroup
                row
                value={form.goal.variant}
                onChange={(e) => update(["goal", "variant"], e.target.value)}
              >
                <FormControlLabel value="write" control={<Radio />} label="Prompt → write the best answer" />
                <FormControlLabel value="author" control={<Radio />} label="Topic → author prompt (and optional answer)" />
              </RadioGroup>
              <Hint>Use <b>write</b> when you already have prompts. Use <b>author</b> to create new prompts from topics/guidelines.</Hint>
            </>
          )}

          {form.goal.main === "rm" && (
            <>
              <FormLabel>RM Variant</FormLabel>
              <RadioGroup
                row
                value={form.goal.variant}
                onChange={(e) => update(["goal", "variant"], e.target.value)}
              >
                <FormControlLabel value="single" control={<Radio />} label="Rate one answer (Likert/Binary)" />
                <FormControlLabel value="pairwise" control={<Radio />} label="Compare A vs B" />
                <FormControlLabel value="dialogue" control={<Radio />} label="Back-and-forth dialogue" />
              </RadioGroup>
              <Hint>Pick <b>dialogue</b> for red-team/interactive evaluations. The next steps will ask turns, gating, etc.</Hint>
            </>
          )}

          {form.goal.main === "safety" && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Annotators will label content (e.g., toxicity, harassment, PII). You can turn on severity scales.
            </Typography>
          )}
        </Grid>
      </Grid>
    </Section>
  );

  /* ── STEP 2: Data & Model (clean) ─────────────────────────────────────── */
  const StepDataModel = () => {
    const uploadedCount = countJSONLOrLines(form.data.uploadedJSONL);

    return (
      <Box>
        <Section
          title="Data & Model"
          sub="First pick how answers will be produced. Keep it minimal; detailed task logic comes next."
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <QCard
                title="How will answers be produced?"
                helper="Choose whether we’ll call your model, use pre-uploaded answers/candidates, or (for SFT) let humans author."
              >
                <RadioGroup
                  value={form.data.productionMode}
                  onChange={(e) => update(["data", "productionMode"], e.target.value)}
                >
                  <FormControlLabel value="model" control={<Radio />} label="Use my model key to generate answers" />
                  <FormControlLabel value="uploaded" control={<Radio />} label="Use uploaded answers/candidates" />
                  {form.goal.main === "sft" && (
                    <FormControlLabel value="none" control={<Radio />} label="No model (human-only authoring)" />
                  )}
                </RadioGroup>
              </QCard>

              <QCard
                title="How many items do you plan to run?"
                helper="Used for estimates. If you upload candidates, we’ll also detect count from the JSONL."
              >
                <Grid container spacing={1}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth type="number" label="Planned items"
                      value={form.data.plannedCount}
                      onChange={(e) => update(["data", "plannedCount"], safeInt(e.target.value, 0))}
                    />
                  </Grid>
                </Grid>
              </QCard>
            </Grid>

            <Grid item xs={12} md={6}>
              {form.data.productionMode === "model" && (
                <QCard title="Model selection" helper="Pick the model(s). Sampling controls are optional.">
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel id="models-label">Models</InputLabel>
                    <Select
                      multiple
                      labelId="models-label"
                      value={form.data.models}
                      onChange={(e) => update(["data", "models"], e.target.value)}
                      input={<OutlinedInput label="Models" />}
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {DUMMY_MODELS.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          <Checkbox checked={form.data.models.includes(m.id)} />
                          <Typography sx={{ ml: 1 }}>{m.name}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2">Sampling (optional)</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth type="number" label="Temperature"
                        inputProps={{ step: 0.05, min: 0, max: 2 }}
                        value={form.data.sampling.temperature}
                        onChange={(e) => update(["data", "sampling", "temperature"], parseFloat(e.target.value || "0"))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth type="number" label="Top-p"
                        inputProps={{ step: 0.01, min: 0, max: 1 }}
                        value={form.data.sampling.top_p}
                        onChange={(e) => update(["data", "sampling", "top_p"], parseFloat(e.target.value || "0"))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth type="number" label="Max tokens"
                        value={form.data.sampling.max_tokens}
                        onChange={(e) => update(["data", "sampling", "max_tokens"], safeInt(e.target.value, 0))}
                      />
                    </Grid>
                  </Grid>
                </QCard>
              )}

              {form.data.productionMode === "uploaded" && (
                <QCard
                  title="Upload / paste candidates"
                  helper='JSONL preferred. For pairwise, put an array of candidates; for single, a single string is fine.'
                >
                  <TextField
                    fullWidth multiline minRows={10}
                    placeholder={
                      '{"id":"1","prompt":"…","candidates":["Answer A","Answer B"]}\n' +
                      '{"id":"2","prompt":"…","candidates":["A","B"]}'
                    }
                    value={form.data.uploadedJSONL}
                    onChange={(e) => update(["data", "uploadedJSONL"], e.target.value)}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Detected items: <b>{uploadedCount}</b>
                  </Typography>
                </QCard>
              )}

              {form.data.productionMode === "none" && form.goal.main === "sft" && (
                <QCard title="Human-only" helper="Answers will be authored by annotators during the task.">
                  <Typography variant="body2" color="text.secondary">
                    You can refine authoring rules in the next step (Workflow).
                  </Typography>
                </QCard>
              )}
            </Grid>
          </Grid>
        </Section>
      </Box>
    );
  };

  /* ── STEP 3: Workflow & Rating ─────────────────────────────────────────── */
 const StepWorkflow = () => {
  const [previewTab, setPreviewTab] = useState(0);
  const isRM = form.goal.main === "rm";
  const isSFT = form.goal.main === "sft";
  const isSafety = form.goal.main === "safety";

  const scoreIsBinary =
    isRM &&
    form.goal.variant === "single" &&
    Number(form.workflow.rm.scaleMin) === 0 &&
    Number(form.workflow.rm.scaleMax) === 1;

  /* ── Helpers: chips + summary ────────────────────────────────────────── */
  const summaryLines = useMemo(() => {
    const lines = [];
    if (isSFT) {
      lines.push(`Format: SFT • Mode: ${form.workflow.sft.mode}`);
      lines.push(`Completion: ${form.workflow.sft.completeRule || "single_submit"}`);
      if (form.workflow.sft.multiTurn) lines.push("Multi-turn: On");
      if (form.workflow.sft.nudge) lines.push(`Nudge: “${form.workflow.sft.nudge}”`);
    }
    if (isRM) {
      lines.push(`Format: RM • ${form.goal.variant}`);
      if (form.goal.variant === "single") {
        lines.push(`Rubrics: ${form.workflow.rm.rubrics.join(", ") || "—"}`);
        lines.push(`Scale: ${form.workflow.rm.scaleMin}–${form.workflow.rm.scaleMax}${scoreIsBinary ? " (Binary)" : ""}`);
      }
      if (form.goal.variant === "pairwise") {
        lines.push(`Reminders: ${form.workflow.rm.rubrics.join(", ") || "—"}`);
        lines.push(`Tie: ${form.workflow.rm.allowTie ? "On" : "Off"} • Why: ${form.workflow.rm.requireJustification ? "Required" : "Optional/Off"}`);
      }
      if (form.goal.variant === "dialogue") {
        lines.push(`Turns: ${form.workflow.rm.dialogueTurns}`);
        lines.push(`End rule: ${form.workflow.rm.stopRule || "max_turns"}`);
        lines.push(`Ratings: ${form.workflow.rm.perTurn ? "Per turn" : "Overall at end"}`);
        if (form.workflow.rm.followupQuestion) lines.push(`Follow-up: “${form.workflow.rm.followupQuestion}”`);
      }
      if (form.workflow.sft.nudge) lines.push(`Nudge: “${form.workflow.sft.nudge}”`);
    }
    if (isSafety) {
      lines.push(`Format: Safety labeling`);
      lines.push(`Labels: ${form.workflow.safety.labels.join(", ") || "—"}`);
      lines.push(`Severity: ${form.workflow.safety.severity ? "On" : "Off"}`);
      if (form.workflow.sft.nudge) lines.push(`Guidance: “${form.workflow.sft.nudge}”`);
    }
    return lines;
  }, [form, isRM, isSFT, isSafety, scoreIsBinary]);

  const ChipsRow = () => {
    const chips = [];
    if (isSFT) {
      chips.push({ k: "SFT", v: form.workflow.sft.mode });
      chips.push({ k: "Complete", v: form.workflow.sft.completeRule || "single_submit" });
      if (form.workflow.sft.multiTurn) chips.push({ k: "Multi-turn", v: "On" });
    }
    if (isRM) {
      chips.push({ k: "RM", v: form.goal.variant });
      if (form.goal.variant === "single") chips.push({ k: "Scale", v: `${form.workflow.rm.scaleMin}–${form.workflow.rm.scaleMax}` });
      if (form.goal.variant === "pairwise") {
        chips.push({ k: "Tie", v: form.workflow.rm.allowTie ? "On" : "Off" });
        chips.push({ k: "Why", v: form.workflow.rm.requireJustification ? "Req" : "Off" });
      }
      if (form.goal.variant === "dialogue") {
        chips.push({ k: "Turns", v: String(form.workflow.rm.dialogueTurns) });
        chips.push({ k: "Ratings", v: form.workflow.rm.perTurn ? "Per-turn" : "Overall" });
      }
    }
    if (isSafety) {
      chips.push({ k: "Severity", v: form.workflow.safety.severity ? "On" : "Off" });
    }
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
        {chips.map((c, i) => (
          <Chip key={i} size="small" label={`${c.k}: ${c.v}`} />
        ))}
      </Box>
    );
  };

  /* ── Preview pieces (purely visual) ───────────────────────────────────── */
  const PreviewSliders = ({ rubrics, min, max }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
      {rubrics.map((r, i) => (
        <Box key={i} sx={{ p: 1, border: "1px solid #eee", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">{r}</Typography>
          <Slider min={min} max={max} value={Math.round((min + max) / 2)} disabled />
          <Typography variant="caption" color="text.secondary">{min} ⟶ {max}</Typography>
        </Box>
      ))}
    </Box>
  );

  const PreviewBinary = ({ rubrics }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
      {rubrics.map((r, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="body2">{r}</Typography>
          <RadioGroup row value="up">
            <FormControlLabel value="up" control={<Radio />} label="👍" disabled />
            <FormControlLabel value="down" control={<Radio />} label="👎" disabled />
          </RadioGroup>
        </Paper>
      ))}
    </Box>
  );

  const PreviewAB = () => (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="overline">Candidate A</Typography>
            <Typography variant="body2" color="text.secondary">Sample answer A…</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="overline">Candidate B</Typography>
            <Typography variant="body2" color="text.secondary">Sample answer B…</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" disabled>Choose A</Button>
        <Button size="small" variant="outlined" disabled>Choose B</Button>
        {form.workflow.rm.allowTie && <Button size="small" variant="outlined" disabled>Tie</Button>}
      </Box>
      {form.workflow.rm.requireJustification && (
        <TextField label="Why?" size="small" fullWidth placeholder="One line reason…" disabled />
      )}
      {!!form.workflow.rm.rubrics.length && (
        <Box sx={{ mt: 0.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {form.workflow.rm.rubrics.map((r, i) => <Chip key={i} size="small" label={r} />)}
        </Box>
      )}
    </Box>
  );

  const PreviewDialogue = () => {
    const turns = Math.max(2, Number(form.workflow.rm.dialogueTurns) || 4);
    const nodes = [];
    for (let t = 1; t <= turns; t++) {
      const isAnnotator = t % 2 === 1;
      nodes.push(
        <Box key={t} sx={{ mb: 1.2 }}>
          <Typography variant="caption" color="text.secondary">
            {isAnnotator ? `Turn ${t} • You` : `Turn ${t} • Model`}
          </Typography>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {isAnnotator ? "Ask a probing question…" : "Sample model reply…"}
            </Typography>
          </Paper>
          {!isAnnotator && form.workflow.rm.perTurn && (
            <Box sx={{ mt: 0.5 }}>
              {scoreIsBinary ? (
                <PreviewBinary rubrics={["Quality (thumbs)"]} />
              ) : (
                <PreviewSliders rubrics={["Quality"]} min={form.workflow.rm.scaleMin} max={form.workflow.rm.scaleMax} />
              )}
            </Box>
          )}
        </Box>
      );
    }
    return (
      <Box>
        {nodes}
        {!form.workflow.rm.perTurn && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="subtitle2">Overall rating</Typography>
            {scoreIsBinary ? (
              <PreviewBinary rubrics={["Overall"]} />
            ) : (
              <PreviewSliders rubrics={["Overall"]} min={form.workflow.rm.scaleMin} max={form.workflow.rm.scaleMax} />
            )}
            {form.workflow.rm.followupQuestion && (
              <TextField sx={{ mt: 1 }} label={form.workflow.rm.followupQuestion} fullWidth size="small" disabled />
            )}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Ends: {form.workflow.rm.stopRule || "max_turns"}
        </Typography>
      </Box>
    );
  };

  const PreviewSFT = () => (
    <Box>
      <Typography variant="subtitle2">Prompt</Typography>
      <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">Write a clear explanation of transformers…</Typography>
      </Paper>
      <Typography variant="subtitle2">Answer</Typography>
      <TextField multiline minRows={5} fullWidth placeholder="Type the best answer…" disabled />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Completion: {form.workflow.sft.completeRule || "single_submit"} {form.workflow.sft.multiTurn ? "• Multi-turn" : ""}
      </Typography>
      {form.workflow.sft.nudge && (
        <Alert sx={{ mt: 1 }} severity="info">Nudge: {form.workflow.sft.nudge}</Alert>
      )}
    </Box>
  );

  const PreviewSafety = () => (
    <Box>
      <Typography variant="subtitle2">Content</Typography>
      <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">Sample text to label for policy categories…</Typography>
      </Paper>
      <Typography variant="subtitle2">Labels</Typography>
      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        {form.workflow.safety.labels.map((l, i) => (
          <Grid key={i} item xs={12} sm={6}>
            <FormControlLabel control={<Checkbox checked={false} disabled />} label={l} />
            {form.workflow.safety.severity && (
              <Slider min={0} max={3} value={1} disabled />
            )}
          </Grid>
        ))}
      </Grid>
      {form.workflow.sft.nudge && (
        <Alert sx={{ mt: 1 }} severity="info">Guidance: {form.workflow.sft.nudge}</Alert>
      )}
    </Box>
  );

  const RaterPreview = () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <ChipsRow />
      {isSFT && <PreviewSFT />}
      {isRM && form.goal.variant === "single" && (
        scoreIsBinary ? (
          <PreviewBinary rubrics={form.workflow.rm.rubrics.length ? form.workflow.rm.rubrics : ["Quality"]} />
        ) : (
          <PreviewSliders
            rubrics={form.workflow.rm.rubrics.length ? form.workflow.rm.rubrics : ["Quality"]}
            min={form.workflow.rm.scaleMin}
            max={form.workflow.rm.scaleMax}
          />
        )
      )}
      {isRM && form.goal.variant === "pairwise" && <PreviewAB />}
      {isRM && form.goal.variant === "dialogue" && <PreviewDialogue />}
      {isSafety && <PreviewSafety />}
    </Paper>
  );

  /* ── AI Configure: naive keyword mapping (optional) ───────────────────── */
  const [aiText, setAiText] = useState("");
  const applyAIConfigure = () => {
    const text = aiText.toLowerCase();
    // format
    if (text.includes("dialogue") || text.includes("chat")) {
      update(["goal", "main"], "rm"); update(["goal", "variant"], "dialogue");
    } else if (text.includes("a/b") || text.includes("compare")) {
      update(["goal", "main"], "rm"); update(["goal", "variant"], "pairwise");
    } else if (text.includes("sft") || text.includes("write")) {
      update(["goal", "main"], "sft"); update(["goal", "variant"], "write");
    } else if (text.includes("safety") || text.includes("label")) {
      update(["goal", "main"], "safety");
    } else {
      update(["goal", "main"], "rm"); update(["goal", "variant"], "single");
    }
    // rubrics
    const rubrics = [];
    if (text.match(/clarity|clear/)) rubrics.push("clarity");
    if (text.match(/factual|truth/)) rubrics.push("factuality");
    if (text.match(/helpful/)) rubrics.push("helpfulness");
    if (text.match(/harmless|safe/)) rubrics.push("harmlessness");
    if (text.match(/honest/)) rubrics.push("honesty");
    if (rubrics.length) update(["workflow", "rm", "rubrics"], rubrics);
    // scale
    if (text.includes("binary") || text.includes("thumb")) {
      update(["workflow", "rm", "scaleMin"], 0);
      update(["workflow", "rm", "scaleMax"], 1);
    } else if (text.includes("1-5") || text.includes("1 to 5")) {
      update(["workflow", "rm", "scaleMin"], 1);
      update(["workflow", "rm", "scaleMax"], 5);
    } else if (text.includes("1-7") || text.includes("1 to 7")) {
      update(["workflow", "rm", "scaleMin"], 1);
      update(["workflow", "rm", "scaleMax"], 7);
    }
    // pairwise options
    update(["workflow", "rm", "allowTie"], /tie/.test(text));
    update(["workflow", "rm", "requireJustification"], /why|justify|reason/.test(text));
    // dialogue options
    const m = text.match(/(\d+)\s*turn/);
    if (m) update(["workflow", "rm", "dialogueTurns"], Math.max(2, parseInt(m[1], 10)));
    update(["workflow", "rm", "perTurn"], /per[- ]?turn|each turn/.test(text));
    if (/refuse/.test(text)) update(["workflow", "rm", "stopRule"], "model_refuses_twice");
    // safety labels
    if (form.goal.main === "safety") {
      const labels = [];
      if (/tox/i.test(text)) labels.push("toxicity");
      if (/harass/i.test(text)) labels.push("harassment");
      if (/hate/i.test(text)) labels.push("hate");
      if (/pii|privacy/i.test(text)) labels.push("pii");
      if (/danger|illegal/i.test(text)) labels.push("dangerous");
      if (labels.length) update(["workflow", "safety", "labels"], labels);
      update(["workflow", "safety", "severity"], /severity|level/.test(text));
    }
  };

  /* ── LEFT PANE (controls) + RIGHT PANE (preview tabs) ─────────────────── */
  return (
    <Box>
      {/* SFT */}
      {isSFT && (
        <Section title="SFT workflow" sub="Tell us what annotators should do and when an item is done.">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <QCard title="What should annotators do?" helper="Write the best answer for each prompt, or author new prompts from topics.">
                <RadioGroup
                  value={form.workflow.sft.mode}
                  onChange={(e) => update(["workflow", "sft", "mode"], e.target.value)}
                >
                  <FormControlLabel value="write" control={<Radio />} label="Write best answer to each prompt" />
                  <FormControlLabel value="author" control={<Radio />} label="Author prompts (and optionally answers)" />
                </RadioGroup>
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={<Switch checked={form.workflow.sft.multiTurn} onChange={(e) => update(["workflow", "sft", "multiTurn"], e.target.checked)} />}
                  label="Allow multi-turn authoring"
                />
              </QCard>

              <QCard title="Completion rule" helper="When is a task considered complete?">
                <RadioGroup
                  value={form.workflow.sft.completeRule || "single_submit"}
                  onChange={(e) => update(["workflow", "sft", "completeRule"], e.target.value)}
                >
                  <FormControlLabel value="single_submit" control={<Radio />} label="After a single high-quality submission" />
                  <FormControlLabel value="multi_fields" control={<Radio />} label="After all required fields / steps are filled" />
                </RadioGroup>
              </QCard>

              <QCard title="Short nudge / guidance (optional)">
                <TextField
                  fullWidth multiline minRows={4}
                  value={form.workflow.sft.nudge}
                  onChange={(e) => update(["workflow", "sft", "nudge"], e.target.value)}
                  placeholder="Prefer helpful, honest, harmless, concise answers."
                />
              </QCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} variant="fullWidth">
                  <Tab label="Rater view" />
                  <Tab label="Summary" />
                  <Tab label="AI Configure" />
                </Tabs>
              </Paper>

              {previewTab === 0 && <RaterPreview />}
              {previewTab === 1 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {summaryLines.map((l, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>{l}</Typography>
                  ))}
                </Paper>
              )}
              {previewTab === 2 && (
                <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1 }}>
                  <TextField
                    label="Describe your task (one sentence)"
                    placeholder="e.g., Compare two summaries for clarity & factuality, allow ties, ask why."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    multiline minRows={3}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" onClick={applyAIConfigure} disabled={!aiText.trim()}>Generate & Apply</Button>
                    <Button variant="text" onClick={() => setAiText("")}>Clear</Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Tip: Use keywords like “A/B”, “binary”, “dialogue 4 turns”, “per-turn ratings”, “tie”, “why”.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Section>
      )}

      {/* RM */}
      {isRM && (
        <Section title="Reward modeling" sub="Pick the evaluation format and how raters will judge answers.">
          <Grid container spacing={2}>
            {/* LEFT: controls */}
            <Grid item xs={12} md={6}>
              <QCard title="Evaluation format" helper="Single-answer rating, A/B comparison, or dialogue?">
                <RadioGroup value={form.goal.variant} onChange={(e) => update(["goal", "variant"], e.target.value)}>
                  <FormControlLabel value="single" control={<Radio />} label="Rate one answer" />
                  <FormControlLabel value="pairwise" control={<Radio />} label="Compare A vs B" />
                  <FormControlLabel value="dialogue" control={<Radio />} label="Back-and-forth dialogue" />
                </RadioGroup>
              </QCard>

              {form.goal.variant !== "dialogue" && (
                <QCard title="What matters to the rater?" helper="For single-answer, sliders; for A/B, a simple reminder strip.">
                  {form.goal.variant === "single" && (
                    <>
                      <TextField
                        fullWidth label="Rubrics (comma separated)"
                        value={form.workflow.rm.rubrics.join(",")}
                        onChange={(e) =>
                          update(["workflow", "rm", "rubrics"],
                            e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                      />
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth type="number" label="Scale min"
                            value={form.workflow.rm.scaleMin}
                            onChange={(e) => update(["workflow", "rm", "scaleMin"], safeInt(e.target.value, 0))}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth type="number" label="Scale max"
                            value={form.workflow.rm.scaleMax}
                            onChange={(e) => update(["workflow", "rm", "scaleMax"], safeInt(e.target.value, 1))}
                          />
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary">Tip: set min=0, max=1 for binary thumbs.</Typography>
                    </>
                  )}

                  {form.goal.variant === "pairwise" && (
                    <>
                      <FormControlLabel
                        control={<Switch checked={form.workflow.rm.allowTie}
                                         onChange={(e) => update(["workflow", "rm", "allowTie"], e.target.checked)} />}
                        label="Allow tie"
                      />
                      <FormControlLabel
                        control={<Switch checked={form.workflow.rm.requireJustification}
                                         onChange={(e) => update(["workflow", "rm", "requireJustification"], e.target.checked)} />}
                        label="Require one-line “why”"
                      />
                      <TextField
                        sx={{ mt: 1 }} fullWidth
                        label="Reminders to raters (comma-separated)"
                        placeholder="helpfulness, harmlessness, honesty…"
                        value={form.workflow.rm.rubrics.join(",")}
                        onChange={(e) =>
                          update(["workflow", "rm", "rubrics"],
                            e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                      />
                    </>
                  )}
                </QCard>
              )}

              {form.goal.variant === "dialogue" && (
                <QCard title="Conversation design" helper="Control turns, end rules, and how ratings are captured.">
                  <Typography gutterBottom>Max turns: {form.workflow.rm.dialogueTurns}</Typography>
                  <Slider min={2} max={12} step={1}
                          value={form.workflow.rm.dialogueTurns}
                          onChange={(_, v) => update(["workflow", "rm", "dialogueTurns"], v)} />

                  <FormLabel sx={{ mt: 2 }}>End when…</FormLabel>
                  <RadioGroup value={form.workflow.rm.stopRule || "max_turns"}
                              onChange={(e) => update(["workflow", "rm", "stopRule"], e.target.value)}>
                    <FormControlLabel value="max_turns" control={<Radio />} label="Max turns reached" />
                    <FormControlLabel value="annotator_ends" control={<Radio />} label="Annotator ends early" />
                    <FormControlLabel value="model_refuses_twice" control={<Radio />} label="Model refuses twice" />
                  </RadioGroup>

                  <FormLabel sx={{ mt: 2 }}>Collect ratings</FormLabel>
                  <RadioGroup value={form.workflow.rm.perTurn ? "per_turn" : "overall"}
                              onChange={(e) => update(["workflow", "rm", "perTurn"], e.target.value === "per_turn")}>
                    <FormControlLabel value="overall" control={<Radio />} label="One overall rating at the end" />
                    <FormControlLabel value="per_turn" control={<Radio />} label="Ask for ratings each turn (gated)" />
                  </RadioGroup>

                  <TextField sx={{ mt: 1 }} fullWidth
                             label="Optional follow-up question at the end"
                             value={form.workflow.rm.followupQuestion}
                             onChange={(e) => update(["workflow", "rm", "followupQuestion"], e.target.value)} />
                </QCard>
              )}

              <QCard title="Short nudge / guidance (optional)">
                <TextField
                  fullWidth multiline minRows={4}
                  value={form.workflow.sft.nudge}
                  onChange={(e) => update(["workflow", "sft", "nudge"], e.target.value)}
                  placeholder="Prefer helpful, honest, harmless, concise answers."
                />
              </QCard>
            </Grid>

            {/* RIGHT: live preview tabs */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} variant="fullWidth">
                  <Tab label="Rater view" />
                  <Tab label="Summary" />
                  <Tab label="AI Configure" />
                </Tabs>
              </Paper>

              {previewTab === 0 && <RaterPreview />}
              {previewTab === 1 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {summaryLines.map((l, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>{l}</Typography>
                  ))}
                </Paper>
              )}
              {previewTab === 2 && (
                <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1 }}>
                  <TextField
                    label="Describe your task (one sentence)"
                    placeholder="e.g., Chat 4 turns, rate each turn, end if model refuses twice."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    multiline minRows={3}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" onClick={applyAIConfigure} disabled={!aiText.trim()}>Generate & Apply</Button>
                    <Button variant="text" onClick={() => setAiText("")}>Clear</Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Tip: Use “A/B”, “binary”, “1–5”, “dialogue 6 turns”, “per-turn ratings”, “tie”, “why”.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Safety */}
      {isSafety && (
        <Section title="Safety / policy labeling" sub="Pick labels and whether to include severity.">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <QCard title="Labels">
                <TextField
                  fullWidth label="Labels (comma separated)"
                  value={form.workflow.safety.labels.join(",")}
                  onChange={(e) =>
                    update(["workflow", "safety", "labels"],
                      e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                    )
                  }
                />
                <FormControlLabel sx={{ mt: 1 }}
                  control={<Switch checked={form.workflow.safety.severity}
                                   onChange={(e) => update(["workflow", "safety", "severity"], e.target.checked)} />}
                  label="Enable severity scale" />
              </QCard>

              <QCard title="Short guidance (optional)">
                <TextField
                  fullWidth multiline minRows={4}
                  value={form.workflow.sft.nudge}
                  onChange={(e) => update(["workflow", "sft", "nudge"], e.target.value)}
                  placeholder="Be precise; apply labels strictly; use severity when enabled."
                />
              </QCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} variant="fullWidth">
                  <Tab label="Rater view" />
                  <Tab label="Summary" />
                  <Tab label="AI Configure" />
                </Tabs>
              </Paper>

              {previewTab === 0 && <RaterPreview />}
              {previewTab === 1 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {summaryLines.map((l, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>{l}</Typography>
                  ))}
                </Paper>
              )}
              {previewTab === 2 && (
                <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1 }}>
                  <TextField
                    label="Describe your safety task"
                    placeholder="e.g., Label toxicity, harassment, hate; include severity."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    multiline minRows={3}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" onClick={applyAIConfigure} disabled={!aiText.trim()}>Generate & Apply</Button>
                    <Button variant="text" onClick={() => setAiText("")}>Clear</Button>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Section>
      )}
    </Box>
  );
};


  /* ── STEP 4: People & Pay ─────────────────────────────────────────────── */
  const StepPeoplePay = () => (
    <Section title="People & Pay" sub="Choose who labels, how many opinions you want, and pay.">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="pool-label">Annotator pools</InputLabel>
            <Select
              labelId="pool-label" multiple input={<OutlinedInput label="Annotator pools" />}
              value={form.people.pools}
              onChange={(e) => update(["people", "pools"], e.target.value)}
              renderValue={(selected) => selected.join(", ")}
            >
              {DUMMY_POOLS.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Checkbox checked={form.people.pools.includes(p.id)} />
                  <Typography sx={{ ml: 1 }}>{p.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <QCard title="Filter by expertise (optional)" helper="Narrow the pool by language, domain, and seniority.">
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="lang-label">Languages</InputLabel>
                  <Select
                    labelId="lang-label" multiple input={<OutlinedInput label="Languages" />}
                    value={form.people.expertise.languages}
                    onChange={(e) => update(["people", "expertise", "languages"], e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {DUMMY_LANGUAGES.map((x) => (
                      <MenuItem key={x} value={x}><Checkbox checked={form.people.expertise.languages.includes(x)} /><Typography sx={{ ml: 1 }}>{x}</Typography></MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="dom-label">Domains</InputLabel>
                  <Select
                    labelId="dom-label" multiple input={<OutlinedInput label="Domains" />}
                    value={form.people.expertise.domains}
                    onChange={(e) => update(["people", "expertise", "domains"], e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {DUMMY_DOMAINS.map((x) => (
                      <MenuItem key={x} value={x}><Checkbox checked={form.people.expertise.domains.includes(x)} /><Typography sx={{ ml: 1 }}>{x}</Typography></MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="sen-label">Seniority</InputLabel>
                  <Select
                    labelId="sen-label" multiple input={<OutlinedInput label="Seniority" />}
                    value={form.people.expertise.seniority}
                    onChange={(e) => update(["people", "expertise", "seniority"], e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {DUMMY_SENIORITY.map((x) => (
                      <MenuItem key={x} value={x}><Checkbox checked={form.people.expertise.seniority.includes(x)} /><Typography sx={{ ml: 1 }}>{x}</Typography></MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </QCard>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Extra opinions per item"
                value={form.people.extraOpinions}
                onChange={(e) => update(["people", "extraOpinions"], safeInt(e.target.value, 1))}
                helperText="How many additional reviewers, beyond the first."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Agreement needed"
                value={form.people.agreementN}
                onChange={(e) => update(["people", "agreementN"], safeInt(e.target.value, 1))}
                helperText="Minimum reviewers who must agree."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="QA gold tasks %"
                value={form.people.qaSpotPercent}
                onChange={(e) => update(["people", "qaSpotPercent"], safeInt(e.target.value, 0))}
                helperText="Known-answer items to keep quality high."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Random audits %"
                value={form.people.qaAuditPercent}
                onChange={(e) => update(["people", "qaAuditPercent"], safeInt(e.target.value, 0))}
                helperText="Extra human review for a sample."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Warm-up / calibration %"
                value={form.people.warmupCalibPercent}
                onChange={(e) => update(["people", "warmupCalibPercent"], safeInt(e.target.value, 0))}
                helperText="Optional starter batch with instant feedback."
              />
            </Grid>
            <Grid item xs={6} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.people.showGoldImmediateFeedback}
                    onChange={(e) => update(["people", "showGoldImmediateFeedback"], e.target.checked)}
                  />
                }
                label="Immediate feedback on gold items"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormLabel>Pay</FormLabel>
          <RadioGroup row value={form.people.payUnit} onChange={(e) => update(["people", "payUnit"], e.target.value)}>
            <FormControlLabel value="per_item" control={<Radio />} label="Per item" />
            <FormControlLabel value="per_turn" control={<Radio />} label="Per turn" />
            <FormControlLabel value="per_rating" control={<Radio />} label="Per rating" />
          </RadioGroup>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Pay (¢)"
                value={form.people.payCents}
                onChange={(e) => update(["people", "payCents"], safeInt(e.target.value, 1))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Turnaround target (hours)"
                value={form.people.turnaroundHours}
                onChange={(e) => update(["people", "turnaroundHours"], safeInt(e.target.value, 0))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Daily quota per annotator"
                value={form.people.dailyQuota}
                onChange={(e) => update(["people", "dailyQuota"], safeInt(e.target.value, 0))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" label="Max budget (¢, optional)"
                value={form.people.maxBudgetCents}
                onChange={(e) => update(["people", "maxBudgetCents"], safeInt(e.target.value, 0))}
                helperText="0 = no cap"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth type="number" label="Budget alert at % of cap"
                value={form.people.alertThresholdPct}
                onChange={(e) => update(["people", "alertThresholdPct"], safeInt(e.target.value, 90))}
              />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle2">Budget (estimate)</Typography>
            <Typography variant="body2" color="text.secondary">
              Items planned/detected: <b>{stimuliCount.toLocaleString()}</b><br/>
              Work per item: <b>{perItemUnits}</b> • Redundancy: <b>{redundancy}×</b>
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              {dollars(estimatedTotalCents)}{" "}
              <Typography variant="caption" color="text.secondary">({estimatedTotalCents.toLocaleString()}¢)</Typography>
            </Typography>
            {nearBudget && <Alert severity="warning" sx={{ mt: 1 }}>Approaching budget cap.</Alert>}
            {overBudget && <Alert severity="error" sx={{ mt: 1 }}>Over budget cap — adjust scope or rates.</Alert>}
          </Paper>
        </Grid>
      </Grid>
    </Section>
  );

  /* ── STEP 5: Gamification (NEW) ───────────────────────────────────────── */
  const StepGamification = () => (
    <Section title="Gamification & Motivation" sub="Optional rewards that encourage consistency and quality.">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <QCard title="Enable gamification">
            <FormControlLabel
              control={<Switch checked={form.gamification.enabled}
                               onChange={(e) => update(["gamification", "enabled"], e.target.checked)} />}
              label="Enable project-level gamification"
            />
            <Hint>Annotators can see progress meters and rewards. Respect privacy and allow opt-out when required.</Hint>
          </QCard>

          <QCard title="Leaderboards">
            <FormControlLabel
              control={<Switch checked={form.gamification.leaderboard.enabled}
                               onChange={(e) => update(["gamification", "leaderboard", "enabled"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Show leaderboard"
            />
            <FormControlLabel
              control={<Switch checked={form.gamification.leaderboard.anonymized}
                               onChange={(e) => update(["gamification", "leaderboard", "anonymized"], e.target.checked)}
                               disabled={!form.gamification.enabled || !form.gamification.leaderboard.enabled} />}
              label="Anonymize names"
            />
          </QCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <QCard title="Badges, streaks, milestones">
            <FormControlLabel
              control={<Switch checked={form.gamification.badges.enabled}
                               onChange={(e) => update(["gamification", "badges", "enabled"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Badges"
            />
            <FormControlLabel
              control={<Switch checked={form.gamification.streaks.enabled}
                               onChange={(e) => update(["gamification", "streaks", "enabled"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Streaks"
            />
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth type="number" label="Weekly goal (days)"
                  value={form.gamification.streaks.weeklyGoal}
                  onChange={(e) => update(["gamification", "streaks", "weeklyGoal"], safeInt(e.target.value, 5))}
                  disabled={!form.gamification.enabled || !form.gamification.streaks.enabled}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth type="number" label="Grace days"
                  value={form.gamification.streaks.graceDays}
                  onChange={(e) => update(["gamification", "streaks", "graceDays"], safeInt(e.target.value, 1))}
                  disabled={!form.gamification.enabled || !form.gamification.streaks.enabled}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1.5 }} />

            <FormControlLabel
              control={<Switch checked={form.gamification.milestone.enabled}
                               onChange={(e) => update(["gamification", "milestone", "enabled"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Milestone rewards"
            />
            <TextField
              fullWidth label="Milestones (comma-separated item counts)"
              value={form.gamification.milestone.thresholds.join(",")}
              onChange={(e) => update(["gamification", "milestone", "thresholds"], e.target.value.split(",").map((x) => safeInt(x.trim(), 0)).filter((n) => n > 0))}
              disabled={!form.gamification.enabled || !form.gamification.milestone.enabled}
            />
          </QCard>
        </Grid>

        <Grid item xs={12}>
          <QCard title="Annotator visibility & opt-out">
            <FormControlLabel
              control={<Switch checked={form.gamification.showInAnnotatorUI}
                               onChange={(e) => update(["gamification", "showInAnnotatorUI"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Show gamification in annotator UI"
            />
            <FormControlLabel
              control={<Switch checked={form.gamification.allowOptOut}
                               onChange={(e) => update(["gamification", "allowOptOut"], e.target.checked)}
                               disabled={!form.gamification.enabled} />}
              label="Allow annotator opt-out"
            />
          </QCard>
        </Grid>
      </Grid>
    </Section>
  );

  /* ── STEP 6: Policies ─────────────────────────────────────────────────── */
  const StepPolicies = () => (
    <Section title="Policies & Guardrails" sub="Simple, plain-English safety controls.">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={<Switch checked={form.policies.showGuidelinesInTask}
                             onChange={(e) => update(["policies", "showGuidelinesInTask"], e.target.checked)} />}
            label="Show guidelines inside each task"
          />
          <FormControlLabel
            control={<Switch checked={form.policies.piiRedaction}
                             onChange={(e) => update(["policies", "piiRedaction"], e.target.checked)} />}
            label="Redact obvious PII in prompts/answers"
          />
          <FormControlLabel
            control={<Switch checked={form.policies.autoRefusalHints}
                             onChange={(e) => update(["policies", "autoRefusalHints"], e.target.checked)} />}
            label="Enable refusal nudges for unsafe requests"
          />
          <TextField
            sx={{ mt: 2 }} fullWidth
            label="Link to your policy (optional)"
            placeholder="https://…"
            value={form.policies.policyDocUrl}
            onChange={(e) => update(["policies", "policyDocUrl"], e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={<Switch checked={form.policies.contentFilters.enabled}
                             onChange={(e) => update(["policies", "contentFilters", "enabled"], e.target.checked)} />}
            label="Light content filters"
          />
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" inputProps={{ step: 0.01, min: 0, max: 1 }}
                label="Toxicity threshold"
                value={form.policies.contentFilters.thresholds.toxicity}
                onChange={(e) => update(["policies", "contentFilters", "thresholds", "toxicity"], parseFloat(e.target.value || "0"))}
                helperText="Lower = stricter"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth type="number" inputProps={{ step: 0.01, min: 0, max: 1 }}
                label="Violence threshold"
                value={form.policies.contentFilters.thresholds.violence}
                onChange={(e) => update(["policies", "contentFilters", "thresholds", "violence"], parseFloat(e.target.value || "0"))}
                helperText="Lower = stricter"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Section>
  );

  /* ── STEP 7: Review & Preview ─────────────────────────────────────────── */
  const payload = useMemo(() => ({
    basics: form.basics,
    goal: form.goal,
    data: form.data,
    workflow: form.workflow,
    people: { ...form.people, redundancy, estimatedUnits },
    gamification: form.gamification,
    policies: form.policies,
    meta: { createdAt: new Date().toISOString(), wizardVersion: "v4" },
  }), [form, redundancy, estimatedUnits]);

  const Summary = ({ label, value }) => (
    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
      <Typography sx={{ minWidth: 180 }} color="text.secondary">{label}:</Typography>
      <Typography sx={{ flex: 1 }}>{value}</Typography>
    </Box>
  );

  const StepReview = () => (
    <Box>
      <Section title="Review" sub="Confirm configuration. Save as draft or launch.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Summary label="Goal" value={`${form.goal.main} • ${form.goal.variant}`} />
            <Summary label="Items" value={`${stimuliCount}`} />
            <Summary label="Inputs" value={form.data.productionMode === "model" ? `Model(s): ${form.data.models.join(", ")}` : form.data.productionMode} />
            <Summary label="Work per item" value={`${perItemUnits}`} />
            <Summary label="Redundancy" value={`${redundancy}×`} />
            <Summary label="Budget (est.)" value={`${dollars(estimatedTotalCents)} ${overBudget ? " • OVER CAP" : nearBudget ? " • NEAR CAP" : ""}`} />
            <Summary label="Gamification" value={form.gamification.enabled ? "On" : "Off"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box component="pre" sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1, fontSize: 12, maxHeight: 280, overflow: "auto", border: "1px solid #eee" }}>
              {JSON.stringify(payload, null, 2)}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => { console.log("SAVE DRAFT", payload); alert("Saved as draft (see console)."); }}>
            Save draft
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (overBudget) { alert("Cannot launch: over budget cap."); return; }
              console.log("LAUNCH", payload);
              alert("Launched (see console).");
            }}
          >
            Launch
          </Button>
        </Box>
      </Section>

      <Section title="Preview & simulate" sub="Run a single item through the flow (simulates if no model key is set).">
        <PreviewRunner config={{ goal: form.goal, workflow: form.workflow, data: form.data }} openAIKey={openAIKey} />
      </Section>
    </Box>
  );

  /* ── Navigation & validation ──────────────────────────────────────────── */
  const canNext = useMemo(() => {
    if (activeStep === 0) return !!form.goal.main && !!form.goal.variant;
    if (activeStep === 1) { // Data & Model
      if (form.data.productionMode === "model") return form.data.models.length > 0;
      if (form.data.productionMode === "uploaded") return (form.data.uploadedJSONL || "").trim().length > 0;
      if (form.data.productionMode === "none") return form.goal.main === "sft";
      return false;
    }
    if (activeStep === 2) { // Workflow basic sanity
      if (form.goal.main === "rm" && form.goal.variant === "dialogue") return safeInt(form.workflow.rm.dialogueTurns, 0) >= 2;
      return true;
    }
    if (activeStep === 3) { // People & Pay basics
      if (safeInt(form.people.payCents, 0) <= 0) return false;
      if (safeInt(form.people.agreementN, 0) <= 0) return false;
      return true;
    }
    // Gamification & Policies have no hard blockers
    return true;
  }, [activeStep, form]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Create New Project</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Goal → Data & Model → Workflow → People & Pay → Gamification → Policies → Review. Clear, simple, flexible.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ my: 2 }}>
        {steps.map((s) => (
          <Step key={s}><StepLabel>{s}</StepLabel></Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && <StepGoal />}
        {activeStep === 1 && <StepDataModel />}
        {activeStep === 2 && <StepWorkflow />}
        {activeStep === 3 && <StepPeoplePay />}
        {activeStep === 4 && <StepGamification />}
        {activeStep === 5 && <StepPolicies />}
        {activeStep === 6 && <StepReview />}

        <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
          <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
          <Tooltip title={!canNext ? "Please complete this step." : ""}>
            <span>
              <Button variant="contained" onClick={handleNext} disabled={!canNext}>
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}