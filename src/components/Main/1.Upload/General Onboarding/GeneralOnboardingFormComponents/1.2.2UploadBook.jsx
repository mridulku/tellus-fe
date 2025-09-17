// src/components/DetailedBookViewer/UploadBook.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../../../../firebase";

export default function UploadBook({ userId, onComplete }) {
  // States for PDF selection and title
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  // Handler for uploading the selected PDF
  const handleUpload = async () => {
    if (!pdfFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload PDF to Firebase
      const downloadURL = await uploadPDF(pdfFile);

      // 2. Mark user as onboarded in your backend
      await markUserOnboarded(userId);

      setUploadDone(true);
      console.log("PDF uploaded. Download URL:", downloadURL);

      // 3. Signal parent that we’re done (move to next step)
      onComplete();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Upload to Firebase Storage
  const uploadPDF = (file) => {
    return new Promise((resolve, reject) => {
      const currentUser = auth.currentUser;
      const path = `pdfUploads/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);

      const metadata = {
        customMetadata: {
          category: "academic",
          userId: currentUser?.uid || userId || "noUser",
          courseName: pdfTitle,
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(prog));
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Mark the user as onboarded in your backend
  const markUserOnboarded = async (uid) => {
    if (!uid) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/learner-personas/onboard`, {
        userId: uid,
      });
      console.log("User marked as onboarded:", uid);
    } catch (err) {
      console.error("Error marking user onboarded:", err);
    }
  };

  /* ------------------------------------
   * Styles (Dark / Semi‐Transparent Card)
   * ------------------------------------ */
  const cardStyle = {
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "rgba(255,255,255,0.04)",  // or "rgba(0,0,0,0.5)" if you prefer
    padding: "24px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
    color: "#fff",
  };

  const textFieldStyle = {
    mb: 1,
    width: "100%",
    // For a dark theme, you can try variant="filled" with custom styles:
    "& .MuiFilledInput-root": {
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    "& .MuiOutlinedInput-root": {
      // For outlined variant, set the border color:
      "& fieldset": {
        borderColor: "#888",
      },
      "&:hover fieldset": {
        borderColor: "#ccc",
      },
    },
    // Label color
    "& .MuiInputLabel-root": {
      color: "#bbb",
    },
    // Input text color
    "& .MuiInputBase-input": {
      color: "#fff",
    },
  };

  // Purple accent (optional—use if you want the same purple as the carousel)
  const accentPurple = "#9b59b6";
  const accentPurpleHover = "#8e44ad";

  const uploadButtonStyle = {
    backgroundColor: accentPurple,
    color: "#fff",
    textTransform: "none",
    "&:hover": {
      backgroundColor: accentPurpleHover,
    },
  };

  return (
    <Box sx={cardStyle}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        Upload Your Book
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#ccc" }}>
        Select a PDF file, optionally enter a title (or auto-generate it).
      </Typography>

      {/* File Picker */}
      <Button variant="contained" component="label" sx={uploadButtonStyle}>
        Choose PDF
        <input
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        />
      </Button>
      {pdfFile && (
        <Typography variant="subtitle2" sx={{ mt: 1, color: "#ccc" }}>
          Selected: {pdfFile.name}
        </Typography>
      )}

      {/* PDF Title or auto-generate */}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="PDF Title"
          variant="outlined"
          disabled={autoGenerateTitle}
          value={pdfTitle}
          onChange={(e) => setPdfTitle(e.target.value)}
          sx={textFieldStyle}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={autoGenerateTitle}
              onChange={(e) => setAutoGenerateTitle(e.target.checked)}
              sx={{ color: "#ccc" }}
            />
          }
          label={<span style={{ color: "#ccc" }}>Auto-generate title</span>}
        />
      </Box>

      {/* Upload / Next button */}
      <Box sx={{ mt: 3 }}>
        {uploading ? (
          !uploadDone ? (
            <>
              <Typography variant="body1" gutterBottom sx={{ color: "#ccc" }}>
                Uploading {uploadProgress}%
              </Typography>
              <CircularProgress />
            </>
          ) : (
            <Typography variant="body1" sx={{ color: "success.main" }}>
              Upload Complete!
            </Typography>
          )
        ) : (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!pdfFile}
            sx={{ ...uploadButtonStyle, mt: 1 }}
          >
            {pdfFile ? "Upload" : "Upload (Select a File First)"}
          </Button>
        )}
      </Box>
    </Box>
  );
}