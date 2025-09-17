/* ────────────────────────────────────────────────────────────────
   File:  src/components/ReadingGuide.jsx
   Purpose:
     • Welcomes the learner
     • Explains Bloom’s 5-stage ladder + retry/revision loop
     • Warns that the very next screen is a *sample* passage
   ---------------------------------------------------------------- */

   import React from "react";
   import {
     Box,
     Paper,
     Grid,
     Typography,
     Button,
     Divider,
     useMediaQuery,
     Tooltip,
   } from "@mui/material";
   import { useDispatch, useSelector } from "react-redux";
   import { setCurrentIndex } from "../../../../../../../store/planSlice";
   
   /* icons */
   import MenuBookIcon       from "@mui/icons-material/MenuBook";        // Reading
   import QuizIcon           from "@mui/icons-material/Quiz";            // Remember
   import WbIncandescentIcon from "@mui/icons-material/WbIncandescent";  // Understand
   import BuildCircleIcon    from "@mui/icons-material/BuildCircle";     // Apply
   import PsychologyIcon     from "@mui/icons-material/Psychology";      // Analyze
   import ReplayIcon         from "@mui/icons-material/Replay";          // revision loop
   import ArrowForwardIcon   from "@mui/icons-material/ArrowForward";
   
   /* ───── visual constants ───── */
   const GOLD     = "#FFD54F";
   const ACCENT   = "#BB86FC";
   const DARK_BG  = "#111";
   const PANEL_BG = "#1C1C1C";
   
   export default function GuideReading({ onFinish }) {
     const dispatch      = useDispatch();
     const curIndex      = useSelector((s) => s.plan?.currentIndex ?? 0);
     const smallScreen   = useMediaQuery("(max-width:600px)");
   
     /* advance to first READ activity */
     const handleBegin = () => {
       dispatch(setCurrentIndex(curIndex + 1));
       typeof onFinish === "function" && onFinish();
     };
   
     /* mini ladder item */
     const LadderItem = ({ icon, title, tagline, tint = GOLD }) => (
       <Grid item xs={6} sm={4} md={2.4}>
         <Box
           sx={{
             display: "flex",
             flexDirection: "column",
             alignItems: "center",
             bgcolor: PANEL_BG,
             p: 2,
             borderRadius: 2,
             height: "100%",
             border: `1px solid ${tint}55`,
           }}
         >
           {React.cloneElement(icon, {
             sx: { fontSize: 36, color: tint, mb: 0.5 },
           })}
           <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
           <Typography
             variant="caption"
             sx={{ color: "#aaa", textAlign: "center", mt: 0.5, lineHeight: 1.2 }}
           >
             {tagline}
           </Typography>
         </Box>
       </Grid>
     );
   
     /* render */
     return (
       <Box
         sx={{
           width: "100%",
           minHeight: "100%",
           bgcolor: DARK_BG,
           p: { xs: 2, sm: 4 },
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
           boxSizing: "border-box",
         }}
       >
         <Paper
           elevation={4}
           sx={{
             maxWidth: 880,
             width: "100%",
             bgcolor: "#000",
             color: "#fff",
             borderRadius: 3,
             p: { xs: 3, sm: 5 },
           }}
         >
           {/* ── headline ───────────────────────────── */}
           <Typography variant={smallScreen ? "h4" : "h3"} sx={{ fontWeight: 700, mb: 1 }}>
             Welcome to your learning journey!
           </Typography>
           <Typography variant="body1" sx={{ color: "#ccc", mb: 3 }}>
             Every topic you pick climbs <strong>Bloom’s Taxonomy</strong> —
             starting with a quick read, finishing with advanced analysis.
           </Typography>
   
           {/* ── ladder ─────────────────────────────── */}
           <Typography sx={{ fontWeight: 600, mb: 1 }}>The 5 stages you’ll master:</Typography>
           <Grid container spacing={2}>
             <LadderItem
               icon={<MenuBookIcon />}
               title="Reading"
               tagline="Fast skim"
             />
             <LadderItem
               icon={<QuizIcon />}
               title="Remember"
               tagline="1&nbsp;Q / concept"
               tint="#03A9F4"
             />
             <LadderItem
               icon={<WbIncandescentIcon />}
               title="Understand"
               tagline="Why & how"
               tint="#4CAF50"
             />
             <LadderItem
               icon={<BuildCircleIcon />}
               title="Apply"
               tagline="Use in context"
               tint="#FF7043"
             />
             <LadderItem
               icon={<PsychologyIcon />}
               title="Analyze"
               tagline="Solve novel problems"
               tint="#AB47BC"
             />
           </Grid>
   
           {/* ── retry loop explainer ───────────────── */}
           <Divider sx={{ my: 3, bgcolor: "#333" }} />
           <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
             <ReplayIcon sx={{ color: ACCENT }} />
             <Typography variant="h6" sx={{ fontWeight: 600 }}>
               The <em>retry&nbsp;loop</em>
             </Typography>
           </Box>
           <Typography variant="body2" sx={{ color: "#ccc", lineHeight: 1.55 }}>
             Miss any concept in a quiz stage?&nbsp; We drop you into a short,
             focused revision, then retest only those concepts — repeating until
             <strong> every&nbsp;concept sticks</strong>. No wasted time on what you already
             know.
           </Typography>
   
           {/* ── new “sample passage” heads-up ───────── */}
           <Divider sx={{ my: 3, bgcolor: "#333" }} />
           <Paper
             elevation={0}
             sx={{
               bgcolor: PANEL_BG,
               p: 2,
               borderRadius: 2,
               border: `1px dashed ${ACCENT}55`,
             }}
           >
             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 ,color: "#fff" }}>
               What happens next?
             </Typography>
             <Typography variant="body2" sx={{ color: "#bbb", lineHeight: 1.4 }}>
               The next screen is a <strong>1-minute sample passage</strong> so you
               can experience the flow before your real material starts.  It isn’t
               scored — just explore and continue when you’re ready.
             </Typography>
           </Paper>
   
           {/* ── CTA ─────────────────────────────────── */}
           <Box sx={{ textAlign: "center", mt: 4 }}>
             <Button
               variant="contained"
               endIcon={<ArrowForwardIcon />}
               sx={{
                 bgcolor: ACCENT,
                 fontWeight: 700,
                 px: 4,
                 "&:hover": { bgcolor: "#A57BF7" },
               }}
               onClick={handleBegin}
             >
               {smallScreen ? "Start" : "Let’s begin with Reading"}
             </Button>
           </Box>
         </Paper>
       </Box>
     );
   }