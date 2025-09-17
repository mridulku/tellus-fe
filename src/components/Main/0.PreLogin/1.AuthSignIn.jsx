// src/components/AuthSignIn.jsx
import React, { useState, useEffect } from "react";
import googleIcon from "./logo.png"; // <-- Import from same folder

import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
} from "firebase/auth";
import axios from "axios";
import { auth } from "../../../firebase";

// ----- Material UI Imports -----
import {
  createTheme,
  ThemeProvider,
  styled
} from "@mui/material/styles";
import {
  CssBaseline,
  Container,
  Paper,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress
} from "@mui/material";

// OPTIONAL: small Google "G" logo icon
const GoogleLogo = () => (
  <img
    src={googleIcon}
    alt="Google Logo"
    width="18"
    height="18"
    style={{ marginRight: 8, verticalAlign: "middle" }}
  />
);

// Dark theme with purple + gold accents
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B39DDB", // Purple accent
    },
    secondary: {
      main: "#FFD700", // Gold accent
    },
    background: {
      default: "#0F0F0F",
      paper: "#1F1F1F",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#AAAAAA",
    },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
  },
});

// A styled Paper container to hold our sign-in box
const SignInContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: "60px auto",
  padding: theme.spacing(4),
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
}));

export default function AuthSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingEmailPassword, setLoadingEmailPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // If user is already logged in => skip sign-in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  /**
   * After sign-in, create a learnerPersonas doc if none exists
   */
  async function createLearnerPersonaIfNeeded() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await axios.post(`${backendURL}/create-learner-persona`, {
        userId: currentUser.uid,
        wpm: 200,
        dailyReadingTime: 30,
      });
    } catch (err) {
      console.error("Error creating learner persona:", err);
      // Not a show-stopper, so we won't block
    }
  }

  // =============================================
  // 1) USERNAME + PASSWORD Sign-In
  // =============================================
  const handleEmailPasswordSignIn = async () => {
    setErrorMsg("");
    setLoadingEmailPassword(true);
    try {
      const response = await axios.post(`${backendURL}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const { token, firebaseCustomToken, user } = response.data;
        if (!firebaseCustomToken) {
          alert("No Firebase custom token returned from server.");
          return;
        }

        // Sign in to Firebase
        await signInWithCustomToken(auth, firebaseCustomToken);

        // Store userId
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          localStorage.setItem("userId", currentUserId);
        }

        // Attempt to create a default learnerPersona
        await createLearnerPersonaIfNeeded();

        // Store server JWT + user data
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        // Navigate to Dashboard
        navigate("/dashboard");
      } else {
        setErrorMsg(response.data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in with username/password:", error);
      setErrorMsg("Login failed. Check console for details.");
    } finally {
      setLoadingEmailPassword(false);
    }
  };

  // =============================================
  // 2) GOOGLE Sign-In
  // =============================================
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // Get the Firebase ID token
      const idToken = await auth.currentUser.getIdToken();

      // Send to server
      const response = await axios.post(`${backendURL}/login-google`, {
        idToken,
      });

      if (response.data.success) {
        const { token, firebaseCustomToken, user } = response.data;

        await signInWithCustomToken(auth, firebaseCustomToken);

        // Store userId
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          localStorage.setItem("userId", currentUserId);
        }

        // Attempt to create a default learnerPersona
        await createLearnerPersonaIfNeeded();

        // Store server JWT + user data
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        navigate("/dashboard");
      } else {
        setErrorMsg(response.data.error || "Google Sign-In failed");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setErrorMsg("Google Sign-In failed. Check console for details.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <SignInContainer elevation={4}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* USERNAME */}
          <TextField
            fullWidth
            variant="outlined"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* PASSWORD */}
          <TextField
            fullWidth
            variant="outlined"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            onClick={handleEmailPasswordSignIn}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 2, fontWeight: "bold" }}
            disabled={loadingEmailPassword}
          >
            {loadingEmailPassword ? (
              <CircularProgress size={24} />
            ) : (
              "Sign In"
            )}
          </Button>

          <Divider sx={{ my: 2 }}>OR</Divider>

          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled={loadingGoogle}
          >
            {loadingGoogle ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <GoogleLogo />
                Sign In with Google
              </>
            )}
          </Button>
        </SignInContainer>
      </Container>
    </ThemeProvider>
  );
}