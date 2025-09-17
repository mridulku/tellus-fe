/**
 * OnboardingChatContent.jsx
 *
 * A single, chat-based approach that mimics the defensive logic from ProcessAnimation.jsx:
 *   - Filtering out invalid chapters or subchapters
 *   - Sorting them by numeric prefix
 *   - "Typing out" their names step by step
 *   - Then offering a final "Create Plan" flow (like EditAdaptivePlanModal)
 * 
 * If something still triggers “Cannot read properties of undefined (reading 'name')”,
 * wrap this component in the ErrorBoundary below, and add console logs to see which item is undefined.
 */

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import { storage, auth } from "../../../../../firebase";

import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import _ from "lodash";

/** -----------------------------------------------------------
 *  Helper: parse numeric prefix "3. Something" => 3
 *          if invalid => 999999
 * ---------------------------------------------------------- */
function getNumericPrefix(title) {
  if (typeof title !== "string") return 999999;
  const match = title.trim().match(/^(\d+)\./);
  if (!match) return 999999;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? 999999 : num;
}

/** -----------------------------------------------------------
 * OnboardingChatContent
 * ---------------------------------------------------------- */
export default function OnboardingChatContent() {
  // ----------------------------------
  // 1) Basic Config
  // ----------------------------------
  const [currentUserId, setCurrentUserId] = useState("demoUserId");
  const backendURL = import.meta.env.VITE_BACKEND_URL; // adjust for your server
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
      console.log("[Init] Found user =>", user.uid);
    } else {
      console.log("[Init] No auth user => defaulting to 'demoUserId'");
    }
  }, []);

  // ----------------------------------
  // 2) Chat UI State
  // ----------------------------------
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Overall flow:
  //   0 => PDF upload
  //   1 => "Process Animation" steps
  //   2 => Plan creation wizard
  //   3 => done
  const [chatFlowStep, setChatFlowStep] = useState(0);

  // typed user input
  const [userInput, setUserInput] = useState("");

  function addMessage(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
    console.log(`[Chat ${role}] =>`, text);
  }

  useEffect(() => {
    // greet user
    addMessage("system", "Hello! Please upload your PDF to begin.");
  }, []);

  useEffect(() => {
    // keep chat scrolled to bottom
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ----------------------------------
  // 3) PDF Upload
  // ----------------------------------
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bookId, setBookId] = useState("");

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("[FileSelect]", file.name);
    }
  }

  async function handlePDFUpload() {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadPDFtoFirebase(selectedFile);
      addMessage("system", `PDF uploaded at => ${url}`);
      setTimeout(() => {
        addMessage("system", "Analyzing your book content...");
        setChatFlowStep(1);
        fetchLatestBookAndProcess();
      }, 1000);
    } catch (err) {
      console.error("Error uploading =>", err);
      addMessage("system", "Error uploading PDF. Check console logs.");
    } finally {
      setIsUploading(false);
    }
  }

  function uploadPDFtoFirebase(file) {
    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      const path = `pdfUploads/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);
      const metadata = {
        customMetadata: { userId: user?.uid || "anonymous", category: "academic" }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on(
        "state_changed",
        (snap) => {
          const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
          setUploadProgress(Math.round(prog));
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  // ----------------------------------
  // 4) "Process Animation"
  // ----------------------------------
  const [processStep, setProcessStep] = useState(-1);

  const [chapters, setChapters] = useState([]);
  const [typedChapters, setTypedChapters] = useState([]);
  const [subchapterMap, setSubchapterMap] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [numChaptersDetected, setNumChaptersDetected] = useState(0);

  useEffect(() => {
    if (chatFlowStep === 1 && processStep >= 0) {
      runProcessStep(processStep);
    }
  }, [chatFlowStep, processStep]);

  async function fetchLatestBookAndProcess() {
    try {
      const res = await axios.get(`${backendURL}/api/latest-book`, {
        params: { userId: currentUserId }
      });
      const data = res.data || {};
      if (!data.bookId) {
        addMessage("system", "No recently uploaded book found. Can't process.");
        return;
      }
      setBookId(data.bookId);
      handleStartProcessing(data.bookId);
    } catch (err) {
      console.error("Error fetching latest book =>", err);
      addMessage("system", "Error retrieving latest book from server.");
    }
  }

  async function handleStartProcessing(bId) {
    if (!bId) return;
    try {
      const resp = await axios.get(`${backendURL}/api/process-book-data`, {
        params: { userId: currentUserId, bookId: bId }
      });
      const data = resp.data || {};
      console.log("[handleStartProcessing] raw =>", data);

      const raw = Array.isArray(data.chapters) ? data.chapters : [];
      // EXACT defensive approach from ProcessAnimation
      const cleanedChapters = raw
        .filter((c) => c && typeof c.name === "string")
        .map((ch) => {
          const rawSubs = Array.isArray(ch.subchapters) ? ch.subchapters : [];
          const sortedSubs = rawSubs
            .filter((s) => s && typeof s.name === "string")
            .sort((a, b) => {
              const aVal = getNumericPrefix(a.name);
              const bVal = getNumericPrefix(b.name);
              return aVal - bVal;
            });
          return { ...ch, subchapters: sortedSubs };
        })
        .sort((a, b) => {
          const aVal = getNumericPrefix(a.name);
          const bVal = getNumericPrefix(b.name);
          return aVal - bVal;
        });

      setChapters(cleanedChapters);
      setNumChaptersDetected(cleanedChapters.length);

      setTypedChapters([]);
      setSubchapterMap({});
      setExpandedChapters({});

      setProcessStep(0);
    } catch (err) {
      console.error("Error in handleStartProcessing =>", err);
      addMessage("system", "Error analyzing the book content. Check console logs.");
    }
  }

  function runProcessStep(stepI) {
    switch (stepI) {
      case 0:
        addMessage("system", "Step 1: Upload Complete ✅");
        setTimeout(() => setProcessStep(1), 1000);
        break;
      case 1:
        addMessage("system", "Step 2: Analyzing Content...");
        setTimeout(() => setProcessStep(2), 1000);
        break;
      case 2:
        addMessage("system", `Step 3: ${numChaptersDetected} Chapters Detected.`);
        setTimeout(() => setProcessStep(3), 1000);
        break;
      case 3: {
        // Type out each chapter name
        setTypedChapters([]);
        let index = 0;
        const interval = setInterval(() => {
          if (!chapters[index]) {
            clearInterval(interval);
            setTimeout(() => setProcessStep(4), 500);
            return;
          }
          setTypedChapters((prev) => [...prev, chapters[index].name]);
          index++;
          if (index >= chapters.length) {
            clearInterval(interval);
            setTimeout(() => setProcessStep(4), 500);
          }
        }, 150);
        break;
      }
      case 4:
        addMessage("system", "Step 4: Analyzing Chapters...");
        setTimeout(() => setProcessStep(5), 1000);
        break;
      case 5:
        addMessage("system", "Step 5: Detecting Sub-chapters...");
        (async () => {
          let newObj = {};
          for (let i = 0; i < chapters.length; i++) {
            const c = chapters[i];
            if (!c || !Array.isArray(c.subchapters)) continue;
            const subNames = c.subchapters.map((s) => s.name);
            newObj[c.name] = subNames;
            setSubchapterMap({ ...newObj });
            await new Promise((r) => setTimeout(r, 200));
          }
          setTimeout(() => setProcessStep(6), 800);
        })();
        break;
      case 6:
        addMessage("system", "Step 6: Analyzing Sub-chapters...");
        setTimeout(() => setProcessStep(7), 1000);
        break;
      case 7:
        addMessage("system", "Step 7: All Content Absorbed!");
        setTimeout(() => setProcessStep(8), 1000);
        break;
      case 8:
        addMessage("system", "Step 8: Book analysis complete. Ready to create your plan?");
        setChatFlowStep(2);
        break;
      default:
        break;
    }
  }

  function handleToggleExpand(chName) {
    setExpandedChapters((prev) => ({
      ...prev,
      [chName]: !prev[chName],
    }));
  }

  // ----------------------------------
  // 5) Plan Wizard
  // ----------------------------------
  const [planWizardStep, setPlanWizardStep] = useState(0);

  // We'll skip some details, but you can replicate the logic from "EditAdaptivePlanModal"
  const [chapterSelection, setChapterSelection] = useState({});
  const [subchapterSelection, setSubchapterSelection] = useState({});

  const [targetDate, setTargetDate] = useState("");
  const [dailyReading, setDailyReading] = useState(30);
  const [masteryLevel, setMasteryLevel] = useState("mastery");
  const [isPlanCreating, setIsPlanCreating] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [createdPlan, setCreatedPlan] = useState(null);

  const [planAggregation, setPlanAggregation] = useState(null);

  useEffect(() => {
    // if we just entered chatFlowStep=2 => select all chapters by default
    if (chatFlowStep === 2 && planWizardStep === 0 && chapters.length > 0) {
      const allChapters = {};
      const allSubs = {};
      chapters.forEach((ch) => {
        allChapters[ch.id] = true;
        allSubs[ch.id] = {};
        ch.subchapters.forEach((sub) => {
          allSubs[ch.id][sub.id] = true;
        });
      });
      setChapterSelection(allChapters);
      setSubchapterSelection(allSubs);
    }
  }, [chatFlowStep, planWizardStep, chapters]);

  async function handleCreatePlan() {
    setIsPlanCreating(true);
    setPlanError(null);
    try {
      // ... create logic
      addMessage("system", "Plan creation not fully implemented in this snippet!");
      // But if you want a real call:
      // const resp = await axios.post("somePlanURL", { userId, bookId, ... });
      // setCreatedPlan(resp.data.plan);
      // then fetch aggregator, etc.
      setPlanWizardStep(3); // show summary
    } catch (err) {
      console.error("Plan creation error =>", err);
      setPlanError(err.message || "Plan creation failed");
    } finally {
      setIsPlanCreating(false);
    }
  }

  // aggregator
  function computeAggregation(plan) {
    // ...
    return null;
  }

  // ----------------------------------
  // handleSend => interpret user typed input if we want
  // ----------------------------------
  function handleSend(e) {
    e.preventDefault();
    const txt = userInput.trim();
    if (!txt) return;
    addMessage("user", txt);
    setUserInput("");

    if (chatFlowStep === 2) {
      handlePlanWizardInput(txt);
    }
  }

  function handlePlanWizardInput(txt) {
    switch (planWizardStep) {
      case 0:
        if (/all/i.test(txt)) {
          selectAllChapters();
          addMessage("system", "All chapters selected. Next => set schedule & mastery.");
          setPlanWizardStep(1);
        } else if (/done/i.test(txt)) {
          addMessage("system", "Ok, let's set schedule => next step.");
          setPlanWizardStep(1);
        } else {
          addMessage("system", "Type 'all' or 'done' when finished toggling chapters.");
        }
        break;
      case 1:
        // user sets date etc. in UI, or we parse from txt
        addMessage("system", "Understood. Next => confirm & create plan.");
        setPlanWizardStep(2);
        break;
      case 2:
        if (/yes|create|ok/i.test(txt)) {
          handleCreatePlan();
        } else {
          addMessage("system", "Type 'yes' or 'create' to confirm plan creation.");
        }
        break;
      default:
        break;
    }
  }

  function selectAllChapters() {
    const allCh = {};
    const allSubs = {};
    chapters.forEach((c) => {
      allCh[c.id] = true;
      allSubs[c.id] = {};
      c.subchapters.forEach((sub) => {
        allSubs[c.id][sub.id] = true;
      });
    });
    setChapterSelection(allCh);
    setSubchapterSelection(allSubs);
  }

  // ----------------------------------
  // Rendering
  // ----------------------------------
  function renderMessages() {
    return messages.map((m, idx) => {
      const isSystem = m.role === "system";
      return (
        <div
          key={idx}
          style={{
            ...bubbleStyle,
            alignSelf: isSystem ? "flex-start" : "flex-end",
            backgroundColor: isSystem ? "rgba(255,255,255,0.2)" : "#0084FF"
          }}
        >
          {m.text}
        </div>
      );
    });
  }

  function renderPDFUploadStep() {
    if (chatFlowStep !== 0) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <input type="file" accept="application/pdf" onChange={handleFileSelect} />
        {selectedFile && !isUploading && (
          <button style={{ marginLeft: 8 }} onClick={handlePDFUpload}>
            <CloudUploadIcon style={{ verticalAlign: "middle", marginRight: 4 }} />
            Upload
          </button>
        )}
        {isUploading && (
          <div style={{ marginTop: 8 }}>
            <CircularProgress size={20} /> {uploadProgress}%
          </div>
        )}
      </div>
    );
  }

  function renderProcessAnimationStep() {
    if (chatFlowStep !== 1) return null;
    return (
      <div style={{ marginTop: 10 }}>
        {/* Step 2 => show "Analyze Content in steps"? 
            We'll show typedChapters & subchapterMap, etc. */}
        <p>
          <strong>Process Animation: typed out chapters & sub-chapters below</strong>
        </p>
        {typedChapters.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <strong>Chapters typed out so far:</strong>
            {typedChapters.map((chName, i) => (
              <div key={i} style={{ marginLeft: 12 }}>
                - {chName}
              </div>
            ))}
          </div>
        )}
        {Object.keys(subchapterMap).length > 0 && (
          <div>
            <strong>Sub-chapters detected:</strong>
            {Object.keys(subchapterMap).map((chName) => {
              const subs = subchapterMap[chName] || [];
              const isExp = expandedChapters[chName] || false;
              return (
                <div key={chName} style={{ marginTop: 4 }}>
                  <div
                    style={{ display: "flex", cursor: "pointer" }}
                    onClick={() => handleToggleExpand(chName)}
                  >
                    {chName} ({subs.length})
                  </div>
                  {isExp && (
                    <div style={{ marginLeft: 20 }}>
                      {subs.map((sn, idx2) => (
                        <div key={idx2}>- {sn}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderPlanWizard() {
    if (chatFlowStep !== 2) return null;

    return (
      <div style={{ marginTop: 10 }}>
        {planWizardStep === 0 && (
          <>
            <p>Plan Wizard Step 1: Select chapters. Type 'all' or 'done' once finished.</p>
            {renderChapterSelectionUI()}
          </>
        )}
        {planWizardStep === 1 && (
          <>
            <p>Step 2: Provide schedule details (or just pick in UI) then proceed.</p>
            <div style={{ marginBottom: 6 }}>
              <label>Target Date: </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label>Daily Reading (min): </label>
              <input
                type="number"
                value={dailyReading}
                onChange={(e) => setDailyReading(Number(e.target.value))}
              />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label>Mastery Level: </label>
              <select value={masteryLevel} onChange={(e) => setMasteryLevel(e.target.value)}>
                <option value="mastery">mastery</option>
                <option value="revision">revision</option>
                <option value="glance">glance</option>
              </select>
            </div>
            <button onClick={() => setPlanWizardStep(2)}>Next: Confirm & Create</button>
          </>
        )}
        {planWizardStep === 2 && (
          <>
            <p>
              Step 3: Confirm Plan
              <br />
              <strong>Target Date:</strong> {targetDate || "N/A"}
              <br />
              <strong>Daily Reading:</strong> {dailyReading} min
              <br />
              <strong>Mastery:</strong> {masteryLevel}
            </p>
            {isPlanCreating ? (
              <div>
                <CircularProgress size={20} /> Creating plan...
              </div>
            ) : (
              <button onClick={handleCreatePlan}>Create Plan</button>
            )}
            {planError && <p style={{ color: "red" }}>{planError}</p>}
          </>
        )}
        {planWizardStep === 3 && (
          <>
            <h4>Plan Created!</h4>
            <p>(You could show aggregator data here, etc.)</p>
          </>
        )}
      </div>
    );
  }

  function renderChapterSelectionUI() {
    if (!chapters.length) {
      return <p>No chapters loaded or none found.</p>;
    }
    return (
      <div style={{ border: "1px solid #444", padding: 8, marginTop: 6 }}>
        {chapters.map((ch) => {
          const cSelected = chapterSelection[ch.id] || false;
          return (
            <div
              key={ch.id}
              style={{
                border: "1px solid #555",
                borderRadius: 4,
                marginBottom: 6,
                padding: 6
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={cSelected}
                  onChange={() => toggleChapter(ch.id)}
                />
                <strong style={{ marginLeft: 6 }}>{ch.name}</strong>
              </label>
              {cSelected && (
                <div style={{ marginLeft: 20, marginTop: 4 }}>
                  {ch.subchapters.map((sub) => {
                    const sSelected = subchapterSelection[ch.id]?.[sub.id] || false;
                    return (
                      <div key={sub.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={sSelected}
                            onChange={() => toggleSubchapter(ch.id, sub.id)}
                          />
                          <span style={{ marginLeft: 6 }}>{sub.name}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function toggleChapter(chId) {
    setChapterSelection((prev) => {
      const oldVal = prev[chId];
      const newVal = !oldVal;
      return { ...prev, [chId]: newVal };
    });
    // if turning off => subchapters off
    if (chapterSelection[chId]) {
      setSubchapterSelection((prev2) => ({
        ...prev2,
        [chId]: Object.fromEntries(Object.keys(prev2[chId]).map((sId) => [sId, false]))
      }));
    } else {
      // turning on => subchapters all on
      const found = chapters.find((cc) => cc.id === chId);
      if (found) {
        const subsOn = {};
        found.subchapters.forEach((sub) => {
          subsOn[sub.id] = true;
        });
        setSubchapterSelection((prev2) => ({
          ...prev2,
          [chId]: subsOn
        }));
      }
    }
  }

  function toggleSubchapter(chId, subId) {
    setSubchapterSelection((prev) => {
      const oldVal = prev[chId][subId];
      const newVal = !oldVal;
      const updated = { ...prev[chId], [subId]: newVal };
      const anyTrue = Object.values(updated).some(Boolean);
      setChapterSelection((prevChap) => ({
        ...prevChap,
        [chId]: anyTrue
      }));
      return {
        ...prev,
        [chId]: updated
      };
    });
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>Onboarding Chat - Using ProcessAnimation Logic</h2>
      <div style={chatContainerStyle}>
        {renderMessages()}
        {renderPDFUploadStep()}
        {renderProcessAnimationStep()}
        {renderPlanWizard()}
        <div ref={chatEndRef} />
      </div>

      <form style={chatFormStyle} onSubmit={handleSend}>
        <input
          type="text"
          style={chatInputStyle}
          placeholder="Type a message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" style={chatSendButtonStyle}>
          Send
        </button>
      </form>
    </div>
  );
}

/** -----------------------------------------------------------
 * Basic styling
 * ---------------------------------------------------------- */
const chatContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "600px",
  overflowY: "auto",
  marginBottom: "10px",
  border: "1px solid #333",
  backgroundColor: "#222",
  borderRadius: "6px",
  padding: "12px",
  color: "#fff",
};

const chatFormStyle = {
  display: "flex",
  gap: "8px",
  marginTop: 10
};

const chatInputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc"
};

const chatSendButtonStyle = {
  backgroundColor: "#0084FF",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer"
};

const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "6px",
  margin: "4px 0",
  wordWrap: "break-word",
  fontSize: "0.9rem"
};

/** -----------------------------------------------------------
 * OPTIONAL: ErrorBoundary
 * If you still see "Cannot read property of undefined," wrap
 * <OnboardingChatContent> in <ErrorBoundary> so your entire
 * app won't crash. 
 * ---------------------------------------------------------- */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] =>", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 10 }}>
          <h3>Something went wrong in OnboardingChatContent</h3>
          <p>{String(this.state.error)}</p>
          <p>Please reload or contact support if this persists.</p>
        </div>
      );
    }
    return this.props.children;
  }
}