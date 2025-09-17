import React, { useState } from 'react';

/**
 * Bloom’s-based sample prompts (or any other prompt templates you like).
 * You can expand or customize these.
 */
const PROMPTS = [
  {
    label: "Bloom's: Remember & Understand",
    value: `You are a helpful assistant. Given the following text, generate 3 multiple-choice questions 
            that test a learner's basic recall and comprehension (Bloom's Remember/Understand). 
            Return the questions, options, and correct answers in JSON format. 
            Keep them concise.`
  },
  {
    label: "Bloom's: Apply",
    value: `Generate 2 scenario-based questions that require the learner to apply the concepts 
            from the provided text to a new situation. Provide them in JSON format with short 
            answer prompts and suggested correct solutions.`
  },
  {
    label: "Bloom's: Analyze",
    value: `Create 2 questions that require analysis of the text's arguments or evidence. 
            Each question should be open-ended. Provide a short reference answer or key points 
            the user should mention. Return in JSON format.`
  },
  {
    label: "Bloom's: Evaluate",
    value: `Formulate 2 questions that ask the learner to evaluate or critique the ideas in the text. 
            Provide sample 'ideal' answers in JSON format.`
  },
  {
    label: "Custom / Freeform",
    value: `Please generate questions or tasks in any style you see fit, 
            focusing on checking deeper understanding. Return results in JSON.`
  }
];

function GptQuestionGenerator() {
  const [content, setContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0].value);
  const [apiKey, setApiKey] = useState("");  // For quick local testing
  const [gptResponse, setGptResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setGptResponse("");

    try {
      // Construct the prompt to send to GPT
      const fullPrompt = `
        ${selectedPrompt}

        Text Content:
        ${content}
      `;

      // Call the OpenAI API
      // For ChatGPT-style endpoints:
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or "gpt-4" if you have access
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const data = await response.json();
      // Extract the assistant's reply
      const reply = data.choices[0]?.message?.content || "";
      setGptResponse(reply);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h1>GPT Question Generator</h1>
      
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          OpenAI API Key (temporary for testing):
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <small style={{ color: "#666" }}>
          For local testing only. Do NOT deploy your key in production front-ends.
        </small>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Select Prompt:</label>
        <select
          value={selectedPrompt}
          onChange={(e) => setSelectedPrompt(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        >
          {PROMPTS.map((p) => (
            <option key={p.label} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Content (Subchapter / Chapter):</label>
        <textarea
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
          placeholder="Paste your content here..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !apiKey}
        style={{ padding: "0.75rem 1.5rem", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Generating..." : "Generate Questions"}
      </button>

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {gptResponse && !error && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          <h2>GPT Response</h2>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              background: "#f9f9f9"
            }}
          >
            {gptResponse}
          </div>
        </div>
      )}
    </div>
  );
}

export default GptQuestionGenerator;