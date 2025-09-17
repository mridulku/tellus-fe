import React, { useState } from "react";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../../firebase";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const UPSC_SUBJECTS = [
  "History",
  "Polity & Governance",
  "Geography",
  "Economics",
  "Environment & Ecology",
  "General Science",
  "Current Affairs",
];
const JEE_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

/**
 * Steps:
 *  0) name
 *  1) exam
 *  2) subject
 *  3) dailyHours
 *  4) preparationGoal
 *  5) additionalNote
 *  6) pdfUpload
 *  7) confirmFinish => final "Yes, finalize" or "No, go back?"
 */
export default function OverviewContent() {
  console.log("Rendering Chat...");

  // Chat messages
  const [messages, setMessages] = useState([
    { role: "system", text: "Hi! Let's begin. What's your name?" },
  ]);

  // Data
  const [formData, setFormData] = useState({
    name: "",
    exam: "",
    subject: "",
    dailyHours: "",
    preparationGoal: "",
    additionalNote: "",
    pdfFile: null,
  });

  // The steps
  const steps = [
    { field: "name", question: "What's your name?", type: "text" },
    {
      field: "exam",
      question: "Which exam are you preparing for?",
      type: "options",
      options: ["UPSC", "IIT JEE"],
    },
    {
      field: "subject",
      question: "Which subject are you focusing on?",
      type: "conditionalOptions",
    },
    { field: "dailyHours", question: "How many hours can you study daily?", type: "text" },
    {
      field: "preparationGoal",
      question: "What's your preparation goal?",
      type: "options",
      options: ["revise", "start afresh", "deep mastery"],
    },
    {
      field: "additionalNote",
      question: "Any additional notes that might help us personalize your plan?",
      type: "text",
    },
    {
      field: "pdfUpload",
      question: "Please upload your PDF now (only 1).",
      type: "pdfUpload",
    },
    {
      field: "confirmFinish",
      question: "Everything set. Ready to finalize?",
      type: "options",
      options: ["Yes, finalize", "No, go back"],
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Add message to chat
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
    console.log(`[Chat] ${role.toUpperCase()} => ${text}`);
  };

  // Move steps or finalize
  async function handleUserAnswer(answer) {
    const step = steps[stepIndex];
    console.log(`[handleUserAnswer] stepIndex=${stepIndex}, type=${step.type}, field=${step.field}, answer=${answer}`);

    // If not pdfUpload or confirmFinish, store in formData
    if (step.field !== "pdfUpload" && step.field !== "confirmFinish") {
      setFormData((prev) => ({ ...prev, [step.field]: answer }));
    }

    // Next step
    const nextIndex = stepIndex + 1;

    // Special logic for "confirmFinish"
    if (step.field === "confirmFinish") {
      if (answer.startsWith("Yes")) {
        // yes => finalize
        console.log("User selected finalize => finalizeSubmission()");
        addMessage("system", "Great! We will now submit your data.");
        await finalizeSubmission();
        return;
      } else {
        // "No, go back" => maybe go back to step 6 (pdfUpload) or some earlier step
        // For simplicity, let's just go back one step
        const backIndex = stepIndex - 1;
        setStepIndex(backIndex);
        addMessage("system", steps[backIndex].question);
        return;
      }
    }

    // If we haven't reached last step
    if (nextIndex < steps.length) {
      setStepIndex(nextIndex);
      const nextStep = steps[nextIndex];
      console.log(`Moving to stepIndex=${nextIndex}, type=${nextStep.type}, field=${nextStep.field}`);

      if (nextStep.type === "conditionalOptions" && nextStep.field === "subject") {
        // show subject choices
        const examChoice = step.field === "exam" ? answer : formData.exam;
        if (examChoice === "UPSC") {
          addMessage("system", "Which UPSC subject do you prefer?");
        } else if (examChoice === "IIT JEE") {
          addMessage("system", "Which JEE subject do you prefer?");
        } else {
          addMessage("system", nextStep.question);
        }
      } else if (nextStep.type === "pdfUpload") {
        addMessage("system", nextStep.question);
      } else if (nextStep.type === "options") {
        addMessage("system", nextStep.question);
      } else {
        // normal text question
        addMessage("system", nextStep.question);
      }
    } else {
      // If nextIndex == steps.length => This means we got to the end anyway
      console.log("No more steps => finalizeSubmission ???");
      addMessage("system", "We will now finalize your data...");
      await finalizeSubmission();
    }
  }

  // For typed input
  function handleSend(e) {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setUserInput("");
    handleUserAnswer(trimmed);
  }

  // If user picks an option
  function handleOptionClick(opt) {
    addMessage("user", opt);
    handleUserAnswer(opt);
  }

  // File upload function
  async function uploadPDFWithMetadata(file, fileName) {
    console.log("Starting PDF upload for:", fileName);
    return new Promise((resolve, reject) => {
      if (!file) {
        console.log("No file => skip upload...");
        resolve("");
        return;
      }
      const user = auth.currentUser;
      const path = `pdfUploads/${fileName}/${file.name}`;
      console.log("Initiating upload at path:", path);

      const storageRef = firebaseRef(storage, path);
      const metadata = {
        customMetadata: {
          category: "Academic",
          courseName: fileName,
          userId: user?.uid || "noUser",
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          console.log(`[UploadProgress] ${file.name} => ${progress}%`);
        },
        (err) => {
          console.error("Error uploading PDF:", err);
          reject(err);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("[UploadComplete] =>", downloadURL);
          resolve(downloadURL);
        }
      );
    });
  }

  // Final submission
  async function finalizeSubmission() {
    console.log("finalizeSubmission() triggered...");
    addMessage("system", "Uploading your PDF...");

    try {
      let pdfLink = "";
      if (formData.pdfFile) {
        const fileName = formData.pdfFile.name || "CourseDoc";
        pdfLink = await uploadPDFWithMetadata(formData.pdfFile, fileName);
      }

      console.log("PDF upload done =>", pdfLink);
      const payload = {
        category: "academic",
        answers: {
          exam: formData.exam,
          subject: formData.subject,
          dailyHours: formData.dailyHours,
          preparationGoal: formData.preparationGoal,
          additionalNote: formData.additionalNote,
          pdfLink: pdfLink,
          name: formData.name,
        },
      };

      console.log("Sending to /api/learnerpersona =>", payload);
      const token = localStorage.getItem("token") || "";
      const resp = await axios.post(`${backendURL}/api/learnerpersona`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (resp.data.success) {
        addMessage("system", "All set! Your onboarding is complete.");
        setOnboardingComplete(true);
      } else {
        console.log("Resp not success =>", resp.data);
        addMessage("system", "Something went wrong storing your info.");
      }
    } catch (err) {
      console.error("Error finalizeSubmission =>", err);
      addMessage("system", "Error uploading or submitting. Check console logs.");
    }
  }

  // For pdfUpload step
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file picked in handleFileSelect");
      return;
    }
    console.log("handleFileSelect =>", file.name);

    addMessage("user", `Selected file: ${file.name}`);
    setFormData((prev) => ({ ...prev, pdfFile: file }));

    // We treat that as an "answer"
    await handleUserAnswer("PDF_FILE_CHOSEN");
  }

  // Figure out current step
  const currentStep = steps[stepIndex];
  const isOptionsStep = currentStep?.type === "options";
  const isConditional = currentStep?.type === "conditionalOptions";
  const isPdfStep = currentStep?.type === "pdfUpload";

  // If step is "confirmFinish" => we show yes/no buttons
  const isConfirmFinish = currentStep?.field === "confirmFinish";

  // If the user is done or the step requires picking an option/file, disable typing
  const disableTextInput =
    onboardingComplete || isOptionsStep || isConditional || isPdfStep || isConfirmFinish;

  // For subject selection
  let dynamicSubjects = [];
  if (currentStep?.field === "subject") {
    if (formData.exam === "UPSC") dynamicSubjects = UPSC_SUBJECTS;
    if (formData.exam === "IIT JEE") dynamicSubjects = JEE_SUBJECTS;
  }

  return (
    <div style={containerStyle}>
      <h2>Chat Onboarding (with Confirm Step)</h2>

      <div style={chatBoxStyle}>
        {messages.map((msg, idx) => {
          const isSystem = (msg.role === "system");
          return (
            <div
              key={idx}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? "flex-start" : "flex-end",
                backgroundColor: isSystem ? "rgba(255,255,255,0.2)" : "#0084FF",
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* If step is an "options" step */}
        {isOptionsStep && !onboardingComplete && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {currentStep.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionClick(opt)}
                style={optionButtonStyle}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* If step is conditional for "subject" => show dynamic subjects */}
        {isConditional && currentStep.field === "subject" && dynamicSubjects.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {dynamicSubjects.map((subj) => (
              <button
                key={subj}
                onClick={() => handleOptionClick(subj)}
                style={optionButtonStyle}
              >
                {subj}
              </button>
            ))}
          </div>
        )}

        {/* If step is pdfUpload => show file input */}
        {isPdfStep && !onboardingComplete && (
          <div style={{ marginTop: 10 }}>
            <input type="file" accept="application/pdf" onChange={handleFileSelect} />
          </div>
        )}

        {/* If step is confirmFinish => show "Yes, finalize" or "No, go back" */}
        {isConfirmFinish && !onboardingComplete && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {currentStep.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionClick(opt)}
                style={optionButtonStyle}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <form style={formStyle} onSubmit={handleSend}>
        <input
          type="text"
          disabled={disableTextInput}
          style={inputStyle}
          placeholder={
            onboardingComplete
              ? "Onboarding finished..."
              : disableTextInput
              ? "Use buttons above..."
              : "Type your response..."
          }
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" style={buttonStyle} disabled={disableTextInput}>
          Send
        </button>
      </form>
    </div>
  );
}

/** Basic styles below... */
const containerStyle = {
  width: "400px",
  margin: "40px auto",
  backgroundColor: "rgba(0,0,0,0.3)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "sans-serif",
};

const chatBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "400px",
  overflowY: "auto",
  marginBottom: "10px",
};

const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "6px",
  color: "#fff",
  margin: "4px 0",
  wordWrap: "break-word",
};

const formStyle = {
  display: "flex",
  gap: "8px",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "none",
  outline: "none",
};

const buttonStyle = {
  backgroundColor: "#0084FF",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};

const optionButtonStyle = {
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};