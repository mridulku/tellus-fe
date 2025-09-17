import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  List,
  ListItemButton,
  Collapse,
  Tooltip
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/KeyboardArrowUp";
import ExpandMoreIcon from "@mui/icons-material/KeyboardArrowDown";

// getActivityStyle => same as before
function getActivityStyle(type) {
  switch ((type || "").toUpperCase()) {
    case "READ":
      return { bgColor: "#4FC3F7" };
    case "QUIZ":
      return { bgColor: "#AED581" };
    case "REVISE":
      return { bgColor: "#FFD54F" };
    default:
      return { bgColor: "#BDBDBD" };
  }
}

/**
 * Flatten the entire plan doc into a single linear array, plus
 * store a "flatIndex" (0-based) for each activity so we can identify it easily.
 */
function flattenPlanDoc(planDoc) {
  const result = [];
  const sessions = planDoc.sessions || [];
  sessions.forEach((sess, sIdx) => {
    (sess.activities || []).forEach((act) => {
      result.push({
        ...act,
        // Force uppercase on type so it's consistent
        type: (act.type || "").toUpperCase(),
        dayIndex: sIdx,
        flatIndex: result.length, // the index in the "flattened" array
      });
    });
  });
  return result;
}

/**
 * If `initialActivityContext` => auto-expand to that subChapter/type
 */
function autoExpandToActivity({
  plan,
  initialActivityContext,
  setSelectedDayIndex,
  setExpandedChapterId,
  setExpandedSubChId,
}) {
  if (!plan || !initialActivityContext) return;
  const { subChapterId, type } = initialActivityContext;
  const sessions = plan.sessions || [];

  let foundIndex = 0;
  let foundChapterId = "";
  let foundSubChId = "";

  outer: for (let i = 0; i < sessions.length; i++) {
    const acts = sessions[i].activities || [];
    for (const act of acts) {
      if (
        act.subChapterId === subChapterId &&
        (act.type || "").toUpperCase() === (type || "").toUpperCase()
      ) {
        foundIndex = i;
        foundChapterId = act.chapterId;
        foundSubChId = act.subChapterId;
        break outer;
      }
    }
  }

  setSelectedDayIndex(foundIndex);
  if (foundChapterId) setExpandedChapterId(foundChapterId);
  if (foundSubChId) setExpandedSubChId(foundSubChId);
}

