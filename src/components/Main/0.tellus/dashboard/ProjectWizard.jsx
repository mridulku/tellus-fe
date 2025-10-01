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

// ── RM prompt template library (prompt-only; no answers) ────────────────
const RM_PRESET_PROMPTS = [
  {
    id: "rm-genqa",
    name: "General Q&A",
    items: [
      { id: "rm-genqa-1", model_input: "Q: What is the Big Bang?", metadata: { topic: "cosmology" } },
      { id: "rm-genqa-2", model_input: "Q: Why do seasons occur on Earth?", metadata: { topic: "astronomy" } },
      { id: "rm-genqa-3", model_input: "Q: How does photosynthesis work?", metadata: { topic: "biology" } },
    ],
  },
  {
    id: "rm-summ",
    name: "Summarization",
    items: [
      { id: "rm-summ-1", model_input: "Summarize the following article in 2 sentences:\n<PASTE ARTICLE>", metadata: { task: "summarize" } },
      { id: "rm-summ-2", model_input: "Write a TL;DR for:\n<TEXT>", metadata: { task: "tldr" } },
    ],
  },
  {
    id: "rm-reason",
    name: "Reasoning",
    items: [
      { id: "rm-reason-1", model_input: "Solve step by step:\nIf a train leaves A at 40 km/h and ...", metadata: { task: "math_reasoning" } },
      { id: "rm-reason-2", model_input: "Explain like I’m 12: what is backpropagation?", metadata: { task: "concept_explain" } },
    ],
  },
  {
    id: "rm-code",
    name: "Coding",
    items: [
      { id: "rm-code-1", model_input: "Given this JS function, explain what it does:\n```js\nfunction uniq(arr){return [...new Set(arr)]}\n```", metadata: { task: "code_explain" } },
      { id: "rm-code-2", model_input: "Refactor the following Python to be more readable:\n```python\n...\n```", metadata: { task: "code_refactor" } },
    ],
  },
  {
    id: "rm-safety",
    name: "Safety probes",
    items: [
      { id: "rm-safe-1", model_input: "User asks: 'How do I bypass a paywall?'\nRespond helpfully and safely.", metadata: { policy: "safety" } },
      { id: "rm-safe-2", model_input: "User asks for medical advice without a doctor. Provide safe, general info.", metadata: { policy: "safety" } },
    ],
  },
];

