import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase"; // Adjust your path
import _ from "lodash"; // optional for grouping/summing if you prefer lodash

/**
 * PlanBrowser
 *
 * Props:
 *  - userId: string (the current user's ID)
 *
 * Behavior:
 *  1) Fetch all docs from "adaptive_demo" where userId == userId.
 *  2) Let user pick which plan to view (via a dropdown).
 *  3) When a plan is selected, display aggregated data:
 *     - Summation of times grouped by book/chapter, etc.
 *     - Show plan-level info (targetDate, level, etc.)
 */
export default function PlanBrowser({ userId="acbhbtiODoPPcks2CP6Z" }) {
  const [plans, setPlans] = useState([]);         // all plan docs
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState(null);

  // 1) Fetch all plan docs for this user
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);
      setError(null);

      try {
        const q = query(
          collection(db, "adaptive_demo"),
          where("userId", "==", userId)
        );
        const snap = await getDocs(q);

        const fetched = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setPlans(fetched);
        // optionally auto-select first
        if (fetched.length > 0) {
          setSelectedPlanId(fetched[0].id);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to fetch plans. See console for details.");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [userId]);

  // 2) When selectedPlanId changes, fetch the plan doc or get from memory
  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedPlan(null);
      return;
    }

    // Option A: we already have the doc in "plans" array
    // We can find it in memory:
    const inMemory = plans.find((p) => p.id === selectedPlanId);
    if (inMemory) {
      setSelectedPlan(inMemory);
      return;
    }

    // Option B: if we didn't store the entire doc or want to re-fetch
    // (Here we assume the entire plan is already in memory, so no re-fetch needed)
    // But if needed, do:
    // const planRef = doc(db, "adaptive_demo", selectedPlanId);
    // getDoc(planRef).then((docSnap) => setSelectedPlan({ id: docSnap.id, ...docSnap.data() }));
  }, [selectedPlanId, plans]);

  // 3) Helper function to compute an aggregated view
  function computeAggregation(planDoc) {
    if (!planDoc) return {};

    // planDoc structure:
    // {
    //   sessions: [
    //     {
    //       sessionLabel: "1",
    //       activities: [
    //         { type: "READ"|"QUIZ"|"REVISE", timeNeeded: number, bookId, chapterId, level, ... }
    //       ]
    //     }
    //   ],
    //   level, targetDate, userId, ...
    // }

    const { sessions = [] } = planDoc;

    // We'll create a structure: { [bookId]: { [chapterId]: { totalTime, readTime, quizTime, reviseTime } } }
    // or do something simpler.

    // Flatten all activities across all sessions
    let allActivities = [];
    sessions.forEach((sess) => {
      allActivities = allActivities.concat(sess.activities || []);
    });

    // Group by book
    const groupedByBook = _.groupBy(allActivities, "bookId");

    // We'll build an array of { bookId, chapters: [ ... ], totalTime, ... }
    const bookSummaries = Object.entries(groupedByBook).map(([bookId, acts]) => {
      // group by chapter
      const groupedChapters = _.groupBy(acts, "chapterId");
      const chapterSummaries = Object.entries(groupedChapters).map(([chapterId, cActs]) => {
        // sum times
        const totalTime = _.sumBy(cActs, "timeNeeded");
        const readTime = _.sumBy(
          cActs.filter((a) => a.type === "READ"),
          "timeNeeded"
        );
        const quizTime = _.sumBy(
          cActs.filter((a) => a.type === "QUIZ"),
          "timeNeeded"
        );
        const reviseTime = _.sumBy(
          cActs.filter((a) => a.type === "REVISE"),
          "timeNeeded"
        );
        return {
          chapterId,
          totalTime,
          readTime,
          quizTime,
          reviseTime,
          activities: cActs,
        };
      });

      const totalBookTime = _.sumBy(chapterSummaries, "totalTime");

      return {
        bookId,
        chapters: chapterSummaries,
        totalTime: totalBookTime,
      };
    });

    return {
      bookSummaries,
      // You could add session-level summaries, plan-level sums, etc.
      totalPlanTime: _.sumBy(bookSummaries, "totalTime"),
    };
  }

  const aggregated = selectedPlan ? computeAggregation(selectedPlan) : null;

  // ========================= RENDER =========================
  if (!userId) {
    return <div>Please log in or provide a userId.</div>;
  }

  return (
    <div style={{ padding: "1rem", color: "#FFF" }}>
      <h2>Plan Browser</h2>

      {loadingPlans && <p>Loading plans...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Dropdown to pick which plan to view */}
      {plans.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="planSelect" style={{ marginRight: "8px" }}>
            Select Plan:
          </label>
          <select
            id="planSelect"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planName || `Plan: ${p.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* If a plan is selected, show some details */}
      {selectedPlan && (
        <div>
          <h3>Plan Details</h3>
          <p>
            <strong>Plan ID:</strong> {selectedPlan.id} <br />
            <strong>Plan Name:</strong> {selectedPlan.planName} <br />
            <strong>Target Date:</strong> {selectedPlan.targetDate} <br />
            <strong>Level:</strong> {selectedPlan.level || "N/A"} <br />
            <strong>Max Day Count:</strong> {selectedPlan.maxDayCount || "N/A"} <br />
            <strong>Total Time (calculated):</strong>{" "}
            {aggregated ? aggregated.totalPlanTime : 0} min
          </p>

          {/* Book Summaries Table */}
          {aggregated && aggregated.bookSummaries.map((b) => (
            <div
              key={b.bookId}
              style={{
                border: "1px solid #ccc",
                marginBottom: "1rem",
                padding: "0.5rem",
                color: "#000", // sample styling
                backgroundColor: "#eee",
              }}
            >
              <h4>Book: {b.bookId}</h4>
              <p>Total Book Time: {b.totalTime} min</p>

              {b.chapters.map((ch) => (
                <div
                  key={ch.chapterId}
                  style={{ marginLeft: "1rem", marginBottom: "0.5rem" }}
                >
                  <strong>Chapter: {ch.chapterId}</strong>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    <li>Total: {ch.totalTime} min</li>
                    <li>READ: {ch.readTime} min</li>
                    <li>QUIZ: {ch.quizTime} min</li>
                    <li>REVISE: {ch.reviseTime} min</li>
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 && !loadingPlans && <p>No plans found for this user.</p>}
    </div>
  );
}