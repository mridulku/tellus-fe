/**
 * File: QuizQuestionGrader.js
 * Description:
 *   - A helper library for grading quiz questions, both local and GPT-based.
 *   - Exports functions you can use inside QuizComponent (or elsewhere).
 *
 * NOTE: If you already integrated local/GPT grading directly in QuizComponent,
 *       you can optionally remove/trim this file. 
 */

import axios from "axios";

/**
 * Given an array of question items, split into local vs. GPT-gradable, 
 * then produce a final "gradingResults" array, each with { score, feedback }.
 * 
 * @param {Object} params
 * @param {string} params.openAiKey - Your GPT API key
 * @param {string} params.subchapterSummary - Additional context for GPT
 * @param {Array}  params.questions - The full array of question objects
 * @param {Array}  params.userAnswers - The user's parallel array of answers
 * @returns {Promise<{ success:boolean, results:Array, error:string }>}
 *
 * Example usage:
 *   const { success, results, error } = await gradeAllQuestions({
 *     openAiKey, subchapterSummary, questions, userAnswers
 *   });
 */
export async function gradeAllQuestions({
  openAiKey,
  subchapterSummary,
  questions,
  userAnswers,
}) {
  if (!questions || !userAnswers || questions.length !== userAnswers.length) {
    return {
      success: false,
      results: [],
      error: "Mismatch in questions vs. userAnswers length.",
    };
  }

  // We'll store final results in an array parallel to `questions`
  const gradingResults = new Array(questions.length).fill(null);

  // 1) Separate local vs GPT
  const localItems = [];
  const openEndedItems = [];
  questions.forEach((qObj, idx) => {
    const userAns = userAnswers[idx] || "";
    if (isLocallyGradableType(qObj.type)) {
      localItems.push({ qObj, userAns, originalIndex: idx });
    } else {
      openEndedItems.push({ qObj, userAns, originalIndex: idx });
    }
  });

  // 2) Handle local grading
  localItems.forEach((item) => {
    const { score, feedback } = localGradeQuestion(item.qObj, item.userAns);
    gradingResults[item.originalIndex] = { score, feedback };
  });

  // 3) Handle GPT-based grading
  if (openEndedItems.length > 0) {
    if (!openAiKey) {
      // If there's no GPT key, set them all to 0 
      openEndedItems.forEach((item) => {
        gradingResults[item.originalIndex] = {
          score: 0,
          feedback: "No OpenAI key; cannot GPT-grade open-ended question.",
        };
      });
    } else {
      // Attempt GPT grading
      const { success, gradingArray, error } = await gradeOpenEndedBatch({
        openAiKey,
        subchapterSummary,
        items: openEndedItems,
      });
      if (!success) {
        // If GPT call fails, fill them with 0
        console.error("GPT grading error:", error);
        openEndedItems.forEach((item) => {
          gradingResults[item.originalIndex] = {
            score: 0,
            feedback: "GPT grading error: " + error,
          };
        });
      } else {
        // Insert each result in the correct slot
        gradingArray.forEach((res, i) => {
          const origIdx = openEndedItems[i].originalIndex;
          gradingResults[origIdx] = res;
        });
      }
    }
  }

  return {
    success: true,
    results: gradingResults,
    error: "",
  };
}

/**
 * Helper: Decide if a question type is "locally gradable."
 * Adjust as needed if you add new question types.
 */
export function isLocallyGradableType(qType) {
  switch (qType) {
    case "multipleChoice":
    case "trueFalse":
    case "fillInBlank":
    case "ranking": // if you have a correct order, you can do local grading
      return true;
    default:
      return false;
  }
}

/**
 * Local grading function for those question types that have
 * an explicit correct answer in the question object:
 *   - multipleChoice => questionObj.correctIndex
 *   - trueFalse => questionObj.correctValue
 *   - fillInBlank => questionObj.answerKey
 *   - ranking => questionObj.correctOrder (if you store it)
 *
 * Return { score: 0..1, feedback: string }
 */
