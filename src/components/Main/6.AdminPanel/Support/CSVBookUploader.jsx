import React, { useState } from "react";
import Papa from "papaparse";
import { db } from "../../../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function groupBy(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const k = keyFn(item);
    (map[k] = map[k] || []).push(item);
  }
  return map;
}
const getWordCount = (t = "") =>
  t.trim().split(/\s+/).filter(Boolean).length;

function CSVBookUploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = () => {
    if (!file) return alert("Choose a CSV file first");

    setStatus("Parsing CSV…");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data: rows }) => {
        try {
          /*  EXPECTED HEADERS  ─────────────────────────────
              bookName, subject, grouping, userId,
              chapterName, subchapterName, summary
          */

          // ── group rows by (bookName,userId)
          const bookGroups = groupBy(
            rows,
            (r) => `${r.bookName}___${r.userId}`
          );

          setStatus("Creating books / chapters / sub-chapters…");

          for (const bookKey of Object.keys(bookGroups)) {
            const bookRows = bookGroups[bookKey];
            const { bookName, userId } = bookRows[0];

            // 1️⃣  BOOK  --------------------------------------------------
            const bookRef = await addDoc(collection(db, "books_demo"), {
              name: bookName || "Untitled Book",
              userId: userId || "anonymous",
              createdAt: serverTimestamp(),
            });
            const bookId = bookRef.id;

            // ── group by chapterName inside this book
            const chapterGroups = groupBy(
              bookRows,
              (r) => r.chapterName || "Untitled Chapter"
            );

            for (const chapterName of Object.keys(chapterGroups)) {
              const chapRows = chapterGroups[chapterName];

              // 🔎 VALIDATE subject + grouping consistency
              const subjects = new Set(chapRows.map((r) => r.subject));
              const groupings = new Set(chapRows.map((r) => r.grouping));
              if (subjects.size !== 1 || groupings.size !== 1) {
                throw new Error(
                  `Chapter “${chapterName}” in book “${bookName}” has inconsistent subject/grouping.`
                );
              }
              const subject = [...subjects][0] || "";
              const grouping = [...groupings][0] || "";

              // 2️⃣  CHAPTER  -------------------------------------------
              const chapRef = await addDoc(
                collection(db, "chapters_demo"),
                {
                  bookId,
                  userId,
                  name: chapterName,
                  subject,
                  grouping,
                  createdAt: serverTimestamp(),
                }
              );
              const chapterId = chapRef.id;

              // 3️⃣  SUB-CHAPTERS  --------------------------------------
              for (const r of chapRows) {
                const subRef = await addDoc(
                  collection(db, "subchapters_demo"),
                  {
                    bookId,
                    chapterId,
                    userId,
                    name: r.subchapterName || "Untitled Subchapter",
                    summary: r.summary || "",
                    wordCount: getWordCount(r.summary),
                    subject,   // inherited, already validated
                    grouping,  // inherited
                    createdAt: serverTimestamp(),
                  }
                );
                /* If you still need the doc’s own ID inside itself:
                   await setDoc(subRef, { subChapterId: subRef.id }, { merge:true });
                */
              }
            }
          }

          setStatus("✅ Upload complete!");
        } catch (err) {
          console.error(err);
          setStatus(`❌ Error: ${err.message}`);
        }
      },
      error: (err) => {
        console.error(err);
        setStatus(`❌ Parsing error: ${err.message}`);
      },
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      <h2>CSV Book Uploader</h2>
      <p>
        CSV columns (in order):{" "}
        <code>
          bookName, subject, grouping, userId, chapterName, subchapterName,
          summary
        </code>
      </p>

      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: ".5rem" }}>
        Upload
      </button>

      {status && (
        <pre style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {status}
        </pre>
      )}
    </div>
  );
}

export default CSVBookUploader;