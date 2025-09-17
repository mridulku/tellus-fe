// AuthLogin.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signInWithCustomToken } from "firebase/auth";
import axios from "axios";

// MUI imports
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Drawer from "@mui/material/Drawer";

// 1) Reuse your dark + gold theme or create a consistent one
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD700', // gold
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function AuthAppBar() {
  // Minimal top bar with brand "TalkAI"
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          TalkAI
        </Typography>

        {/* Only a menu icon (or nothing) — remove sign-in since we are on login page */}
        <IconButton
          onClick={toggleDrawer}
          sx={{ display: { xs: 'block', md: 'none' }, color: 'primary.main' }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer (if you want any items, or keep blank) */}
      <Drawer anchor="top" open={open} onClose={toggleDrawer}>
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={toggleDrawer} sx={{ color: 'primary.main' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          {/* If you want some placeholder or nav links, add them here */}
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default function AuthLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Check if user is already logged in => redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${backendURL}/login`, { username, password });

      if (response.data.success) {
        const firebaseCustomToken = response.data.firebaseCustomToken;
        if (!firebaseCustomToken) {
          alert("No firebase custom token returned from server.");
          return;
        }

        // 2) Sign in to Firebase
        await signInWithCustomToken(auth, firebaseCustomToken);

        // 3) Log user
        console.log("Auth current user after login:", auth.currentUser);
        console.log("User UID:", auth.currentUser?.uid);

        // 4) Store JWT if needed
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));

        // 5) Navigate
        if (response.data.user.onboardingComplete) {
          navigate("/dashboard");
        } else {
          // or /onboard if you have a separate route
          navigate("/dashboard");
        }
      } else {
        alert(response.data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Login failed. Check console for details.");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthAppBar />

      {/* Main container */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(160deg, #000000 50%, #1A1A1A 100%)",          
          py: 6
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              borderRadius: "10px",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Welcome Back
            </Typography>
            <Typography sx={{ mb: 4, color: 'text.secondary' }}>
              Please log in to continue
            </Typography>

            {/* Inputs */}
            <TextField
              fullWidth
              variant="outlined"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              variant="outlined"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            {/* Login button */}
            <Button
              onClick={handleLogin}
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              Log In
            </Button>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}