// src/components/ExamPapers/UploadQuestionPaper.jsx
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
import { storage, auth } from "../../../../firebase";

export default function UploadQuestionPaper({ userId, onComplete }) {
  // State for PDF selection and exam name
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
  // 1) Handle Upload
  // --------------------------
  const handleUpload = async () => {
    if (!pdfFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload the PDF to Firebase with exam-specific metadata
      const downloadURL = await uploadExamPDF(pdfFile);

      // (Optional) Mark user as "examPaperUploaded" or do any backend updates
      await markUserHasExamPaper(userId);

      setUploadDone(true);
      console.log("PDF uploaded. Download URL:", downloadURL);

      // Trigger parent callback if needed (e.g., proceed to next step)
      onComplete?.();
    } catch (error) {
      console.error("Error uploading question paper PDF:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // --------------------------
  // 2) Upload PDF to Firebase Storage
  // --------------------------
  const uploadExamPDF = (file) => {
    return new Promise((resolve, reject) => {
      const currentUser = auth.currentUser;
      const path = `examPapers/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);

      // Add the `bookId` field in the custom metadata
      const metadata = {
        customMetadata: {
          category: "examPaper", // triggers the new pipeline
          userId: currentUser?.uid || userId || "noUser",
          examName: examTitle,   // e.g., "Mock Test 1" or "TOEFL Reading"
          bookId: bookId         // new field
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

  // (Optional) Mark user or do other backend calls
  const markUserHasExamPaper = async (uid) => {
    if (!uid) return;
    try {
      // Example: call your backend to update user doc
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/exams/markUserHasExam`, {
        userId: uid,
      });
      console.log("User flagged as having an exam paper:", uid);
    } catch (err) {
      console.error("Error in markUserHasExamPaper:", err);
    }
  };

  // --------------------------
  // 3) UI and Styles
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
        Upload Your Exam Paper
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#ccc" }}>
        Select a PDF file of your question paper, then optionally name the exam and provide a book ID.
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

      {/* Exam Title or auto-generate */}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Exam Title"
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
          label={<span style={{ color: "#ccc" }}>Auto-generate exam title</span>}
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