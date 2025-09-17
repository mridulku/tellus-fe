import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Stepper,
  Grid,
  Step,
  StepLabel,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  useMediaQuery
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import CelebrationIcon from "@mui/icons-material/Celebration";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

 import { useSelector, useDispatch } from "react-redux";
 import { PlanModalCtx } from "../../../../StudyModal";
import { setCurrentIndex } from "../../../../../../../store/planSlice";

  /*  ⬇︎  NEW imports – add to the top, with the other icon imports  */
  import MemoryIcon from "@mui/icons-material/Memory";
  import LightbulbIcon from "@mui/icons-material/EmojiObjects";
  import BuildIcon from "@mui/icons-material/Build";
  import SearchIcon from "@mui/icons-material/ManageSearch";

// Bloom's stages for demonstration
const bloomStages = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

export default function GuideRemember() {
  // PHASES => 'guide' | 'quiz' | 'revision' | 'retake' | 'final'
  const [phase, setPhase] = useState("guide");
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // Redux
  const dispatch = useDispatch();
  const currentIndex = useSelector((state) => state.plan?.currentIndex ?? 0);
  const { onClose } = React.useContext(PlanModalCtx);            // ← real prop

  // Hard-coded quiz
  const initialQuestions = [
    {
      id: "Q1",
      conceptId: "Sky Color",
      question: "What color is the sky on a clear day?",
      type: "multipleChoice",
      options: ["Green", "Red", "Blue", "White"],
      correctIndex: 2,
    },
    {
      id: "Q2",
      conceptId: "Weight Comparison",
      question: "Which is heavier: 1kg of iron or 1kg of cotton?",
      type: "multipleChoice",
      options: ["Iron", "Cotton", "Both weigh 1kg", "Not sure"],
      correctIndex: 2,
    },
  ];

  const [questions] = useState(initialQuestions);
  const [userAnswers, setUserAnswers] = useState(Array(initialQuestions.length).fill(""));
  const [missedIndices, setMissedIndices] = useState([]);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // Feedback
  const [passMessage, setPassMessage] = useState("");
  const [failMessage, setFailMessage] = useState("");

  // Dummy revision content
  const revisionHtml = `
    <ul style="margin: 0; padding: 0 1.2rem;">
      <li>The sky is typically "blue" on a clear day.</li>
      <li>Both 1kg of iron and 1kg of cotton weigh the same: 1kg!</li>
    </ul>
  `;



/*  ⬇︎  Stage metadata used by both the Stepper & the grid cards  */
const bloomPreview = [
  {
    label: "Remember",
    icon: <MemoryIcon />,
    color: "#FFD54F",
    sample: "Quick-fire recall (MCQ, fill-the-blank)"
  },
  {
    label: "Understand",
    icon: <LightbulbIcon />,
    color: "#BB86FC",
    sample: "Explain ideas in your own words"
  },
  {
    label: "Apply",
    icon: <BuildIcon />,
    color: "#4FC3F7",
    sample: "Solve practice problems"
  },
  {
    label: "Analyze",
    icon: <SearchIcon />,
    color: "#81C784",
    sample: "Compare & break down scenarios"
  }
];

/*  ⬇︎  Custom Step icon for the Stepper  */


 /*  ⬇︎  REPLACE the old renderGuide() with this new version  */
 function renderGuide() {
  return (
    <Box sx={styles.outerContainer}>
      <Paper elevation={3} sx={styles.guidePaper}>
        {/* Heading */}
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#FFD54F", mb: 1 }}
        >
          🎉 Great job finishing your reading!
        </Typography>

        {/* Brief overview */}
        <Typography variant="body1" sx={styles.paragraph}>
          You’ll now climb <strong>Bloom’s adaptive ladder</strong> through&nbsp;
          <strong>four stages</strong>. Each stage asks a different
          question style to deepen your mastery:
        </Typography>

        {/* 4-stage Stepper (labels only) */}
        <Stepper alternativeLabel activeStep={0} connector={null} sx={{ mb: 3 }}>
          {bloomPreview.map((s) => (
            <Step key={s.label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": { color: "#ccc", fontWeight: 500 },
                  "& .Mui-active .MuiStepLabel-label": { color: s.color },
                }}
              >
                {s.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Stage preview cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {bloomPreview.map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "#222",
                  borderLeft: `4px solid ${s.color}`,
                  height: "100%",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", mb: 1, color: s.color }}
                >
                  {s.icon}
                  <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#ccc" }}>
                  {s.sample}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Explain the Remember loop */}
        <Typography variant="body2" sx={{ ...styles.paragraph, mb: 3 }}>
          First up is <strong>Remember</strong>. Answer quick-fire recall
          questions. Miss any? We’ll show a lightning revision, then let you
          retake just those questions until you pass—before moving to
          <em>Understand</em>.
        </Typography>

        {/* CTA */}
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={() => setPhase("quiz")}
          sx={styles.actionButton}
        >
          Begin Recall Quiz
        </Button>
      </Paper>
    </Box>
  );
}


  function renderQuiz() {
    return (
      <Box sx={styles.outerContainer}>
        <Paper sx={styles.contentPaper}>
          <Typography variant="h5" sx={{ mb: 2, color: "#fff" }}>
            Attempt #{attemptNumber}: Quick Recall
          </Typography>
          {passMessage && (
            <Typography sx={{ color: "#BBFFBB", mb: 2 }}>{passMessage}</Typography>
          )}
          {failMessage && (
            <Typography sx={{ color: "#FF9999", mb: 2 }}>{failMessage}</Typography>
          )}

          {questions.map((qObj, i) => (
            <Box key={qObj.id} sx={styles.questionBlock}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ color: "#ddd" }}>
                  Q{i + 1}: {qObj.question}
                </Typography>
                <Chip
                  label={qObj.conceptId}
                  variant="outlined"
                  sx={{
                    borderColor: "#BB86FC",
                    color: "#BB86FC",
                    fontSize: "0.7rem",
                    height: "24px",
                  }}
                />
              </Box>
              {renderMCQ(qObj, i)}
            </Box>
          ))}

          <Button variant="contained" onClick={handleQuizSubmit} sx={styles.actionButton}>
            Submit
          </Button>
        </Paper>
      </Box>
    );
  }

  function renderRevision() {
    return (
      <Box sx={styles.outerContainer}>
        <Paper sx={styles.contentPaper}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AutorenewIcon sx={{ color: "#FFD54F", mr: 1 }} />
            <Typography variant="h5" sx={{ color: "#fff" }}>
              Revision Needed
            </Typography>
          </Box>

          {failMessage && (
            <Typography sx={{ color: "#FF9999", mb: 2 }}>{failMessage}</Typography>
          )}
          <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
            We’ll focus on the concepts you missed. First, read these quick tips:
          </Typography>

          <Box
            sx={styles.revisionArea}
            dangerouslySetInnerHTML={{ __html: revisionHtml }}
          />
          <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
            After that, you’ll <strong>retake only the missed question(s)</strong> until
            you get them right. This loop ensures you master each concept before
            continuing.
          </Typography>

          {/* Show missed concept chips */}
          <Box sx={{ mb: 2 }}>
            {missedIndices.map((idx) => (
              <Chip
                key={questions[idx].id}
                label={questions[idx].conceptId}
                variant="outlined"
                sx={{
                  borderColor: "#FFD54F",
                  color: "#FFD54F",
                  fontSize: "0.7rem",
                  height: "24px",
                  mr: 1,
                  mb: 1,
                }}
              />
            ))}
          </Box>

          <Button variant="contained" onClick={handleRevisionDone} sx={styles.actionButton}>
            Retake Missed Questions
          </Button>
        </Paper>
      </Box>
    );
  }

  function renderRetake() {
    return (
      <Box sx={styles.outerContainer}>
        <Paper sx={styles.contentPaper}>
          <Typography variant="h5" sx={{ mb: 2, color: "#fff" }}>
            Retake (Attempt #{attemptNumber})
          </Typography>
          {passMessage && (
            <Typography sx={{ color: "#BBFFBB", mb: 2 }}>{passMessage}</Typography>
          )}
          {failMessage && (
            <Typography sx={{ color: "#FF9999", mb: 2 }}>{failMessage}</Typography>
          )}

          {missedIndices.map((qIdx) => {
            const q = questions[qIdx];
            return (
              <Box key={q.id} sx={styles.questionBlock}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ color: "#ddd" }}>
                    Q{qIdx + 1}: {q.question}
                  </Typography>
                  <Chip
                    label={q.conceptId}
                    variant="outlined"
                    sx={{
                      borderColor: "#BB86FC",
                      color: "#BB86FC",
                      fontSize: "0.7rem",
                      height: "24px",
                    }}
                  />
                </Box>
                {renderMCQ(q, qIdx)}
              </Box>
            );
          })}

          <Button variant="contained" onClick={handleRetakeSubmit} sx={styles.actionButton}>
            Submit Retake
          </Button>
        </Paper>
      </Box>
    );
  }

  function renderFinal() {
    return (
      <Box sx={styles.outerContainer}>
        <Paper sx={styles.contentPaper}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CelebrationIcon sx={{ color: "#FFD54F", mr: 1 }} />
            <Typography variant="h5" sx={{ color: "#fff" }}>
              Remember Stage Complete!
            </Typography>
          </Box>
          {passMessage && (
            <Typography sx={{ color: "#BBFFBB", mb: 2 }}>{passMessage}</Typography>
          )}

          {/* Show the Bloom Stepper again, or a shortened version, highlighting the full path */}
          <Stepper
            alternativeLabel
            activeStep={0} 
            sx={{ mb: 2 }}
          >
            {bloomStages.map((label, index) => (
              <Step key={label} completed={index === 0}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": { color: "#ccc" },
                    "& .Mui-completed .MuiStepLabel-label": { color: "#FFD54F" },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
            Great job! You’ve mastered the basics for the “Remember” stage. 
            Each upcoming stage will feature deeper question types (Understand, Apply, etc.), 
            so you continuously build stronger mastery.
          </Typography>

          <Button variant="contained" onClick={handleFinish} sx={styles.finishButton}>
            Continue to Your Plan
          </Button>
        </Paper>
      </Box>
    );
  }

  // ---------------- QUIZ LOGIC ----------------
  function handleQuizSubmit() {
    const newlyMissed = [];
    questions.forEach((qObj, i) => {
      if (parseInt(userAnswers[i], 10) !== qObj.correctIndex) {
        newlyMissed.push(i);
      }
    });

    if (newlyMissed.length === 0) {
      setPassMessage("Fantastic! You got everything correct on this attempt.");
      setFailMessage("");
      setPhase("final");
    } else {
      setMissedIndices(newlyMissed);
      setPassMessage("");
      setFailMessage(`You missed ${newlyMissed.length} question(s). Let’s do a quick revision!`);
      setPhase("revision");
    }
  }

  function handleRevisionDone() {
    setPhase("retake");
    setAttemptNumber((prev) => prev + 1);
  }

  function handleRetakeSubmit() {
    const newlyMissed = [];
    missedIndices.forEach((qIdx) => {
      if (parseInt(userAnswers[qIdx], 10) !== questions[qIdx].correctIndex) {
        newlyMissed.push(qIdx);
      }
    });

    if (newlyMissed.length === 0) {
      setMissedIndices([]);
      setPassMessage(`Great job fixing the missed questions on attempt #${attemptNumber}!`);
      setFailMessage("");
      setPhase("final");
    } else {
      setMissedIndices(newlyMissed);
      setPassMessage("");
      setFailMessage(`Still missed ${newlyMissed.length} question(s). Let's revise again.`);
      setPhase("revision");
    }
  }

   function handleFinish() {
   /* if PlanFetcher supplied an onClose → close the modal */
   if (typeof onClose === "function") {
     onClose();
   } else {
     /* fallback: old behaviour */
     dispatch(setCurrentIndex(currentIndex + 1));
   }
 }

  // ---------------- RENDER MCQ ----------------
  function renderMCQ(qObj, qIdx) {
    return (
      <RadioGroup
        name={`q_${qObj.id}`}
        value={userAnswers[qIdx] || ""}
        onChange={(e) => handleAnswerChange(qIdx, e.target.value)}
      >
        {qObj.options.map((opt, i) => (
          <FormControlLabel
            key={i}
            value={String(i)}
            control={<Radio sx={{ color: "#BB86FC" }} />}
            label={opt}
            sx={{ color: "#ccc" }}
            aria-label={`Option ${i + 1} for question ${qObj.id}`}
          />
        ))}
      </RadioGroup>
    );
  }
  function handleAnswerChange(qIdx, val) {
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = val;
    setUserAnswers(newAnswers);
  }

  // ---------------- PHASE SWITCH ----------------
  switch (phase) {
    case "guide":
      return renderGuide();
    case "quiz":
      return renderQuiz();
    case "revision":
      return renderRevision();
    case "retake":
      return renderRetake();
    case "final":
      return renderFinal();
    default:
      return <Box sx={{ color: "#fff" }}>Unknown phase: {phase}</Box>;
  }
}

// ---------------- STYLES ----------------
const styles = {
  outerContainer: {
    backgroundColor: "#000",
    minHeight: "100vh",
    py: 4,
    px: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  guidePaper: {
    maxWidth: 800,
    width: "100%",
    backgroundColor: "#111",
    p: 3,
    borderRadius: 2,
    color: "#fff",
  },
  contentPaper: {
    maxWidth: 600,
    width: "100%",
    backgroundColor: "#111",
    p: 3,
    borderRadius: 2,
    border: "1px solid #333",
  },
  paragraph: {
    color: "#ccc",
    mb: 2,
  },
  actionButton: {
    mt: 2,
    backgroundColor: "#BB86FC",
    fontWeight: "bold",
    "&:hover": { backgroundColor: "#a55efc" },
  },
  questionBlock: {
    backgroundColor: "#222",
    borderRadius: 2,
    p: 2,
    mb: 2,
  },
  revisionArea: {
    backgroundColor: "#222",
    borderRadius: 2,
    p: 2,
    mb: 2,
    color: "#ccc",
  },
  finishButton: {
    mt: 2,
    backgroundColor: "#FFD54F",
    color: "#000",
    fontWeight: "bold",
    "&:hover": { backgroundColor: "#f4c953" },
  },
};