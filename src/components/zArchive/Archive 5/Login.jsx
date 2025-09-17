import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the token so user is no longer authenticated
    localStorage.removeItem("token");
    // Optionally remove userData too, if set
    localStorage.removeItem("userData");

    // Redirect back to the landing page
    navigate("/");
  };

  const chats = [
    // Original 17 items (unchanged)
    { id: 1, label: "A. Content Creation & Clarity: A1. Structural Coherence" },
    { id: 2, label: "A. Content Creation & Clarity: A2. Conciseness & Brevity" },
    { id: 3, label: "A. Content Creation & Clarity: A3. Vocabulary & Grammar" },
    { id: 4, label: "A. Content Creation & Clarity: A4. Tone & Style" },
    { id: 5, label: "A. Content Creation & Clarity: A5. Logical Persuasion" },
    { id: 6, label: "B. Understanding & Interpretation: B1. Active Listening / Reading" },
    { id: 7, label: "B. Understanding & Interpretation: B2. Questioning & Clarification" },
    { id: 8, label: "B. Understanding & Interpretation: B3. Emotional & Subtextual Awareness" },
    { id: 9, label: "B. Understanding & Interpretation: B4. Contextual Intelligence" },
    { id: 10, label: "C. Contextual & Relational Adaptation: C1. Audience Awareness" },
    { id: 11, label: "C. Contextual & Relational Adaptation: C2. Channel & Medium Adaptation" },
    { id: 12, label: "C. Contextual & Relational Adaptation: C3. Cultural & Normative Sensitivity" },
    { id: 13, label: "C. Contextual & Relational Adaptation: C4. Relational Dynamics" },
    { id: 14, label: "D. Emotional & Interpersonal Dynamics: D1. Emotional Regulation" },
    { id: 15, label: "D. Emotional & Interpersonal Dynamics: D2. Empathy & Perspective-Taking" },
    { id: 16, label: "D. Emotional & Interpersonal Dynamics: D3. Conflict Resolution Approaches" },
    { id: 17, label: "D. Emotional & Interpersonal Dynamics: D4. Influence & Trust-Building" },
  
    // From 18 onward: Tutorial lines for each micro-concept
    // A1. Structural Coherence
    { id: 18, label: "Tutorial: A1. Structural Coherence - Identify Core Sections" },
    { id: 19, label: "Tutorial: A1. Structural Coherence - Sequential Flow" },
    { id: 20, label: "Tutorial: A1. Structural Coherence - Using Transitions" },
    { id: 21, label: "Tutorial: A1. Structural Coherence - Nesting Ideas" },
  
    // A2. Conciseness & Brevity
    { id: 22, label: "Tutorial: A2. Conciseness & Brevity - Eliminating Filler" },
    { id: 23, label: "Tutorial: A2. Conciseness & Brevity - One-Point-Per-Sentence" },
    { id: 24, label: "Tutorial: A2. Conciseness & Brevity - Summarizing" },
    { id: 25, label: "Tutorial: A2. Conciseness & Brevity - Trimming Redundancies" },
  
    // A3. Vocabulary & Grammar
    { id: 26, label: "Tutorial: A3. Vocabulary & Grammar - Word Choice" },
    { id: 27, label: "Tutorial: A3. Vocabulary & Grammar - Common Grammar Pitfalls" },
    { id: 28, label: "Tutorial: A3. Vocabulary & Grammar - Synonyms & Shades of Meaning" },
    { id: 29, label: "Tutorial: A3. Vocabulary & Grammar - Consistency" },
  
    // A4. Tone & Style
    { id: 30, label: "Tutorial: A4. Tone & Style - Formal vs. Informal" },
    { id: 31, label: "Tutorial: A4. Tone & Style - Positive, Neutral, or Negative Tone" },
    { id: 32, label: "Tutorial: A4. Tone & Style - Stylistic Elements" },
    { id: 33, label: "Tutorial: A4. Tone & Style - Consistency in Style" },
  
    // A5. Logical Persuasion
    { id: 34, label: "Tutorial: A5. Logical Persuasion - Claims & Evidence" },
    { id: 35, label: "Tutorial: A5. Logical Persuasion - Connecting Reasoning" },
    { id: 36, label: "Tutorial: A5. Logical Persuasion - Anticipating Objections" },
    { id: 37, label: "Tutorial: A5. Logical Persuasion - Use of Examples" },
  
    // B1. Active Listening / Reading
    { id: 38, label: "Tutorial: B1. Active Listening / Reading - Paraphrasing" },
    { id: 39, label: "Tutorial: B1. Active Listening / Reading - Minimal Encouragers" },
    { id: 40, label: "Tutorial: B1. Active Listening / Reading - Focusing Attention" },
    { id: 41, label: "Tutorial: B1. Active Listening / Reading - Summarizing Key Points" },
  
    // B2. Questioning & Clarification
    { id: 42, label: "Tutorial: B2. Questioning & Clarification - Open vs. Closed Questions" },
    { id: 43, label: "Tutorial: B2. Questioning & Clarification - Clarifying Ambiguities" },
    { id: 44, label: "Tutorial: B2. Questioning & Clarification - Probing Questions" },
    { id: 45, label: "Tutorial: B2. Questioning & Clarification - Avoiding Leading Questions" },
  
    // B3. Emotional & Subtextual Awareness
    { id: 46, label: "Tutorial: B3. Emotional & Subtextual Awareness - Reading Emotional Cues" },
    { id: 47, label: "Tutorial: B3. Emotional & Subtextual Awareness - Detecting Unspoken Concerns" },
    { id: 48, label: "Tutorial: B3. Emotional & Subtextual Awareness - Handling Subtext" },
    { id: 49, label: "Tutorial: B3. Emotional & Subtextual Awareness - Checking In" },
  
    // B4. Contextual Intelligence
    { id: 50, label: "Tutorial: B4. Contextual Intelligence - Situational Awareness" },
    { id: 51, label: "Tutorial: B4. Contextual Intelligence - Cultural/Social Norms" },
    { id: 52, label: "Tutorial: B4. Contextual Intelligence - Audience Roles" },
    { id: 53, label: "Tutorial: B4. Contextual Intelligence - Assessing External Factors" },
  
    // C1. Audience Awareness
    { id: 54, label: "Tutorial: C1. Audience Awareness - Identifying Audience Knowledge Level" },
    { id: 55, label: "Tutorial: C1. Audience Awareness - Spotting Audience Interests" },
    { id: 56, label: "Tutorial: C1. Audience Awareness - Avoiding Assumptions" },
    { id: 57, label: "Tutorial: C1. Audience Awareness - Catering Tone" },
  
    // C2. Channel & Medium Adaptation
    { id: 58, label: "Tutorial: C2. Channel & Medium Adaptation - Medium Constraints" },
    { id: 59, label: "Tutorial: C2. Channel & Medium Adaptation - Length & Format" },
    { id: 60, label: "Tutorial: C2. Channel & Medium Adaptation - Asynchronous vs. Synchronous" },
    { id: 61, label: "Tutorial: C2. Channel & Medium Adaptation - Etiquette" },
  
    // C3. Cultural & Normative Sensitivity
    { id: 62, label: "Tutorial: C3. Cultural & Normative Sensitivity - Avoiding Cultural Faux Pas" },
    { id: 63, label: "Tutorial: C3. Cultural & Normative Sensitivity - Formality Levels" },
    { id: 64, label: "Tutorial: C3. Cultural & Normative Sensitivity - Taboos & Topics" },
    { id: 65, label: "Tutorial: C3. Cultural & Normative Sensitivity - Respectful Language" },
  
    // C4. Relational Dynamics
    { id: 66, label: "Tutorial: C4. Relational Dynamics - Navigating Hierarchy" },
    { id: 67, label: "Tutorial: C4. Relational Dynamics - Power Distance" },
    { id: 68, label: "Tutorial: C4. Relational Dynamics - Managing Up vs. Sideways" },
    { id: 69, label: "Tutorial: C4. Relational Dynamics - Balancing Formal/Informal" },
  
    // D1. Emotional Regulation
    { id: 70, label: "Tutorial: D1. Emotional Regulation - Identifying Personal Triggers" },
    { id: 71, label: "Tutorial: D1. Emotional Regulation - Self-Calming Techniques" },
    { id: 72, label: "Tutorial: D1. Emotional Regulation - De-escalation" },
    { id: 73, label: "Tutorial: D1. Emotional Regulation - Positive Reframing" },
  
    // D2. Empathy & Perspective-Taking
    { id: 74, label: "Tutorial: D2. Empathy & Perspective-Taking - Acknowledging Feelings" },
    { id: 75, label: "Tutorial: D2. Empathy & Perspective-Taking - Seeing Others’ Viewpoints" },
    { id: 76, label: "Tutorial: D2. Empathy & Perspective-Taking - Validation Statements" },
    { id: 77, label: "Tutorial: D2. Empathy & Perspective-Taking - Refocusing" },
  
    // D3. Conflict Resolution Approaches
    { id: 78, label: "Tutorial: D3. Conflict Resolution Approaches - Problem vs. Person" },
    { id: 79, label: "Tutorial: D3. Conflict Resolution Approaches - Win-Win Mindset" },
    { id: 80, label: "Tutorial: D3. Conflict Resolution Approaches - Collaborative Language" },
    { id: 81, label: "Tutorial: D3. Conflict Resolution Approaches - Stepping Away vs. Engaging" },
  
    // D4. Influence & Trust-Building
    { id: 82, label: "Tutorial: D4. Influence & Trust-Building - Rapport & Authenticity" },
    { id: 83, label: "Tutorial: D4. Influence & Trust-Building - Consistency" },
    { id: 84, label: "Tutorial: D4. Influence & Trust-Building - Mutual Benefit" },
    { id: 85, label: "Tutorial: D4. Influence & Trust-Building - Demonstrating Expertise" }
  ];

  return (
    <div style={{ textAlign: "center", marginTop: "20%" }}>
      <h1>Welcome to the Chat App</h1>
      
      {/* ===== New Button to go to BooksViewer ===== */}
      <button
        onClick={() => navigate("/books")}
        style={{
          display: "inline-block",
          padding: "8px 16px",
          margin: "10px",
          cursor: "pointer"
        }}
      >
        View Books
      </button>
      {/* ========================================= */}

      {/* ===== New Button to go to BooksViewer ===== */}
      <button
        onClick={() => navigate("/upload-pdf")}
        style={{
          display: "inline-block",
          padding: "8px 16px",
          margin: "10px",
          cursor: "pointer"
        }}
      >
        View Books
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          display: "inline-block",
          padding: "8px 16px",
          margin: "10px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>

      {/* List of Chat Buttons */}
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => navigate(`/chat/${chat.id}`)}
          style={{
            display: "block",
            margin: "10px auto",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {chat.label}
        </button>
      ))}
    </div>
  );
}

export default Login;




