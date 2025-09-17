import React, { useState } from "react";
import { db } from "../../../../firebase"; // adjust your import
import { doc, setDoc } from "firebase/firestore";

/**
 * Example usage:
 * 
 * JSON in raw input might look like:
 * [
 *   {
 *     "name": "multipleChoice",
 *     "description": "A multiple-choice question type...",
 *     "typicalBloomLevels": ["Remember", "Understand", "Apply"],
 *     "expectedJsonStructure": {
 *       "question": "string",
 *       "type": "multipleChoice",
 *       "options": ["string"],
 *       "correctAnswerIndex": 0
 *     },
 *     "exampleUsage": {
 *       "bloomLevelExample": "Remember",
 *       "questionSample": {
 *         "question": "What is skimming?",
 *         "type": "multipleChoice",
 *         "options": [
 *           "Reading thoroughly",
 *           "Scanning headings quickly"
 *         ],
 *         "correctAnswerIndex": 1
 *       }
 *     }
 *   },
 *   {
 *     "name": "shortAnswer",
 *     "description": "A short open-ended question type...",
 *     ...
 *   }
 * ]
 */

export default function QuestionTypesCreator() {
  // The user can enter a doc ID if they want to store all question types
  // in a single doc, but here we'll do multiple docs, each doc ID = type's "name".
  // We'll keep docId optional or ignore it. Let's just show an example docId input.
  const [collectionName, setCollectionName] = useState("questionTypes");

  // The raw JSON array containing question types
  const [rawJson, setRawJson] = useState(`[
  {
    "name": "multipleChoice",
    "description": "A multiple-choice question with several options, exactly one correct answer.",
    "typicalBloomLevels": ["Remember", "Understand", "Apply"],
    "expectedJsonStructure": {
      "question": "string",
      "type": "multipleChoice",
      "options": ["string", "..."],
      "correctAnswerIndex": 0
    },
    "exampleUsage": {
      "bloomLevelExample": "Remember",
      "questionSample": {
        "question": "What is skimming?",
        "type": "multipleChoice",
        "options": [
          "Reading thoroughly",
          "Looking at headings to find main ideas",
          "Ignoring the text entirely"
        ],
        "correctAnswerIndex": 1
      }
    }
  },
  {
    "name": "shortAnswer",
    "description": "Learner provides a short, free-text response. Usually GPT or a rubric checks correctness.",
    "typicalBloomLevels": ["Understand", "Analyze"],
    "expectedJsonStructure": {
      "question": "string",
      "type": "shortAnswer",
      "answerGuidance": "string"
    },
    "exampleUsage": {
      "bloomLevelExample": "Understand",
      "questionSample": {
        "question": "Why does skimming save time?",
        "type": "shortAnswer",
        "answerGuidance": "It focuses on headings and key sentences..."
      }
    }
  }
]`);

  const [status, setStatus] = useState("");

  async function handleSubmit() {
    try {
      setStatus("Parsing JSON...");
      const parsed = JSON.parse(rawJson);

      if (!Array.isArray(parsed)) {
        setStatus("Error: JSON must be an array of question types.");
        return;
      }

      // For each question type in the array, we store a doc in "questionTypes" collection,
      // doc ID = questionType's "name"
      setStatus("Saving docs to Firestore...");

      for (const qt of parsed) {
        if (!qt.name) {
          throw new Error("Each question type must have a 'name' field.");
        }

        const docRef = doc(db, collectionName, qt.name); 
        await setDoc(docRef, qt, { merge: true });
      }

      setStatus(`Successfully wrote ${parsed.length} question types to "${collectionName}".`);
    } catch (err) {
      console.error("Error saving question types:", err);
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Create Question Types</h2>

      {/* Collection Name Input */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="collectionInput">
          Collection Name (default: "questionTypes"):
        </label>
        <br />
        <input
          id="collectionInput"
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* JSON Text Area */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="jsonInput">Question Types JSON (array):</label>
        <br />
        <textarea
          id="jsonInput"
          rows={15}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* Submit Button */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleSubmit}>Save to Firestore</button>
      </div>

      {/* Status Messages */}
      {status && <p>{status}</p>}
    </div>
  );
}