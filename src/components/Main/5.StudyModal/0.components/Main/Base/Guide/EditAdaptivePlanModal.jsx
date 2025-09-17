import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Paper,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";
import _ from "lodash";

// CHILD COMPONENTS (Wizard steps)
import ChapterSelection from "./AdaptivePlanSupport/ChapterSelection";
import PlanSelection from "./AdaptivePlanSupport/PlanSelection";
import PlanRender from "./AdaptivePlanSupport/PlanRender";

// NEW IMPORT: your Redux-based plan fetcher
import PlanFetcher from "../../../../5.StudyModal/StudyModal";

/**
 * Helper function to sort a list of { title: "1. something"} objects 
 * by the numeric prefix if present. Fallback is alphabetical if no parseable number.
 */
function sortByNumericPrefix(items) {
  return items.slice().sort((a, b) => {
    const getLeadingNumber = (str) => {
      // Attempt to parse up to first non-digit or the dot
      if (!str) return 999999;
      const match = str.match(/^(\d+)\.?/);
      return match ? parseInt(match[1], 10) : 999999; // large fallback
    };
    const numA = getLeadingNumber(a.title);
    const numB = getLeadingNumber(b.title);
    // If there's a tie in numeric prefix, fallback to standard string compare
    if (numA === numB) {
      return a.title.localeCompare(b.title);
    }
    return numA - numB;
  });
}

/**
 * EditAdaptivePlanModal
 *
 * A multi-step wizard that:
 *  1) Selects chapters
 *  2) Picks schedule (target date, daily reading, mastery level)
 *  3) Shows final plan summary
 *  4) On confirm => automatically opens the (NEW) Plan Fetcher in a modal
 *
 * Props:
 *  - renderAsDialog (bool)
 *  - open (bool)
 *  - onClose (func)
 *  - userId (string)
 *  - backendURL (string)
 *  - bookId (string)
 */
