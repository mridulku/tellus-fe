// src/components/Main/0.tellus/ProjectWizard.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  Grid,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Checkbox,
  Switch,
  Chip,
  Slider,
  InputLabel,
  FormControl,
  OutlinedInput,
  Tooltip,
  Paper,
} from "@mui/material";

/** Dummy lists (replace with real data from API later) */
const DUMMY_MODELS = [
  { id: "mdl-1", name: "OpenAI - gpt-4o-mini", caps: ["chat", "completion"] },
  { id: "mdl-2", name: "Meta - Llama 3 8B", caps: ["chat", "completion"] },
  { id: "mdl-3", name: "Anthropic - Claude 3 Haiku", caps: ["chat"] },
];
const DUMMY_POOLS = [
  { id: "pool-pro", name: "Vetted Pro Pool" },
  { id: "pool-crowd", name: "Crowd Pool" },
  { id: "pool-internal", name: "Internal Raters" },
];
const DEFAULT_RUBRICS = ["helpfulness", "harmlessness", "honesty", "formatting"];

export default function ProjectWizard() {
  const steps = ["Basics", "Type", "Prompts", "Annotators", "Policies", "Review"];
  const [activeStep, setActiveStep] = useState(0);

  /** --- FORM STATE (single object so Review can JSON.stringify) --- */
  const [form, setForm] = useState({
    basics: {
      name: "",
      description: "",
      owner: "",
      dueDate: "",
      tags: "",
    },
    type: {
      main: "sft", // "sft" | "rm" | "safety"
      sftSubtype: "prompt_completion", // "prompt_completion" | "topic_authoring"
      rmSchema: "pairwise", // "pairwise" | "scalar" | "dialogue"
      rmAdversarial: false, // adversarial mode is a sub-config of RM
      safetySubtype: "policy_labeling", // future-friendly
    },
    data: {
      // generic fields
      notes: "",
      /** SFT Branch */
      sft: {
        inputSource: "upload_prompts", // "upload_prompts" | "upload_topics" | "manual" | "generate"
        outputSchema: "single_turn", // "single_turn" | "multi_turn"
        promptsText: "", // textarea: prompts or topics, JSONL or newline list
        authoringGuide: "",
      },
      /** RM Branch */
      rm: {
        promptSource: "upload_prompts", // "upload_prompts" | "manual" | "generate"
        promptsText: "",
        candidateModels: [], // array of model IDs
        numCandidates: 2,
        sampling: { temperature: 0.7, top_p: 0.95, max_tokens: 512 },
        rubrics: DEFAULT_RUBRICS,
        requireJustification: true,
        scaleMin: 1,
        scaleMax: 7,
        dialogueRatingMode: "overall", // "overall" | "per_turn"
        nudgeText:
          "Prefer helpful, honest, and harmless responses. Be concise and follow instructions.",
        /** adversarial settings (when rmAdversarial = true) */
        adversarial: {
          enabled: false,
          focusAreas: ["safety", "pii"],
          policyText:
            "Try to elicit policy-breaking or unsafe outputs; flag any violations.",
          attackHints:
            "Probe for jailbreaks; attempt to bypass refusals with subtle rewording.",
        },
      },
      /** Safety/Policy Branch */
      safety: {
        categories: ["toxicity", "harassment", "hate", "pii"],
        severityScale: true,
        inputText: "",
      },
    },
    annotators: {
      pools: ["pool-crowd"],
      labelsPerItem: 1,
      consensusN: 1,
      goldPercent: 5,
      auditPercent: 10,
      dailyQuotaPerAnnotator: 50,
      slaHours: 72,
    },
    policies: {
      showTOS: true,
      contentFilters: { enabled: true, thresholds: { toxicity: 0.8, violence: 0.7 } },
      piiRedaction: true,
      autoRefusalHints: true,
      exposeGuidelinesInTask: true,
      policyDocUrl: "",
    },
  });

  /** helpers */
  const update = (path, value) => {
    // path example: ["basics","name"]
    setForm((prev) => {
      const copy = structuredClone(prev);
      let node = copy;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return copy;
    });
  };

  const isRM = form.type.main === "rm";
  const isSFT = form.type.main === "sft";
  const isSafety = form.type.main === "safety";

  const promptsStepLabel = useMemo(() => {
    if (isSFT) return "Prompts & Authoring";
    if (isRM) return "Prompts & Candidates";
    if (isSafety) return "Inputs & Labels";
    return "Prompts";
  }, [isSFT, isRM, isSafety]);

  /** --- VALIDATION (minimal) --- */
  const canNext = useMemo(() => {
    if (activeStep === 0) {
      return form.basics.name.trim().length > 0;
    }
    if (activeStep === 1) {
      if (isSFT) return ["prompt_completion", "topic_authoring"].includes(form.type.sftSubtype);
      if (isRM) return ["pairwise", "scalar", "dialogue"].includes(form.type.rmSchema);
      if (isSafety) return true;
    }
    if (activeStep === 2) {
      if (isSFT) return form.data.sft.inputSource.length > 0;
      if (isRM) return form.data.rm.promptSource.length > 0 && form.data.rm.numCandidates >= 2;
      if (isSafety) return form.data.safety.categories.length > 0;
    }
    return true;
  }, [activeStep, form, isRM, isSFT, isSafety]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  /** --- FINAL PAYLOAD BUILDER --- */
  const payload = useMemo(() => {
    return {
      basics: form.basics,
      type: form.type,
      data: form.data,
      annotators: form.annotators,
      policies: form.policies,
      // minimal normalization hints (so backend knows how to construct jobs)
      normalized: {
        branch:
          form.type.main === "sft"
            ? `sft:${form.type.sftSubtype}`
            : form.type.main === "rm"
            ? `rm:${form.type.rmSchema}${form.type.rmAdversarial ? ":adversarial" : ""}`
            : "safety:policy_labeling",
        expectsPairwise: isRM && form.type.rmSchema === "pairwise",
        expectsScalar: isRM && form.type.rmSchema === "scalar",
        expectsDialogue: isRM && form.type.rmSchema === "dialogue",
      },
      versionMeta: {
        createdAt: new Date().toISOString(),
        wizardVersion: "v1",
      },
    };
  }, [form, isRM]);

  /** --- RENDER HELPERS (field groups) --- */
  const Section = ({ title, sub, children, dense }) => (
    <Paper
      elevation={1}
      sx={{ p: dense ? 2 : 3, mb: 3, borderRadius: 2, border: "1px solid #eee" }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {sub && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {sub}
        </Typography>
      )}
      {children}
    </Paper>
  );

  /** --- STEP CONTENTS --- */
  const BasicsStep = () => (
    <Box>
      <Section
        title="Project Basics"
        sub="Give your project a clear identity and scope; you can refine details later."
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Project Name *"
              value={form.basics.name}
              onChange={(e) => update(["basics", "name"], e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Owner"
              placeholder="Owner name or email"
              value={form.basics.owner}
              onChange={(e) => update(["basics", "owner"], e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={form.basics.description}
              onChange={(e) => update(["basics", "description"], e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={form.basics.dueDate}
              onChange={(e) => update(["basics", "dueDate"], e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tags"
              placeholder="comma,separated,tags"
              value={form.basics.tags}
              onChange={(e) => update(["basics", "tags"], e.target.value)}
            />
          </Grid>
        </Grid>
      </Section>
    </Box>
  );

  const TypeStep = () => (
    <Box>
      <Section
        title="Select Type & Mode"
        sub="Reward modeling includes adversarial/red-team as a configuration, not a separate project."
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormLabel>Project Type</FormLabel>
            <RadioGroup
              value={form.type.main}
              onChange={(e) => update(["type", "main"], e.target.value)}
            >
              <FormControlLabel value="sft" control={<Radio />} label="SFT (Supervised Fine-Tuning)" />
              <FormControlLabel value="rm" control={<Radio />} label="Reward Model (Preferences/Ratings)" />
              <FormControlLabel value="safety" control={<Radio />} label="Safety / Policy Labeling" />
            </RadioGroup>
          </Grid>

          {isSFT && (
            <Grid item xs={12} md={8}>
              <FormLabel>SFT Subtype</FormLabel>
              <RadioGroup
                row
                value={form.type.sftSubtype}
                onChange={(e) => update(["type", "sftSubtype"], e.target.value)}
              >
                <FormControlLabel
                  value="prompt_completion"
                  control={<Radio />}
                  label={
                    <Box>
                      <b>Prompt → Completion</b>
                      <Typography variant="body2" color="text.secondary">
                        Annotators write high-quality answers for provided prompts.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="topic_authoring"
                  control={<Radio />}
                  label={
                    <Box>
                      <b>Topic → Authoring</b>
                      <Typography variant="body2" color="text.secondary">
                        Annotators author prompts (and optionally answers) from topics/guidelines.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Grid>
          )}

          {isRM && (
            <Grid item xs={12} md={8}>
              <FormLabel>Reward Model Schema</FormLabel>
              <RadioGroup
                row
                value={form.type.rmSchema}
                onChange={(e) => update(["type", "rmSchema"], e.target.value)}
              >
                <FormControlLabel
                  value="pairwise"
                  control={<Radio />}
                  label={
                    <Box>
                      <b>Pairwise Preference (A vs B)</b>
                      <Typography variant="body2" color="text.secondary">
                        Annotators choose the better response overall or per rubric.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="scalar"
                  control={<Radio />}
                  label={
                    <Box>
                      <b>Scalar Ratings (Likert)</b>
                      <Typography variant="body2" color="text.secondary">
                        Annotators rate a single response across rubrics (e.g., 1–7).
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="dialogue"
                  control={<Radio />}
                  label={
                    <Box>
                      <b>Multi-turn Dialogue Rating</b>
                      <Typography variant="body2" color="text.secondary">
                        Rate per-turn or overall across rubrics.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.type.rmAdversarial}
                      onChange={(e) => {
                        update(["type", "rmAdversarial"], e.target.checked);
                        update(["data", "rm", "adversarial", "enabled"], e.target.checked);
                      }}
                    />
                  }
                  label={
                    <Box>
                      <b>Enable Adversarial / Red-Team Mode</b>
                      <Typography variant="body2" color="text.secondary">
                        Adds attack hints, focus areas, and policy context to nudge adversarial probing.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          )}

          {isSafety && (
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="text.secondary">
                Policy/Safety labeling: annotators tag content for violations (toxicity, harassment, PII, etc.),
                optionally with severity.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Section>
    </Box>
  );

  const PromptsStep = () => (
    <Box>
      <Section title={promptsStepLabel} sub="Configure inputs for annotators; this varies by branch.">
        {isSFT && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormLabel>Input Source</FormLabel>
              <RadioGroup
                value={form.data.sft.inputSource}
                onChange={(e) => update(["data", "sft", "inputSource"], e.target.value)}
              >
                <FormControlLabel value="upload_prompts" control={<Radio />} label="Upload prompts" />
                <FormControlLabel value="upload_topics" control={<Radio />} label="Upload topics" />
                <FormControlLabel value="manual" control={<Radio />} label="Manual authoring in UI" />
                <FormControlLabel value="generate" control={<Radio />} label="Generate from template" />
              </RadioGroup>

              <Box sx={{ mt: 2 }}>
                <FormLabel>Output Schema</FormLabel>
                <RadioGroup
                  row
                  value={form.data.sft.outputSchema}
                  onChange={(e) => update(["data", "sft", "outputSchema"], e.target.value)}
                >
                  <FormControlLabel value="single_turn" control={<Radio />} label="Single-turn" />
                  <FormControlLabel value="multi_turn" control={<Radio />} label="Multi-turn" />
                </RadioGroup>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                multiline
                minRows={8}
                label={
                  form.data.sft.inputSource === "upload_topics"
                    ? "Topics / Guidelines (paste or JSONL)"
                    : "Prompts (paste or JSONL)"
                }
                placeholder={
                  form.data.sft.inputSource === "upload_topics"
                    ? "topic: medical triage\nnotes: follow official guidelines"
                    : '{"id":"1","prompt":"Explain the Doppler effect."}\n{"id":"2","prompt":"Write a refusal for illegal request."}'
                }
                value={form.data.sft.promptsText}
                onChange={(e) => update(["data", "sft", "promptsText"], e.target.value)}
              />
              <TextField
                sx={{ mt: 2 }}
                fullWidth
                multiline
                minRows={4}
                label="Authoring Guide (shown to annotators)"
                placeholder="Tone, style, required sections, examples, etc."
                value={form.data.sft.authoringGuide}
                onChange={(e) => update(["data", "sft", "authoringGuide"], e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        {isRM && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormLabel>Prompt Source</FormLabel>
              <RadioGroup
                value={form.data.rm.promptSource}
                onChange={(e) => update(["data", "rm", "promptSource"], e.target.value)}
              >
                <FormControlLabel value="upload_prompts" control={<Radio />} label="Upload prompts" />
                <FormControlLabel value="manual" control={<Radio />} label="Manual authoring in UI" />
                <FormControlLabel value="generate" control={<Radio />} label="Generate from template" />
              </RadioGroup>

              <Divider sx={{ my: 2 }} />

              <FormLabel>Candidate Generation</FormLabel>

              <FormControl sx={{ mt: 1, width: "100%" }}>
                <InputLabel id="models-label">Models</InputLabel>
                <Select
                  multiple
                  labelId="models-label"
                  value={form.data.rm.candidateModels}
                  onChange={(e) => update(["data", "rm", "candidateModels"], e.target.value)}
                  input={<OutlinedInput label="Models" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const m = DUMMY_MODELS.find((x) => x.id === id);
                        return <Chip key={id} label={m ? m.name : id} />;
                      })}
                    </Box>
                  )}
                >
                  {DUMMY_MODELS.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      <Checkbox checked={form.data.rm.candidateModels.indexOf(m.id) > -1} />
                      <Typography sx={{ ml: 1 }}>{m.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Num Candidates per Prompt: {form.data.rm.numCandidates}</Typography>
                <Slider
                  min={2}
                  max={4}
                  step={1}
                  value={form.data.rm.numCandidates}
                  onChange={(_, v) => update(["data", "rm", "numCandidates"], v)}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Sampling</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ step: 0.05, min: 0, max: 2 }}
                      label="Temperature"
                      value={form.data.rm.sampling.temperature}
                      onChange={(e) =>
                        update(["data", "rm", "sampling", "temperature"], parseFloat(e.target.value || "0"))
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      label="Top-p"
                      value={form.data.rm.sampling.top_p}
                      onChange={(e) =>
                        update(["data", "rm", "sampling", "top_p"], parseFloat(e.target.value || "0"))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max tokens"
                      value={form.data.rm.sampling.max_tokens}
                      onChange={(e) =>
                        update(["data", "rm", "sampling", "max_tokens"], parseInt(e.target.value || "0", 10))
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                multiline
                minRows={8}
                label="Prompts (paste or JSONL)"
                placeholder={'{"id":"1","prompt":"Explain transformers simply."}\n{"id":"2","prompt":"Refuse unsafe request politely."}'}
                value={form.data.rm.promptsText}
                onChange={(e) => update(["data", "rm", "promptsText"], e.target.value)}
              />

              <Box sx={{ mt: 2 }}>
                <FormLabel>Rubrics</FormLabel>
                <Select
                  multiple
                  fullWidth
                  value={form.data.rm.rubrics}
                  onChange={(e) => update(["data", "rm", "rubrics"], e.target.value)}
                  input={<OutlinedInput />}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {DEFAULT_RUBRICS.map((r) => (
                    <MenuItem key={r} value={r}>
                      <Checkbox checked={form.data.rm.rubrics.includes(r)} />
                      <Typography sx={{ ml: 1 }}>{r}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {form.type.rmSchema === "pairwise" && (
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={
                    <Checkbox
                      checked={form.data.rm.requireJustification}
                      onChange={(e) => update(["data", "rm", "requireJustification"], e.target.checked)}
                    />
                  }
                  label="Require justification notes when choosing A vs B"
                />
              )}

              {form.type.rmSchema === "scalar" && (
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Scale Min"
                      value={form.data.rm.scaleMin}
                      onChange={(e) => update(["data", "rm", "scaleMin"], parseInt(e.target.value || "1", 10))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Scale Max"
                      value={form.data.rm.scaleMax}
                      onChange={(e) => update(["data", "rm", "scaleMax"], parseInt(e.target.value || "7", 10))}
                    />
                  </Grid>
                </Grid>
              )}

              {form.type.rmSchema === "dialogue" && (
                <Box sx={{ mt: 1 }}>
                  <FormLabel>Dialogue Rating Mode</FormLabel>
                  <RadioGroup
                    row
                    value={form.data.rm.dialogueRatingMode}
                    onChange={(e) => update(["data", "rm", "dialogueRatingMode"], e.target.value)}
                  >
                    <FormControlLabel value="overall" control={<Radio />} label="Overall" />
                    <FormControlLabel value="per_turn" control={<Radio />} label="Per-turn" />
                  </RadioGroup>
                </Box>
              )}

              <TextField
                sx={{ mt: 2 }}
                fullWidth
                multiline
                minRows={3}
                label="Annotator Nudge (short guidance shown in task)"
                value={form.data.rm.nudgeText}
                onChange={(e) => update(["data", "rm", "nudgeText"], e.target.value)}
              />

              {form.type.rmAdversarial && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Adversarial / Red-Team Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="Focus Areas (comma separated)"
                    value={form.data.rm.adversarial.focusAreas.join(",")}
                    onChange={(e) =>
                      update(
                        ["data", "rm", "adversarial", "focusAreas"],
                        e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                  <TextField
                    sx={{ mt: 1 }}
                    fullWidth
                    multiline
                    minRows={3}
                    label="Policy Text (shown to annotators)"
                    value={form.data.rm.adversarial.policyText}
                    onChange={(e) => update(["data", "rm", "adversarial", "policyText"], e.target.value)}
                  />
                  <TextField
                    sx={{ mt: 1 }}
                    fullWidth
                    multiline
                    minRows={3}
                    label="Attack Hints"
                    value={form.data.rm.adversarial.attackHints}
                    onChange={(e) => update(["data", "rm", "adversarial", "attackHints"], e.target.value)}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {isSafety && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormLabel>Categories</FormLabel>
              <Select
                multiple
                fullWidth
                value={form.data.safety.categories}
                onChange={(e) => update(["data", "safety", "categories"], e.target.value)}
                input={<OutlinedInput />}
                renderValue={(selected) => selected.join(", ")}
              >
                {["toxicity", "harassment", "hate", "self_harm", "pii", "dangerous"].map((c) => (
                  <MenuItem key={c} value={c}>
                    <Checkbox checked={form.data.safety.categories.includes(c)} />
                    <Typography sx={{ ml: 1 }}>{c}</Typography>
                  </MenuItem>
                ))}
              </Select>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Switch
                    checked={form.data.safety.severityScale}
                    onChange={(e) => update(["data", "safety", "severityScale"], e.target.checked)}
                  />
                }
                label="Enable severity scale"
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                multiline
                minRows={8}
                label="Sample Inputs (paste to preview parsing later)"
                value={form.data.safety.inputText}
                onChange={(e) => update(["data", "safety", "inputText"], e.target.value)}
              />
            </Grid>
          </Grid>
        )}
      </Section>

      <Section title="Notes (optional)" dense>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="Anything reviewers should know about data generation or scope."
          value={form.data.notes}
          onChange={(e) => update(["data", "notes"], e.target.value)}
        />
      </Section>
    </Box>
  );

  const AnnotatorsStep = () => (
    <Box>
      <Section title="Annotator Assignment & Quotas" sub="Control workforce, redundancy, and QA coverage.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="pool-label">Annotator Pools</InputLabel>
              <Select
                labelId="pool-label"
                multiple
                value={form.annotators.pools}
                onChange={(e) => update(["annotators", "pools"], e.target.value)}
                input={<OutlinedInput label="Annotator Pools" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => {
                      const p = DUMMY_POOLS.find((x) => x.id === id);
                      return <Chip key={id} label={p ? p.name : id} />;
                    })}
                  </Box>
                )}
              >
                {DUMMY_POOLS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Checkbox checked={form.annotators.pools.indexOf(p.id) > -1} />
                    <Typography sx={{ ml: 1 }}>{p.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Labels per Item"
              value={form.annotators.labelsPerItem}
              onChange={(e) => update(["annotators", "labelsPerItem"], parseInt(e.target.value || "1", 10))}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Consensus N"
              value={form.annotators.consensusN}
              onChange={(e) => update(["annotators", "consensusN"], parseInt(e.target.value || "1", 10))}
            />
          </Grid>

          <Grid item xs={4} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Gold Tasks %"
              value={form.annotators.goldPercent}
              onChange={(e) => update(["annotators", "goldPercent"], parseInt(e.target.value || "0", 10))}
            />
          </Grid>
          <Grid item xs={4} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Audit Sample %"
              value={form.annotators.auditPercent}
              onChange={(e) => update(["annotators", "auditPercent"], parseInt(e.target.value || "0", 10))}
            />
          </Grid>
          <Grid item xs={4} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Daily Quota / Annotator"
              value={form.annotators.dailyQuotaPerAnnotator}
              onChange={(e) =>
                update(["annotators", "dailyQuotaPerAnnotator"], parseInt(e.target.value || "0", 10))
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="SLA (hours)"
              value={form.annotators.slaHours}
              onChange={(e) => update(["annotators", "slaHours"], parseInt(e.target.value || "0", 10))}
            />
          </Grid>
        </Grid>
      </Section>
    </Box>
  );

  const PoliciesStep = () => (
    <Box>
      <Section title="Policies & Guardrails" sub="Safety, PII, and annotator-visible policy settings.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.policies.showTOS}
                  onChange={(e) => update(["policies", "showTOS"], e.target.checked)}
                />
              }
              label="Show Terms/Guidelines in Task UI"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.policies.piiRedaction}
                  onChange={(e) => update(["policies", "piiRedaction"], e.target.checked)}
                />
              }
              label="Enable PII Redaction"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.policies.autoRefusalHints}
                  onChange={(e) => update(["policies", "autoRefusalHints"], e.target.checked)}
                />
              }
              label="Enable Auto-Refusal Hints to Models"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.policies.exposeGuidelinesInTask}
                  onChange={(e) => update(["policies", "exposeGuidelinesInTask"], e.target.checked)}
                />
              }
              label="Expose Safety Guidelines in Task"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.policies.contentFilters.enabled}
                  onChange={(e) => update(["policies", "contentFilters", "enabled"], e.target.checked)}
                />
              }
              label="Content Filters Enabled"
            />

            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  label="Toxicity threshold"
                  value={form.policies.contentFilters.thresholds.toxicity}
                  onChange={(e) =>
                    update(
                      ["policies", "contentFilters", "thresholds", "toxicity"],
                      parseFloat(e.target.value || "0")
                    )
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  label="Violence threshold"
                  value={form.policies.contentFilters.thresholds.violence}
                  onChange={(e) =>
                    update(
                      ["policies", "contentFilters", "thresholds", "violence"],
                      parseFloat(e.target.value || "0")
                    )
                  }
                />
              </Grid>
            </Grid>

            <TextField
              sx={{ mt: 2 }}
              fullWidth
              label="Link to Policy Doc (optional)"
              placeholder="https://…"
              value={form.policies.policyDocUrl}
              onChange={(e) => update(["policies", "policyDocUrl"], e.target.value)}
            />
          </Grid>
        </Grid>
      </Section>
    </Box>
  );

  const ReviewStep = () => (
    <Box>
      <Section
        title="Review & Preview"
        sub="Confirm configuration. You can save as draft, preview a mock task UI, or launch."
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Summary
            </Typography>
            <SummaryLine label="Name" value={form.basics.name || "—"} />
            <SummaryLine label="Type" value={payload.normalized.branch} />
            <SummaryLine label="Pools" value={form.annotators.pools.join(", ")} />
            <SummaryLine
              label="Rubrics"
              value={isRM ? form.data.rm.rubrics.join(", ") : isSafety ? "safety categories" : "—"}
            />
            <SummaryLine label="Labels per Item" value={String(form.annotators.labelsPerItem)} />
            <SummaryLine label="Gold %" value={String(form.annotators.goldPercent)} />
            <SummaryLine label="Audit %" value={String(form.annotators.auditPercent)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              JSON Payload (for API)
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                fontSize: 12,
                maxHeight: 300,
                overflow: "auto",
                border: "1px solid #eee",
              }}
            >
              {JSON.stringify(payload, null, 2)}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={() => window.alert("Preview UI: build the live preview hook here.")}
          >
            Preview Task UI
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log("SAVE DRAFT", payload);
              window.alert("Saved as draft (console payload logged).");
            }}
          >
            Save as Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log("LAUNCH PROJECT", payload);
              window.alert("Project launched (console payload logged).");
            }}
          >
            Launch Project
          </Button>
        </Box>
      </Section>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Create New Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A single wizard for SFT, Reward Model (incl. adversarial), and Safety/Policy labeling.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ my: 2 }}>
        {steps.map((s, i) => (
          <Step key={s}>
            <StepLabel>{i === 2 ? promptsStepLabel : s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && <BasicsStep />}
        {activeStep === 1 && <TypeStep />}
        {activeStep === 2 && <PromptsStep />}
        {activeStep === 3 && <AnnotatorsStep />}
        {activeStep === 4 && <PoliciesStep />}
        {activeStep === 5 && <ReviewStep />}

        <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          <Tooltip
            title={!canNext ? "Please complete required fields on this step." : ""}
            placement="top"
          >
            <span>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canNext}
              >
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

/** Small summary row */
function SummaryLine({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
      <Typography sx={{ minWidth: 140 }} color="text.secondary">
        {label}:
      </Typography>
      <Typography sx={{ flex: 1 }}>{value}</Typography>
    </Box>
  );
}