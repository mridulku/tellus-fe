// -------------------------------------------------------------
// /src/components/MaterialsDashboard.jsx   (v3 – live plan list)
// -------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch }   from "react-redux";
/* axios import kept in case you use it elsewhere in this file */
// import axios                        from "axios";

import {
  doc, getDoc,
  collection, query, where, orderBy, onSnapshot   // ⬅️ new
} from "firebase/firestore";
import { db } from "../../../../firebase";        // adjust path if needed

import { Grid, Box } from "@mui/material";

import PlanSelector from "../1.PlanSelector/PlanSelector";
import Child2       from "../3.AdaptivePlanView/0.Parent/0.Parent";
import StatsPanel   from "../4.StatsPanel/StatsPanel";
import Loader       from "./Loader";

import { setAuth }  from "../../../../store/authSlice";

/* -------------------------------------------------------------
   Map exam → field in users/{uid} that stores the cloned book
------------------------------------------------------------- */
const FIELD_MAP = {
  NEET  : "clonedNeetBook",
  TOEFL : "clonedToeflBooks",
};

const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6Z"];

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function MaterialsDashboard({
  userId,
  backendURL        = import.meta.env.VITE_BACKEND_URL,
  onOpenOnboarding  = () => {},
  onHomeSelect      = () => {},
  onOpenPlayer      = () => {},
  themeColors       = {},
}) {
  /* ---------- auth (hydrate userId in the store) ---------- */
  const dispatch = useDispatch();
  useEffect(() => {
    if (userId) dispatch(setAuth({ userId }));
  }, [userId, dispatch]);

  /* ---------- exam type from global store ---------- */
  const examType = useSelector((s) => s.exam?.examType);

  /* ---------- 1) look up bookId in users/{uid} ---------- */
  const [bookId,      setBookId]      = useState(null);
  const [bookErr,     setBookErr]     = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);

  const isAdmin = ADMIN_UIDS.includes(userId);

  useEffect(() => {
    if (!userId || !examType) return;
    (async () => {
      setLoadingBook(true); setBookErr(null);
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists()) throw new Error("user doc not found");

        const entry = snap.data()[FIELD_MAP[examType.toUpperCase()]];
        const id    = Array.isArray(entry) ? entry?.[0]?.newBookId
                                           : entry?.newBookId;
        if (!id) throw new Error("newBookId missing in user doc");
        setBookId(id);
      } catch (e) {
        console.error("book lookup:", e);
        setBookErr(e.message || String(e));
      } finally {
        setLoadingBook(false);
      }
    })();
  }, [userId, examType]);

  /* ---------- 2) live plan-ID listener ---------- */
  const [planIds,        setPlanIds]        = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingPlans,   setLoadingPlans]   = useState(true);

  useEffect(() => {
    if (!userId || !bookId) return;

    /* collection that holds adaptive plans – adjust if yours differs */
    const col = collection(db, "adaptive_demo");

    /* query: this user's plans for this book, newest first */
    const q = query(
      col,
      where("userId", "==", userId),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc")          // needs composite index
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const ids = snap.docs.map((d) => d.id);
        setPlanIds(ids);

        /* keep current selection if still present; else pick newest */
        setSelectedPlanId((curr) =>
          curr && ids.includes(curr) ? curr : ids[0] || ""
        );
        setLoadingPlans(false);
      },
      (err) => {
        console.error("planId listener:", err);
        setPlanIds([]); setSelectedPlanId(""); setLoadingPlans(false);
      }
    );

    return () => unsub();           // clean up on unmount / dep change
  }, [userId, bookId]);

  const handlePlanSelect = (pid) => setSelectedPlanId(pid);

  /* ---------- loading / error UI ---------- */
  if (loadingBook || loadingPlans) {
    return (
      <Loader
        type="bar"
        fullScreen
        accent={themeColors.accent || "#BB86FC"}
        message="Loading your study plans…"
        zIndex={1000}               /* one step below MUI modal (1300) */
      />
    );
  }

  if (bookErr || !bookId) {
    return (
      <Box sx={{ p: 2, color: "#f44336" }}>
        {bookErr || "No configured book found for this exam."}
      </Box>
    );
  }

  /* ---------- MAIN RENDER ---------- */
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ─── STATS STRIP ACROSS THE TOP ─── */}
      <Box sx={{ px: 2, pt: 2 }}>
        <StatsPanel userId={userId} />
      </Box>

      {/* ─── TWO-COLUMN LAYOUT BELOW ─── */}
      <Grid container sx={{ flex: 1 }}>

        {/* LEFT column — My Plans */}
        <Grid item xs={12} md={4} lg={3}>
          <PlanSelector
            planIds={planIds}
            selectedPlanId={selectedPlanId}
            onPlanSelect={handlePlanSelect}
            onOpenOnboarding={onOpenOnboarding}
          />
        </Grid>

        {/* RIGHT column — adaptive plan viewer */}
        <Grid item xs={12} md={8} lg={9}>
          <Box sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              <Child2
                userId={userId}
                isAdmin={isAdmin}
                bookId={bookId}
                planId={selectedPlanId}
                backendURL={backendURL}
                onOverviewSelect={onHomeSelect}
                onOpenPlayer={onOpenPlayer}
                colorScheme={{
                  panelBg:     themeColors.sidebarBg,
                  textColor:   themeColors.textPrimary,
                  borderColor: themeColors.borderColor,
                  heading:     themeColors.accent,
                }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}