export default function EditAdaptivePlanModal({
  renderAsDialog = true,
  open = false,
  onClose,
  userId = null,
  backendURL = import.meta.env.VITE_BACKEND_URL,
  bookId = "",
}) {
  // -------------------------------------------------
  // STEPS
  // -------------------------------------------------
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Chapters", "Schedule & Mastery", "Review & Confirm"];

  

  // -------------------------------------------------
  // Step 1: Chapter selection
  // -------------------------------------------------
  const [chapters, setChapters] = useState([]);
  // We'll track an error for invalid chapter selections
  const [chapterSelectionError, setChapterSelectionError] = useState("");

  // We’ll store an array of selected chapter IDs that we’ll eventually send 
  // to the backend (or null if user selects ALL).
  const [selectedChapterIds, setSelectedChapterIds] = useState(null);

  useEffect(() => {
    async function fetchChapters() {
      try {
        const res = await axios.get(`${backendURL}/api/process-book-data`, {
          params: { userId, bookId },
        });
        const data = res.data || {};
        if (data.chapters && Array.isArray(data.chapters)) {
          // 1) Sort chapters
          let sortedChaps = sortByNumericPrefix(
            data.chapters.map((chap) => ({
              id: chap.id,
              title: chap.name,
              expanded: false,
              selected: true,
              subchapters: (chap.subchapters || []).map((sub) => ({
                id: sub.id,
                title: sub.name,
                selected: true,
              })),
            }))
          );
          // 2) Sort subchapters
          sortedChaps = sortedChaps.map((ch) => {
            const sortedSubs = sortByNumericPrefix(ch.subchapters);
            return { ...ch, subchapters: sortedSubs };
          });

          setChapters(sortedChaps);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    }
    if (userId && bookId) {
      fetchChapters();
    }
  }, [userId, bookId, backendURL]);

  // Toggle the entire chapter on/off
  const handleToggleChapter = (chapterIndex) => {
    const updated = [...chapters];
    const c = updated[chapterIndex];
    c.selected = !c.selected;
    // We are ignoring sub-chapter selection from the user side 
    // (per request, no checkboxes there), but if we want them consistent:
    if (!c.selected) {
      c.subchapters.forEach((sc) => (sc.selected = false));
    } else {
      c.subchapters.forEach((sc) => (sc.selected = true));
    }
    updated[chapterIndex] = c;
    setChapters(updated);
  };

  // We no longer toggle sub-chapters because sub-chapter checkboxes are disabled, 
  // but let's keep the function around if needed:
  const handleToggleSubchapter = (chapterIndex, subIndex) => {
    // DO NOTHING, or you can remove this entirely
  };

  const handleAccordionToggle = (chapterIndex) => {
    const updated = [...chapters];
    updated[chapterIndex].expanded = !updated[chapterIndex].expanded;
    setChapters(updated);
  };

  /**
   * Validate and store selected chapters before moving to Step 2
   *  - If all are selected => set selectedChapterIds = null
   *  - If any are unselected => gather their IDs
   *  - Must have at least 1 selected
   *  - If partially selected, cannot exceed 10
   */
  function validateChapterSelections() {
    const selectedChaps = chapters.filter((ch) => ch.selected);
    if (selectedChaps.length === 0) {
      setChapterSelectionError("Please select at least one chapter.");
      return false;
    }
    // Are ALL selected?
    if (selectedChaps.length === chapters.length) {
      // Means user wants them all => we do NOT pass any chapter IDs
      setSelectedChapterIds(null);
      return true;
    }

    // Otherwise, user has a partial selection
    if (selectedChaps.length > 10) {
      setChapterSelectionError(
        `You have selected ${selectedChaps.length} chapters. Please either select ALL or 10 or fewer.`
      );
      return false;
    }

    // All good => store them
    setSelectedChapterIds(selectedChaps.map((ch) => ch.id));
    return true;
  }

  // -------------------------------------------------
  // Step 2: Plan selection
  // -------------------------------------------------
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);

  // Instead of old mastery levels:
  const [currentKnowledge, setCurrentKnowledge] = useState("none");
  const [goalLevel, setGoalLevel] = useState("basic");

  let quizTime = 1;
  let reviseTime = 1;

  // -------------------------------------------------
  // Plan creation (Step 2 -> Step 3)
  // -------------------------------------------------
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdPlan, setCreatedPlan] = useState(null);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  async function createPlanOnBackend() {
    if (!userId) {
      console.warn("No userId provided—cannot create plan.");
      return;
    }
    try {
      setServerError(null);
      setIsCreatingPlan(true);

      const planType = `${currentKnowledge}-${goalLevel}`;

      if (goalLevel === "advanced") {
        quizTime = 5;
        reviseTime = 5;
      } else if (goalLevel === "moderate") {
        quizTime = 3;
        reviseTime = 3;
      }

      const body = {
        userId,
        targetDate,
        dailyReadingTime,
        planType,
        quizTime,
        reviseTime,
      };
      if (bookId) {
        body.bookId = bookId;
      }

      // If selectedChapterIds is NOT null => partial selection
      // If selectedChapterIds = null => we omit them (meaning all chapters)
      if (selectedChapterIds !== null) {
        body.selectedChapters = selectedChapterIds;
      }

      // Example new function endpoint:
      const createEndpoint =
        "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

      const response = await axios.post(createEndpoint, body, {
        headers: { "Content-Type": "application/json" },
      });

      const { planId, planDoc } = response.data;
      setCreatedPlan(planDoc);
      setCreatedPlanId(planId);
      setCreatedAt(planDoc?.createdAt || null);
    } catch (error) {
      console.error("Plan creation failed:", error);
      setServerError(error.message || "Plan creation failed");
    } finally {
      setIsCreatingPlan(false);
    }
  }

  // -------------------------------------------------
  // Step 3: Fetch newly created or most recent plan
  // -------------------------------------------------
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  async function fetchMostRecentPlan() {
    if (!userId) {
      console.warn("No userId => can't fetch plan.");
      return;
    }
    try {
      setIsFetchingPlan(true);
      setServerError(null);
      setServerPlan(null);

      const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
        params: { userId, bookId },
      });
      const allPlans = res.data?.plans || [];
      if (!allPlans.length) {
        throw new Error("No plans found for user/book combination.");
      }
      // sort by createdAt desc
      allPlans.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return tB - tA;
      });
      const recentPlan = allPlans[0];
      setServerPlan(recentPlan);

      const agg = computeAggregation(recentPlan);
      setAggregated(agg);
    } catch (err) {
      console.error("Error fetching plan:", err);
      setServerError(err.message || "Failed to fetch plan.");
    } finally {
      setIsFetchingPlan(false);
    }
  }

  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;
    let allActs = [];
    plan.sessions.forEach((sess) => {
      if (Array.isArray(sess.activities)) {
        allActs.push(...sess.activities);
      }
    });
    const totalReadCount = allActs.filter((a) => a.type === "READ").length;
    const totalQuizCount = allActs.filter((a) => a.type === "QUIZ").length;
    const totalReviseCount = allActs.filter((a) => a.type === "REVISE").length;

    const readTime = _.sumBy(
      allActs.filter((a) => a.type === "READ"),
      "timeNeeded"
    );
    const quizTime = _.sumBy(
      allActs.filter((a) => a.type === "QUIZ"),
      "timeNeeded"
    );
    const reviseTime = _.sumBy(
      allActs.filter((a) => a.type === "REVISE"),
      "timeNeeded"
    );

    const uniqueSubChapterCount = _.uniqBy(allActs, "subChapterId").length;
    const uniqueChapterCount = _.uniqBy(allActs, "chapterId").length;
    const totalPlanTime = readTime + quizTime + reviseTime;

    return {
      totalPlanTime,
      totalReadCount,
      totalQuizCount,
      totalReviseCount,
      readTime,
      quizTime,
      reviseTime,
      uniqueSubChapterCount,
      uniqueChapterCount,
    };
  }

  // -------------------------------------------------
  // Local feasibility (rough calc)
  // -------------------------------------------------
  const [isProcessingLocalCalc, setIsProcessingLocalCalc] = useState(false);
  const [planSummary, setPlanSummary] = useState({
    totalMinutes: 0,
    dailyMinutes: dailyReadingTime,
    totalDays: 0,
    feasible: true,
    reason: "",
  });

  function calculatePlanLocally() {
    setIsProcessingLocalCalc(true);

    let timePerSubchapter = 10;
    const planType = `${currentKnowledge}-${goalLevel}`;
    if (planType.startsWith("some-")) {
      timePerSubchapter = 5;
    } else if (planType.startsWith("strong-")) {
      timePerSubchapter = 2;
    }

    let subchapterCount = 0;
    chapters.forEach((ch) => {
      if (!ch.selected) return;
      // subchapters are always 'selected' if the chapter is selected
      subchapterCount += ch.subchapters.length;
    });

    const totalTime = subchapterCount * timePerSubchapter;
    const daysNeeded =
      dailyReadingTime > 0 ? Math.ceil(totalTime / dailyReadingTime) : 9999;

    const today = new Date();
    const tDate = new Date(targetDate);

    let feasible = true;
    let reason = "";
    if (!isNaN(tDate.getTime())) {
      const msDiff = tDate - today;
      const daysAvailable = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (daysNeeded > daysAvailable) {
        feasible = false;
        reason = `Needs ${daysNeeded} days but only ${daysAvailable} available.`;
      }
    }

    // simulate some delay
    setTimeout(() => {
      setPlanSummary({
        totalMinutes: totalTime,
        dailyMinutes: dailyReadingTime,
        totalDays: daysNeeded,
        feasible,
        reason,
      });
      setIsProcessingLocalCalc(false);
    }, 800);
  }

  // -------------------------------------------------
  // PlanFetcher modal (Step 4)
  // -------------------------------------------------
  const [showReduxPlanDialog, setShowReduxPlanDialog] = useState(false);
  const [playerPlanId, setPlayerPlanId] = useState(null);

  // -------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------
  const handleNext = async () => {
    // Step 0 => Step 1
    if (activeStep === 0) {
      setChapterSelectionError("");
      const ok = validateChapterSelections();
      if (!ok) return; // stop if invalid
      setActiveStep(1);
      return;
    }
    // Step 1 => Step 2
    if (activeStep === 1) {
      calculatePlanLocally();       // local check
      await createPlanOnBackend();  // create plan
      setActiveStep(2);
      fetchMostRecentPlan();
      return;
    }
    // Step 2 => done
    if (activeStep === 2) {
      if (renderAsDialog && onClose) {
        onClose();
      }
      // Then open the new PlanFetcher in a modal
     
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      // Going back from step 0 => close the dialog if needed
      if (renderAsDialog && onClose) {
        onClose();
      }
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  function renderStepContent(step) {
    switch (step) {
      case 0:
        return (
          <>
            <ChapterSelection
              chapters={chapters}
              onToggleChapter={handleToggleChapter}
              onToggleSubchapter={handleToggleSubchapter}
              onAccordionToggle={handleAccordionToggle}
            />
            {chapterSelectionError && (
              <Typography color="error" sx={{ mt: 2 }}>
                {chapterSelectionError}
              </Typography>
            )}
          </>
        );
      case 1:
        return (
          <Box sx={{ mt: 1 }}>
            <PlanSelection
              targetDate={targetDate}
              setTargetDate={setTargetDate}
              dailyReadingTime={dailyReadingTime}
              setDailyReadingTime={setDailyReadingTime}
              hideMasteryInput
            />
            <Box sx={{ mt: 3 }}>
              <FormControl sx={{ mr: 2, minWidth: 120 }}>
                <InputLabel>Current</InputLabel>
                <Select
                  label="Current"
                  value={currentKnowledge}
                  onChange={(e) => setCurrentKnowledge(e.target.value)}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="some">Some</MenuItem>
                  <MenuItem value="strong">Strong</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Goal</InputLabel>
                <Select
                  label="Goal"
                  value={goalLevel}
                  onChange={(e) => setGoalLevel(e.target.value)}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );
      case 2:
        return (
          <PlanRender
            isCreatingPlan={isCreatingPlan}
            isFetchingPlan={isFetchingPlan}
            serverError={serverError}
            serverPlan={serverPlan}
            aggregated={aggregated}
            planSummary={planSummary}
          />
        );
      default:
        return <Typography sx={{ color: "#fff" }}>Unknown step</Typography>;
    }
  }

  const content = (
    <Box
      sx={
        renderAsDialog
          ? {}
          : {
              p: 2,
              backgroundColor: "#1f1f1f",
              borderRadius: 1,
              marginY: 2,
              color: "#fff",
            }
      }
    >
      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { color: "#fff" },
          "& .MuiSvgIcon-root": { color: "#B39DDB" },
          "& .MuiStepIcon-text": { fill: "#fff" },
          "& .MuiStepIcon-root.Mui-completed": { color: "#B39DDB" },
        }}
      >
        {steps.map((label, idx) => (
          <Step key={idx}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={isCreatingPlan || isFetchingPlan || isProcessingLocalCalc}
          sx={{
            borderColor: "#B39DDB",
            color: "#fff",
            "&:hover": {
              borderColor: "#D1C4E9",
            },
          }}
        >
          Back
        </Button>

        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isCreatingPlan || isFetchingPlan || isProcessingLocalCalc}
            startIcon={<CheckIcon />}
            sx={{
              backgroundColor: "#B39DDB",
              "&:hover": { backgroundColor: "#D1C4E9" },
              color: "#fff",
            }}
          >
            Next
          </Button>
        )}
        {activeStep === steps.length - 1 &&
          !isCreatingPlan &&
          !isFetchingPlan &&
          !isProcessingLocalCalc && (
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={<CheckIcon />}
              sx={{
                backgroundColor: "#B39DDB",
                "&:hover": { backgroundColor: "#D1C4E9" },
                color: "#fff",
              }}
            >
              Confirm Plan
            </Button>
          )}
      </Box>
    </Box>
  );

  return (
    <>
      {renderAsDialog ? (
        <Dialog
          open={open}
          onClose={onClose}
          scroll="paper"
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              backgroundColor: "#1f1f1f",
              color: "#fff",
            },
          }}
        >
          <DialogTitle sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Adaptive Plan Setup
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Box>{content}</Box>
      )}

      {/* New MUI dialog for PlanFetcher */}
      <Dialog
  open={showReduxPlanDialog}
  onClose={() => setShowReduxPlanDialog(false)}
  fullWidth={false}       // disable the default "fullWidth"
  maxWidth={false}        // disable MUI's maxWidth so we can use our own
  sx={{
    "& .MuiDialog-paper": {
      // Control the overall size of the modal
      width: "90vw",
      height: "90vh",
      maxWidth: "90vw",
      maxHeight: "90vh",
      // Dark styling
      backgroundColor: "#000",
      color: "#fff",
      borderRadius: 2,
      boxShadow: "none",

      // So the DialogContent can stretch
      display: "flex",
      flexDirection: "column",
    },
  }}
>
  <DialogContent
    sx={{
      display: "flex",
      flexDirection: "column",
      flex: 1,          // let child fill vertical space
      p: 0,
      backgroundColor: "#000",
      overflow: "hidden",
    }}
  >
    {playerPlanId ? (
      <PlanFetcher
        planId={playerPlanId}
        userId={userId}
        // pass any other needed props
      />
    ) : (
      <Typography sx={{ color: "#fff", m: 2 }}>
        No planId found. Cannot load plan.
      </Typography>
    )}
  </DialogContent>
       
      </Dialog>
    </>
  );
}