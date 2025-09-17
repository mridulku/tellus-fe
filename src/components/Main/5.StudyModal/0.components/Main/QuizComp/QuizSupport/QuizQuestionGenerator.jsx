/**
 * File: QuizQuestionGenerator.js
 * Description:
 *   - Handles question generation from GPT, returning an array of question objects
 *   - Excludes concepts the user has already passed at 100 %
 *   - *NEW*: each Bloom stage can prepend a stage-specific prompt snippet
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

/* ------------------------------------------------------------------ */
/*  MAIN ENTRY: generateQuestions                                     */
/* ------------------------------------------------------------------ */
export async function generateQuestions({
  db,
  planId,
  subChapterId,
  examId = "general",
  quizStage = "remember",
  openAiKey,
  userId,
}) {
  try {
    console.log("[generateQuestions] START", {
      userId,
      planId,
      subChapterId,
      quizStage,
      examId,
    });

    /* -------------------------------------------------------------- */
    /* 0) Which concepts has the learner already mastered?            */
    /* -------------------------------------------------------------- */
    const passedConceptsSet = await findPassedConcepts(
      db,
      userId,
      planId,
      subChapterId,
      quizStage
    );
    console.log(
      "[generateQuestions] passedConceptsSet =>",
      Array.from(passedConceptsSet)
    );

    /* -------------------------------------------------------------- */
    /* 1) Fetch quizConfig for this stage (e.g. quizGeneralRemember)  */
    /* -------------------------------------------------------------- */
    const docId = buildQuizConfigDocId(examId, quizStage);
    const quizConfigRef = doc(db, "quizConfigs", docId);
    const quizConfigSnap = await getDoc(quizConfigRef);

    if (!quizConfigSnap.exists()) {
      console.warn(`[generateQuestions] No quizConfig doc "${docId}"`);
      return {
        success: false,
        error: `Missing quizConfig "${docId}"`,
        questionsData: null,
      };
    }

    const quizConfigData = quizConfigSnap.data();
    console.log("[generateQuestions] quizConfigData =>", quizConfigData);

    /* ——— pull out the prompt snippet & strip it from the counts ——— */
    const stagePrompt = quizConfigData.stagePrompt || "";
    delete quizConfigData.stagePrompt; // so only pure counts remain

    /* -------------------------------------------------------------- */
    /* 2) Fetch all concept docs for this sub-chapter                 */
    /* -------------------------------------------------------------- */
    let conceptList = [];
    const conceptSnap = await getDocs(
      query(
        collection(db, "subchapterConcepts"),
        where("subChapterId", "==", subChapterId)
      )
    );
    conceptList = conceptSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    /* —— remove concepts already mastered —— */
    conceptList = conceptList.filter((c) => !passedConceptsSet.has(c.name));

    if (conceptList.length === 0) {
      console.log("[generateQuestions] All concepts mastered — 0 questions.");
      return { success: true, error: null, questionsData: { questions: [] } };
    }

    /* -------------------------------------------------------------- */
    /* 3) Loop concepts × type counts → call GPT                      */
    /* -------------------------------------------------------------- */
    let allConceptQuestions = [];

    for (const concept of conceptList) {
      console.log(`→ Generating for concept "${concept.name}"`);
      for (const [typeName, count] of Object.entries(quizConfigData)) {
        if (count <= 0) continue;
        const batch = await generateQuestions_ForConcept({
          db,
          subChapterId,
          openAiKey,
          typeName,
          numberOfQuestions: count,
          concept,
          stagePrompt, // pass down
        });
        allConceptQuestions.push(...batch);
      }
    }

    console.log(
      "[generateQuestions] TOTAL generated =>",
      allConceptQuestions.length
    );
    return {
      success: true,
      error: null,
      questionsData: { questions: allConceptQuestions },
    };
  } catch (err) {
    console.error("[generateQuestions] ERROR:", err);
    return { success: false, error: err.message, questionsData: null };
  }
}

/* ------------------------------------------------------------------ */
/*  findPassedConcepts — unchanged                                    */
/* ------------------------------------------------------------------ */
async function findPassedConcepts(db, userId, planId, subChapterId, quizStage) {
  const passed = new Set();
  try {
    const snap = await getDocs(
      query(
        collection(db, "quizzes_demo"),
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("subchapterId", "==", subChapterId),
        where("quizType", "==", quizStage),
        orderBy("attemptNumber", "desc")
      )
    );
    snap.forEach((d) => {
      (d.data().quizSubmission || []).forEach((q) => {
        const c = q.conceptName;
        if (!c) return;
        if (parseFloat(q.score) >= 1) passed.add(c);
      });
    });
  } catch (err) {
    console.error("findPassedConcepts error:", err);
  }
  return passed;
}

/* ------------------------------------------------------------------ */
/*  generateQuestions_ForConcept — now receives stagePrompt           */
/* ------------------------------------------------------------------ */
async function generateQuestions_ForConcept({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  concept,
  stagePrompt, // ← receives
}) {
  return generateQuestions_GPT({
    db,
    subChapterId,
    openAiKey,
    typeName,
    numberOfQuestions,
    forcedConceptName: concept.name,
    stagePrompt, // ← passes through
  });
}

/* ------------------------------------------------------------------ */
/*  generateQuestions_GPT — accepts stagePrompt & inserts it          */
/* ------------------------------------------------------------------ */
async function generateQuestions_GPT({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  forcedConceptName,
  stagePrompt = "", // default empty
}) {
  /* A) fetch sub-chapter summary */
  let subchapterSummary = "";
  try {
    const snap = await getDoc(doc(db, "subchapters_demo", subChapterId));
    if (snap.exists()) subchapterSummary = snap.data().summary || "";
  } catch (e) {
    console.error("subchapter fetch error:", e);
  }

  /* B) forced concept block (optional) */
  const forcedBlock = forcedConceptName
    ? `All questions must focus on the concept: "${forcedConceptName}".\nSet each question's "conceptName" field to "${forcedConceptName}".`
    : "";

  /* C) build prompts */
  const systemPrompt = "You are a helpful question generator that outputs JSON only.";
  const userPrompt = `
${stagePrompt}

You have a subchapter summary:
"${subchapterSummary}"

Generate ${numberOfQuestions} questions of type "${typeName}."

${forcedBlock}

Include:
- "question": The question text
- "type": "${typeName}"
- "conceptName": (if forced, otherwise blank)
- For multipleChoice => "options"[] and "correctIndex"
- For trueFalse      => "correctValue": "true" or "false"
- For fillInBlank    => "answerKey"
- For openEnded/compareContrast/shortAnswer => "expectedAnswer"
- For scenario       => "scenarioText" + "expectedAnswer"

Return ONLY valid JSON:
{
  "questions":[ { ... }, ... ]
}
`.trim();

  /* D) call OpenAI */
  let parsedQuestions = [];
  try {
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${openAiKey}` } }
    );

    const raw = resp.data.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    parsedQuestions = JSON.parse(raw).questions || [];
  } catch (err) {
    console.error("generateQuestions_GPT error:", err);
  }

  return parsedQuestions;
}

/* ------------------------------------------------------------------ */
/*  Utility: buildQuizConfigDocId                                     */
/* ------------------------------------------------------------------ */
function buildQuizConfigDocId(exam, stage) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `quiz${cap(exam)}${cap(stage)}`;
}