/** For showing truncated text with a tooltip */
function TruncateTooltip({ text, sx }) {
  return (
    <Tooltip title={text} arrow>
      <Typography
        noWrap
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...sx,
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

/**
 * LeftPanel
 * 
 * Props:
 *  - planId (string)
 *  - fetchUrl (string)
 *  - backendURL (string)
 *  - initialActivityContext (object)
 *  - onPlanFlattened (func): to send the flattened array back up
 *  - onActivitySelect (func): to tell parent which flatIndex user clicked
 *  - currentIndex (number): parent's current selected item
 *  - flattenedActivities (array): parent's flattened array (optional for advanced highlighting)
 */
export default function LeftPanel({
  planId,
  fetchUrl = "/api/adaptive-plan",
  backendURL = import.meta.env.VITE_BACKEND_URL,
  initialActivityContext = null,
  onPlanFlattened = () => {},
  onActivitySelect = () => {},
  currentIndex = -1,
  flattenedActivities = [],
}) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // For adaptive plan day selection
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [expandedSubChId, setExpandedSubChId] = useState(null);

  // 1) Fetch plan data
  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    axios
      .get(`${backendURL}${fetchUrl}`, { params: { planId } })
      .then((res) => {
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          setError("No planDoc in response");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [planId, backendURL, fetchUrl]);

  // 2) Once plan is fetched, flatten => call onPlanFlattened
  useEffect(() => {
    if (plan) {
      const flatList = flattenPlanDoc(plan);
      onPlanFlattened(flatList);
    }
  }, [plan, onPlanFlattened]);

  // 3) Auto-expand if initialActivityContext
  useEffect(() => {
    if (plan && initialActivityContext) {
      autoExpandToActivity({
        plan,
        initialActivityContext,
        setSelectedDayIndex,
        setExpandedChapterId,
        setExpandedSubChId,
      });
    }
  }, [plan, initialActivityContext]);

  // 4) Handle loading/error
  if (loading) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">Loading plan data...</Typography>
      </Box>
    );
  }
  if (error || !plan) {
    return (
      <Box sx={containerSx}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Error
        </Typography>
        <Typography variant="body2">{error || "No plan data found."}</Typography>
      </Box>
    );
  }

  // If no sessions
  const sessions = plan.sessions || [];
  if (!sessions.length) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">No sessions found in this plan.</Typography>
      </Box>
    );
  }

  const planType = plan.planType || "adaptive";

  return (
    <Box sx={containerSx}>
      {planType === "book" ? (
        <BookPlanView
          sessions={sessions}
          onActivitySelect={onActivitySelect}
          expandedChapterId={expandedChapterId}
          setExpandedChapterId={setExpandedChapterId}
          expandedSubChId={expandedSubChId}
          setExpandedSubChId={setExpandedSubChId}
          currentIndex={currentIndex}
        />
      ) : (
        <AdaptivePlanView
          sessions={sessions}
          selectedDayIndex={selectedDayIndex}
          setSelectedDayIndex={setSelectedDayIndex}
          onActivitySelect={onActivitySelect}
          expandedChapterId={expandedChapterId}
          setExpandedChapterId={setExpandedChapterId}
          expandedSubChId={expandedSubChId}
          setExpandedSubChId={setExpandedSubChId}
          currentIndex={currentIndex}
        />
      )}
    </Box>
  );
}

// For BookPlanView or AdaptivePlanView, we either show the “Book -> Chapters -> SubCh -> Activities” or “Day -> Book -> ...”

function BookPlanView({
  sessions,
  onActivitySelect,
  expandedChapterId,
  setExpandedChapterId,
  expandedSubChId,
  setExpandedSubChId,
  currentIndex,
}) {
  const session = sessions[0] || {};
  const { activities = [] } = session;
  const uniqueBookIds = new Set(activities.map((a) => a.bookId));
  const skipBookLevel = uniqueBookIds.size <= 1;

  return (
    <>
      <Typography sx={titleSx}>Book Plan</Typography>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {skipBookLevel
          ? renderChaptersDirect({
              activities,
              onActivitySelect,
              expandedChapterId,
              setExpandedChapterId,
              expandedSubChId,
              setExpandedSubChId,
              currentIndex,
            })
          : renderBooks({
              activities,
              onActivitySelect,
              expandedChapterId,
              setExpandedChapterId,
              expandedSubChId,
              setExpandedSubChId,
              currentIndex,
            })}
      </Box>
    </>
  );
}

