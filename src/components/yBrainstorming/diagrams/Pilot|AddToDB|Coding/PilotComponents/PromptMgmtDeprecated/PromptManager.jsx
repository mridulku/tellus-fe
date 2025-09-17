import React, { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc
} from "firebase/firestore";
import { db } from "../../../../../../firebase"; // <-- adjust to your firebase config path

/**
 * PromptManagerNoExpress
 * ----------------------
 * A React component that directly reads/writes to Firestore's "prompts" collection.
 *
 * FEATURES:
 *   - Search by promptKey => if found, load doc into a JSON text area
 *   - Edit doc JSON in text area
 *   - Save doc => merges changes if doc existed, or creates new doc if none found
 */
export default function PromptManagerNoExpress() {
  const [promptKeySearch, setPromptKeySearch] = useState("");
  const [docId, setDocId] = useState("");       // the Firestore doc ID if found
  const [jsonData, setJsonData] = useState(""); // the JSON text in the text area
  const [status, setStatus] = useState("");

  /**
   * 1) FETCH PROMPT BY KEY
   */
  async function handleFetchPrompt() {
    setStatus("");
    setDocId("");
    setJsonData("");

    if (!promptKeySearch.trim()) {
      setStatus("Please enter a promptKey to search for.");
      return;
    }

    try {
      // Query the "prompts" collection where promptKey == promptKeySearch
      const q = query(
        collection(db, "prompts"),
        where("promptKey", "==", promptKeySearch.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus(
          `No document found with promptKey="${promptKeySearch}". You can create a new one below.`
        );
        // Optionally set some default JSON structure as a starting template
        const defaultJson = {
          promptKey: promptKeySearch.trim(),
          promptText: "Enter your prompt text here...",
          UIconfig: {
            fields: [
              {
                component: "quiz",
                field: "quizQuestions",
                label: "Answer these questions"
              }
            ]
          },
          name: "Prompt Name Here",
          description: "Short description of this prompt"
        };
        setJsonData(JSON.stringify(defaultJson, null, 2));
        return;
      }

      // If we found a doc, let's just take the first match
      const docSnap = snap.docs[0];
      const docData = docSnap.data();

      setDocId(docSnap.id);
      setJsonData(JSON.stringify(docData, null, 2));
      setStatus(`Found doc: ${docSnap.id} (loaded into text area).`);
    } catch (err) {
      console.error("Error fetching prompt:", err);
      setStatus(`Error fetching prompt: ${err.message || err}`);
    }
  }

  /**
   * 2) SAVE/UPDATE PROMPT
   *    - If docId is known, we update that doc with merge=true
   *    - If no docId, we create a new doc with addDoc()
   */
  async function handleSavePrompt() {
    setStatus("");

    if (!jsonData.trim()) {
      setStatus("Please enter valid JSON data before saving.");
      return;
    }

    // Parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonData);
    } catch (err) {
      setStatus("Error: The JSON in the text area is invalid.");
      return;
    }

    // Check that we have a promptKey in the data
    if (!parsed.promptKey) {
      setStatus("Error: 'promptKey' field is missing in the JSON data.");
      return;
    }

    try {
      if (docId) {
        // We already have a doc to update
        const ref = doc(db, "prompts", docId);
        await setDoc(ref, parsed, { merge: true });
        setStatus(`Successfully updated existing doc (ID: ${docId}).`);
      } else {
        // No doc found earlier => create a new doc
        // (We do not define the doc ID ourselves, but you could if you prefer.)
        const ref = await addDoc(collection(db, "prompts"), parsed);
        setDocId(ref.id);
        setStatus(`Created new doc with ID: ${ref.id}.`);
      }
    } catch (err) {
      console.error("Error saving prompt doc:", err);
      setStatus(`Error saving prompt: ${err.message || err}`);
    }
  }

  return (
    <div style={styles.container}>
      <h2>Prompt Manager (No Express)</h2>

      {/* ---- SEARCH BY PROMPT KEY ---- */}
      <div style={styles.block}>
        <h3>1) Fetch Prompt by Key</h3>
        <input
          type="text"
          placeholder="Enter promptKey to search"
          value={promptKeySearch}
          onChange={(e) => setPromptKeySearch(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleFetchPrompt} style={styles.btn}>
          Fetch Document
        </button>
      </div>

      {/* ---- JSON EDITOR ---- */}
      <div style={styles.block}>
        <h3>2) Edit & Save Document JSON</h3>
        <p style={{ margin: "4px 0" }}>
          {docId ? (
            <>
              Currently editing existing doc: <strong>{docId}</strong>
            </>
          ) : (
            "No doc found yet - your save will create a new doc"
          )}
        </p>

        <textarea
          style={styles.textarea}
          rows={12}
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
        />

        <button onClick={handleSavePrompt} style={styles.btn}>
          Save / Update
        </button>
      </div>

      {/* ---- STATUS MESSAGE ---- */}
      {status && <div style={styles.status}>{status}</div>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "30px auto",
    padding: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    color: "#fff",
    fontFamily: "sans-serif"
  },
  block: {
    border: "1px solid #444",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16
  },
  input: {
    width: "100%",
    marginBottom: 8,
    padding: 8,
    border: "1px solid #555",
    borderRadius: 4,
    fontSize: "1rem",
    backgroundColor: "#333",
    color: "#fff"
  },
  textarea: {
    width: "100%",
    marginBottom: 8,
    padding: 8,
    border: "1px solid #555",
    borderRadius: 4,
    fontSize: "0.9rem",
    backgroundColor: "#333",
    color: "#fff",
    whiteSpace: "pre",
    fontFamily: "monospace"
  },
  btn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "1rem"
  },
  status: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#333",
    borderRadius: 4
  }
};