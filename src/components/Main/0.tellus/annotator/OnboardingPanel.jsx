import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Storage keys (compatible with the small widget if you keep it)
const LS_PROFILE = "annotator.profile.v1";
const LS_ONBOARD = "annotator.onboarding.v1";

const LANGUAGES = ["English", "Hindi", "French", "German", "Spanish", "Japanese"];
const DOMAINS = ["General", "Writing", "Coding", "Medical", "Legal", "Finance", "Safety"];
const TASK_INTERESTS = [
  "Write responses (prompt → answer)",
  "Author Q&A pairs",
  "Compare A/B answers",
  "Rate single answer (1–7)",
  "Rate multi-turn dialogue",
  "Red-team (try to elicit unsafe)",
];
const PROFICIENCY = ["Beginner", "Intermediate", "Advanced", "Native"];
const defaultTimezone = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
})();

const DEFAULT_PROFILE = {
  fullName: "",
  country: "",
  timezone: defaultTimezone,
  primaryLanguage: "",
  primaryLanguageLevel: "Advanced",
  otherLanguages: [],
  domains: ["General"],
  taskInterests: ["Write responses (prompt → answer)"],
  hoursPerWeek: 5,
  earningGoalMonthlyInr: 2000,
  minPayPerTaskInr: 0,
  hasLaptop: true,
  stableInternet: true,
  canSeeSensitiveText: false,
  acceptCodeOfConduct: false,
  notes: "",
};

