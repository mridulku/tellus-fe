import React, { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../firebase"; // Adjust to your actual path

// A small helper to compute word count
function getWordCount(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function ManualBookCreator() {
  // We'll store the raw JSON input in this state.
  const [rawJson, setRawJson] = useState(`{
  "bookName": "My Manually Created Book",
  "userId": "manualUser123",
  "chapters": [
    {
      "chapterName": "Introduction to Something",
      "subchapters": [
        {
          "subchapterName": "Overview",
          "summary": "This is a short subchapter explaining the basics of our topic."
        },
        {
          "subchapterName": "Motivation",
          "summary": "Why do we care about this topic and what problems does it solve?"
        }
      ]
    },
    {
      "chapterName": "Deep Dive",
      "subchapters": [
        {
          "subchapterName": "Detailed Analysis",
          "summary": "In this subchapter, we analyze the complexities and potential pitfalls in depth."
        }
      ]
    }
  ]
}`);

  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    try {
      setStatus("Processing...");

      // 1) Parse the JSON structure
      const parsed = JSON.parse(rawJson);

      // Extract top-level fields
      const bookName = parsed.bookName || "Untitled Book";
      const userId = parsed.userId || "anonymousUser";
      const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];

      // 2) Create the Book document in "books_demo"
      //    (You can store any other fields you need as well.)
      const bookDocRef = await addDoc(collection(db, "books_demo"), {
        name: bookName,
        userId: userId,
        createdAt: serverTimestamp(),
      });

      const bookId = bookDocRef.id; // We'll use this for chapters

      // 3) For each chapter in the JSON => create "chapters_demo" doc
      for (const chapter of chapters) {
        const chapterName = chapter.chapterName || "Unnamed Chapter";
        const subchapters = Array.isArray(chapter.subchapters)
          ? chapter.subchapters
          : [];

        // Create chapter doc
        const chapterDocRef = await addDoc(collection(db, "chapters_demo"), {
          bookId: bookId,
          userId: userId,
          name: chapterName,
          createdAt: serverTimestamp(),
        });

        const chapterId = chapterDocRef.id;

        // 4) For each subchapter => create "subchapters_demo" doc
        for (const subchap of subchapters) {
          const subchapterName = subchap.subchapterName || "Untitled Subchapter";
          const summary = subchap.summary || "";
          const wordCount = getWordCount(summary);

          // Create subchapter doc
          const subChapterDocRef = await addDoc(collection(db, "subchapters_demo"), {
            chapterId: chapterId,
            bookId: bookId,
            userId: userId,
            name: subchapterName,
            summary: summary, // The final text the front-end will display
            wordCount: wordCount,
            createdAt: serverTimestamp(),
          });

          const subChapterId = subChapterDocRef.id;

          // (Optional) If you want the doc's own ID recorded in the doc:
          // This step is purely optional and depends on your schema preference.
          await updateDoc(doc(db, "subchapters_demo", subChapterId), {
            subChapterId: subChapterId,
          });
        }
      }

      setStatus(
        `Successfully created a book in books_demo (ID: ${bookId}), plus chapters and subchapters!`
      );
    } catch (error) {
      console.error("Error creating manual book data:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 700, margin: "0 auto" }}>
      <h2>Manual Book Creator</h2>
      <p>
        Paste or edit a JSON structure below, then click “Submit” to create
        <br />
        1) <strong>books_demo</strong> doc, 2) <strong>chapters_demo</strong>{" "}
        docs, 3) <strong>subchapters_demo</strong> docs (with final summary).
      </p>

      <textarea
        rows={20}
        style={{ width: "100%" }}
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
      />

      <button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
        Submit
      </button>

      {status && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{status}</div>
      )}
    </div>
  );
}

export default ManualBookCreator;