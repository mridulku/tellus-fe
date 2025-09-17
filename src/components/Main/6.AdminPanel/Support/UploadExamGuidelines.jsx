// src/components/ExamGuidelines/UploadExamGuidelines.jsx
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
import { storage, auth } from "../../../../firebase"; // adjust path as needed

/**
 * UploadExamGuidelines
 * --------------------
 * A React component for uploading a PDF of exam guidelines.
 * 
 * Usage:
 *   <UploadExamGuidelines userId="xyz" onComplete={() => ...}/>
 */
export default function UploadExamGuidelines({ userId, onComplete }) {
  // State for PDF selection and exam guidelines name/title
  const [pdfFile, setPdfFile] = useState(null);
  const [examTitle, setExamTitle] = useState("");
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(false);

  // NEW: Book ID state
  const [bookId, setBookId] = useState("");

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  // --------------------------
  // 1) Handle the Upload
  // --------------------------
  const handleUpload = async () => {
    if (!pdfFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // 1) Upload the PDF to Firebase with exam-guidelines metadata
      const downloadURL = await uploadExamGuidelinesPDF(pdfFile);

      // 2) (Optional) Update your backend or user doc
      await markUserHasExamGuidelines(userId);

      setUploadDone(true);
      console.log("Exam guidelines PDF uploaded. Download URL:", downloadURL);

      // 3) Call onComplete if provided
      onComplete?.();
    } catch (error) {
      console.error("Error uploading exam guidelines PDF:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // --------------------------
  // 2) Upload PDF to Firebase
  // --------------------------
  const uploadExamGuidelinesPDF = (file) => {
    return new Promise((resolve, reject) => {
      const currentUser = auth.currentUser;
      // You can store them in e.g. "examGuidelines" folder
      const path = `examGuidelines/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);

      // Include the bookId in customMetadata
      const metadata = {
        customMetadata: {
          category: "examGuidelines",
          userId: currentUser?.uid || userId || "noUser",
          examTitle: examTitle,   // e.g. "Official Syllabus"
          bookId: bookId,         // NEW field
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (err) => reject(err),
        async () => {
          // On complete => get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // (Optional) function to mark the user as having exam guidelines in your backend
  const markUserHasExamGuidelines = async (uid) => {
    if (!uid) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/exams/markUserHasExamGuidelines`, {
        userId: uid,
      });
      console.log("User flagged as having exam guidelines:", uid);
    } catch (err) {
      console.error("Error in markUserHasExamGuidelines:", err);
    }
  };

  // --------------------------
  // 3) UI and styling
  // --------------------------
  const cardStyle = {
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
    color: "#fff",
  };

  const textFieldStyle = {
    mb: 1,
    width: "100%",
    "& .MuiFilledInput-root": {
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#888",
      },
      "&:hover fieldset": {
        borderColor: "#ccc",
      },
    },
    "& .MuiInputLabel-root": {
      color: "#bbb",
    },
    "& .MuiInputBase-input": {
      color: "#fff",
    },
  };

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
        Upload Exam Guidelines
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#ccc" }}>
        Select a PDF file containing the exam's syllabus/guidelines. You can optionally name it below.
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

      {/* Title or auto-generate */}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Exam Guidelines Title"
          variant="outlined"
          disabled={autoGenerateTitle}
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
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
          label={<span style={{ color: "#ccc" }}>Auto-generate guidelines title</span>}
        />
      </Box>

      {/* NEW: Book ID field */}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Book ID"
          variant="outlined"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          sx={textFieldStyle}
        />
      </Box>

      {/* Upload */}
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