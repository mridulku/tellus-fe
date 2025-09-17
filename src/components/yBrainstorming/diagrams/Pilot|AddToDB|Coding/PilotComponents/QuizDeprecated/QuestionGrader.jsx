// File: QuestionGrader.js
import axios from "axios";

/**
 * gradeQuestion
 * @param {object} params
 *   - openAiKey: string
 *   - subchapterSummary: string
 *   - questionObj: any
 *   - userAnswer: string (or whatever user typed)
 *
 * @returns { score: number, feedback: string }
 */
export async function gradeQuestion({
  openAiKey,
  subchapterSummary,
  questionObj,
  userAnswer,
}) {
  const answerGuidance = questionObj.answerGuidance || "";
  const questionText = questionObj.question || "(No question text)";
  const questionType = questionObj.type || "(No type)";

  const gradingPrompt = `
You are a grading assistant. You have the following subchapter text as context:
"${subchapterSummary}"

Here is a single question, plus the user's answer:

Question Type: ${questionType}
Question: ${questionText}
Answer Guidance (if any): ${answerGuidance}

User's Answer: ${userAnswer}

Please:
1. Rate how correct or complete the user's answer is on a scale of 0 to 5 (integer).
2. Provide 1-2 sentences of feedback, focusing on correctness or completeness.
3. Return only valid JSON in the format:
{
  "score": 3,
  "feedback": "some short feedback..."
}

No extra commentary.
`.trim();

  try {
    const gradeResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a strict grading assistant. Return JSON with 'score' and 'feedback' only.",
          },
          {
            role: "user",
            content: gradingPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
      }
    );

    const gptGradeContent = gradeResponse.data.choices[0].message.content.trim();
    let parsedGrade = { score: 0, feedback: "No feedback" };
    try {
      const cleanedGrade = gptGradeContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedGrade = JSON.parse(cleanedGrade);
    } catch (err) {
      console.error("Error parsing grading JSON:", err);
    }

    return {
      score: parsedGrade.score || 0,
      feedback: parsedGrade.feedback || "No feedback provided",
    };
  } catch (err) {
    console.error("Error calling GPT for grading:", err);
    return { score: 0, feedback: "Grading failed: " + err.message };
  }
}