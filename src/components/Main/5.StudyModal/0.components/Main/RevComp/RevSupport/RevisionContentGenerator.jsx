/**
 * File: RevisionContentGenerator.js
 * Description:
 *   - Self-contained logic for building revision content from GPT
 *   - Automatically determines which concepts the user failed in their latest quiz attempt
 *   - Returns a concept-by-concept breakdown
 */

import axios from "axios";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export async function generateRevisionContent({
  db,
  subChapterId,
  openAiKey,
  revisionConfig,
  userId,
  quizStage,
  maxHistoryAttempts = 10,
}) {
  if (!db || !subChapterId || !openAiKey || !userId || !quizStage) {
    return {
      success: false,
      revisionData: null,
      error: "Missing required parameters in generateRevisionContent.",
    };
  }

  /* ────────────────────────────────────────────────
   * 1) Grab the user’s MOST-RECENT quiz attempts
   *    (up to maxHistoryAttempts) so we can:
   *      • work out failed concepts          (as before)
   *      • embed a history block in the prompt
  * ────────────────────────────────────────────── */
  let failedConcepts = [];
  let historyBlock   = "";
  try {
    const quizRef = collection(db, "quizzes_demo");
    const q = query(
      quizRef,
      where("userId", "==", userId),
      where("subchapterId", "==", subChapterId),
      where("quizType", "==", quizStage),
      orderBy("attemptNumber", "desc")
    );
    const snap = await getDocs(q);
        if (snap.empty) {
      console.log("No quiz attempts found ➜ generic revision.");
    } else {
      /* ── a) slice the most-recent N docs ── */
      const recentDocs = snap.docs.slice(0, maxHistoryAttempts);

      /* ── b) build a human-readable *history* string ── */
      historyBlock = recentDocs
        .map((d) => {
          const { attemptNumber, quizSubmission = [] } = d.data();
          const lines = quizSubmission.map((q, idx) => {
            const isCorrect = parseFloat(q.score) >= 1 ? "✅" : "❌";
            return `    • Q${idx + 1} (${q.conceptName}): ${isCorrect}`;
          });
          return `Attempt #${attemptNumber}\n${lines.join("\n")}`;
        })
        .join("\n\n");

      /* ── c) compute failedConcepts *from the latest attempt only* (unchanged) ── */
      const latestDoc = recentDocs[0];
      const latestData = latestDoc.data();
      const quizSubmission = latestData.quizSubmission || [];

      // Build a concept map => { conceptName: { correct, total } }
      const conceptMap = {};
      quizSubmission.forEach((qItem) => {
        const cName = qItem.conceptName || "UnknownConcept";
        if (!conceptMap[cName]) {
          conceptMap[cName] = { correct: 0, total: 0 };
        }
        conceptMap[cName].total++;
        if (parseFloat(qItem.score) >= 1) {
          conceptMap[cName].correct++;
        }
      });

      // If ratio < 1 => fail
      Object.keys(conceptMap).forEach((cName) => {
        const { correct, total } = conceptMap[cName];
        if (total > 0 && correct < total) {
          failedConcepts.push(cName);
        }
      });
    }
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching latest quiz attempt: ${err.message}`,
    };
  }

  // 2) Fetch subchapter summary from "subchapters_demo"
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        revisionData: null,
        error: `No subchapter found with ID: ${subChapterId}`,
      };
    }
    subchapterSummary = snap.data().summary || "";
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching subchapter doc: ${err.message}`,
    };
  }

  // 3) We'll incorporate the revisionConfig doc. Suppose it has instructions or something
  const configJson = JSON.stringify(revisionConfig, null, 2);

  // 4) Build a GPT prompt that says: "Focus on these failed concepts. Return JSON with 'title' + 'concepts'..."
  let failedConceptsText = "No failing concepts => provide a general revision.";
  if (failedConcepts.length > 0) {
    failedConceptsText = `These concepts were failed:\n - ${failedConcepts.join("\n - ")}`;
  }

    /* 👇 NEW – only added if we actually have history */
  const quizHistoryText = historyBlock
    ? `\n\nQuiz History (most recent ${maxHistoryAttempts}):\n${historyBlock}`
    : "";

 
  
    const userPrompt = `
You are an expert tutor creating a **personal revision brief** for one
learner.  Use the information below to write *conversational*,
*detailed* explanations that target the learner’s specific mistakes.

────────────────────────  CONTEXT  ────────────────────────
• **Sub-chapter summary**  
"""${subchapterSummary}"""

• **Concepts the learner still struggles with**  
${failedConcepts.length
    ? failedConcepts.map((c) => `  – ${c}`).join("\\n")
    : "  – none (give a concise general recap of all key ideas)"}  

• **Recent quiz history** (✅ correct, ❌ incorrect)  
${quizHistoryText || "  – no previous attempts on record"}  

• **Authoring guidelines from my CMS**  
"""${configJson}"""

──────────────────────  HOW TO WRITE  ─────────────────────
1. For **each concept** output **1-2 full paragraphs** (≈ 120–200 words
   total).  Use a conversational tone (“you…”) and weave in:
   • A one-sentence recap of the idea.  
   • A plain-language deep-dive that fixes *this learner’s* exact
     misconceptions (mention how many times they missed it if >1).  
   • An analogy, mini-story, or real-life application to aid memory.  
   • A short actionable tip or mnemonic to try next time.  
2. If the learner already mastered the concept (no errors), still give
   a concise *reinforcement* paragraph (~80–120 words) that cements the
   knowledge and suggests an extension or challenge question.  
3. **Return each paragraph as a single string** inside the notes
   array.  (e.g. notes ["<paragraph text>"])  
4. Do **NOT** add markdown, bullets, or code-blocks; plain text only.  
5. **EVERY concept MUST include an example object** exactly as shown below.
    If you omit it the response is invalid.

You must return **valid JSON only** – no markdown fences, no extra prose –
and follow *exactly* this schema:
{
  "title": "Short Title",
  "concepts": [
    {
      "conceptName": "Concept A",
      "explanation": "A clear, conversational paragraph (≈120–180 words) that
                     teaches the idea in plain language, referencing the
                     learner’s typical error(s) where relevant.",
      "example": {
        "prompt":  "A realistic exam-style question or scenario",
        "solution":"Step-by-step working that applies the concept and highlights
                    the common pitfall the learner previously fell into."
      }
    },
    ...
  ]
}

**Guidelines for each concept**
• *explanation* should feel like a tutor speaking directly to the learner  
• *example.prompt* must be novel (don’t reuse a past quiz item)  
• *example.solution* must reference the concept explicitly and point out the
  misconception you observed in the quiz-history.  

Return the JSON, nothing else.
`.trim();

  // 5) Call GPT
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful tutor. Return JSON only." },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1600,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const gptMessage = response.data.choices[0].message.content.trim();
    const cleaned = gptMessage.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        revisionData: null,
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    return {
      success: true,
      revisionData: parsed,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error calling GPT: ${err.message}`,
    };
  }
}