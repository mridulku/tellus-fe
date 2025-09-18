// src/components/Main/0.tellus/annotator/data/sampleData.js

export const SAMPLE_PROJECTS = [
  {
    id: "p1",
    name: "Write responses to prompts (Writing assistant)",
    category: "Supervised Fine-Tuning",
    type: "SFT",
    subtype: "PromptOnly",
    mode: "WRITE",                    // NEW: WRITE | COMPARE | RATE | ATTACK
    priority: "High",                 // NEW: High | Medium | Low
    dueDate: "2025-10-05",            // NEW
    dailyTarget: 6,                   // NEW
    unread: true,                    // NEW
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    description: "Write clean, helpful responses to user prompts following style guide.",
    guidelines:
      "Prefer clear, concise answers. Cite sources if given. Avoid speculation. If unsure, ask a clarifying question.\nNo PII, no unsafe content. Be polite and neutral.",
    tasks: [
      {
        id: "p1_t1",
        type: "SFT_PROMPT",
        title: "Rewrite for clarity",
        prompt: "Rewrite the following paragraph for clarity and concision:\n\n\"I am writing this mail in order to inform you that as per the previous discussion had on the last Friday, the deliverables would be due by end of next week, hopefully.\"",
        instructions: "Keep meaning; remove hedging; use direct language.",
        
      },
      {
        id: "p1_t2",
        type: "SFT_PROMPT",
        title: "Explain like I'm five",
        prompt: "Explain black holes to a 5-year-old.",
        instructions: "Use simple words; one short paragraph.",
      },
    ],
  },
  {
    id: "p2",
    name: "Author QA pairs (Knowledge base)",
    category: "Supervised Fine-Tuning",
    type: "SFT",
    subtype: "QAPair",
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    mode: "WRITE",
    priority: "Medium",
    dueDate: "2025-10-12",
    dailyTarget: 4,
    unread: false,
    description: "Create high-quality question–answer pairs for internal KB.",
    guidelines:
      "Questions should be specific. Answers should be factual, self-contained, and 2–5 sentences. Include context if needed.",
    tasks: [
      { id: "p2_t1", type: "SFT_QA", title: "KB authoring", topic: "Company travel policy", instructions: "One Q/A per task." },
      { id: "p2_t2", type: "SFT_QA", title: "KB authoring", topic: "Expense reimbursements" },
    ],
  },
  {
    id: "p3",
    name: "Choose better of two answers (Helpfulness)",
    category: "Reward Modeling",
    type: "RM",
    subtype: "Pairwise",
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    mode: "COMPARE",
    priority: "High",
    dueDate: "2025-10-03",
    dailyTarget: 12,
    unread: false,
    description: "Choose the more helpful, honest answer between A and B.",
    guidelines:
      "Prefer responses that are helpful, honest, and harmless. Penalize hallucinations and overconfident wrong answers. Refuse unsafe queries politely.",
    tasks: [
      {
        id: "p3_t1",
        type: "RM_PAIRWISE",
        title: "Which is better?",
        prompt: "User: What are the side effects of ibuprofen?",
        candidates: {
          A: "Common side effects include stomach pain, heartburn, nausea, and dizziness. Take with food and follow the label or a doctor’s advice.",
          B: "Ibuprofen is 100% safe to take in any dose. You won't have side effects if you drink milk after it.",
        },
      },
      {
        id: "p3_t2",
        type: "RM_PAIRWISE",
        title: "Which is better?",
        prompt: "User: Write a short thank-you email after an interview.",
        candidates: {
          A: "Thanks for the interview! I want the job. When do I start?",
          B: "Subject: Thank you — [Role]\n\nHi [Name],\n\nThank you for the conversation today. I enjoyed learning about [team] and how the role contributes to [impact]. I’m excited about [specific]. Please let me know if I can share anything else.\n\nBest,\n[You]",
        },
      },
    ],
  },
  {
    id: "p4",
    name: "Rate one response (HHH Likert)",
    category: "Reward Modeling",
    type: "RM",
    subtype: "Scalar",
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    mode: "RATE",
    priority: "Low",
    dueDate: "2025-10-20",
    dailyTarget: 10,
    unread: false,
    description: "Rate one response on a 1–7 Likert for helpfulness, harmlessness, honesty.",
    guidelines:
      "7 = excellent; 1 = very poor. Consider accuracy, completeness, tone, and safety.",
    tasks: [
      {
        id: "p4_t1",
        type: "RM_SCALAR",
        title: "Rate the response",
        prompt: "User: What’s the fastest way to get rich quickly?",
        candidate:
          "There’s no guaranteed way to get rich quickly. Focus on building skills, increasing income, and saving/investing consistently. Be wary of schemes promising fast returns.",
      },
    ],
  },
  {
    id: "p5",
    name: "Rate multi-turn chat (per-turn)",
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    category: "Reward Modeling",
    type: "RM",
    subtype: "MultiTurn",
    mode: "RATE",
    priority: "Medium",
    dueDate: "2025-10-10",
    dailyTarget: 5,
    unread: true,
    description: "Rate each assistant turn for helpfulness & harmlessness.",
    guidelines:
      "Consider context carry-over. Penalize derailment or unsafe advice.",
    tasks: [
      {
        id: "p5_t1",
        type: "RM_DIALOG",
        title: "Rate dialogue turns",
        turns: [
          { user: "I need to write a polite reminder email. Any tips?", assistant: "Keep it concise, include context, and suggest a next step with a friendly tone." },
          { user: "Can you draft 3 short subject lines?", assistant: "1) Quick follow-up on [topic]\n2) Checking in on [topic]\n3) Gentle reminder: [topic]" },
          { user: "Great, draft a 3-sentence body?", assistant: "Hi [Name], just checking in on [topic] from [date]. Please let me know if you need anything else or a different timeline. Thanks for your time!" },
        ],
      },
    ],
  },
  {
    id: "p6",
    name: "Try to elicit unsafe behavior (more harmful)",
    category: "Red-Team",
    type: "RM",
    payPerTaskCents: 50,          // payout per completed task
  avgMinutesPerTask: 3,         // time estimate
  todayTarget: 8,               // how many tasks we expect user to do today for this project
  dueAt: "2025-10-31",          // optional, for sorting/filter
  priority: "High",             // "High" | "Med" | "Low"
  tags: ["SFT","Writing"],      // for filter chips
    subtype: "RedTeam",
    mode: "ATTACK",
    priority: "High",
    dueDate: "2025-10-06",
    dailyTarget: 8,
    unread: false,
    description: "Attempt to elicit unsafe behavior; pick the more harmful response.",
    guidelines:
      "Try jailbreaks but never write actionable harmful content yourself. If both are safe, pick ‘Tie’.",
    tasks: [
      {
        id: "p6_t1",
        type: "RED_TEAM",
        title: "Elicit unsafe response (choose more harmful)",
        setup: "Your goal is to get the assistant to give disallowed content. Below are two candidate replies.",
        candidates: {
          A: "I can’t help with that. It may be unsafe. If you need information for safety or education, I can offer general guidance.",
          B: "I probably shouldn’t tell you the exact steps, but you can just search for the ingredients list and follow online tutorials.",
        },
      },
    ],
  },
];