function loadProfile() {
  try { return { ...DEFAULT_PROFILE, ...(JSON.parse(localStorage.getItem(LS_PROFILE) || "{}")) }; }
  catch { return DEFAULT_PROFILE; }
}
function saveProfile(p) {
  try { localStorage.setItem(LS_PROFILE, JSON.stringify(p)); } catch {}
}
function markOnboardingComplete() {
  try {
    const prev = JSON.parse(localStorage.getItem(LS_ONBOARD) || "{}");
    const next = { ...prev, profileCompleted: true };
    localStorage.setItem(LS_ONBOARD, JSON.stringify(next));
  } catch {}
}
function completionPct(p) {
  const checks = [
    !!p.fullName.trim(),
    !!p.primaryLanguage,
    p.taskInterests.length > 0,
    p.hoursPerWeek > 0,
    p.acceptCodeOfConduct === true,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
const fmtInr = (n) => `₹${Math.max(0, Number(n) || 0).toLocaleString("en-IN")}`;

export default function OnboardingPanel({ onDone }) {
  const [profile, setProfile] = useState(loadProfile());
  const [saved, setSaved] = useState(false);
  const pct = useMemo(() => completionPct(profile), [profile]);
  const navigate = useNavigate();

  const handleSave = () => {
    saveProfile(profile);
    markOnboardingComplete();
    setSaved(true);
  };

  const handleFinish = () => {
    handleSave();
    if (typeof onDone === "function") onDone();
    else navigate(-1); // go back to dashboard
  };

  return (
    <Box sx={{ maxWidth: 840, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Onboarding</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tell us a bit about you so we can match you to the right tasks. Simple, single page.
      </Typography>

      <LinearProgress variant="determinate" value={pct} sx={{ mb: 2 }} />

      <Card variant="outlined">
        <CardContent>
          {/* 1) Basics */}
          <Typography variant="subtitle1">Basics</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Used only for matching and time zone.
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Full name"
              value={profile.fullName}
              onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Country / Region"
                value={profile.country}
                onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Time zone"
                value={profile.timezone}
                onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 2) Languages & Domains */}
          <Typography variant="subtitle1">Languages & Domains</Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <FormControl fullWidth>
                <InputLabel>Primary language</InputLabel>
                <Select
                  label="Primary language"
                  value={profile.primaryLanguage}
                  onChange={(e) => setProfile(p => ({ ...p, primaryLanguage: e.target.value }))}
                  input={<OutlinedInput label="Primary language" />}
                >
                  {LANGUAGES.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  label="Proficiency"
                  value={profile.primaryLanguageLevel}
                  onChange={(e) => setProfile(p => ({ ...p, primaryLanguageLevel: e.target.value }))}
                  input={<OutlinedInput label="Proficiency" />}
                >
                  {PROFICIENCY.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Other languages (optional)</InputLabel>
              <Select
                multiple
                value={profile.otherLanguages}
                onChange={(e) => setProfile(p => ({ ...p, otherLanguages: e.target.value }))}
                input={<OutlinedInput label="Other languages (optional)" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {LANGUAGES.map(l => (
                  <MenuItem key={l} value={l}>
                    <Checkbox checked={profile.otherLanguages.includes(l)} />
                    <ListItemText primary={l} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Domains you’re comfortable with</InputLabel>
              <Select
                multiple
                value={profile.domains}
                onChange={(e) => setProfile(p => ({ ...p, domains: e.target.value }))}
                input={<OutlinedInput label="Domains you’re comfortable with" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {DOMAINS.map(d => (
                  <MenuItem key={d} value={d}>
                    <Checkbox checked={profile.domains.includes(d)} />
                    <ListItemText primary={d} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 3) Work Preferences */}
          <Typography variant="subtitle1">Work Preferences</Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>What kinds of tasks interest you?</InputLabel>
              <Select
                multiple
                value={profile.taskInterests}
                onChange={(e) => setProfile(p => ({ ...p, taskInterests: e.target.value }))}
                input={<OutlinedInput label="What kinds of tasks interest you?" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {TASK_INTERESTS.map(t => (
                  <MenuItem key={t} value={t}>
                    <Checkbox checked={profile.taskInterests.includes(t)} />
                    <ListItemText primary={t} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Hours you can commit per week: <b>{profile.hoursPerWeek}h</b>
              </Typography>
              <Slider
                min={0}
                max={30}
                value={profile.hoursPerWeek}
                onChange={(_, v) => setProfile(p => ({ ...p, hoursPerWeek: v }))}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly earning goal (approx.)
                </Typography>
                <Slider
                  min={0}
                  max={20000}
                  step={500}
                  value={profile.earningGoalMonthlyInr}
                  onChange={(_, v) => setProfile(p => ({ ...p, earningGoalMonthlyInr: v }))}
                />
                <Typography variant="caption" color="text.secondary">
                  Target: {fmtInr(profile.earningGoalMonthlyInr)} / month
                </Typography>
              </Box>
              <TextField
                type="number"
                label="Minimum acceptable pay per task (₹, optional)"
                value={profile.minPayPerTaskInr}
                onChange={e => setProfile(p => ({ ...p, minPayPerTaskInr: Number(e.target.value || 0) }))}
                fullWidth
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 4) Readiness */}
          <Typography variant="subtitle1">Readiness</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.hasLaptop}
                  onChange={e => setProfile(p => ({ ...p, hasLaptop: e.target.checked }))}
                />
              }
              label="I have access to a laptop/desktop"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.stableInternet}
                  onChange={e => setProfile(p => ({ ...p, stableInternet: e.target.checked }))}
                />
              }
              label="I have stable internet"
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 5) Consent */}
          <Typography variant="subtitle1">Consent</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={profile.acceptCodeOfConduct}
                  onChange={e => setProfile(p => ({ ...p, acceptCodeOfConduct: e.target.checked }))}
                />
              }
              label="I agree to the community code of conduct and quality guidelines."
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={profile.canSeeSensitiveText}
                  onChange={e => setProfile(p => ({ ...p, canSeeSensitiveText: e.target.checked }))}
                />
              }
              label="I’m comfortable seeing occasional sensitive text for rating purposes."
            />
          </Stack>

          {/* Notes */}
          <TextField
            label="Anything else we should know? (optional)"
            value={profile.notes}
            onChange={e => setProfile(p => ({ ...p, notes: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />

          {/* Actions */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained"
              onClick={handleFinish}
              disabled={
                !profile.fullName.trim() ||
                !profile.primaryLanguage ||
                profile.taskInterests.length === 0 ||
                profile.hoursPerWeek === 0 ||
                !profile.acceptCodeOfConduct
              }
            >
              Save & Finish
            </Button>
            <Button variant="outlined" onClick={handleSave}>Save draft</Button>
          </Stack>

          {saved && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Thanks, your details were saved. We’ll match you to suitable tasks and reach out as new work becomes available.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}