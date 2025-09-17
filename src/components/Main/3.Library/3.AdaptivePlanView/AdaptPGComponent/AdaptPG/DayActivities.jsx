// File: DayActivities.jsx
import React from "react";
import { Box } from "@mui/material";
import ActivityAccordion from "./ActivityAccordion";

export default function DayActivities({
  userId,
  planId,
  activities,
  timeMap,
  subchapterStatusMap,
  onOpenPlanFetcher,
  dispatch,
  setCurrentIndex,

  // aggregator modals
  setDebugOpen,
  setDebugTitle,
  setDebugData,
  setHistoryOpen,
  setHistoryTitle,
  setHistoryData,
  setPrevModalOpen,
  setPrevModalTitle,
  setPrevModalItems,
  setProgressOpen,
  setProgressTitle,
  setProgressData,
  setTimeDetailOpen,
  setTimeDetailTitle,
  setTimeDetailData,

  // aggregator logs
  timeFetchLogs,
  statusFetchLogs,
}) {
  if (!activities || activities.length === 0) {
    return <div>No activities for this day.</div>;
  }

  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  return (
    <Box>
      {activities.map((act, idx) => (
        <ActivityAccordion
          key={idx}
          index={idx}
          activity={act}
          timeMap={timeMap}
          subchapterStatusMap={subchapterStatusMap}
          onClickActivity={handleClickActivity}
          // aggregator modals
          setDebugOpen={setDebugOpen}
          setDebugTitle={setDebugTitle}
          setDebugData={setDebugData}
          setHistoryOpen={setHistoryOpen}
          setHistoryTitle={setHistoryTitle}
          setHistoryData={setHistoryData}
          setPrevModalOpen={setPrevModalOpen}
          setPrevModalTitle={setPrevModalTitle}
          setPrevModalItems={setPrevModalItems}
          setProgressOpen={setProgressOpen}
          setProgressTitle={setProgressTitle}
          setProgressData={setProgressData}
          setTimeDetailOpen={setTimeDetailOpen}
          setTimeDetailTitle={setTimeDetailTitle}
          setTimeDetailData={setTimeDetailData}
          // aggregator logs
          timeFetchLogs={timeFetchLogs}
          statusFetchLogs={statusFetchLogs}
        />
      ))}
    </Box>
  );
}