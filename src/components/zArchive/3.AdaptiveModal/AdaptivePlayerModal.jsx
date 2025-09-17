import React, { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";
import BottomBar from "./BottomBar";
import ChatPanel from "./ChatPanel";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.8)",
  zIndex: 2000,
};
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "90%",
  height: "90%",
  transform: "translate(-50%,-50%)",
  backgroundColor: "#000",
  display: "flex",
  flexDirection: "column",
  color: "#fff",
  borderRadius: "8px",
};
const mainAreaStyle = {
  flex: 1,
  display: "flex",
};
const bottomBarStyle = {
  height: "40px",
};

/**
 * AdaptivePlayerModal
 * 
 * Props:
 *  - isOpen (bool)
 *  - onClose (func)
 *  - planId (string)
 *  - userId (string)
 *  - initialActivityContext (object, optional)
 *  - sessionLength (number, default=45)
 *  - daysUntilExam (number, default=7)
 *  - fetchUrl (string, default="/api/adaptive-plan")
 */
export default function AdaptivePlayerModal({
  isOpen,
  onClose,
  planId,
  userId,
  initialActivityContext = null,
  sessionLength = 45,
  daysUntilExam = 7,
  fetchUrl = "/api/adaptive-plan",
}) {
  // 1) Timer
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(sessionLength * 60);
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, sessionLength]);

  // 2) Flattened activities + currentIndex
  const [flattenedActivities, setFlattenedActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  /**
   * handlePlanFlattened
   * Called by LeftPanel once it fetches the plan & flattens it.
   * We store that array locally. We'll also set currentIndex to 0 if any items exist.
   */
  function handlePlanFlattened(flatList) {
    if (!flatList || flatList.length === 0) {
      setFlattenedActivities([]);
      setCurrentIndex(-1);
      return;
    }
    setFlattenedActivities(flatList);
    setCurrentIndex(0);
  }

  /**
   * handleActivitySelect
   * The left panel will pass us the *flatIndex* of the clicked activity, so we just set currentIndex.
   */
  function handleActivitySelect(flatIndex) {
    if (typeof flatIndex === "number" && flatIndex >= 0 && flatIndex < flattenedActivities.length) {
      setCurrentIndex(flatIndex);
    }
  }

  // The item to show in MainContent
  const activityToShow =
    currentIndex >= 0 && currentIndex < flattenedActivities.length
      ? flattenedActivities[currentIndex]
      : null;

  // 3) Next/Prev
  function handleNext() {
    if (currentIndex < flattenedActivities.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    }
  }
  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  }

  // 4) Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help?" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  function handleChatSend() {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  }

  // If not open, return null
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Top bar with countdown & close */}
        <TopBar
          daysUntilExam={daysUntilExam}
          sessionLength={sessionLength}
          secondsLeft={secondsLeft}
          onClose={onClose}
        />

        <div style={mainAreaStyle}>
          {/* Left panel => fetches plan, calls handlePlanFlattened, calls handleActivitySelect */}
          <LeftPanel
            planId={planId}
            fetchUrl={fetchUrl}
            initialActivityContext={initialActivityContext}
            onPlanFlattened={handlePlanFlattened}
            onActivitySelect={handleActivitySelect}
            // Pass currentIndex + flattenedActivities for optional highlighting
            currentIndex={currentIndex}
            flattenedActivities={flattenedActivities}
          />

          <div style={{ position: "relative", flex: 1 }}>
            {/* Right panel => shows the selected activity */}
            <MainContent
              currentItem={activityToShow}
              userId={userId}
              onRefreshData={() => console.log("Refresh data...")}
            />

            {flattenedActivities.length > 1 && (
              <>
                {/* LEFT ARROW */}
                <button
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                >
                  ◀
                </button>
                {/* RIGHT ARROW */}
                <button
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={handleNext}
                  disabled={currentIndex >= flattenedActivities.length - 1}
                >
                  ▶
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar => step percentage */}
        <div style={bottomBarStyle}>
          <BottomBar
            stepPercent={
              flattenedActivities.length
                ? (currentIndex / flattenedActivities.length) * 100
                : 0
            }
            currentIndex={currentIndex}
            totalSteps={flattenedActivities.length}
          />
        </div>

        {/* Chat */}
        <ChatPanel
          open={chatOpen}
          onToggle={() => setChatOpen((o) => !o)}
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={handleChatSend}
        />
      </div>
    </div>
  );
}