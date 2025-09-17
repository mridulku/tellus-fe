// File: QuestionGenerator.js

import axios from "axios";
import { doc, getDoc } from "firebase/firestore";

/**
 * generateQuestions
 * @param {object} params
 *   - db: Firestore instance
 *   - subChapterId: string
 *   - openAiKey: string
 *   - selectedTypeName: string (e.g., "multipleChoice")
 *   - questionTypeDoc: the question type doc from Firestore (contains expectedJsonStructure, etc.)
 *   - numberOfQuestions: number
 *
 * @returns
 *   {
 *     success: boolean,
 *     subchapterSummary: string,
 *     questionsData: { questions: [...] } or null,
 *     error: string (if any)
 *   }
 */
export async function generateQuestions({
  db,
  subChapterId,
  openAiKey,
  selectedTypeName,
  questionTypeDoc,
  numberOfQuestions,
}) {
  if (!db || !subChapterId || !openAiKey || !selectedTypeName || !questionTypeDoc) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: "Missing required parameters.",
    };
  }

  // 1) Fetch the subchapter doc
  let subchapterSummary = "";
  try {
    const subChapterRef = doc(db, "subchapters_demo", subChapterId);
    const subChapterSnap = await getDoc(subChapterRef);
    if (!subChapterSnap.exists()) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: `No subchapter with ID = ${subChapterId}`,
      };
    }
    const subData = subChapterSnap.data();
    subchapterSummary = subData.summary || "";
    if (!subchapterSummary) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: "Subchapter has no summary text.",
      };
    }
  } catch (err) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: `Error fetching subchapter: ${err.message}`,
    };
  }

  // 2) Build the GPT prompt
  const prompt = `
You are a question generator. I have a subchapter summary below.
I want you to produce ${numberOfQuestions} questions of type "${questionTypeDoc.name}".

**Subchapter Summary**:
${subchapterSummary}

**Question Type Definition**:
Name: ${questionTypeDoc.name}
Expected JSON structure (each question must match this shape):
${JSON.stringify(questionTypeDoc.expectedJsonStructure, null, 2)}

Please only return valid JSON with the following structure:

{
  "questions": [
    // each question object with the fields from expectedJsonStructure
  ]
}

No extra commentary, just the JSON object.
`.trim();

  // 3) Call OpenAI
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful question generator." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
      }
    );

    const gptMessage = response.data.choices[0].message.content.trim();
    let cleaned = gptMessage.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        subchapterSummary,
        questionsData: {
          error: "Invalid JSON from GPT",
          raw: gptMessage,
        },
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    // If we have valid JSON, return it
    return {
      success: true,
      subchapterSummary,
      questionsData: parsed, // { "questions": [ ... ] }
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      subchapterSummary,
      questionsData: null,
      error: `Error generating questions (OpenAI): ${err.message}`,
    };
  }
}