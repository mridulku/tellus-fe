/* OnboardingWizard.jsx
   ────────────────────────────────────────────────────────────────
   A 2-step welcome flow:

   1.  Pick the topics you want to learn (checkbox tree)
   2.  Pick your overall goal (radio buttons)

   Dark theme, black background, fully self-contained.
   Replace the “subjects” array with your real catalog later.
   ───────────────────────────────────────────────────────────────*/

   import React, { useState } from "react";
   import {
     Box,
     Button,
     Checkbox,
     Container,
     CssBaseline,
     FormControl,
     FormControlLabel,
     FormGroup,
     FormLabel,
     Radio,
     RadioGroup,
     Step,
     StepLabel,
     Stepper,
     ThemeProvider,
     Typography,
     createTheme,
   } from "@mui/material";
   
   // ──────────────────── dummy catalog ──────────────────────────────
   const subjects = [
     {
       name: "Physics",
       topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"],
     },
     {
       name: "Chemistry",
       topics: ["Organic", "Inorganic", "Physical", "Analytical"],
     },
     {
       name: "Mathematics",
       topics: ["Algebra", "Calculus", "Geometry", "Probability"],
     },
     {
       name: "Biology",
       topics: ["Cell Biology", "Genetics", "Ecology", "Evolution"],
     },
   ];
   
   // ──────────────────── mui dark palette ───────────────────────────
   const darkTheme = createTheme({
     palette: {
       mode: "dark",
       background: {
         default: "#121212",
         paper: "#1E1E1E",
       },
       primary: {
         main: "#bb86fc",
       },
     },
     typography: {
       fontFamily: "Inter, Roboto, sans-serif",
     },
   });
   
   function OnboardingWizard({ onFinish = console.log }) {
     /* step state */
     const [activeStep, setActiveStep] = useState(0);
   
     /* selections */
     const [selected, setSelected] = useState(() =>
       subjects.reduce(
         (acc, sub) => ({ ...acc, [sub.name]: new Set() }),
         {}
       )
     );
     const [goal, setGoal] = useState("");
   
     /* helpers */
     const steps = ["Pick topics", "Choose your goal"];
   
     const handleTopicToggle = (subject, topic) => {
       setSelected((s) => {
          const set = new Set(selected[subject]); // clone Set
   
         set.has(topic) ? set.delete(topic) : set.add(topic);
         return { ...s, [subject]: set };
       });
     };
   
     const handleNext = () => {
       if (activeStep === steps.length - 1) {
         /* compile payload */
         const payload = {
           topics: Object.fromEntries(
             Object.entries(selected).map(([k, v]) => [k, Array.from(v)])
           ),
           goal,
         };
         onFinish(payload);
         return;
       }
       setActiveStep((p) => p + 1);
     };
     const handleBack = () => setActiveStep((p) => p - 1);
   
     /* ───────────── render each slide ───────────── */
     const SlidePickTopics = (
       <Box sx={{ mt: 4 }}>
         {subjects.map(({ name, topics }) => (
           <Box key={name} sx={{ mb: 3 }}>
             <Typography variant="h6" sx={{ mb: 1 }}>
               {name}
             </Typography>
             <FormGroup>
               {topics.map((t) => (
                 <FormControlLabel
                   key={t}
                   control={
                     <Checkbox
                       checked={selected[name].has(t)}
                       onChange={() => handleTopicToggle(name, t)}
                     />
                   }
                   label={t}
                 />
               ))}
             </FormGroup>
           </Box>
         ))}
       </Box>
     );
   
     const SlideGoal = (
       <FormControl sx={{ mt: 4 }}>
         <FormLabel>What best describes your goal?</FormLabel>
         <RadioGroup
           value={goal}
           onChange={(e) => setGoal(e.target.value)}
           sx={{ mt: 2, gap: 2 }}
         >
           <FormControlLabel
             value="start_fresh"
             control={<Radio />}
             label="Start from scratch and master the subject over time"
           />
           <FormControlLabel
             value="diagnose_weakness"
             control={<Radio />}
             label="I already studied it — find weak spots and go deeper"
           />
         </RadioGroup>
       </FormControl>
     );
   
     /* ───────────── main render ───────────── */
     return (
       <ThemeProvider theme={darkTheme}>
         <CssBaseline />
         <Box
           sx={{
             minHeight: "100vh",
             bgcolor: "background.default",
             color: "text.primary",
             display: "flex",
             alignItems: "center",
           }}
         >
           <Container maxWidth="sm">
             <Typography variant="h4" align="center" gutterBottom>
               👋 Welcome to the platform!
             </Typography>
   
             {/* stepper */}
             <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4 }}>
               {steps.map((label) => (
                 <Step key={label}>
                   <StepLabel>{label}</StepLabel>
                 </Step>
               ))}
             </Stepper>
   
             {/* slide */}
             {activeStep === 0 ? SlidePickTopics : SlideGoal}
   
             {/* navigation buttons */}
             <Box
               sx={{
                 display: "flex",
                 justifyContent: "space-between",
                 mt: 4,
               }}
             >
               <Button
                 disabled={activeStep === 0}
                 onClick={handleBack}
                 variant="outlined"
               >
                 Back
               </Button>
               <Button
                 onClick={handleNext}
                 variant="contained"
                 color="primary"
                 disabled={
                   activeStep === 0 &&
                   Object.values(selected).every((set) => set.size === 0)
                 }
               >
                 {activeStep === steps.length - 1 ? "Finish" : "Next"}
               </Button>
             </Box>
           </Container>
         </Box>
       </ThemeProvider>
     );
   }
   
   export default OnboardingWizard;