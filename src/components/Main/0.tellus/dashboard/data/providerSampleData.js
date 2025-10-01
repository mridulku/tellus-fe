// src/components/Main/0.tellus/dashboard/data/providerSampleData.js

/* ========== Annotators (demo) ========== */
export const PROVIDER_ANNOTATORS = [
  { id: "a1", name: "Ravi Sharma",   email: "ravi@example.com",  quota: 50, accuracyPct: 92, flags: 2, rating: 4.6, projects: [1,2] },
  { id: "a2", name: "Maya Chen",     email: "maya@example.com",  quota: 60, accuracyPct: 88, flags: 1, rating: 4.4, projects: [1,2] },
  { id: "a3", name: "Liam O’Connor", email: "liam@example.com",  quota: 40, accuracyPct: 90, flags: 0, rating: 4.7, projects: [2] },
];

export function getAnnotatorById(id) {
  return PROVIDER_ANNOTATORS.find((a) => a.id === id) || null;
}

/* ========== Projects (demo) ========== */
export const PROVIDER_PROJECTS = [
  /* ---------- SFT Project ---------- */
  {
    id: 1,
    name: "SFT Project A",
    type: "SFT",
    subtype: "Prompt→Answer",
    owner: "Alice",
    createdAt: "2025-09-01",
    dueDate: "2025-10-01",
    status: "Active",
    tags: ["sft", "english"],
    description: "Plain prompt→answer writing by people. Keep it clear and correct.",
    progress: { itemsDone: 2, itemsTotal: 5 }, // simple demo numbers
    workforce: { assignedAnnotators: ["a1", "a2"], dailyQuotaPerAnnotator: 50 },

    // Minimal config snapshot (kept simple)
    config: {
      goal: { main: "sft", mode: "write" },
      taskUI: { minWords: 0, maxWords: 300, allowSkip: true, allowFlag: true },
      people: { who: ["internal_pool"], opinionsPerItem: 1, needAgree: 1 },
      pay: { perItem: 0.05, dailyQuota: 50, turnaroundDays: 3 },
      qa: { warmups: 0, goldPct: 0, audits: 0 }
    },

    // SFT sample items (from your CSV spec). Each has:
    //  - payload.prompt (what the model sees)
    //  - payload.response (what the person wrote)
    //  - payload.seed.* (provider-only context: instruction, samples, tags, notes)
    responses: [
      {
        id: "r-sft-101",
        ts: "2025-09-10T09:10:00Z",
        annotatorId: "a1",
        type: "sft",
        status: "accepted",
        payload: {
          prompt: "Translate the sentence to Spanish: Good morning",
          response: "Buenos días",
          seed: {
            instruction_for_annotator: "Translate the sentence to Spanish",
            sample_input: "Translate the sentence to Spanish: I am learning English",
            sample_output: "Estoy aprendiendo inglés",
            tags: "translation",
            notes: "Leave output blank for annotator to fill"
          }
        }
      },
      {
        id: "r-sft-102",
        ts: "2025-09-10T09:35:00Z",
        annotatorId: "a2",
        type: "sft",
        status: "accepted",
        payload: {
          prompt: "Translate the sentence to French: The weather is nice",
          response: "Le temps est agréable.",
          seed: {
            instruction_for_annotator: "Translate the sentence to French",
            sample_input: "Translate the sentence to French: The book is on the table",
            sample_output: "Le livre est sur la table",
            tags: "translation",
            notes: ""
          }
        }
      },
      {
        id: "r-sft-103",
        ts: "2025-09-10T10:05:00Z",
        annotatorId: "a1",
        type: "sft",
        status: "needs_review",
        payload: {
          prompt: "Summarize the following: Renewable energy sources are becoming more important due to...",
          response: "Renewable energy is gaining importance because costs are falling and climate goals demand cleaner power.",
          seed: {
            instruction_for_annotator: "Summarize the following paragraph",
            sample_input: "Summarize the following: The economic crisis in 2008 was triggered by...",
            sample_output: "The 2008 crisis began due to subprime mortgages and led to a global recession.",
            tags: "summarization",
            notes: "Focus on one-sentence summary"
          }
        }
      },
      {
        id: "r-sft-104",
        ts: "2025-09-10T10:28:00Z",
        annotatorId: "a2",
        type: "sft",
        status: "accepted",
        payload: {
          prompt: "Write a poem about spring",
          response: "Buds wake to gentle light,\nRains stitch green across the fields—\nSpring hums, soft and bright.",
          seed: {
            instruction_for_annotator: "Write a poem about spring",
            sample_input: "Write a poem about winter",
            sample_output: "Soft snow falls at night / Trees whisper with icy breath / Winter dreams in white",
            tags: "creative",
            notes: "Any form of poetry accepted"
          }
        }
      },
      {
        id: "r-sft-105",
        ts: "2025-09-10T10:49:00Z",
        annotatorId: "a1",
        type: "sft",
        status: "flagged",
        payload: {
          prompt: "Explain in simple terms: Quantum entanglement",
          response: "It’s when two tiny particles act like they share one state, so changing one instantly relates to the other, even far apart.",
          seed: {
            instruction_for_annotator: "Explain in simple terms",
            sample_input: "Explain in simple terms: Blockchain",
            sample_output: "Blockchain is a digital ledger that records transactions securely.",
            tags: "explanation",
            notes: "Keep explanation under 2 lines"
          }
        }
      }
    ]
  },

  /* ---------- Reward Modeling Project (Pairwise) ---------- */
  {
    id: 2,
    name: "RM Project B",
    type: "RM",
    subtype: "Pairwise (A vs B)",
    owner: "Bob",
    createdAt: "2025-08-15",
    dueDate: "2025-09-30",
    status: "Active",
    tags: ["rm", "pairwise"],
    description: "People pick the better answer (A or B), can tie, say why, and how much better.",
    progress: { itemsDone: 2, itemsTotal: 4 },
    workforce: { assignedAnnotators: ["a1", "a3"], dailyQuotaPerAnnotator: 40 },

    config: {
      goal: { main: "rm", variant: "pairwise" },
      pairwise: { allowTie: true, requireWhy: true, strengthMin: 1, strengthMax: 5 },
      people: { who: ["pro_pool"], opinionsPerItem: 1, needAgree: 1 },
      pay: { perItem: 0.04, dailyQuota: 40, turnaroundDays: 3 },
      qa: { warmups: 0, goldPct: 0, audits: 0 }
    },

    // Pairwise examples include optional "seed.reminders" chips
    responses: [
      {
        id: "r-pw-201",
        ts: "2025-08-20T11:10:00Z",
        annotatorId: "a1",
        type: "pairwise",
        status: "accepted",
        payload: {
          prompt: "Summarize pros and cons of electric vehicles.",
          A: "Pros: lower emissions, instant torque, low maintenance. Cons: charging time, range limits, battery cost.",
          B: "EVs are cool. Buy one.",
          choice: "A",
          strength: 4,
          why: "A is balanced and specific; B is shallow.",
          seed: { reminders: "helpfulness;factuality;clarity" }
        }
      },
      {
        id: "r-pw-202",
        ts: "2025-08-21T09:05:00Z",
        annotatorId: "a3",
        type: "pairwise",
        status: "accepted",
        payload: {
          prompt: "Explain what a mortgage is in one sentence.",
          A: "A mortgage is a loan used to buy property, secured by the home itself.",
          B: "Mortgages are things banks like because money.",
          choice: "A",
          strength: 5,
          why: "A is accurate and concise; B is vague.",
          seed: { reminders: "accuracy;brevity" }
        }
      },
      {
        id: "r-pw-203",
        ts: "2025-08-22T14:20:00Z",
        annotatorId: "a1",
        type: "pairwise",
        status: "needs_review",
        payload: {
          prompt: "Give two tips for focusing while studying.",
          A: "Remove distractions; take short breaks (Pomodoro).",
          B: "Just study harder.",
          choice: "A",
          strength: 3,
          why: "A offers actionable tips.",
          seed: { reminders: "actionable;clear" }
        }
      },
      {
        id: "r-pw-204",
        ts: "2025-08-23T16:40:00Z",
        annotatorId: "a3",
        type: "pairwise",
        status: "flagged",
        payload: {
          prompt: "Write guidance on a potentially unsafe activity.",
          A: "—",
          B: "—",
          choice: "tie",
          strength: 1,
          why: "Both unsafe to provide.",
          seed: { reminders: "harmlessness" }
        }
      }
    ]
  }
];

/* ========== Helpers ========== */
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