export function localGradeQuestion(questionObj, userAnswer) {
  let score = 0;
  let feedback = "";

  switch (questionObj.type) {
    case "multipleChoice": {
      // e.g. questionObj.correctIndex
      const correctIndex = questionObj.correctIndex;
      const userIdx = parseInt(userAnswer, 10);
      if (!isNaN(userIdx) && userIdx === correctIndex) {
        score = 1.0;
        feedback = "Correct!";
      } else {
        score = 0.0;
        if (Array.isArray(questionObj.options) && questionObj.options[correctIndex]) {
          feedback = `Incorrect. Correct is: ${questionObj.options[correctIndex]}`;
        } else {
          feedback = "Incorrect.";
        }
      }
      break;
    }
    case "trueFalse": {
      // e.g. questionObj.correctValue is "true" or "false"
      if (userAnswer === questionObj.correctValue) {
        score = 1.0;
        feedback = "Correct (T/F).";
      } else {
        score = 0.0;
        feedback = `Incorrect. Correct answer was "${questionObj.correctValue}".`;
      }
      break;
    }
    case "fillInBlank": {
      // e.g. questionObj.answerKey
      const correctAnswerKey = (questionObj.answerKey || "").trim().toLowerCase();
      const userAns = (userAnswer || "").trim().toLowerCase();
      score = userAns === correctAnswerKey ? 1.0 : 0.0;
      feedback = score === 1.0
        ? "Correct fill-in!"
        : `Incorrect. Expected "${questionObj.answerKey}".`;
      break;
    }
    case "ranking": {
      // If you store a correct order array in questionObj.correctOrder 
      // vs. userAnswer = user’s chosen order
      // Implement your logic. For now, we default to 0. 
      score = 0.0;
      feedback = "Ranking local grading not implemented here.";
      break;
    }
    default:
      score = 0.0;
      feedback = "Not recognized for local grading.";
  }

  return { score, feedback };
}

/**
 * Single GPT call to grade open-ended questions. 
 * items[] = { qObj, userAns, originalIndex }
 * 
 * The question object should contain something like "expectedAnswer" or "answerGuidance."
 * GPT returns an array of { score: 0..1, feedback: "..." }, in the same order as `items`.
 */
export async function gradeOpenEndedBatch({ openAiKey, subchapterSummary, items }) {
  if (!openAiKey) {
    return { success: false, gradingArray: [], error: "Missing openAiKey" };
  }
  if (!items || !items.length) {
    return { success: true, gradingArray: [], error: "" };
  }

  // Build the GPT prompt
    /* ---------- Build the GPT prompt (wrap answer in triple quotes) ---------- */
  let promptBlock = "";
  items.forEach((item, i) => {
    const { qObj, userAns } = item;
    const safeAns = userAns ?? "";   // accept whatever the learner type

    promptBlock += `
Q#${i + 1}:
Question: ${qObj.question}
Expected Answer: ${qObj.expectedAnswer || qObj.answerGuidance || "(none provided)"}
User's Answer: """${safeAns}"""
`;
  });

  // Optional: peek at the exact prompt in the browser console
  console.log("GPT-grading prompt ↓↓↓", promptBlock);

  const userPrompt = `
You are a grading assistant. 
Context (subchapter summary): "${subchapterSummary}"

 For each question, compare Expected vs User’s Answer.
 If it is just very short, grade it normally and give constructive feedback.Score it from 0.0 to 1.0, then give 1-2 sentences of feedback.

Return exactly JSON in the format:
{
  "results": [
    { "score": 0.0, "feedback": "..." },
    { "score": 1.0, "feedback": "..." }
  ]
}
No extra commentary—only this JSON.

${promptBlock}
`.trim();

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a strict grading assistant. Return JSON only." },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.0,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    let parsed;
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        gradingArray: [],
        error: "Error parsing JSON from GPT: " + err.message,
      };
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return {
        success: false,
        gradingArray: [],
        error: "Invalid response: 'results' array not found in GPT output.",
      };
    }

    // Return them
    const gradingArray = parsed.results.map((r) => ({
      score: r.score ?? 0.0,
      feedback: r.feedback || "",
    }));

    return { success: true, gradingArray, error: "" };
  } catch (err) {
    return {
      success: false,
      gradingArray: [],
      error: "GPT call failed: " + err.message,
    };
  }
}