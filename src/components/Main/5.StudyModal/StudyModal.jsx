/*  StudyModal.jsx  – “PlanFetcher”  */
import React, { useEffect, useState, createContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "../../../store/planSlice";
import { setUserId } from "../../../store/authSlice";
import {
  fetchDailyTime,
  incrementDailyTime,
} from "../../../store/timeTrackingSlice";

import TopBar       from "./0.components/Secondary/TopBar";
import BottomBar    from "./0.components/Secondary/BottomBar";
import LeftPanel    from "./0.components/Secondary/LeftPanel";
import MainContent  from "./0.components/Main/Base/MainContent";

/* ★★★ 1. shared context so children can call onClose() */
export const PlanModalCtx = createContext({ onClose: () => {} });

// ------------------------------------------------------------
// constants & helpers
// ------------------------------------------------------------
const HEARTBEAT_INTERVAL = 15; // seconds

function FloatingClose({ onClose }) {
  /* Esc key also closes */
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <button
      aria-label="Close"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 1200,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1px solid #666",
        background: "rgba(0,0,0,.6)",
        color: "#fff",
        fontSize: 20,
        lineHeight: "28px",
        cursor: "pointer",
        transition: "background .2s",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.background = "rgba(0,0,0,.8)")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.background = "rgba(0,0,0,.6)")
      }
    >
      &times;
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  PlanFetcher (modal)                                               */
/* ------------------------------------------------------------------ */
export default function PlanFetcher({
  planId,
  initialActivityContext,
  userId = null,

  backendURL = import.meta.env.VITE_BACKEND_URL,
  fetchUrl   = "/api/adaptive-plan",

  daysUntilExam = 10,
  sessionLength = 30,

  onClose   = () => {},
  allowClose = true,
}) {
  const dispatch = useDispatch();

  /* ----------------------------------------------------------------
   * 0. Debug trace – run once
   * ---------------------------------------------------------------- */
  useEffect(() => {
    console.trace("PlanFetcher mounted →", {
      planId,
      userId,
      initialActivityContext,
      backendURL,
      fetchUrl,
      daysUntilExam,
      sessionLength,
      allowClose,
    });
  }, []); //  ← once only

  /* ----------------------------------------------------------------
   * 1. Redux state
   * ---------------------------------------------------------------- */
  const { status, error, planDoc, flattenedActivities, currentIndex } =
    useSelector((s) => s.plan);
  const { dailyTime } = useSelector((s) => s.timeTracking);

  /* ----------------------------------------------------------------
   * 2. Local timers
   * ---------------------------------------------------------------- */
  const [displayTime, setDisplayTime]     = useState(0);
  const [lastHeartbeatTime, setLastHB]    = useState(null);
  const [leftCollapsed,   setLeftCollapsed] = useState(false);

  /* ----------------------------------------------------------------
   * 3. Side-effects
   * ---------------------------------------------------------------- */

  /* store uid in Redux */
  useEffect(() => {
    if (userId) dispatch(setUserId(userId));
  }, [userId, dispatch]);

  /* fetch plan –––––––––––––––––––––––––––––––––––––––––––––––––– */
  useEffect(() => {
    if (!planId) return;
    dispatch(
      fetchPlan({ planId, backendURL, fetchUrl, initialActivityContext })
    );
  }, [dispatch, planId, backendURL, fetchUrl, initialActivityContext]); // FIX: removed props.*

  /* fetch today's total study time */
  useEffect(() => {
    if (planId && userId) dispatch(fetchDailyTime({ planId, userId }));
  }, [planId, userId, dispatch]);

  /* sync local timer when server value arrives */
  useEffect(() => {
    if (dailyTime != null) {
      setDisplayTime(dailyTime);
      if (!lastHeartbeatTime) setLastHB(Date.now());
    }
  }, [dailyTime, lastHeartbeatTime]);

  /* heartbeat – increment study time every second */
  useEffect(() => {
    const id = setInterval(async () => {
      setDisplayTime((v) => v + 1);

      if (!lastHeartbeatTime || !planId || !userId) return;

      const now  = Date.now();
      const diff = Math.floor((now - lastHeartbeatTime) / 1000);
      if (diff < HEARTBEAT_INTERVAL) return;

      const res = await dispatch(
        incrementDailyTime({ planId, userId, increment: diff })
      );
      if (incrementDailyTime.fulfilled.match(res)) {
        const newTotal = res.payload;
        setDisplayTime(
          typeof newTotal === "number" ? newTotal : (p) => p + diff
        );
        setLastHB(Date.now());
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lastHeartbeatTime, planId, userId, dispatch]);

  /* ----------------------------------------------------------------
   * 4. Derived UI values
   * ---------------------------------------------------------------- */
  const totalSteps  = flattenedActivities?.length || 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const stepPercent =
    totalSteps ? Math.floor((currentStep / totalSteps) * 100) : 0;

  /* ----------------------------------------------------------------
   * 5. Render
   * ---------------------------------------------------------------- */
  return (
    /* ★★★ 2. provide onClose to descendants */
    <PlanModalCtx.Provider value={{ onClose }}>
      <div style={styles.appContainer}>
        {allowClose && <FloatingClose onClose={onClose} />}

        {/* Loading / error states */}
        {status === "loading" && (
          <p style={{ color: "#fff", margin: 8 }}>Loading plan…</p>
        )}
        {error && <p style={{ color: "red", margin: 8 }}>{error}</p>}
        {!planDoc && status !== "loading" && !error && (
          <p style={{ color: "#fff", margin: 8 }}>
            No plan loaded. Pass a valid planId to load content.
          </p>
        )}

        {/* Main layout */}
        {planDoc && (
          <div style={styles.mainArea}>
            {/* left sidebar */}
            <div
              style={{
                ...styles.leftPanelContainer,
                width: leftCollapsed ? 48 : 300,
                transition: "width .25s",
              }}
            >
              <LeftPanel
                isCollapsed={leftCollapsed}
                onToggleCollapse={() => setLeftCollapsed((p) => !p)}
              />
            </div>

            {/* right content */}
            <div style={styles.rightPanelContainer}>
              <MainContent
                examId={planDoc.examId || "general"}
                onClose={onClose}
              />
            </div>
          </div>
        )}

        <BottomBar
          stepPercent={stepPercent}
          currentIndex={currentIndex}
          totalSteps={totalSteps}
        />
      </div>
    </PlanModalCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  styles                                                            */
/* ------------------------------------------------------------------ */
const styles = {
  appContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  leftPanelContainer: {
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
  },
  rightPanelContainer: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
  },
};