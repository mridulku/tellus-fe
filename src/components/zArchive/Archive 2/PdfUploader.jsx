// src/components/PdfUploader.jsx

import React, { useState } from "react";
import axios from "axios";

function PdfUploader() {
  const [pdfFile, setPdfFile] = useState(null);
  const [bookName, setBookName] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");



  //  const backendURL = "https://bookish-guide-pjpjjpjgwxxgc7x5j-3001.app.github.dev/upload-pdf";
  // const backendURL = "http://localhost:3001/upload-pdf";

  const backendURL = `${import.meta.env.VITE_BACKEND_URL}/upload-pdf`;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleBookNameChange = (e) => {
    setBookName(e.target.value);
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    setUploadMessage("");

    if (!pdfFile) {
      setUploadMessage("Please select a PDF file.");
      return;
    }
    if (!bookName.trim()) {
      setUploadMessage("Please enter a Book Name.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdfFile", pdfFile);
      formData.append("bookName", bookName.trim());

      const response = await axios.post(uploadPdfURL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setUploadMessage(`PDF uploaded successfully. Pages: ${response.data.pagesUploaded}`);
        // Reset
        setPdfFile(null);
        setBookName("");
      } else {
        setUploadMessage("Upload done, but success=false. Check server logs.");
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setUploadMessage("Error uploading PDF. See console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>PDF Uploader</h2>

      <form onSubmit={handlePdfUpload} style={{ border: "1px solid #ccc", padding: "10px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Book Name:{" "}
            <input
              type="text"
              value={bookName}
              onChange={handleBookNameChange}
              style={{ marginLeft: "5px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            PDF File:{" "}
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </label>
        </div>

        <button type="submit" style={{ padding: "8px 16px" }}>
          Upload PDF
        </button>
      </form>

      {uploadMessage && <p style={{ marginTop: "10px" }}>{uploadMessage}</p>}
    </div>
  );
}

export default PdfUploader;