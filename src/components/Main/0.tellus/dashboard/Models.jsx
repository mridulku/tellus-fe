// src/components/Main/0.tellus/dashboard/Models.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Stack, Checkbox, FormControlLabel,
  Paper, Chip, Alert, Snackbar, IconButton, Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// --- Static provider catalog (for the picker + mock "Test connection") ---
const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    needs: ["apiKey"],
    mockModels: ["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"],
  },
  
];

const STORAGE_KEY = "tellus.models.page.v1";

export default function Models() {
  // --- State persisted to localStorage -----------------------------------
  const [models, setModels] = useState([]);      // array of {id, name, provider, status, linked, connectionId, code}
  const [connections, setConnections] = useState([]); // array of {id, providerId, apiKey?, baseUrl?}

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setModels(parsed.models ?? []);
        setConnections(parsed.connections ?? []);
      } else {
        // seed with one example
        const seedConn = { id: "c-seed", providerId: "openai", apiKey: "sk-***demo***" };
        const seedModel = {
          id: "m1",
          name: "OpenAI • gpt-4o-mini",
          provider: "OpenAI",
          code: "gpt-4o-mini",
          status: "Active",
          linked: 2,
          connectionId: "c-seed",
        };
        setConnections([seedConn]);
        setModels([seedModel]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ models, connections });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [models, connections]);

  // --- Add Model dialog ---------------------------------------------------
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const [form, setForm] = useState({
    providerId: "",
    apiKey: "",
    baseUrl: "",
    testOk: false,
    testError: "",
    availableModels: [],
    selectedModels: [],
  });

  const provider = useMemo(
    () => PROVIDERS.find((p) => p.id === form.providerId) || null,
    [form.providerId]
  );

  const resetForm = () => {
    setForm({
      providerId: "",
      apiKey: "",
      baseUrl: "",
      testOk: false,
      testError: "",
      availableModels: [],
      selectedModels: [],
    });
    setTesting(false);
  };

  const handleOpen = () => { resetForm(); setOpen(true); };
  const handleClose = () => { setOpen(false); };

  // --- Mock "Test connection" --------------------------------------------
  const handleTest = async () => {
    setTesting(true);
    setForm((f) => ({ ...f, testError: "", testOk: false, availableModels: [], selectedModels: [] }));

    // quick client-side validation
    if (!provider) {
      setTesting(false);
      setForm((f) => ({ ...f, testError: "Select a provider." }));
      return;
    }
    if (provider.needs.includes("apiKey") && !form.apiKey.trim()) {
      setTesting(false);
      setForm((f) => ({ ...f, testError: "API key is required." }));
      return;
    }
    if (provider.id === "openai" && !form.apiKey.trim().startsWith("sk-")) {
      setTesting(false);
      setForm((f) => ({ ...f, testError: "OpenAI keys typically start with 'sk-'. Please check." }));
      return;
    }
    if (provider.needs.includes("baseUrl") && !form.baseUrl.trim()) {
      setTesting(false);
      setForm((f) => ({ ...f, testError: "Base URL is required." }));
      return;
    }

    // simulate a round-trip
    await new Promise((r) => setTimeout(r, 700));

    // mock success/failure: simple heuristic
    const seemsOk =
      (provider.id !== "custom" && form.apiKey.trim().length >= 6) ||
      (provider.id === "custom" && /^https?:\/\//i.test(form.baseUrl.trim()));

    if (!seemsOk) {
      setTesting(false);
      setForm((f) => ({ ...f, testError: "Connection failed. Please verify credentials/URL." }));
      return;
    }

    // produce available models
    const list =
      provider.id === "custom"
        ? [] // user will type their own codes in a text field below
        : [...provider.mockModels];

    setTesting(false);
    setForm((f) => ({ ...f, testOk: true, testError: "", availableModels: list, selectedModels: [] }));
  };

  const handleSave = () => {
    if (!provider) return;

    // create a connection (one per provider credential/baseUrl)
    const conn = {
      id: "c-" + Date.now(),
      providerId: provider.id,
      ...(form.apiKey ? { apiKey: form.apiKey } : {}),
      ...(form.baseUrl ? { baseUrl: form.baseUrl } : {}),
    };
    setConnections((prev) => [...prev, conn]);

    // figure out chosen codes
    let codes = [...form.selectedModels];
    if (provider.id === "custom" && codes.length === 0) {
      // take a comma separated text field
      const raw = (document.getElementById("custom-model-codes-input")?.value || "").trim();
      if (raw) codes = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (codes.length === 0) {
      // if none selected, add a single generic entry
      codes = ["default"];
    }

    const newRows = codes.map((code) => ({
      id: "m-" + provider.id + "-" + code + "-" + Date.now() + "-" + Math.floor(Math.random() * 999),
      name: `${provider.label} • ${code}`,
      provider: provider.label,
      code,
      status: "Active",
      linked: 0,
      connectionId: conn.id,
    }));

    setModels((prev) => [...prev, ...newRows]);

    setToast({ open: true, msg: `Added ${newRows.length} model${newRows.length > 1 ? "s" : ""}`, severity: "success" });
    setOpen(false);
  };

  const toggleStatus = (rowId) => {
    setModels((prev) =>
      prev.map((m) => (m.id === rowId ? { ...m, status: m.status === "Active" ? "Disabled" : "Active" } : m))
    );
  };

  // --- Rotate Key dialog (per connection) --------------------------------
  const [rotating, setRotating] = useState({ open: false, connectionId: "" });
  const [newKey, setNewKey] = useState("");

  const openRotate = (connectionId) => {
    setNewKey("");
    setRotating({ open: true, connectionId });
  };
  const closeRotate = () => setRotating({ open: false, connectionId: "" });

  const doRotate = () => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === rotating.connectionId ? { ...c, apiKey: newKey || c.apiKey } : c
      )
    );
    setToast({ open: true, msg: "Key rotated", severity: "success" });
    closeRotate();
  };

  // helper to find the connection for a model row
  const getConnectionForRow = (row) => connections.find((c) => c.id === row.connectionId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Connected Models</Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={handleOpen}>Add Model</Button>
        <Tooltip title="This table lists enabled model codes from each provider credential. Use ‘Add Model’ to connect a provider and pick codes.">
          <IconButton size="small"><InfoIconFallback /></IconButton>
        </Tooltip>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Projects Linked</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No models connected yet. Click <b>Add Model</b> to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : models.map((m) => {
              const conn = getConnectionForRow(m);
              const canRotate = !!conn?.apiKey; // only show rotate for API-key connections
              return (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.provider}</TableCell>
                  <TableCell>
                    <Chip size="small" label={m.status} color={m.status === "Active" ? "success" : "default"} variant="outlined" />
                  </TableCell>
                  <TableCell>{m.linked}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={canRotate ? "Rotate API key for this provider credential" : "Rotation not applicable for this connection"}>
                      <span>
                        <Button size="small" onClick={() => canRotate && openRotate(m.connectionId)} disabled={!canRotate}>
                          Rotate Key
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      size="small"
                      color={m.status === "Active" ? "warning" : "success"}
                      sx={{ ml: 1 }}
                      onClick={() => toggleStatus(m.id)}
                    >
                      {m.status === "Active" ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Add Model dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Add Model</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="prov-label">Provider</InputLabel>
              <Select
                labelId="prov-label"
                label="Provider"
                value={form.providerId}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  providerId: e.target.value,
                  apiKey: "",
                  baseUrl: "",
                  testOk: false,
                  testError: "",
                  availableModels: [],
                  selectedModels: [],
                }))}
              >
                {PROVIDERS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {provider?.needs.includes("apiKey") && (
              <TextField
                label="API Key"
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              />
            )}

            {provider?.needs.includes("baseUrl") && (
              <TextField
                label="Base URL"
                placeholder="https://your-model-host/api"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            )}

            {!form.testOk && form.testError && <Alert severity="error">{form.testError}</Alert>}

            {!form.testOk ? (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={handleTest} disabled={!provider || testing}>
                  {testing ? "Testing…" : "Test connection"}
                </Button>
              </Stack>
            ) : (
              <>
                <Alert severity="success">Connection OK</Alert>

                {provider?.id !== "custom" && (
                  <>
                    <Typography variant="subtitle2">Available model codes</Typography>
                    <Stack>
                      {form.availableModels.map((code) => (
                        <FormControlLabel
                          key={code}
                          control={
                            <Checkbox
                              checked={form.selectedModels.includes(code)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setForm((f) => ({
                                  ...f,
                                  selectedModels: checked
                                    ? [...f.selectedModels, code]
                                    : f.selectedModels.filter((x) => x !== code),
                                }));
                              }}
                            />
                          }
                          label={code}
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Tip: leave all unchecked to add a single generic entry for this provider.
                    </Typography>
                  </>
                )}

                {provider?.id === "custom" && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Model codes (comma separated)</Typography>
                    <TextField id="custom-model-codes-input" placeholder="my-model-a, my-model-b" />
                    <Typography variant="caption" color="text.secondary">
                      You can keep this blank to add a single generic entry.
                    </Typography>
                  </>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.testOk}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rotate key dialog */}
      <Dialog open={rotating.open} onClose={closeRotate}>
        <DialogTitle>Rotate API Key</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="New API Key"
            type="password"
            fullWidth
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            This updates the credential for all models connected with this provider key.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRotate}>Cancel</Button>
          <Button variant="contained" onClick={doRotate} disabled={!newKey.trim()}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton size="small" color="inherit" onClick={() => setToast((t) => ({ ...t, open: false }))}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}

// Tiny fallback icon to avoid adding more imports
function InfoIconFallback(props) {
  return (
    <Box component="span" {...props} sx={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid #999", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666" }}>
      i
    </Box>
  );
}