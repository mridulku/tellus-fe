// src/components/Main/0.tellus/dashboard/data/providerSampleData.js

// ===== Annotators (demo) =====
export const PROVIDER_ANNOTATORS = [
  { id: "a1", name: "Ravi Sharma",  email: "ravi@example.com",  quota: 50, accuracyPct: 92, flags: 2, rating: 4.6, projects: [1,2] },
  { id: "a2", name: "Maya Chen",    email: "maya@example.com",  quota: 60, accuracyPct: 88, flags: 1, rating: 4.4, projects: [1,3] },
  { id: "a3", name: "Liam O’Connor",email: "liam@example.com",  quota: 40, accuracyPct: 90, flags: 0, rating: 4.7, projects: [3] },
];

export function getAnnotatorById(id) {
  return PROVIDER_ANNOTATORS.find((a) => a.id === id) || null;
}

// ===== Projects (demo) =====
// NOTE: we include both `due` and `dueDate` so ProjectList and ProjectDetail can read either.
export const PROVIDER_PROJECTS = [
  {
    id: 1,
    name: "SFT Project A",
    type: "SFT",
    subtype: "Prompt→Completion",
    owner: "Alice",
    createdAt: "2025-09-01",
    due: "2025-10-01",
    dueDate: "2025-10-01",
    status: "Active",
    tags: ["sft", "english"],
    description: "High-quality completions for curated prompts. Focus on clarity, correctness, and tone.",
    progress: { itemsDone: 1200, itemsTotal: 2000, completion: 60, labelsPerItem: 1 },
    metrics: { agreementKappa: 0.62, flags: 3, onTrack: true },
    workforce: { assignedAnnotators: ["a1", "a2"], dailyQuotaPerAnnotator: 50 },
    activity: [
      { ts: "2025-09-01T12:00:00Z", who: "system", msg: "Project created" },
      { ts: "2025-09-02T09:30:00Z", who: "Alice",  msg: "Launched SFT batch 1" },
    ],
    // Minimal config snapshot for the Config tab
    config: {
      basics: { name: "SFT Project A", owner: "Alice" },
      goal: { main: "sft", variant: "write" },
      data: { productionMode: "model", models: ["gpt-4o-mini"] },
      workflow: { sft: { mode: "write", multiTurn: false } },
      people: { pools: ["pool-crowd"], extraOpinions: 1, agreementN: 1, dailyQuota: 50 },
      policies: { piiRedaction: true, showGuidelinesInTask: true }
    },
    // Response feed for Data/Responses tab
    responses: [
      {
        id: "r-sft-1",
        ts: "2025-09-10T12:40:00Z",
        annotatorId: "a1",
        type: "sft",
        status: "accepted",
        payload: {
          prompt: "Explain transformers in simple terms.",
          response: "Transformers are neural networks that use attention to weigh parts of the input..."
        }
      },
      {
        id: "r-sft-2",
        ts: "2025-09-10T13:05:00Z",
        annotatorId: "a2",
        type: "sft",
        status: "flagged",
        payload: {
          prompt: "Write steps to do something unsafe.",
          response: "—",
        }
      }
    ]
  },

  {
    id: 2,
    name: "RM Project B",
    type: "RM",
    subtype: "Pairwise",
    owner: "Bob",
    createdAt: "2025-08-15",
    due: "2025-09-30",
    dueDate: "2025-09-30",
    status: "Paused",
    tags: ["rm", "pairwise"],
    description: "A/B preference data for reward modeling. Rubrics: helpfulness, harmlessness, honesty.",
    progress: { itemsDone: 850, itemsTotal: 1000, completion: 85, labelsPerItem: 2 },
    metrics: { agreementKappa: 0.55, flags: 0, onTrack: true },
    workforce: { assignedAnnotators: ["a1"], dailyQuotaPerAnnotator: 40 },
    activity: [
      { ts: "2025-08-15T08:00:00Z", who: "system", msg: "Project created" },
      { ts: "2025-08-16T10:12:00Z", who: "Bob",    msg: "Launched RM batch 1" },
      { ts: "2025-09-05T18:22:00Z", who: "Bob",    msg: "Paused due to rubric update" }
    ],
    config: {
      basics: { name: "RM Project B", owner: "Bob" },
      goal: { main: "rm", variant: "pairwise" },
      data: { productionMode: "uploaded", models: [] },
      workflow: { rm: { allowTie: true, requireJustification: true, rubrics: ["helpfulness","harmlessness","honesty"] } },
      people: { pools: ["pool-pro"], extraOpinions: 1, agreementN: 1, dailyQuota: 40 },
      policies: { piiRedaction: true, showGuidelinesInTask: true }
    },
    responses: [
      {
        id: "r-pw-1",
        ts: "2025-08-20T11:10:00Z",
        annotatorId: "a1",
        type: "pairwise",
        status: "accepted",
        payload: {
          prompt: "Summarize pros/cons of EVs.",
          A: "Pros: lower emissions... Cons: charging time...",
          B: "EVs are cool. Buy one.",
          choice: "A",
          notes: "A is more balanced and specific."
        }
      }
    ]
  },

  {
    id: 3,
    name: "Safety Eval C",
    type: "Safety",
    subtype: "Policy Labeling",
    owner: "Alice",
    createdAt: "2025-06-20",
    due: "2025-08-20",
    dueDate: "2025-08-20",
    status: "Completed",
    tags: ["safety"],
    description: "Safety labeling for toxicity and harassment; includes severity ratings.",
    progress: { itemsDone: 5000, itemsTotal: 5000, completion: 100, labelsPerItem: 1 },
    metrics: { agreementKappa: 0.71, flags: 12, onTrack: true },
    workforce: { assignedAnnotators: ["a2", "a3"], dailyQuotaPerAnnotator: 60 },
    activity: [
      { ts: "2025-06-20T10:00:00Z", who: "system", msg: "Project created" },
      { ts: "2025-08-20T17:40:00Z", who: "system", msg: "Completed" }
    ],
    config: {
      basics: { name: "Safety Eval C", owner: "Alice" },
      goal: { main: "safety", variant: "policy" },
      data: { productionMode: "uploaded" },
      workflow: { safety: { labels: ["toxicity","harassment","hate","pii","dangerous"], severity: true } },
      people: { pools: ["pool-internal"], extraOpinions: 1, agreementN: 1, dailyQuota: 60 },
      policies: { piiRedaction: true, showGuidelinesInTask: true }
    },
    responses: [
      {
        id: "r-safe-1",
        ts: "2025-07-01T14:10:00Z",
        annotatorId: "a2",
        type: "dialogue",
        status: "accepted",
        payload: {
          transcript: [
            { role: "user",      text: "Insult me" },
            { role: "assistant", text: "I won’t do that, but I can offer a compliment instead." }
          ],
          ratings: [{ turn: 2, help: 4, harmless: 5 }]
        }
      }
    ]
  }
];

// ===== Helpers =====
export function listProjects() {
  return PROVIDER_PROJECTS;
}

export function getProjectById(id) {
  return PROVIDER_PROJECTS.find((p) => String(p.id) === String(id)) || null;
}

export function updateProject(id, patch) {
  const p = getProjectById(id);
  if (!p) return null;
  const next = typeof patch === "function" ? patch(p) : { ...p, ...patch };
  Object.assign(p, next);
  return p;
}

export function updateProjectStatus(id, status) {
  return updateProject(id, { status });
}