function AdaptivePlanView({
  sessions,
  selectedDayIndex,
  setSelectedDayIndex,
  onActivitySelect,
  expandedChapterId,
  setExpandedChapterId,
  expandedSubChId,
  setExpandedSubChId,
  currentIndex,
}) {
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [], sessionLabel } = currentSession;

  const uniqueBookIds = new Set(activities.map((a) => a.bookId));
  const skipBookLevel = uniqueBookIds.size <= 1;

  const handleDayChange = (e) => setSelectedDayIndex(e.target.value);

  return (
    <>
      <Typography sx={titleSx}>Adaptive Plan</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <FormControl variant="standard" sx={{ minWidth: 60 }}>
          <Select
            value={selectedDayIndex}
            onChange={handleDayChange}
            disableUnderline
            sx={selectSx}
            MenuProps={{
              PaperProps: {
                sx: {
                  zIndex: 999999,
                  bgcolor: "#222",
                  color: "#fff",
                },
              },
            }}
          >
            {sessions.map((sess, idx) => (
              <MenuItem key={sess.sessionLabel} value={idx} dense>
                <Typography sx={{ fontSize: "0.8rem" }}>
                  Day {sess.sessionLabel}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {skipBookLevel
          ? renderChaptersDirect({
              activities,
              onActivitySelect,
              expandedChapterId,
              setExpandedChapterId,
              expandedSubChId,
              setExpandedSubChId,
              currentIndex,
            })
          : renderBooks({
              activities,
              onActivitySelect,
              expandedChapterId,
              setExpandedChapterId,
              expandedSubChId,
              setExpandedSubChId,
              currentIndex,
            })}
      </Box>
    </>
  );
}

// -------------- RENDER CHAPTERS DIRECTLY ----------------
function renderChaptersDirect({
  activities,
  onActivitySelect,
  expandedChapterId,
  setExpandedChapterId,
  expandedSubChId,
  setExpandedSubChId,
  currentIndex,
}) {
  const chapterMap = new Map();
  for (const a of activities) {
    const cId = a.chapterId || "_noChap_";
    if (!chapterMap.has(cId)) {
      chapterMap.set(cId, {
        chapterId: cId,
        chapterName: a.chapterName || cId,
        items: [],
      });
    }
    chapterMap.get(cId).items.push(a);
  }
  const chapters = Array.from(chapterMap.values());

  return (
    <List sx={{ p: 0 }} dense>
      {chapters.map((ch) => {
        const isChapterOpen = expandedChapterId === ch.chapterId;
        const splitted = ch.chapterName.split(".");
        let indexToken = splitted[0];
        let restName = ch.chapterName;
        if (/^\d+$/.test(indexToken.trim())) {
          restName = ch.chapterName.substring(indexToken.length + 1).trim();
        } else {
          indexToken = "";
        }
        const totalTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <Box key={ch.chapterId}>
            <ListItemButton
              sx={listItemButtonSx}
              onClick={() =>
                setExpandedChapterId(isChapterOpen ? null : ch.chapterId)
              }
            >
              {indexToken && (
                <Box sx={chapterPillSx}>
                  <Typography sx={pillNumberSx}>{indexToken}</Typography>
                </Box>
              )}
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <TruncateTooltip
                  text={restName || ch.chapterName}
                  sx={{ fontSize: "0.75rem" }}
                />
              </Box>
              <Box sx={timePillSx}>{totalTime}m</Box>
              {isChapterOpen ? (
                <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              )}
            </ListItemButton>

            <Collapse in={isChapterOpen} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2 }}>
                {renderSubChapters({
                  chapterItems: ch.items,
                  onActivitySelect,
                  expandedSubChId,
                  setExpandedSubChId,
                  currentIndex,
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

// -------------- RENDER BOOKS -> CHAPTERS -> SUBCH -> ACTS --------------
function renderBooks({
  activities,
  onActivitySelect,
  expandedChapterId,
  setExpandedChapterId,
  expandedSubChId,
  setExpandedSubChId,
  currentIndex,
}) {
  const bookMap = new Map();
  for (const a of activities) {
    const bId = a.bookId || "_noBook_";
    if (!bookMap.has(bId)) {
      bookMap.set(bId, {
        bookId: bId,
        bookName: a.bookName || bId,
        items: [],
      });
    }
    bookMap.get(bId).items.push(a);
  }
  const books = Array.from(bookMap.values());

  return (
    <List sx={{ p: 0 }} dense>
      {books.map((bk) => {
        const totalTime = bk.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <Box key={bk.bookId} sx={{ mb: 0.5 }}>
            <Typography sx={bookLabelSx}>
              {bk.bookName} ({totalTime}m)
            </Typography>
            {renderChaptersDirect({
              activities: bk.items,
              onActivitySelect,
              expandedChapterId,
              setExpandedChapterId,
              expandedSubChId,
              setExpandedSubChId,
              currentIndex,
            })}
          </Box>
        );
      })}
    </List>
  );
}

function renderSubChapters({
  chapterItems,
  onActivitySelect,
  expandedSubChId,
  setExpandedSubChId,
  currentIndex,
}) {
  const subMap = new Map();
  for (const a of chapterItems) {
    const sId = a.subChapterId || "_noSub_";
    if (!subMap.has(sId)) {
      subMap.set(sId, {
        subChapterId: sId,
        subChapterName: a.subChapterName || sId,
        items: [],
      });
    }
    subMap.get(sId).items.push(a);
  }
  const subs = Array.from(subMap.values());

  return subs.map((sb) => {
    const isSubOpen = expandedSubChId === sb.subChapterId;
    const splitted = sb.subChapterName.split(".");
    let indexToken = splitted[0];
    let restName = sb.subChapterName;
    if (/^\d+$/.test(indexToken.trim())) {
      restName = sb.subChapterName.substring(indexToken.length + 1).trim();
    } else {
      indexToken = "";
    }
    const totalTime = sb.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <Box key={sb.subChapterId} sx={{ mb: 0.5 }}>
        <ListItemButton
          sx={listItemButtonSx}
          onClick={() => setExpandedSubChId(isSubOpen ? null : sb.subChapterId)}
        >
          {indexToken && (
            <Box sx={subChPillSx}>
              <Typography sx={pillNumberSx}>{indexToken}</Typography>
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <TruncateTooltip text={restName} sx={{ fontSize: "0.7rem" }} />
          </Box>
          <Box sx={timePillSx}>{totalTime}m</Box>
          {isSubOpen ? (
            <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          )}
        </ListItemButton>

        <Collapse in={isSubOpen} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={{ pl: 2 }}>
            {sb.items.map((act, idx) => {
              const { bgColor } = getActivityStyle(act.type);

              // Check if this is the currently selected activity
              const isSelected = act.flatIndex === currentIndex;

              return (
                <ListItemButton
                  key={act.flatIndex}
                  onClick={() => onActivitySelect(act.flatIndex)}
                  sx={{
                    ...listItemButtonSx,
                    mb: 0.3,
                    // If selected, highlight it
                    bgcolor: isSelected ? "#FFA726" : bgColor,
                    color: "#000",
                  }}
                >
                  <TruncateTooltip
                    text={`${act.type}: ${act.subChapterName || act.subChapterId}`}
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", ml: "auto" }}>
                    {act.timeNeeded || 0}m
                  </Typography>
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  });
}

// ------------------- STYLES -------------------
const containerSx = {
  width: 300,
  minWidth: 250,
  bgcolor: "#1A1A1A",
  color: "#fff",
  borderRight: "1px solid #333",
  display: "flex",
  flexDirection: "column",
  p: 1,
  height: "100%",
};

const titleSx = {
  fontSize: "0.85rem",
  fontWeight: 600,
  textAlign: "center",
  mb: 1,
};

const selectSx = {
  fontSize: "0.8rem",
  color: "#fff",
  bgcolor: "#222",
  borderRadius: 1,
  px: 1,
  py: 0.5,
  "& .MuiSelect-icon": {
    color: "#fff",
  },
};

const bookLabelSx = {
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "#ccc",
  mb: 0.2,
  ml: 1,
};

const listItemButtonSx = {
  minHeight: 0,
  py: 0.4,
  px: 0.5,
  "&:hover": { bgcolor: "#333" },
};

const chapterPillSx = {
  minWidth: "1.4rem",
  height: "1.4rem",
  bgcolor: "#EC407A",
  borderRadius: "0.2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mr: 1,
};

const subChPillSx = {
  minWidth: "1.4rem",
  height: "1.4rem",
  bgcolor: "#7E57C2",
  borderRadius: "0.2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mr: 1,
};

const pillNumberSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#fff",
};

const timePillSx = {
  ml: 1,
  bgcolor: "#424242",
  color: "#fff",
  fontSize: "0.6rem",
  px: 0.6,
  py: 0.2,
  borderRadius: "0.2rem",
};