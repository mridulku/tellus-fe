import React, { useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../../../firebase"; // Adjust path as needed

export default function FirebaseCollectionsViewer() {
  // 1) All your collections
  const allCollections = [
    "adaptive_demo",
    "books_demo",
    "chapters_demo",
    "examConfigs",
    "learnerPersonas",
    "loginTimestamps",
    "onboardedUsers",
    "pdfChapters",
    "pdfExtracts",
    "pdfPages",
    "pdfSubChapters",
    "pdfSubSummaries",
    "pdfSummaries",
    "prompts",
    "questionTypes",
    "quizConfigs",
    "quizzes_demo",
    "revisionConfigs",
    "revisions_demo",
    "subchapterConcepts",
    "subchapters_demo",
    "user_activities_demo",
    "user_progress_demo",
    "users",
  ];

  /**
   * 2) An object that tells us which field to order by for each collection.
   *    For example, "books_demo" might use "timestamp", while others use "createdAt".
   */
  const orderFieldMap = {
    // If you want these to use "timestamp":
    "quizzes_demo": "timestamp",
    "revision_demo": "timestamp",
    // If you want "pdfPages" to use "createdAt":
    // etc...

    // If a collection is not listed here, we'll default to "createdAt"
  };

  // 3) State for selected collection
  const [selectedCollection, setSelectedCollection] = useState(allCollections[0]);

  // 4) How many docs to fetch
  const [docLimit, setDocLimit] = useState(3);

  // 5) The fetched documents
  const [docsList, setDocsList] = useState([]);

  // 6) The currently selected doc's data
  const [selectedDocData, setSelectedDocData] = useState(null);

  // 7) UI states
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  /**
   * Fetch the N most recent docs from the chosen collection,
   * ordering by the field in `orderFieldMap` or defaulting to "createdAt".
   */
  async function handleFetchRecentDocs() {
    setError("");
    setStatus("");
    setLoading(true);
    setSelectedDocData(null);
    setDocsList([]);

    // Determine which field to use for ordering
    const fieldToOrderBy = orderFieldMap[selectedCollection] || "createdAt";

    try {
      // Build the query
      const q = query(
        collection(db, selectedCollection),
        orderBy(fieldToOrderBy, "desc"),
        limit(docLimit)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setStatus(`No documents found in collection "${selectedCollection}".`);
      } else {
        setStatus(`Fetched ${snapshot.size} document(s) from "${selectedCollection}" (ordered by "${fieldToOrderBy}").`);
      }

      const results = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setDocsList(results);
    } catch (err) {
      console.error("Error fetching docs:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch a single doc's full data from the currently selected collection.
   */
  async function handleViewDoc(docId) {
    setError("");
    setStatus("");
    setLoading(true);
    setSelectedDocData(null);

    try {
      const docRef = doc(db, selectedCollection, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setError(`Document "${docId}" does not exist in "${selectedCollection}".`);
      } else {
        setSelectedDocData({ id: docSnap.id, ...docSnap.data() });
        setStatus(`Fetched doc "${docId}" from "${selectedCollection}".`);
      }
    } catch (err) {
      console.error("Error viewing doc:", err);
      setError(`Error viewing doc "${docId}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Firestore Recent Documents Viewer</h2>

      {/* Display messages */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {status && <p style={{ color: "blue" }}>{status}</p>}
      {loading && <p>Loading...</p>}

      {/* Dropdown to pick a collection */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: 8 }}>Select Collection:</label>
        <select
          value={selectedCollection}
          onChange={(e) => {
            setSelectedCollection(e.target.value);
            setDocsList([]); 
            setSelectedDocData(null);
          }}
        >
          {allCollections.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Input for doc limit */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: 8 }}>
          Number of docs to fetch (most recent):
        </label>
        <input
          type="number"
          min="1"
          value={docLimit}
          onChange={(e) => setDocLimit(Number(e.target.value))}
          style={{ width: 60 }}
        />
        <button onClick={handleFetchRecentDocs} style={{ marginLeft: 8 }}>
          Fetch
        </button>
      </div>

      {/* List of fetched documents */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Fetched Documents</h3>
        {docsList.length === 0 && !loading && (
          <p>No documents loaded yet (or none found).</p>
        )}
        {docsList.map((docObj) => (
          <div key={docObj.id} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() => handleViewDoc(docObj.id)}
              style={{ marginRight: "0.5rem" }}
            >
              View
            </button>
            <strong>{docObj.id}</strong>
            {" | "}
            <small>
              {Object.entries(docObj)
                .filter(([key]) => key !== "id")
                .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
                .slice(0, 2)
                .join(" | ")}
              {Object.keys(docObj).length > 3 ? " ..." : ""}
            </small>
          </div>
        ))}
      </div>

      {/* Selected document data in black text */}
      <div>
        <h3>Selected Document Data</h3>
        {selectedDocData ? (
          <pre
            style={{
              backgroundColor: "#f4f4f4",
              padding: "1rem",
              maxHeight: "300px",
              overflow: "auto",
              color: "black", 
            }}
          >
            {JSON.stringify(selectedDocData, null, 2)}
          </pre>
        ) : (
          <p>No document selected.</p>
        )}
      </div>
    </div>
  );
}