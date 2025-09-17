import React, { useState } from "react";
import { db } from "../../../../firebase"; // Adjust the path as needed
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function QuickDeleteUserData() {
  const [targetUserId, setTargetUserId] = useState("");

  async function handleDelete() {
    if (!targetUserId.trim()) {
      alert("Please enter a user ID.");
      return;
    }

    try {
      // 1) Delete doc in "users" collection => doc ID == userId
      await deleteDoc(doc(db, "users", targetUserId));
      console.log(`Deleted doc in "users" with ID: ${targetUserId}`);

      // 2) Delete doc in "learnerPersonas" => doc ID == userId
      await deleteDoc(doc(db, "learnerPersonas", targetUserId));
      console.log(`Deleted doc in "learnerPersonas" with ID: ${targetUserId}`);

      // 3) Delete all docs in "books_demo" where userId == targetUserId
      const booksRef = collection(db, "books_demo");
      const q = query(booksRef, where("userId", "==", targetUserId));
      const querySnapshot = await getDocs(q);

      for (const bookDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, "books_demo", bookDoc.id));
        console.log(`Deleted doc in "books_demo" with ID: ${bookDoc.id}`);
      }

      alert(`All relevant data deleted for user: ${targetUserId}`);
    } catch (err) {
      console.error("Error deleting user data:", err);
      alert("Failed to delete user data. Check console for details.");
    }
  }

  return (
    <div style={{
      backgroundColor: "#111", 
      color: "#fff", 
      padding: "2rem", 
      width: "400px",
      borderRadius: "8px",
    }}>
      <h2 style={{ marginBottom: "1rem" }}>Quick Delete User Data</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="Enter user ID..."
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #888",
          }}
        />
      </div>

      <button
        onClick={handleDelete}
        style={{
          backgroundColor: "#d9534f",
          color: "#fff",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Delete User Data
      </button>
    </div>
  );
}