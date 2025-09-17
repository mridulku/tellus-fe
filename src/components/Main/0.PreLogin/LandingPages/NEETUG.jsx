/***************************************************************************
 * src/components/ExamLandingPage.jsx  ––  Slim NEET edition (v3 user-friendly)
 ***************************************************************************/

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Container,
  Box, Button, IconButton, Drawer, Stack, Paper, Grid
} from "@mui/material";
import MenuIcon   from "@mui/icons-material/Menu";
import CloseIcon  from "@mui/icons-material/CloseRounded";
import QuizIcon   from "@mui/icons-material/Quiz";
import TodayIcon  from "@mui/icons-material/Today";
import CheckIcon  from "@mui/icons-material/CheckCircle";
import { useDispatch } from "react-redux";
import { setExamType } from "../../../../store/examSlice";   // ← ADDED


import {
  GoogleAuthProvider, signInWithPopup, signInWithCustomToken
} from "firebase/auth";
import axios from "axios";
import { auth } from "../../../../firebase";
import googleIcon from "../logo.png";

/* ───────────────────────── theme  ────────────────── */
import { createTheme } from "@mui/material/styles";
const theme = createTheme({
  palette:{
    mode:"dark",
    primary:{ main:"#B39DDB" },
    secondary:{ main:"#FFD700" },
    background:{ default:"#0F0F0F", paper:"#1F1F1F" },
    text:{ primary:"#FFF", secondary:"#b3b3b3" },
  },
  typography:{ fontFamily:["Inter","Roboto","sans-serif"].join(","), h4:{fontWeight:700} },
});

/* ───────────────────────── helpers ────────────────── */
const slugToType = { neet:"NEET" };
const GoogleLogo = () => (
  <img src={googleIcon} alt="G" width={18} height={18}
       style={{marginRight:8,verticalAlign:"middle"}}/>
);

/* ───────────────────────── NavBar ────────────────── */
function NavBar({ examType, onGoogle }) {
  const [open,setOpen]=React.useState(false);
  const cta=`Start my ${examType} prep`;
  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor:"transparent",
          backdropFilter:"none",
          transition:"all .3s",
          "&.scrolled":{ bgcolor:"rgba(10,0,30,.6)", backdropFilter:"blur(8px)" }
        }}
      >
        <Toolbar sx={{justifyContent:"space-between"}}>
          <Typography variant="h6" sx={{fontWeight:700,cursor:"pointer"}}
                      onClick={()=>window.location='/'}>
            🚀 talk-ai.co
          </Typography>
          <Box sx={{display:{xs:"none",md:"block"}}}>
            <Button variant="outlined" color="primary" onClick={onGoogle}>
              <GoogleLogo/>{cta}
            </Button>
          </Box>
          <IconButton sx={{display:{xs:"flex",md:"none"}}}
                      onClick={()=>setOpen(true)}>
            <MenuIcon/>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="top" open={open} onClose={()=>setOpen(false)}>
        <Box sx={{p:3,bgcolor:"background.default"}}>
          <Box sx={{display:"flex",justifyContent:"flex-end"}}>
            <IconButton onClick={()=>setOpen(false)}><CloseIcon/></IconButton>
          </Box>
          <Stack spacing={2} sx={{mt:2}}>
            <Button variant="outlined" color="primary"
                    onClick={()=>{setOpen(false);onGoogle();}}>
              <GoogleLogo/>{cta}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

/* 1️⃣  HERO ------------------------------------------------------------ */
function Hero({ examType, onGoogle }) {
  return (
    <Box
      sx={{
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        background:"linear-gradient(150deg,#19002c 0%,#29005a 55%,#070012 100%)",
      }}
    >
      <Container>
        <Typography variant="h3" sx={{fontWeight:800,mb:2}}>
          Study what matters. Skip what doesn’t.
        </Typography>

        <Typography variant="h6" sx={{mb:4,maxWidth:640,color:"text.secondary"}}>
          We slice the syllabus into tiny concepts, spot your gaps in minutes, then run quick learn-quiz-review cycles that fix those gaps first—so you master more, forget less, and spend fewer hours studying.
        </Typography>

        <Button
          variant="contained"
          size="large"
          color="secondary"
          sx={{fontWeight:600}}
          onClick={onGoogle}
        >
          <GoogleLogo/>Start my NEET Prep
        </Button>
      </Container>
    </Box>
  );
}

/* 2️⃣  HOW-IT-WORKS ---------------------------------------------------- */
/* 2️⃣  HOW-IT-WORKS  —  concept graph ◾ plan ◾ learn loop --------------- */
import BubbleChartIcon  from "@mui/icons-material/BubbleChart";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";

