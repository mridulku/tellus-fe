// File: DailyPlan.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";
import { Box } from "@mui/material";

/* 🆕 inline loader */
import Loader from "./Loader";              // ← adjust relative path if needed

import {
  parseCreatedAt,
  dateOnly,
  addDays,
  formatDate,
} from "./components/dailyPlanUtils";

import StatusBar from "./components/StatusBar";
import ActivityList from "./components/ActivityList";

export default function DailyPlan({
  userId,
  plan,
  planId,
  colorScheme,
  dayDropIdx,
  onDaySelect,
  expandedChapters,
  onToggleChapter,
  onOpenPlanFetcher,
}) {
  const dispatch  = useDispatch();
  const currentIndex = useSelector((state) => state.plan.currentIndex);

  /* ───── Bail if plan has no sessions ───── */
  if (!plan?.sessions?.length) {
    return <div>No sessions found in this plan.</div>;
  }

  /* ───── Pre-compute constants ───── */
  const sessions      = plan.sessions;
  const createdAtDate = parseCreatedAt(plan);
  const today         = dateOnly(new Date());

  const dayLabels = sessions.map((sess) => {
    const sNum      = Number(sess.sessionLabel);
    const dayDate   = addDays(createdAtDate, sNum - 1);
    const dayDateStr = formatDate(dayDate);
    return dayDate.getTime() === today.getTime()
      ? `Today (${dayDateStr})`
      : `Day ${sNum} (${dayDateStr})`;
  });

  /* ───── Clamp dayDropIdx into bounds & auto-jump to today ───── */
  useEffect(() => {
    const firstDay = createdAtDate;
    const lastDay  = addDays(createdAtDate, sessions.length - 1);

    if (today < firstDay)        return onDaySelect(0);
    if (today > lastDay)         return onDaySelect(sessions.length - 1);

    const idx = Math.floor((today - firstDay) / (1000 * 60 * 60 * 24));
    onDaySelect(Math.max(0, Math.min(idx, sessions.length - 1)));
  }, [planId, sessions]);

  let safeIdx = Math.min(Math.max(dayDropIdx, 0), sessions.length - 1);

  /* ───── State for per-activity info ───── */
  const currentSession      = sessions[safeIdx] || {};
  const { activities = [] } = currentSession;

  const [timeMap, setTimeMap]                 = useState({});
  const [subchapterStatusMap, setStatusMap]   = useState({});
  const [loading, setLoading]                 = useState(false);

  /* ───── Fetch time + status whenever activities change ───── */
  useEffect(() => {
    let cancel = false;
    if (!activities.length) {
      setTimeMap({}); setStatusMap({});
      return;
    }

    (async () => {
      try {
        setLoading(true);

        /* 1 — time per activity */
        const timePromise = (async () => {
          const map = {};
          for (const act of activities) {
            const id = act.activityId;
            if (!id) continue;
            const type = (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";
            try {
              const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`,
                { params: { activityId: id, type } }
              );
              map[id] = data?.totalTime || 0;
            } catch (e) {
              console.error("getActivityTime", id, e);
            }
          }
          return map;
        })();

        /* 2 — aggregator status per sub-chapter */
        const statusPromise = (async () => {
          const subIds = new Set(activities.map(a => a.subChapterId).filter(Boolean));
          const map = {};
          for (const subId of subIds) {
            try {
              const { data } = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`,
                { params: { userId, planId, subchapterId: subId } }
              );
              map[subId] = data;
            } catch (e) {
              console.error("subchapter-status", subId, e);
            }
          }
          return map;
        })();

        const [tMap, sMap] = await Promise.all([timePromise, statusPromise]);
        if (!cancel) {
          setTimeMap(tMap);
          setStatusMap(sMap);
        }
      } catch (err) {
        console.error("DailyPlan fetch", err);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [activities, planId, userId]);

  /* ───── Activity click handler ───── */
  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    onOpenPlanFetcher?.(planId, act);
  }

  /* ───── Status bar metrics (example) ───── */
  const totalTimeSpentMin = Math.round(
    Object.values(timeMap).reduce((acc, s) => acc + s, 0) / 60
  );
  const totalTimeExpected = 30;   // placeholder

  /* ───── Render ───── */
  if (loading) {
    return (
      <Box sx={{ display:"flex", justifyContent:"center", mt: 3 }}>
        <Loader type="linear" accent={colorScheme?.heading || "#BB86FC"} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <StatusBar
        safeIdx={safeIdx}
        dayLabels={dayLabels}
        sessions={sessions}
        activities={activities}
        onDaySelect={onDaySelect}
        colorScheme={colorScheme}
        totalTimeSpent={totalTimeSpentMin}
        totalTimeExpected={totalTimeExpected}
        timeMap={timeMap}
      />

      <ActivityList
        dayActivities={activities}
        currentIndex={currentIndex}
        onClickActivity={handleClickActivity}
        timeMap={timeMap}
        subchapterStatusMap={subchapterStatusMap}
        userId={userId}
        planId={planId}
      />
    </Box>
  );
}