function RMDataSetup({ form, update }) {
  // All RM-local hooks live here, always called in this component
  const [rmTab, setRmTab] = React.useState(0);             // 0 = Paste, 1 = Templates
  const [rmPresetChecked, setRmPresetChecked] = React.useState({});
  const [rmPresetAddedCount, setRmPresetAddedCount] = React.useState(0);

  const toggleRmItem = (itemId, checked) =>
    setRmPresetChecked((m) => ({ ...m, [itemId]: checked }));

  const toggleRmCategoryAll = (catId, checked) => {
    const cat = RM_PRESET_PROMPTS.find((c) => c.id === catId);
    if (!cat) return;
    setRmPresetChecked((m) => {
      const next = { ...m };
      cat.items.forEach((it) => (next[it.id] = checked));
      return next;
    });
  };

  const appendRmSelectedToPrompts = () => {
    const chosen = [];
    for (const cat of RM_PRESET_PROMPTS) {
      for (const it of cat.items) {
        if (rmPresetChecked[it.id]) chosen.push(it);
      }
    }
    if (!chosen.length) return;

    const lines = chosen.map((it, idx) =>
      JSON.stringify({
        id: it.id || `rm-preset-${Date.now()}-${idx}`,
        model_input: it.model_input,
        ...(it.metadata ? { metadata: it.metadata } : {}),
      })
    );

    const prev = (form.data.promptsText || "").trim();
    const joined = prev ? prev + "\n" + lines.join("\n") : lines.join("\n");
    update(["data", "promptsText"], joined);

    setRmPresetAddedCount(chosen.length);
    setRmPresetChecked({});
    setRmTab(0);
  };

  const uploadedCount = countJSONLOrLines(form.data.uploadedJSONL);

  // small helper to edit nested rmGen safely
  const setRmGen = (path, val) => {
    const next = structuredClone(form.data.rmGen || {});
    let node = next;
    for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
    node[path[path.length - 1]] = val;
    update(["data", "rmGen"], next);
  };

  return (
    <Section
      title="Reward Modeling — Data"
      sub="Choose the answer source, then provide prompts or pre-computed candidates."
    >
      {/* Source choice (renamed) */}
      <QCard title="Answer source" helper="Either call an existing model on your prompts, or upload ready-made candidates.">
        <RadioGroup
          value={form.data.productionMode}
          onChange={(e) => update(["data", "productionMode"], e.target.value)}
        >
          <FormControlLabel value="model"    control={<Radio />} label="Use Existing Model" />
          <FormControlLabel value="uploaded" control={<Radio />} label="Use Uploaded Answer Candidates" />
        </RadioGroup>
      </QCard>

      {/* MODEL PATH */}
      {form.data.productionMode === "model" && (
        <>
          {/* Model picker (TestModel1..3) */}
          <QCard title="Model" helper="Pick the model to generate answers.">
            <FormControl fullWidth>
              <InputLabel id="rm-models-label">Model</InputLabel>
              <Select
                labelId="rm-models-label"
                label="Model"
                value={form.data.models[0] || ""}
                onChange={(e) => update(["data", "models"], e.target.value ? [e.target.value] : [])}
              >
                {DUMMY_TEST_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Hint>Use a single model here. For A/B from different models, prefer “Uploaded candidates”.</Hint>
          </QCard>

          {/* Tabs: Paste vs Templates */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
            <Tabs value={rmTab} onChange={(_, v) => setRmTab(v)} variant="fullWidth">
              <Tab label="Paste Prompts (JSONL)" />
              <Tab label="Templates" />
            </Tabs>
          </Paper>

          {/* TAB 0: Paste prompts */}
          {rmTab === 0 && (
            <QCard title="Prompts (JSONL)" helper='One JSON object per line. Keys: "id", "model_input", optional "metadata".'>
              <TextField
                fullWidth multiline minRows={12}
                placeholder={rmPromptJSONLPlaceholder}
                value={form.data.promptsText}
                onChange={(e) => update(["data", "promptsText"], e.target.value)}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Detected prompts: <b>{countJSONLOrLines(form.data.promptsText)}</b>
              </Typography>
            </QCard>
          )}

          {/* TAB 1: Templates */}
          {rmTab === 1 && (
            <QCard title="Pick from templates" helper="Select examples; we’ll append them to the Prompts JSONL.">
              <Box sx={{ display: "grid", gap: 1 }}>
                {RM_PRESET_PROMPTS.map((cat) => {
                  const allInCat = cat.items.every((it) => !!rmPresetChecked[it.id]);
                  const someInCat = !allInCat && cat.items.some((it) => !!rmPresetChecked[it.id]);
                  return (
                    <Paper key={cat.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="subtitle2">{cat.name}</Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={allInCat}
                              indeterminate={someInCat}
                              onChange={(e) => toggleRmCategoryAll(cat.id, e.target.checked)}
                            />
                          }
                          label="Select all"
                        />
                      </Box>

                      <Box sx={{ display: "grid", gap: 0.75 }}>
                        {cat.items.map((it) => (
                          <Paper key={it.id} variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                              <Checkbox
                                checked={!!rmPresetChecked[it.id]}
                                onChange={(e) => toggleRmItem(it.id, e.target.checked)}
                                sx={{ mt: 0.5 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Model input</Typography>
                                <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                                  {it.model_input}
                                </Box>
                                {it.metadata && (
                                  <>
                                    <Typography variant="caption" color="text.secondary">Metadata</Typography>
                                    <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                                      {JSON.stringify(it.metadata, null, 2)}
                                    </Box>
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Paper>
                  );
                })}

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button variant="contained" onClick={appendRmSelectedToPrompts}>Add selected to Prompts JSONL</Button>
                  {!!rmPresetAddedCount && (
                    <Alert severity="success" sx={{ m: 0, py: 0.5 }}>
                      Added {rmPresetAddedCount} item{rmPresetAddedCount === 1 ? "" : "s"} to the Prompts tab.
                    </Alert>
                  )}
                </Box>
              </Box>
            </QCard>
          )}

          {/* Candidate-generation (kept simple, no extra hooks) */}
          <QCard
            title="Candidate generation"
            helper="How many answers per prompt, and how to vary parameters across candidates."
          >
            <Grid container spacing={1}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth type="number" label="Answers per prompt"
                  value={form.data.rmGen.nCandidates}
                  onChange={(e) => setRmGen(["nCandidates"], Math.max(1, parseInt(e.target.value || "1", 10)))}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel id="rm-strategy">Variation strategy</InputLabel>
                  <Select
                    labelId="rm-strategy" label="Variation strategy"
                    value={form.data.rmGen.strategy}
                    onChange={(e) => setRmGen(["strategy"], e.target.value)}
                  >
                    <MenuItem value="profiles">Profiles (A, B… fixed params)</MenuItem>
                    <MenuItem value="independent">Independent draws (same params, new seeds)</MenuItem>
                    <MenuItem value="sweep">Sweep one parameter (e.g., temp=[0.7,1.0])</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Minimal knobs (no extra hook usage) */}
            {form.data.rmGen.strategy === "profiles" && (
              <Box sx={{ mt: 1 }}>
                {(form.data.rmGen.profiles || []).map((p, idx) => (
                  <Grid key={idx} container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={2}><TextField fullWidth label="Label" value={p.label} onChange={(e) => setRmGen(["profiles", idx, "label"], e.target.value)} /></Grid>
                    <Grid item xs={6} md={2}><TextField fullWidth type="number" label="Temp" value={p.temperature} onChange={(e) => setRmGen(["profiles", idx, "temperature"], parseFloat(e.target.value || "0"))} /></Grid>
                    <Grid item xs={6} md={2}><TextField fullWidth type="number" label="Top-p" value={p.top_p} onChange={(e) => setRmGen(["profiles", idx, "top_p"], parseFloat(e.target.value || "0"))} /></Grid>
                    <Grid item xs={6} md={2}><TextField fullWidth type="number" label="Top-k" value={p.top_k} onChange={(e) => setRmGen(["profiles", idx, "top_k"], parseInt(e.target.value || "0", 10))} /></Grid>
                    <Grid item xs={6} md={2}><TextField fullWidth type="number" label="Max tokens" value={p.max_tokens} onChange={(e) => setRmGen(["profiles", idx, "max_tokens"], parseInt(e.target.value || "0", 10))} /></Grid>
                    <Grid item xs={12} md={2}><TextField fullWidth label="System prompt" value={p.systemPrompt} onChange={(e) => setRmGen(["profiles", idx, "systemPrompt"], e.target.value)} /></Grid>
                  </Grid>
                ))}
              </Box>
            )}

            {form.data.rmGen.strategy === "sweep" && (
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel id="rm-sweep-param">Sweep</InputLabel>
                      <Select
                        labelId="rm-sweep-param" label="Sweep"
                        value={form.data.rmGen.sweep.param}
                        onChange={(e) => setRmGen(["sweep", "param"], e.target.value)}
                      >
                        <MenuItem value="temperature">temperature</MenuItem>
                        <MenuItem value="top_p">top_p</MenuItem>
                        <MenuItem value="top_k">top_k</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Values (comma-separated)"
                      placeholder="0.7, 1.0"
                      value={(form.data.rmGen.sweep.values || []).join(", ")}
                      onChange={(e) =>
                        setRmGen(
                          ["sweep", "values"],
                          e.target.value.split(",").map((x) => x.trim()).map((v) => (form.data.rmGen.sweep.param === "top_k" ? parseInt(v, 10) : parseFloat(v))).filter((n) => Number.isFinite(n))
                        )
                      }
                    />
                  </Grid>
                </Grid>
                <Hint>We’ll expand across your prompts and generate up to <b>Answers per prompt</b> candidates using the sweep values.</Hint>
              </Box>
            )}
          </QCard>
        </>
      )}

      {/* UPLOADED PATH */}
      {form.data.productionMode === "uploaded" && (
        <QCard title="Upload / paste candidates (JSONL)" helper='Keys: "id", "model_input", "candidates": ["A","B",…].'>
          <TextField
            fullWidth multiline minRows={12}
            placeholder={rmCandidatesJSONLPlaceholder}
            value={form.data.uploadedJSONL}
            onChange={(e) => update(["data", "uploadedJSONL"], e.target.value)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Detected items: <b>{uploadedCount}</b>
          </Typography>
        </QCard>
      )}
    </Section>
  );
}



const SFT_PRESET_LIBRARY = [
  { key: "general_qa", label: "General Q&A", defaultCount: 500, template: { promptType: "qa" } },
  { key: "summarization", label: "Summarization (news, blog)", defaultCount: 500, template: { promptType: "summarize" } },
  { key: "code_help", label: "Code Help (explain/fix/refactor)", defaultCount: 400, template: { promptType: "code" } },
  { key: "reasoning", label: "Reasoning (math/logic)", defaultCount: 300, template: { promptType: "reasoning" } },
];

// ── Test models for RM model picker ───────────────────────────────────────
const DUMMY_TEST_MODELS = [
  { id: "test-1", name: "TestModel1" },
  { id: "test-2", name: "TestModel2" },
  { id: "test-3", name: "TestModel3" },
];

// ── RM JSONL placeholders (prompts vs candidates) ─────────────────────────
const rmPromptJSONLPlaceholder = `{"id":"1","model_input":"Q: What is the Big Bang?","metadata":{"topic":"cosmology"}}
{"id":"2","model_input":"Explain the Goldilocks zone in 2 sentences.","metadata":{"topic":"astronomy"}}
{"id":"3","model_input":"Summarize the key idea of backpropagation.","metadata":{"topic":"ml"}}`;

const rmCandidatesJSONLPlaceholder = `{"id":"101","model_input":"Q: What is the Big Bang?","candidates":["It is the origin theory...","It describes universe expansion..."]}
{"id":"102","model_input":"Explain the Goldilocks zone.","candidates":["A region where liquid water...","The orbit band suitable...","The habitable range..."]}
{"id":"103","model_input":"Summarize backpropagation.","candidates":["Gradient-based algorithm...","Weight-update rule using chain rule..."]}`;

// ── Preset Library (compact, safe examples) ───────────────────────────────
const PRESET_LIB = [
  {
    id: "summ",
    name: "Summarization",
    items: [
      {
        id: "summ-1",
        instruction_for_annotator:
          "Summarize the article in 1–2 sentences focusing on the main claim and one key detail.",
        model_input: "Summarize the following article:\n<PASTE ARTICLE TEXT>",
        model_output: "",
        category: "Summarization",
      },
      {
        id: "summ-2",
        instruction_for_annotator:
          "Write a concise TL;DR that preserves key facts and avoids opinion.",
        model_input: "TL;DR for:\n<ARTICLE>",
        model_output: "",
        category: "Summarization",
      },
      {
        id: "summ-3",
        instruction_for_annotator:
          "Give a 3-bullet summary with neutral tone.",
        model_input: "Summarize as 3 bullets:\n<TEXT>",
        model_output: "",
        category: "Summarization",
      },
    ],
  },
  {
    id: "genqa",
    name: "General Q&A",
    items: [
      {
        id: "genqa-1",
        instruction_for_annotator:
          "Write a clear, student-friendly explanation in 2–3 sentences.",
        model_input: "Q: What is meant by the Big Bang theory?",
        model_output: "",
        category: "General QA",
      },
      {
        id: "genqa-2",
        instruction_for_annotator:
          "Answer directly first, then add one short supporting detail.",
        model_input: "Q: Why do seasons occur on Earth?",
        model_output: "",
        category: "General QA",
      },
      {
        id: "genqa-3",
        instruction_for_annotator:
          "If uncertain, say what info is missing rather than guessing.",
        model_input: "Q: How does photosynthesis work?",
        model_output: "",
        category: "General QA",
      },
    ],
  },
  {
    id: "rc",
    name: "Reading Comprehension",
    items: [
      {
        id: "rc-1",
        instruction_for_annotator:
          "Answer using only the passage. If info is missing, state that explicitly.",
        model_input:
          "PASSAGE:\n<SHORT PASSAGE>\n\nQUESTION: Who is the protagonist and what do they want?",
        model_output: "",
        category: "Reading Comprehension",
      },
      {
        id: "rc-2",
        instruction_for_annotator:
          "Cite a short quote (<=10 words) if directly supported by the passage.",
        model_input:
          "PASSAGE:\n<PASSAGE>\n\nQUESTION: What is the author's main claim?",
        model_output: "",
        category: "Reading Comprehension",
      },
    ],
  },
  {
    id: "translate",
    name: "Translation",
    items: [
      {
        id: "tr-1",
        instruction_for_annotator:
          "Translate to French. Preserve meaning, tone, and punctuation.",
        model_input: "Please translate to French: 'Good evening, how are you?'",
        model_output: "Bonsoir, comment allez-vous ?",
        category: "Translation",
      },
      {
        id: "tr-2",
        instruction_for_annotator:
          "Translate to Hindi. Keep proper nouns unchanged.",
        model_input: "Translate to Hindi: 'The library opens at 9 AM.'",
        model_output: "",
        category: "Translation",
      },
    ],
  },
  {
    id: "codeexp",
    name: "Code Explanation",
    items: [
      {
        id: "codeexp-1",
        instruction_for_annotator:
          "Explain what the code does in plain English.",
        model_input:
          "Explain this code:\n\n```python\nnums=[1,2,3]\nprint(sum(x*x for x in nums))\n```",
        model_output: "",
        category: "Coding",
      },
      {
        id: "codeexp-2",
        instruction_for_annotator:
          "Describe time complexity at the end if relevant.",
        model_input:
          "Explain this function:\n\n```js\nfunction uniq(arr){return [...new Set(arr)];}\n```",
        model_output: "",
        category: "Coding",
      },
    ],
  },
  {
    id: "authorq",
    name: "Author-a-Question (prompt creation)",
    items: [
      {
        id: "authorq-1",
        instruction_for_annotator:
          "Author a good question on the topic and provide its best answer.",
        model_input: "TOPIC: Astrophysics — stellar evolution",
        model_output: "",
        category: "Question Authoring",
      },
      {
        id: "authorq-2",
        instruction_for_annotator:
          "Write a beginner-friendly question with a concise answer.",
        model_input: "TOPIC: European history — Renaissance",
        model_output: "",
        category: "Question Authoring",
      },
    ],
  },
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


{/* ── NEW: example JSONL placeholder (clean three-field schema) ─────────── */}
const qaJSONLPlaceholder = `{"id":"1","instruction_for_annotator":"Summarize the article in 1–2 sentences focusing on the main claim and one key detail.","model_input":"Summarize the following article:\\n<PASTE ARTICLE TEXT HERE>","model_output":"","category":"Summarization"}
{"id":"2","instruction_for_annotator":"Write a clear, student-friendly explanation in 2–3 sentences.","model_input":"Q: What is meant by the Big Bang theory?","model_output":"","category":"General QA"}
{"id":"3","instruction_for_annotator":"Answer using only the passage. If insufficient information, state that explicitly.","model_input":"PASSAGE:\\n<short passage>\\n\\nQUESTION: Who is the protagonist and what do they want?","model_output":"","category":"Reading Comprehension"}
{"id":"4","instruction_for_annotator":"Author a good question on the topic and provide its best answer.","model_input":"TOPIC: Astrophysics — stellar evolution","model_output":"","category":"Question Authoring"}
{"id":"5","instruction_for_annotator":"Translate to French. Preserve meaning, tone, and punctuation.","model_input":"Please translate: 'Good evening, how are you?'","model_output":"Bonsoir, comment allez-vous ?","category":"Translation"}`;



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

function SFTPeoplePay({ form, update, stimuliCount, dollars, unitsPerItem = 1, redundancy = 1 }) {
  // Reuse existing state as much as possible, add a tiny qaPolicy bag
  const pool = (form.people.pools && form.people.pools[0]) || "pool-crowd";
  const payCents = Number.isFinite(form.people.payCents) ? form.people.payCents : 8;

  const qa = form.people.qaPolicy || {
    warmupItems: 10,
    warmupPassPct: 80,
    goldSpotPct: 5,
    autoPauseWindow: 20,
    autoPauseMinAccPct: 60,
  };

  const setPool = (v) => update(["people", "pools"], [v]);
  const setQA = (k, v) => update(["people", "qaPolicy", k], v);

   const totalUnits =
   Math.max(0, stimuliCount) *
   Math.max(1, unitsPerItem) *
   Math.max(1, redundancy);
   const isSFT = form.goal.main === "sft";
  const isRM  = form.goal.main === "rm";
  const answersOrVotes =
    isSFT ? Math.max(1, safeInt(form.people.sftAnswersPerPrompt, 1))
          : isRM  ? Math.max(1, safeInt(form.people.rmVotesPerItem, 1))
                   : 1;
  const totalCents = (stimuliCount || 0) * answersOrVotes * Math.max(1, payCents);
  return (
    <Section title="People & Pay (SFT)" sub="Pick who labels, set pay, and define a simple quality policy.">
      {/* 1) WHO */}
      <QCard title="Who will do the work?" helper="Choose one pool. Optional: light filters.">
        <FormLabel sx={{ mb: 0.5 }}>Annotator pool</FormLabel>
        <RadioGroup
          row
          value={pool}
          onChange={(e) => setPool(e.target.value)}
        >
          <FormControlLabel value="pool-internal" control={<Radio />} label="Internal annotators" />
          <FormControlLabel value="pool-pro" control={<Radio />} label="Vetted Pro Pool" />
          <FormControlLabel value="pool-crowd" control={<Radio />} label="Crowd Marketplace" />
        </RadioGroup>

        <Divider sx={{ my: 1.5 }} />

        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="lang-minimal">Languages</InputLabel>
              <Select
                multiple
                labelId="lang-minimal"
                input={<OutlinedInput label="Languages" />}
                value={form.people.expertise.languages}
                onChange={(e) => update(["people", "expertise", "languages"], e.target.value)}
                renderValue={(selected) => selected.join(", ")}
              >
                {["English","Hindi","French","German","Spanish","Japanese"].map((x) => (
                  <MenuItem key={x} value={x}>
                    <Checkbox checked={form.people.expertise.languages.includes(x)} />
                    <Typography sx={{ ml: 1 }}>{x}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="dom-minimal">Domains</InputLabel>
              <Select
                multiple
                labelId="dom-minimal"
                input={<OutlinedInput label="Domains" />}
                value={form.people.expertise.domains}
                onChange={(e) => update(["people", "expertise", "domains"], e.target.value)}
                renderValue={(selected) => selected.join(", ")}
              >
                {["General","Coding","Medical","Legal","Finance","Safety"].map((x) => (
                  <MenuItem key={x} value={x}>
                    <Checkbox checked={form.people.expertise.domains.includes(x)} />
                    <Typography sx={{ ml: 1 }}>{x}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </QCard>

            {/* NEW: Task distribution & redundancy (simple terms) */}
      <QCard
        title="Task distribution"
        helper={form.goal.main === "sft"
          ? "How many people should answer the same question? We’ll send each question to this many annotators."
          : "How many people should vote on the same comparison? We’ll send each item to this many raters."}
      >
        {isSFT && (
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Answers per question"
                value={form.people.sftAnswersPerPrompt}
                onChange={(e) =>
                  update(["people", "sftAnswersPerPrompt"], Math.max(1, parseInt(e.target.value || "1", 10)))
                }
                helperText="Example: 3 means each question goes to 3 people."
              />
            </Grid>
          </Grid>
        )}

        {isRM && (
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Votes per item"
                value={form.people.rmVotesPerItem}
                onChange={(e) => {
                  const n = Math.max(1, parseInt(e.target.value || "1", 10));
                  update(["people", "rmVotesPerItem"], n);
                  // keep agree <= votes
                  if (safeInt(form.people.agreementN, 1) > n) {
                    update(["people", "agreementN"], n);
                  }
                }}
                helperText="How many people vote on the same A vs B."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Need at least (to agree)"
                value={form.people.agreementN}
                onChange={(e) =>
                  update(["people", "agreementN"], Math.max(1, Math.min(parseInt(e.target.value || "1", 10), Math.max(1, parseInt(form.people.rmVotesPerItem || "1", 10)))))
                }
                helperText="Minimum matching votes to count as ‘agreed’."
              />
            </Grid>
          </Grid>
        )}

        <Alert severity="info" sx={{ mt: 1 }}>
          Cost is estimated as <b>items × people per item × pay</b>. We use these numbers in the estimate below.
        </Alert>
      </QCard>

      {/* 2) PAY & PACING */}
      <QCard title="Pay & pacing" helper="Per-item pay; optional throughput targets.">
        <Grid container spacing={1}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Pay per item (¢)"
              value={form.people.payCents}
              onChange={(e) => update(["people", "payCents"], Math.max(1, parseInt(e.target.value || "1", 10)))}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Daily quota / annotator"
              value={form.people.dailyQuota}
              onChange={(e) => update(["people", "dailyQuota"], Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Turnaround target (hrs)"
              value={form.people.turnaroundHours}
              onChange={(e) => update(["people", "turnaroundHours"], Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Max budget (¢, optional)"
              value={form.people.maxBudgetCents}
              onChange={(e) => update(["people", "maxBudgetCents"], Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
           <Typography variant="body2" color="text.secondary">
   Items planned: <b>{(stimuliCount || 0).toLocaleString()}</b>
   {" • "}Work per item: <b>{unitsPerItem}</b>
   {" • "}Redundancy: <b>{redundancy}×</b>
 </Typography>

          <Typography variant="body2" color="text.secondary">
           People per item (multiplier): <b>{answersOrVotes}</b>
         </Typography>

          <Typography variant="h6" sx={{ mt: 0.5 }}>
            Estimated cost: {dollars(totalCents)}{" "}
            <Typography component="span" variant="caption" color="text.secondary">
              ({totalCents.toLocaleString()}¢)
            </Typography>
          </Typography>
        </Paper>
      </QCard>

      {/* 3) QA POLICY */}
      <QCard title="QA policy" helper="Simple, defensible guardrails for quality.">
        <Grid container spacing={1}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Warm-up items"
              value={qa.warmupItems}
              onChange={(e) => setQA("warmupItems", Math.max(0, parseInt(e.target.value || "0", 10)))}
              helperText="Calibration before full access"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Warm-up pass ≥ %"
              value={qa.warmupPassPct}
              onChange={(e) => setQA("warmupPassPct", Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Gold spot %"
              value={qa.goldSpotPct}
              onChange={(e) => setQA("goldSpotPct", Math.max(0, parseInt(e.target.value || "0", 10)))}
              helperText="Known-answer items"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Auto-pause window (gold)"
              value={qa.autoPauseWindow}
              onChange={(e) => setQA("autoPauseWindow", Math.max(1, parseInt(e.target.value || "1", 10)))}
              helperText="Last N golds"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth type="number" label="Auto-pause if acc < %"
              value={qa.autoPauseMinAccPct}
              onChange={(e) => setQA("autoPauseMinAccPct", Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 1 }}>
          Skips & Flags are enabled in the task UI (recommended). Warm-up and gold accuracy drive auto-pause.
        </Alert>
      </QCard>
    </Section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Main Wizard
 * ────────────────────────────────────────────────────────────────────────── */
export default function ProjectWizard() {
  const steps = [
    "Goal",
    "Data",
    "Workflow",
    "People, Quality & Pay",
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

      // ── NEW: RM generation config (for model-produced candidates) ───────────
  rmGen: {
    nCandidates: 2,                // how many answers per prompt
    strategy: "profiles",          // "profiles" | "independent" | "sweep"
    seedMode: "per_prompt_increment", // "fixed" | "per_prompt_increment"
    baseSeed: 1234,

    // Profiles: used when strategy === "profiles"
    profiles: [
      { label: "A", temperature: 0.7, top_p: 0.95, top_k: 0, max_tokens: 256, frequency_penalty: 0, presence_penalty: 0, systemPrompt: "", seed: 42 },
      { label: "B", temperature: 1.0, top_p: 0.9,  top_k: 0, max_tokens: 256, frequency_penalty: 0, presence_penalty: 0, systemPrompt: "", seed: 99 },
    ],

    // Sweep: used when strategy === "sweep"
    sweep: {
      param: "temperature",        // "temperature" | "top_p" | "top_k"
      values: [0.7, 1.0],          // will expand across nCandidates
    },

    // Independent draws: used when strategy === "independent"
    base: { temperature: 0.9, top_p: 0.95, top_k: 0, max_tokens: 256, frequency_penalty: 0, presence_penalty: 0, systemPrompt: "" },
  },
           sft: {
       mode: "upload",                 // "upload" | "design"
       inputType: "question_only",     // "question_only" | "question_plus_context" | "instruction_only"
       instruction: "",                // instruction/archetype template
       categories: [{ name: "General", target: 100 }],
       sample: { question: "", context: "", answer: "" },
       totalPairs: 100
     }
    },

    workflow: {
      sft: { mode: "write", multiTurn: false, nudge: "Write helpful, honest, harmless answers.", completeRule: "single_submit",
        showInstructionPanel: true,
    showSampleGoodAnswer: true,
    minWords: 0,         // 0 = no min
    maxWords: 0,         // 0 = no max
    allowRichText: false,
    allowSkip: true,
    allowFlag: true,
    afterSubmit: "auto_advance", // "auto_advance" | "stay_here"
       },
       rm: {
    // core, minimal pairwise controls
    allowTie: true,

    // strength-of-preference
    // "off" | "discrete3" | "discrete5" | "slider"
    preferenceKind: "discrete3",
    preferenceMax: 10, // only for slider

    // justification ("why")
    // "off" | "dropdown" | "text" | "both"
    reasonMode: "dropdown",
    reasonOptions: [
      "More accurate",
      "More relevant",
      "More concise",
      "Safer",
      "Fewer hallucinations",
    ],
    requireJustification: false, // keep your existing flag, still used

    // legacy/unused here but kept for compatibility
    rubrics: [...RUBRIC_PRESET],
    scaleMin: 1, scaleMax: 7,
    dialogueTurns: 4,
    perTurn: false,
    stopRule: "max_turns",
    followupQuestion: "",
  },

      safety: { labels: [...SAFETY_LABELS_PRESET], severity: true },
    },

    people: {
           sftAnswersPerPrompt: 1,  // SFT: how many answers per question
     rmVotesPerItem: 3,       // RM: how many raters per comparison
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
      qaPolicy: { warmupItems: 10, warmupPassPct: 80, goldSpotPct: 5, autoPauseWindow: 20, autoPauseMinAccPct: 60 },

    },

    gamification: {
  enabled: false,
  bonusBudgetPct: 3,          // % cushion in estimates for bonuses
  streak: {                   // daily consistency bonus
    enabled: false,
    dailyGoal: 20,            // items/day target
    bonusCents: 2,            // bonus per eligible item
  },
  qualityGate: {              // one simple requirement
    enabled: true,
    minAccuracyPct: 80,       // must meet QA ≥ this for any bonus
  },
  milestones: {               // optional, uniform bonus per milestone
    enabled: false,
    thresholds: [50, 200, 500],
    bonusCents: 100,
  },
  leaderboard: { enabled: false }, // optional, off by default
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
  if (form.goal.main === "sft") {
    return countJSONLOrLines(form.data.uploadedJSONL);
  }
  const c = countJSONLOrLines(form.data.promptsText);
  if (c > 0) return c;
  return form.data.plannedCount || 0;
}, [form.goal.main, form.data.uploadedJSONL, form.data.promptsText, form.data.plannedCount]);

  const perItemUnits = useMemo(() => {
    if (form.goal.main === "sft") return 1;
    if (form.goal.main === "rm") {
      if (form.goal.variant === "single") return 1;
      if (form.goal.variant === "pairwise") return 2;
      if (form.goal.variant === "dialogue") return Math.max(1, Math.ceil((form.workflow.rm.dialogueTurns || 4) / 2));
    }
    return 1; // safety labeling
  }, [form.goal, form.workflow.rm.dialogueTurns]);

   const redundancy =
   form.goal.main === "sft"
     ? Math.max(1, safeInt(form.people.sftAnswersPerPrompt, 1))
     : form.goal.main === "rm"
       ? Math.max(1, safeInt(form.people.rmVotesPerItem, 1))
       : 1; // safety/other
  const estimatedUnits = Math.max(0, stimuliCount) * Math.max(1, perItemUnits);
  const baseTotalCents = estimatedUnits * redundancy * Math.max(1, safeInt(form.people.payCents));
  // simple gamification cost uplift (e.g., small bonus pool), purely illustrative
 // bonus pool uplift driven by a single % knob
// single % knob for bonus cushion
const bonusPct = form.gamification.enabled ? Math.max(0, Number(form.gamification.bonusBudgetPct) || 0) : 0;
const gamificationUplift = Math.round(baseTotalCents * (bonusPct / 100));
const estimatedTotalCents = baseTotalCents + gamificationUplift;

  const budgetCap = safeInt(form.people.maxBudgetCents);
  const budgetWarn =
    budgetCap > 0 ? Math.round((estimatedTotalCents / budgetCap) * 100) : 0;
  const overBudget = budgetCap > 0 && estimatedTotalCents > budgetCap;
  const nearBudget = budgetCap > 0 && !overBudget && budgetWarn >= Math.max(1, safeInt(form.people.alertThresholdPct));

  /* ── STEP 1: Goal ─────────────────────────────────────────────────────── */
  /* ── STEP 1: Goal (REPLACE your existing StepGoal) ──────────────────────── */
/* ── STEP 1: Goal (replace) ─────────────────────────────────────────────── */
const StepGoal = () => {
  const [uiMain, setUiMain] = useState(
    form.goal.main === "sft" ? "sft" :
    form.goal.main === "rm"  ? "rm"  : "postrm"
  );
  const [postrmChoice, setPostrmChoice] = useState("");

  const setGoal = (main, variant) => {
    update(["goal", "main"], main);
    if (variant != null) update(["goal", "variant"], variant);
    if (main === "sft") update(["data", "productionMode"], "none"); // SFT uses human answers
  };

  const applyPostRM = (choice) => {
    setPostrmChoice(choice);
    switch (choice) {
      case "safety_policy":              setGoal("safety", "policy");   break;
      case "red_team_adversarial":       setGoal("rm", "dialogue");     break; // adversarial → dialogue RM for now
      case "refusal_eval":
      case "bias_fairness_audit":
      case "rate_trimming_normalization":
      default:                           setGoal("rm", "single");       break;
    }
  };

  return (
    <Section title="What do you want to run?" sub="Choose a top-level goal. Format details come later.">
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormLabel>Goal</FormLabel>
          <RadioGroup
            value={uiMain}
            onChange={(e) => {
              const v = e.target.value;
              setUiMain(v);
              if (v === "sft")     setGoal("sft", "write");
              if (v === "rm")      setGoal("rm", form.goal.variant || "pairwise"); // default; actual format picked in Step 3
              if (v === "postrm") { /* sub-choice below, no immediate change */ }
            }}
          >
            <FormControlLabel value="sft"    control={<Radio />} label="SFT (Supervised Fine-Tuning)" />
            <FormControlLabel value="rm"     control={<Radio />} label="Reward Modeling" />
            <FormControlLabel value="postrm" control={<Radio />} label="Other / Post-Reward Modeling" />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} md={8}>
          {uiMain === "sft" && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Supervised Fine-Tuning collects Q/A pairs from humans. Model selection is not needed here.
            </Typography>
          )}

          {uiMain === "rm" && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Reward Modeling evaluates model answers. You’ll pick single vs A/B vs dialogue in <b>Workflow</b>.
            </Typography>
          )}

          {uiMain === "postrm" && (
            <Box>
              <FormLabel>Choose a post-RM family</FormLabel>
              <RadioGroup value={postrmChoice} onChange={(e) => applyPostRM(e.target.value)}>
                <FormControlLabel value="safety_policy"               control={<Radio />} label="Safety / Policy labeling" />
                <FormControlLabel value="red_team_adversarial"        control={<Radio />} label="Red Team (adversarial prompt synthesis/eval)" />
                <FormControlLabel value="refusal_eval"                control={<Radio />} label="Refusal / jailbreak compliance evaluation" />
                <FormControlLabel value="bias_fairness_audit"         control={<Radio />} label="Bias & fairness audit" />
                <FormControlLabel value="rate_trimming_normalization" control={<Radio />} label="Rate trimming / outlier normalization" />
              </RadioGroup>
              <Hint>These currently map onto existing RM/Safety flows. You can specialize later without changing the taxonomy.</Hint>
            </Box>
          )}
        </Grid>
      </Grid>
    </Section>
  );
};

  /* ── STEP 2: Data & Model (clean) ─────────────────────────────────────── */
const StepDataModel = () => {
  if (form.goal.main === "sft") {
    return <SFTDataSetup form={form} update={update} />;
  }
  if (form.goal.main === "rm") {
    return <RMDataSetup form={form} update={update} />;
  }
  // Safety or other fallback (no hooks here)
  return (
    <Section title="Data & Model" sub="Provide inputs for your selected goal.">
      <QCard title="Inputs">
        <Alert severity="info">No special data inputs for this goal in Step 2.</Alert>
      </QCard>
    </Section>
  );
};

function SFTDataSetup({ form, update }) {
  const [tab, setTab] = React.useState(0);

  const [presetChecked, setPresetChecked] = useState({}); // { [itemId]: true|false }
const [presetAddedCount, setPresetAddedCount] = useState(0);

const toggleItem = (itemId, checked) =>
  setPresetChecked((m) => ({ ...m, [itemId]: checked }));

const toggleCategoryAll = (catId, checked) => {
  const cat = PRESET_LIB.find((c) => c.id === catId);
  if (!cat) return;
  setPresetChecked((m) => {
    const next = { ...m };
    cat.items.forEach((it) => (next[it.id] = checked));
    return next;
  });
};

const appendSelectedToJSONL = () => {
  const chosen = [];
  for (const cat of PRESET_LIB) {
    for (const it of cat.items) {
      if (presetChecked[it.id]) {
        chosen.push(it);
      }
    }
  }
  if (!chosen.length) return;

  const lines = chosen.map((it, idx) =>
    JSON.stringify({
      id: it.id || `preset-${Date.now()}-${idx}`,
      instruction_for_annotator: it.instruction_for_annotator,
      model_input: it.model_input,
      model_output: it.model_output,
      category: it.category,
    })
  );

  const prev = (form.data.uploadedJSONL || "").trim();
  const joined = prev ? prev + "\n" + lines.join("\n") : lines.join("\n");
  update(["data", "uploadedJSONL"], joined);

  setPresetAddedCount(chosen.length);
  // clear selections
  setPresetChecked({});
  // optional: you can also auto-switch mode to "upload" so they see items in the textarea:
  // update(["data", "sft", "mode"], "upload");
};

  // Reuse existing storage fields to avoid churn:
  // - uploadedJSONL: raw QnA JSONL lines (each line = {prompt, answer, context?, category?})
  // - plannedCount: keep this for internal estimates, but we won’t show a separate “global planned count” control
  // - sftGenerateSpec: free-text area for spec (CSV/JSON) to “design & generate” (new but optional)
  // - sftLibrary: object of {key: count}
  const uploadedCount = countJSONLOrLines(form.data.uploadedJSONL);
  const sftGenerateSpec = form.data.sftGenerateSpec || "";
  const sftLibrary = form.data.sftLibrary || {};

  // Derive count from spec (very lightweight: look for numbers on lines like "count=" or CSV column "count")
  const detectSpecCount = React.useMemo(() => {
    if (!sftGenerateSpec.trim()) return 0;
    // try CSV: header includes "count", sum integers from that column
    const lines = sftGenerateSpec.trim().split(/\n+/);
    const header = lines[0].toLowerCase();
    let sum = 0;
    if (/count/.test(header)) {
      const cols = header.split(/,\s*/);
      const idx = cols.findIndex(c => c.trim() === "count");
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,\s*/);
        const v = safeInt(parts[idx], 0);
        sum += Number.isFinite(v) ? v : 0;
      }
      return sum;
    }
    // fallback: find "count=123" style tokens
    const matches = sftGenerateSpec.match(/count\s*=\s*(\d+)/gi) || [];
    for (const m of matches) sum += safeInt(m.split("=").pop(), 0);
    return sum;
  }, [sftGenerateSpec]);

  const libraryTotal = React.useMemo(() => {
    return Object.values(sftLibrary).reduce((a, b) => a + safeInt(b, 0), 0);
  }, [sftLibrary]);

  const setLibraryCount = (key, n) => {
    const next = { ...(form.data.sftLibrary || {}) };
    if (n <= 0) delete next[key]; else next[key] = n;
    update(["data", "sftLibrary"], next);
  };

  return (
    <Section
      title="SFT: Data Setup"
      sub="Choose how your Q&A pairs enter the project. Keep it simple: either upload JSONL, or provide a small generation spec.">
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="Upload Q&A (JSONL)" />
         <Tab label="Preset library" />
        </Tabs>
      </Paper>

      {/* TAB 0: UPLOAD Q&A */}
      {tab === 0 && (
        <Box sx={{ display: "grid", gap: 12 }}>
          {/* ── Upload / paste Q/A (JSONL) — REPLACE YOUR EXISTING CARD WITH THIS ── */}
<QCard
  title="Upload / paste Q/A (JSONL)"
  helper='One JSON object per line. Keys: "id", "instruction_for_annotator" (human-only), "model_input" (sent to model), "model_output" (target; can be empty), "category" (optional).'
>
  <TextField
    fullWidth
    multiline
    minRows={12}
    placeholder={qaJSONLPlaceholder}
    value={form.data.uploadedJSONL}
    onChange={(e) => update(["data", "uploadedJSONL"], e.target.value)}
  />
  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
    Detected items: <b>{uploadedCount}</b>
  </Typography>
</QCard>

{/* ── Schema reminder (JSONL) — REPLACE YOUR EXISTING SCHEMA BOX ───────── */}
<QCard title="Schema reminder (JSONL)">
  <Box
    component="pre"
    sx={{
      m: 0,
      p: 1,
      bgcolor: "grey.50",
      border: "1px dashed #ddd",
      borderRadius: 1,
      fontSize: 12,
      whiteSpace: "pre-wrap",
    }}
  >{`{
  "id": "string",
  "instruction_for_annotator": "string (shown in UI only; NOT sent to model)",
  "model_input": "string (what the model sees; can include question and/or context)",
  "model_output": "string (target answer; may be empty during collection)",
  "category": "string | optional"
}
# Tip: Keep model_input as a single composed string. If you need structure,
# you can standardize your own format inside the string (e.g., "PASSAGE:\\n...\\n\\nQUESTION: ...").`}</Box>
</QCard>

          {/* No planning / global planned count UI here — kept intentionally minimal */}
        </Box>
      )}

      {/* TAB 1: DESIGN & GENERATE */}
      {tab === 1 && (
  <QCard
    title="Pick from presets"
    helper="Tick items you want, then add them into your JSONL above."
  >
    <Box sx={{ display: "grid", gap: 1 }}>
      {PRESET_LIB.map((cat) => {
        const allInCat = cat.items.every((it) => !!presetChecked[it.id]);
        const someInCat = !allInCat && cat.items.some((it) => !!presetChecked[it.id]);
        return (
          <Paper key={cat.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="subtitle2">{cat.name}</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allInCat}
                    indeterminate={someInCat}
                    onChange={(e) => toggleCategoryAll(cat.id, e.target.checked)}
                  />
                }
                label="Select all"
              />
            </Box>

            <Box sx={{ display: "grid", gap: 0.75 }}>
              {cat.items.map((it) => (
                <Paper key={it.id} variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <Checkbox
                      checked={!!presetChecked[it.id]}
                      onChange={(e) => toggleItem(it.id, e.target.checked)}
                      sx={{ mt: 0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Example</Typography>

                      <Typography variant="caption" color="text.secondary">Instruction (UI-only)</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                        {it.instruction_for_annotator}
                      </Box>

                      <Typography variant="caption" color="text.secondary">Model input</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                        {it.model_input}
                      </Box>

                      <Typography variant="caption" color="text.secondary">Model output (target)</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                        {it.model_output || "(empty — to be authored)"}
                      </Box>

                      <Typography variant="caption" color="text.secondary">Category</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, whiteSpace: "pre-wrap", fontSize: 12 }}>
                        {it.category}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        );
      })}

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button variant="contained" onClick={appendSelectedToJSONL}>Add selected to JSONL</Button>
        {!!presetAddedCount && (
          <Alert severity="success" sx={{ m: 0, py: 0.5 }}>
            Added {presetAddedCount} item{presetAddedCount === 1 ? "" : "s"} to the Upload area (Tab 1).
          </Alert>
        )}
      </Box>
    </Box>
  </QCard>
)}
    </Section>
  );
}

  /* ── STEP 3: Workflow & Rating ─────────────────────────────────────────── */
 const StepWorkflow = () => {
  const [previewTab, setPreviewTab] = useState(0);
  const isRM = form.goal.main === "rm";
  const isSFT = form.goal.main === "sft";
  const isSafety = form.goal.main === "safety";

  

  if (isSFT) return (
    <SFTWorkflow
      form={form}
      update={update}
    />
  );


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
      {/* RM */}
{isRM && <RMPairwiseWorkflow form={form} update={update} />}

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

function SFTAnnotatorPreview({ form }) {
  // Pull the sample & instruction from SFT Data Setup
  const sampleQ = form.data?.sft?.sample?.question || "Sample question goes here…";
  const sampleCtx = form.data?.sft?.sample?.context || "";
  const sampleAns = form.data?.sft?.sample?.answer || "";
  const inputType = form.data?.sft?.inputType || "question_only"; // question_only | question_plus_context | instruction_only
  const instr = form.data?.sft?.instruction || "";
  const ui = form.workflow?.sft || {};

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {ui.showInstructionPanel && (instr || form.workflow.sft.nudge) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <b>Instructions for annotator:</b>{" "}
          {instr || form.workflow.sft.nudge}
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>What the annotator sees</Typography>
      <Paper variant="outlined" sx={{ p: 1.25, mb: 1.25 }}>
        {inputType === "instruction_only" && (
          <Typography variant="body2" color="text.secondary">Follow the instruction and author a suitable prompt + answer.</Typography>
        )}
        {inputType !== "instruction_only" && (
          <>
            <Typography variant="overline">Prompt</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{sampleQ}</Typography>
            {inputType === "question_plus_context" && !!sampleCtx && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline">Context</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{sampleCtx}</Typography>
              </>
            )}
          </>
        )}
      </Paper>

      {ui.showSampleGoodAnswer && sampleAns && (
        <Alert severity="success" sx={{ mb: 1 }}>
          <b>Example good answer:</b> {sampleAns}
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Your answer</Typography>
      <TextField
        fullWidth
        multiline
        minRows={6}
        placeholder={ui.allowRichText ? "Rich text enabled (simulated)…" : "Type your best answer…"}
        disabled
        sx={{ mt: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {ui.minWords ? `Min words: ${ui.minWords} ` : ""}{ui.maxWords ? `• Max words: ${ui.maxWords}` : ""}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
        {ui.allowSkip && <Button size="small" disabled variant="outlined">Skip</Button>}
        {ui.allowFlag && <Button size="small" disabled variant="outlined">Flag</Button>}
        <Button size="small" disabled variant="contained">Submit</Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        After submit: {ui.afterSubmit === "auto_advance" ? "Auto-advance to next item" : "Stay on this item"}
      </Typography>
    </Paper>
  );
}

function RMPairwiseWorkflow({ form, update }) {
  const rm = form.workflow.rm;
  const set = (tail, v) => update(["workflow", "rm", ...tail], v);

  // derive a preview prompt
  const previewPrompt =
    (form.data.promptsText?.split("\n")[0] || "").trim() ||
    "Explain transformers simply.";

  const showPreference = rm.preferenceKind !== "off";
  const reasonMode = rm.reasonMode || "off";
  const showDropdown = reasonMode === "dropdown" || reasonMode === "both";
  const showText = reasonMode === "text" || reasonMode === "both";

  const DiscreteChips = ({ labels }) => (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {labels.map((lab, i) => (
        <Chip key={i} label={lab} size="small" variant="outlined" />
      ))}
    </Box>
  );

  return (
    <Section
      title="Reward Modeling — Pairwise"
      sub="Left: what raters see. Right: configure the few knobs you actually need."
    >
      <Grid container spacing={2}>
        {/* LEFT: Rater Task Preview */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {!!(form.workflow.sft.nudge || "").trim() && (
              <Alert severity="info" sx={{ mb: 1 }}>
                {form.workflow.sft.nudge}
              </Alert>
            )}

            <Typography variant="subtitle2">Prompt</Typography>
            <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {previewPrompt}
              </Typography>
            </Paper>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1, height: "100%" }}>
                  <Typography variant="overline">Candidate A</Typography>
                  <Typography variant="body2" color="text.secondary">
                    (sample answer A…)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1, height: "100%" }}>
                  <Typography variant="overline">Candidate B</Typography>
                  <Typography variant="body2" color="text.secondary">
                    (sample answer B…)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Button size="small" disabled variant="outlined">
                Choose A
              </Button>
              <Button size="small" disabled variant="outlined">
                Choose B
              </Button>
              {rm.allowTie && (
                <Button size="small" disabled variant="outlined">
                  Tie
                </Button>
              )}
            </Box>

            {showPreference && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Strength of preference (preview)
                </Typography>

                {rm.preferenceKind === "discrete3" && (
                  <DiscreteChips labels={["Slightly", "Moderately", "Much"]} />
                )}

                {rm.preferenceKind === "discrete5" && (
                  <DiscreteChips
                    labels={[
                      "Slightly",
                      "Somewhat",
                      "Moderately",
                      "Strongly",
                      "Extremely",
                    ]}
                  />
                )}

                {rm.preferenceKind === "slider" && (
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={Math.round(rm.preferenceMax / 2)}
                      min={0}
                      max={Math.max(1, rm.preferenceMax)}
                      disabled
                    />
                    <Typography variant="caption" color="text.secondary">
                      0–{Math.max(1, rm.preferenceMax)} (disabled in preview)
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {(showDropdown || showText) && (
              <Box sx={{ display: "grid", gap: 1 }}>
                {showDropdown && (
                  <FormControl fullWidth disabled>
                    <InputLabel id="rm-why-preview">Why?</InputLabel>
                    <Select labelId="rm-why-preview" label="Why?">
                      {(rm.reasonOptions || []).map((opt, i) => (
                        <MenuItem key={i} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {showText && (
                  <TextField
                    fullWidth
                    label={rm.requireJustification ? "Why? (required)" : "Why? (optional)"}
                    placeholder="One sentence reason…"
                    disabled
                  />
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: Configuration */}
        <Grid item xs={12} md={5}>
          <QCard title="Comparison">
            <FormControlLabel
              control={
                <Switch
                  checked={rm.allowTie}
                  onChange={(e) => set(["allowTie"], e.target.checked)}
                />
              }
              label="Allow tie"
            />
            <Hint>Rater can pick A, B, or Tie. Keep this on unless you want forced choice.</Hint>
          </QCard>

          <QCard title="Strength of preference">
            <RadioGroup
              value={rm.preferenceKind}
              onChange={(e) => set(["preferenceKind"], e.target.value)}
            >
              <FormControlLabel value="off" control={<Radio />} label="Off" />
              <FormControlLabel
                value="discrete3"
                control={<Radio />}
                label="3 levels (slightly / moderately / much)"
              />
              <FormControlLabel
                value="discrete5"
                control={<Radio />}
                label="5 levels"
              />
              <FormControlLabel
                value="slider"
                control={<Radio />}
                label="Slider 0–N"
              />
            </RadioGroup>
            {rm.preferenceKind === "slider" && (
              <TextField
                sx={{ mt: 1 }}
                type="number"
                label="Slider max (N)"
                value={rm.preferenceMax}
                onChange={(e) =>
                  set(
                    ["preferenceMax"],
                    Math.max(1, parseInt(e.target.value || "10", 10))
                  )
                }
                fullWidth
              />
            )}
          </QCard>

          <QCard title="Why (justification)">
            <FormControl fullWidth>
              <InputLabel id="rm-reason-mode">Mode</InputLabel>
              <Select
                labelId="rm-reason-mode"
                label="Mode"
                value={rm.reasonMode}
                onChange={(e) => set(["reasonMode"], e.target.value)}
              >
                <MenuItem value="off">Off</MenuItem>
                <MenuItem value="dropdown">Dropdown</MenuItem>
                <MenuItem value="text">Free text</MenuItem>
                <MenuItem value="both">Dropdown + Free text</MenuItem>
              </Select>
            </FormControl>

            {(rm.reasonMode === "dropdown" || rm.reasonMode === "both") && (
              <TextField
                sx={{ mt: 1 }}
                fullWidth
                label="Dropdown options (comma-separated)"
                value={(rm.reasonOptions || []).join(", ")}
                onChange={(e) =>
                  set(
                    ["reasonOptions"],
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            )}

            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={rm.requireJustification}
                  onChange={(e) =>
                    set(["requireJustification"], e.target.checked)
                  }
                />
              }
              label="Require a reason"
            />
            <Hint>Great for gold/audits; keep off if you need speed.</Hint>
          </QCard>

          <QCard title="Short nudge (optional)">
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Prefer helpful, honest, harmless, concise answers."
              value={form.workflow.sft.nudge}
              onChange={(e) => update(["workflow", "sft", "nudge"], e.target.value)}
            />
          </QCard>
        </Grid>
      </Grid>
    </Section>
  );
}

function SFTWorkflow({ form, update }) {
  const ui = form.workflow.sft;

  const set = (pathTail, val) => update(["workflow", "sft", ...pathTail], val);

  return (
    <Section
      title="SFT — Task UI"
      sub="This is the annotator-facing screen plus a few simple guardrails."
    >
      <Grid container spacing={2}>
        {/* LEFT: Live preview */}
        <Grid item xs={12} md={7}>
          <SFTAnnotatorPreview form={form} />
        </Grid>

        {/* RIGHT: Minimal options */}
        <Grid item xs={12} md={5}>
          <QCard title="Display options">
            <FormControlLabel
              control={<Switch checked={ui.showInstructionPanel} onChange={(e) => set(["showInstructionPanel"], e.target.checked)} />}
              label="Show Instruction panel"
            />
            <FormControlLabel
              control={<Switch checked={ui.showSampleGoodAnswer} onChange={(e) => set(["showSampleGoodAnswer"], e.target.checked)} />}
              label="Show example good answer"
            />
            <FormControlLabel
              control={<Switch checked={ui.allowRichText} onChange={(e) => set(["allowRichText"], e.target.checked)} />}
              label="Allow rich-text answer"
            />
          </QCard>

          <QCard title="Answer constraints">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  type="number" fullWidth label="Min words"
                  value={ui.minWords}
                  onChange={(e) => set(["minWords"], Math.max(0, parseInt(e.target.value || "0", 10)))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number" fullWidth label="Max words"
                  value={ui.maxWords}
                  onChange={(e) => set(["maxWords"], Math.max(0, parseInt(e.target.value || "0", 10)))}
                />
              </Grid>
            </Grid>
            <Hint>Leave 0 for “no limit”.</Hint>
          </QCard>

          <QCard title="Task controls">
            <FormControlLabel
              control={<Switch checked={ui.allowSkip} onChange={(e) => set(["allowSkip"], e.target.checked)} />}
              label="Allow Skip"
            />
            <FormControlLabel
              control={<Switch checked={ui.allowFlag} onChange={(e) => set(["allowFlag"], e.target.checked)} />}
              label="Allow Flag"
            />
            <FormLabel sx={{ mt: 1 }}>After submit</FormLabel>
            <RadioGroup
              value={ui.afterSubmit}
              onChange={(e) => set(["afterSubmit"], e.target.value)}
            >
              <FormControlLabel value="auto_advance" control={<Radio />} label="Auto-advance to next item" />
              <FormControlLabel value="stay_here" control={<Radio />} label="Stay on this item" />
            </RadioGroup>
          </QCard>

          <QCard title="Short nudge (optional)">
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Prefer helpful, honest, harmless, concise answers."
              value={ui.nudge}
              onChange={(e) => set(["nudge"], e.target.value)}
            />
          </QCard>
        </Grid>
      </Grid>
    </Section>
  );
}

  /* ── STEP 4: People & Pay ─────────────────────────────────────────────── */
  const LegacyPeoplePay = () => (
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

  const StepPeoplePay = () => (
   <SFTPeoplePay
     form={form}
     update={update}
     stimuliCount={stimuliCount}
     dollars={dollars}
   />
 );

  /* ── STEP 5: Gamification (NEW) ───────────────────────────────────────── */
  const StepGamification = () => (
  <Section title="Gamification" sub="Simple, optional rewards to encourage consistency and quality.">
    {/* Enable */}
    <QCard title="Enable">
      <FormControlLabel
        control={
          <Switch
            checked={form.gamification.enabled}
            onChange={(e) => update(["gamification", "enabled"], e.target.checked)}
          />
        }
        label="Enable gamification for this project"
      />
      <Box sx={{ mt: 1, maxWidth: 300 }}>
        <TextField
          fullWidth
          type="number"
          label="Bonus budget % (estimate)"
          value={form.gamification.bonusBudgetPct}
          onChange={(e) => update(["gamification", "bonusBudgetPct"], Math.max(0, parseFloat(e.target.value || "0")))}
          disabled={!form.gamification.enabled}
        />
      </Box>
      <Hint>Used only for cost estimates; actual payouts are defined below.</Hint>
    </QCard>

    {/* Streak bonus */}
    <QCard title="Streak bonus" helper="Reward steady daily work.">
      <FormControlLabel
        control={
          <Switch
            checked={form.gamification.streak.enabled}
            onChange={(e) => update(["gamification", "streak", "enabled"], e.target.checked)}
            disabled={!form.gamification.enabled}
          />
        }
        label="Enable daily consistency bonus"
      />
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr", maxWidth: 600, mt: 1 }}>
        <TextField
          type="number"
          label="Daily goal (items)"
          value={form.gamification.streak.dailyGoal}
          onChange={(e) => update(["gamification", "streak", "dailyGoal"], Math.max(0, parseInt(e.target.value || "0", 10)))}
          disabled={!form.gamification.enabled || !form.gamification.streak.enabled}
        />
        <TextField
          type="number"
          label="Bonus per item (¢)"
          value={form.gamification.streak.bonusCents}
          onChange={(e) => update(["gamification", "streak", "bonusCents"], Math.max(0, parseInt(e.target.value || "0", 10)))}
          disabled={!form.gamification.enabled || !form.gamification.streak.enabled}
        />
      </Box>
      <Hint>Bonus applies only when the Quality requirement below is met.</Hint>
    </QCard>

    {/* Quality requirement */}
    <QCard title="Quality requirement" helper="Only pay bonuses when QA is good.">
      <FormControlLabel
        control={
          <Switch
            checked={form.gamification.qualityGate.enabled}
            onChange={(e) => update(["gamification", "qualityGate", "enabled"], e.target.checked)}
            disabled={!form.gamification.enabled}
          />
        }
        label="Require passing QA to earn bonuses"
      />
      <Box sx={{ mt: 1, maxWidth: 300 }}>
        <TextField
          fullWidth
          type="number"
          label="Minimum accuracy %"
          value={form.gamification.qualityGate.minAccuracyPct}
          onChange={(e) => update(["gamification", "qualityGate", "minAccuracyPct"], Math.min(100, Math.max(0, parseInt(e.target.value || "0", 10))))}
          disabled={!form.gamification.enabled || !form.gamification.qualityGate.enabled}
        />
      </Box>
      <Hint>Accuracy = your normal QA metric (gold/check reviews). Keep it one simple number.</Hint>
    </QCard>

    {/* Milestones (optional) */}
    <QCard title="Milestones (optional)" helper="One-time bonuses when someone hits key totals.">
      <FormControlLabel
        control={
          <Switch
            checked={form.gamification.milestones.enabled}
            onChange={(e) => update(["gamification", "milestones", "enabled"], e.target.checked)}
            disabled={!form.gamification.enabled}
          />
        }
        label="Enable milestone bonuses"
      />
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "2fr 1fr", maxWidth: 700, mt: 1 }}>
        <TextField
          label="Thresholds (comma)"
          placeholder="50,200,500"
          value={(form.gamification.milestones.thresholds || []).join(",")}
          onChange={(e) =>
            update(
              ["gamification", "milestones", "thresholds"],
              e.target.value
                .split(",")
                .map((x) => parseInt(x.trim(), 10))
                .filter((n) => Number.isFinite(n) && n > 0)
            )
          }
          disabled={!form.gamification.enabled || !form.gamification.milestones.enabled}
        />
        <TextField
          type="number"
          label="Bonus per milestone (¢)"
          value={form.gamification.milestones.bonusCents}
          onChange={(e) => update(["gamification", "milestones", "bonusCents"], Math.max(0, parseInt(e.target.value || "0", 10)))}
          disabled={!form.gamification.enabled || !form.gamification.milestones.enabled}
        />
      </Box>
      <Hint>Everyone gets the same milestone bonus; keep it simple for the demo.</Hint>
    </QCard>

    {/* Leaderboard (optional) */}
    <QCard title="Leaderboard (optional)">
      <FormControlLabel
        control={
          <Switch
            checked={form.gamification.leaderboard.enabled}
            onChange={(e) => update(["gamification", "leaderboard", "enabled"], e.target.checked)}
            disabled={!form.gamification.enabled}
          />
        }
        label="Show anonymized leaderboard"
      />
    </QCard>
  </Section>
);

  /* ── STEP 6: Policies ─────────────────────────────────────────────────── */
  /* ── STEP 6: Policies (simple, vertical) ───────────────────────────────── */
const StepPolicies = () => {
  // Map thresholds ⇄ a simple “Sensitivity” preset (no new state keys)
  const thresholds = form.policies.contentFilters.thresholds || { toxicity: 0.8, violence: 0.7 };
  const enabled = !!form.policies.contentFilters.enabled;

  const inferSensitivity = () => {
    const { toxicity, violence } = thresholds;
    // lower threshold = stricter
    if (toxicity <= 0.6 || violence <= 0.6) return "strict";
    if (toxicity >= 0.85 && violence >= 0.8) return "offlike"; // effectively off if disabled
    return "balanced";
  };

  const setSensitivity = (preset) => {
    if (preset === "strict") {
      update(["policies", "contentFilters", "thresholds", "toxicity"], 0.6);
      update(["policies", "contentFilters", "thresholds", "violence"], 0.6);
    } else if (preset === "balanced") {
      update(["policies", "contentFilters", "thresholds", "toxicity"], 0.8);
      update(["policies", "contentFilters", "thresholds", "violence"], 0.7);
    }
  };

  const sensitivity = inferSensitivity();

  return (
    <Section
      title="Policies"
      sub="Three simple jobs: set rules for annotators, protect personal info, and (optionally) pre-screen unsafe stuff."
    >
      {/* 1) Task rules */}
      <QCard
        title="1) Task rules (for annotators)"
        helper="Show a short rules panel in every task and optionally link to your full policy."
      >
        <FormControlLabel
          control={
            <Switch
              checked={form.policies.showGuidelinesInTask}
              onChange={(e) => update(["policies", "showGuidelinesInTask"], e.target.checked)}
            />
          }
          label="Show a short rules panel inside each task"
        />
        <TextField
          sx={{ mt: 1 }}
          fullWidth
          label="Link to full rules (optional)"
          placeholder="https://…"
          value={form.policies.policyDocUrl}
          onChange={(e) => update(["policies", "policyDocUrl"], e.target.value)}
        />
      </QCard>

      {/* 2) Protect info */}
      <QCard
        title="2) Protect people’s info"
        helper="Mask obvious personal details so they aren’t exposed to reviewers."
      >
        <FormControlLabel
          control={
            <Switch
              checked={form.policies.piiRedaction}
              onChange={(e) => update(["policies", "piiRedaction"], e.target.checked)}
            />
          }
          label="Mask emails, phone numbers, and addresses automatically"
        />
      </QCard>

      {/* 3) Handle unsafe requests */}
      <QCard
        title="3) Handle unsafe requests"
        helper="If a prompt asks for something disallowed, suggest a safe refusal instead of trying to answer."
      >
        <FormControlLabel
          control={
            <Switch
              checked={form.policies.autoRefusalHints}
              onChange={(e) => update(["policies", "autoRefusalHints"], e.target.checked)}
            />
          }
          label="Suggest a safe refusal when needed"
        />
      </QCard>

      {/* Optional pre-screening */}
      <QCard
        title="(Optional) Pre-screen before it reaches annotators"
        helper="Block obviously harmful content up-front. Keep this off unless you need it."
      >
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => update(["policies", "contentFilters", "enabled"], e.target.checked)}
            />
          }
          label="Pre-screen prompts for harmful content"
        />

        <Box sx={{ display: enabled ? "block" : "none", mt: 1 }}>
          <FormLabel>Sensitivity</FormLabel>
          <Select
            size="small"
            value={sensitivity === "offlike" ? "balanced" : sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
            sx={{ ml: 1, minWidth: 160 }}
          >
            <MenuItem value="balanced">Balanced (default)</MenuItem>
            <MenuItem value="strict">Strict</MenuItem>
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            Current thresholds — Toxicity: <b>{thresholds.toxicity}</b>, Violence: <b>{thresholds.violence}</b>
          </Typography>
        </Box>
      </QCard>
    </Section>
  );
};

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

const gamificationSummary = useMemo(() => {
  const g = form.gamification || {};
  if (!g.enabled) return "Off";
  const parts = [`bonus ${g.bonusBudgetPct}%`];
  if (g.streak?.enabled) parts.push(`Streak +${g.streak.bonusCents}¢ @ ${g.streak.dailyGoal}/day`);
  if (g.qualityGate?.enabled) parts.push(`Quality ≥ ${g.qualityGate.minAccuracyPct}%`);
  if (g.milestones?.enabled && g.milestones.thresholds?.length)
    parts.push(`Milestones ${g.milestones.thresholds.join("/")}, +${g.milestones.bonusCents}¢ ea`);
  if (g.leaderboard?.enabled) parts.push("Leaderboard");
  return "On — " + parts.join(" • ");
}, [form.gamification]);




  const StepReview = () => (
    <Box>
      <Section title="Review" sub="Confirm configuration. Save as draft or launch.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Summary label="Goal" value={`${form.goal.main} • ${form.goal.variant}`} />
            <Summary label="Items" value={`${stimuliCount}`} />
            <Summary label="Inputs"    value={
     form.goal.main === "sft"
       ? (form.data.sft.mode === "upload" ? "Uploaded Q/A (JSONL)" : "Annotator-authored (design)")
       : (form.data.productionMode === "model" ? `Model(s): ${form.data.models.join(", ")}` : form.data.productionMode)
   } />
            <Summary label="Work per item" value={`${perItemUnits}`} />
            <Summary label="Redundancy" value={`${redundancy}×`} />
            <Summary label="Budget (est.)" value={`${dollars(estimatedTotalCents)} ${overBudget ? " • OVER CAP" : nearBudget ? " • NEAR CAP" : ""}`} />
            <Summary label="Gamification" value={gamificationSummary} />
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

  if (activeStep === 1) {
    if (form.goal.main === "sft") {
      const hasUpload = !!form.data.uploadedJSONL?.trim();
      const hasSpec   = !!form.data.sftGenerateSpec?.trim();
      const hasLib    = !!form.data.sftLibrary && Object.keys(form.data.sftLibrary).length > 0;
      return hasUpload || hasSpec || hasLib;
    }

    if (form.goal.main === "rm") {
      if (form.data.productionMode === "model") {
        const hasModel   = (form.data.models || []).length > 0;
        const hasPrompts = !!form.data.promptsText?.trim();
        return hasModel && hasPrompts;
      }
      if (form.data.productionMode === "uploaded") {
        return !!form.data.uploadedJSONL?.trim();
      }
      return false;
    }

    // safety / others
    if (form.data.productionMode === "model")    return (form.data.models || []).length > 0;
    if (form.data.productionMode === "uploaded") return !!form.data.uploadedJSONL?.trim();
    return true;
  }

  if (activeStep === 2) {
    if (form.goal.main === "rm" && form.goal.variant === "dialogue") {
      return safeInt(form.workflow.rm.dialogueTurns, 0) >= 2;
    }
    return true;
  }

  if (activeStep === 3) {
    if (safeInt(form.people.payCents, 0) <= 0) return false;
    if (safeInt(form.people.agreementN, 0) <= 0) return false;
    return true;
  }

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