function HowItWorks() {
  const steps = [
    {
      icon: <BubbleChartIcon sx={{ fontSize: 46, color: "#FFD54F" }} />,
      title: "Map the syllabus",
      text: "AI turns every chapter into a concept graph, so nothing slips through the cracks."
    },
    {
      icon: <TodayIcon sx={{ fontSize: 46, color: "#4FC3F7" }} />,
      title: "Build your plan",
      text: "You enter exam date & free minutes; a daily schedule appears in seconds."
    },
    {
      icon: <AutoAwesomeMotionIcon sx={{ fontSize: 46, color: "#81C784" }} />,
      title: "Learn on autopilot",
      text: "Smart quiz loops (remember → understand → apply) adapt until each topic sticks."
    },
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: "#120022" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          How it works
        </Typography>

        <Grid container spacing={4}>
          {steps.map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  background:
                    "linear-gradient(180deg,#1e0035 0%,#160029 100%)",
                }}
              >
                {s.icon}
                <Typography
                  variant="h6"
                  sx={{ mt: 1, mb: 1, fontWeight: 700 }}
                >
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {s.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/* 2.5️⃣  WHY DIFFERENT BAR -------------------------------------------- */
function WhyDifferentBar(){
  return(
    <Box sx={{py:4,bgcolor:"#0d0020"}}>
      <Container sx={{textAlign:"center"}}>
        <Typography variant="h6" sx={{fontWeight:700,mb:1}}>
          Why learners pick us
        </Typography>
        <Typography variant="body2" sx={{color:"text.secondary"}}>
          • Plan made in <strong>60 sec</strong>  • Tasks auto-shift when you skip a day<br/>
          • No generic videos — <strong>read&nbsp;→&nbsp;quiz&nbsp;→&nbsp;revise</strong> loop<br/>
          • System learns your pace, adapats accordingly<br/>
        </Typography>
      </Container>
    </Box>
  );
}

/* 3️⃣  PROOF + CTA ---------------------------------------------------- */
function ProofCTA({ onGoogle }) {
  return (
    <Box sx={{py:8,bgcolor:"#1a0033"}}>
      <Container sx={{textAlign:"center"}}>
        <Typography variant="h4" sx={{fontWeight:700,mb:2,color:"#FFD54F"}}>
          Save more than 50 % study time — hit higher marks
        </Typography>

        <Typography variant="body1"
                    sx={{color:"text.secondary",mb:4,maxWidth:580,mx:"auto"}}>
          Join the free pilot. Your first plan is created in seconds —
          then let the system hand hold you to success on exam day.
        </Typography>

        <Button variant="contained" size="large" color="secondary"
                sx={{fontWeight:600}} onClick={onGoogle}>
          <GoogleLogo/>Start My NEET Prep
        </Button>
      </Container>
    </Box>
  );
}

/* ─────────────────────────  Main Export  ────────────────── */
export default function NEETLandingPage(){
  const dispatch = useDispatch();   //  <-- add this line

  const navigate = useNavigate();
  const slug = useLocation().pathname.split("/").pop().toLowerCase();
  const examType = slugToType[slug] ?? "NEET";
  const backend  = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  useEffect(()=>{ if(localStorage.getItem("token")) navigate("/dashboard"); },[navigate]);

  async function googleSignIn(){
    try{
      sessionStorage.setItem("pendingExam",examType);
      const provider=new GoogleAuthProvider();
      await signInWithPopup(auth,provider);
      const idToken = await auth.currentUser.getIdToken();
      const {data}=await axios.post(`${backend}/login-google`,{idToken,examType});
      if(!data.success) throw new Error(data.error);
      await signInWithCustomToken(auth,data.firebaseCustomToken);
         /* make Redux know the exam right now */
      dispatch(setExamType(examType));
      localStorage.setItem("userId", auth.currentUser.uid);   // <– step 5
      await createLearnerPersonaIfNeeded();                   // <– step 6

      localStorage.setItem("token",data.token);
      localStorage.setItem("userData",JSON.stringify(data.user));
      navigate("/dashboard");
    }catch(err){ console.error("Google sign-in failed:",err);}
  }

  async function createLearnerPersonaIfNeeded() {
  try {
    if (!auth.currentUser) return;
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/create-learner-persona`,
      { userId: auth.currentUser.uid, wpm: 200, dailyReadingTime: 30 }
    );
  } catch (err) {
    console.error("Error creating learner persona:", err);
  }
}

  useEffect(()=>{
    const bar=document.querySelector('.MuiAppBar-root');
    const onScroll=()=>{window.scrollY>40?bar.classList.add('scrolled'):bar.classList.remove('scrolled');};
    window.addEventListener('scroll',onScroll);
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  return(
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <NavBar examType={examType} onGoogle={googleSignIn}/>
      <Hero   examType={examType} onGoogle={googleSignIn}/>
      <HowItWorks/>
      <WhyDifferentBar/>
      <ProofCTA onGoogle={googleSignIn}/>
    </ThemeProvider>
  );
}