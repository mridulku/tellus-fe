// src/components/DetailedBookViewer/PanelE.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase"; // the client auth if you still need user login
import _ from "lodash";

// adjust your endpoint
const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function PanelE() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState(null);

  // 1) Listen to user auth (client side)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2) Call your Express route if user is present
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setPlans([]);
      setSelectedPlanId("");
      setSelectedPlan(null);
      return;
    }

    const fetchPlans = async () => {
      setLoadingPlans(true);
      setError(null);

      try {
        // GET request to Express route: /api/adaptive-plans?userId=XYZ
        const res = await axios.get(`${SERVER_URL}/api/adaptive-plans`, {
          params: { userId },
        });

        if (res.data.success) {
          const fetched = res.data.plans;
          setPlans(fetched);
          if (fetched.length > 0) {
            setSelectedPlanId(fetched[0].id);
          } else {
            setSelectedPlanId("");
            setSelectedPlan(null);
          }
        } else {
          setError("Failed to fetch plans (success=false).");
        }
      } catch (err) {
        console.error("Error fetching plans via Express route:", err);
        setError("Failed to fetch plans via server. Check console.");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [userId, authLoading]);

  // 3) Set selectedPlan from memory
  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedPlan(null);
      return;
    }
    const match = plans.find((p) => p.id === selectedPlanId);
    setSelectedPlan(match || null);
  }, [selectedPlanId, plans]);

  /**
   * computeAggregation(plan):
   *   - Summarizes total quiz/revise/read items & time at plan-level
   *   - Summarizes by book -> chapter
   */
  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;

    // Flatten all activities
    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (sess.activities) {
        allActivities = allActivities.concat(sess.activities);
      }
    });

    // Plan-level totals
    const totalReadCount = allActivities.filter((a) => a.type === "READ").length;
    const totalQuizCount = allActivities.filter((a) => a.type === "QUIZ").length;
    const totalReviseCount = allActivities.filter((a) => a.type === "REVISE").length;
    const readTime = _.sumBy(allActivities.filter((a) => a.type === "READ"), "timeNeeded");
    const quizTime = _.sumBy(allActivities.filter((a) => a.type === "QUIZ"), "timeNeeded");
    const reviseTime = _.sumBy(allActivities.filter((a) => a.type === "REVISE"), "timeNeeded");

    // Unique subchapters in entire plan
    const uniqueSubChapterCount = _.uniqBy(allActivities, "subChapterId").length;

    // Group by book -> then by chapter
    const groupedByBook = _.groupBy(allActivities, "bookId");

    const bookSummaries = Object.entries(groupedByBook).map(([bookId, acts]) => {
      const groupedChapters = _.groupBy(acts, "chapterId");

      const chapterSummaries = Object.entries(groupedChapters).map(
        ([chapterId, cActs]) => {
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

          // # of each type
          const readCount = cActs.filter((a) => a.type === "READ").length;
          const quizCount = cActs.filter((a) => a.type === "QUIZ").length;
          const reviseCount = cActs.filter((a) => a.type === "REVISE").length;
          // unique subchapters in this chapter scope
          const subChapterCount = _.uniqBy(cActs, "subChapterId").length;

          return {
            chapterId,
            totalTime,
            readTime,
            quizTime,
            reviseTime,
            readCount,
            quizCount,
            reviseCount,
            subChapterCount,
            activities: cActs,
          };
        }
      );

      const totalBookTime = _.sumBy(chapterSummaries, "totalTime");
      return { bookId, totalTime: totalBookTime, chapters: chapterSummaries };
    });

    const totalPlanTime = _.sumBy(bookSummaries, "totalTime");

    return {
      totalPlanTime,
      bookSummaries,
      // Plan-level breakdown
      totalReadCount,
      totalQuizCount,
      totalReviseCount,
      readTime,
      quizTime,
      reviseTime,
      uniqueSubChapterCount,
    };
  }

  const aggregated = selectedPlan ? computeAggregation(selectedPlan) : null;

  return (
    <div style={panelStyle} id="panelE">
      <h3 style={{ marginTop: 0 }}>Plan Browser (Server-Fetched)</h3>

      {authLoading && <p>Checking sign-in status...</p>}

      {!authLoading && !userId && (
        <p style={{ color: "red" }}>No user is currently logged in.</p>
      )}

      {!authLoading && userId && (
        <>
          {/* Show the user ID */}
          <div style={infoBoxStyle}>
            <p><strong>User ID:</strong> {userId}</p>
          </div>

          {/* Plan dropdown */}
          <div style={boxStyle}>
            <h4>Select a Plan</h4>
            {loadingPlans && <p>Loading plans...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loadingPlans && !error && plans.length === 0 && (
              <p style={{ fontStyle: "italic" }}>No plans found.</p>
            )}

            {plans.length > 0 && (
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                style={{ padding: "4px", marginBottom: "8px" }}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName || `Plan: ${plan.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Plan Detail */}
          {selectedPlan && (
            <div style={boxStyle}>
              <h4>Plan Details</h4>
              <p>
                <strong>Plan ID:</strong> {selectedPlan.id} <br />
                <strong>Plan Name:</strong>{" "}
                {selectedPlan.planName || "Untitled"} <br />
                <strong>Target Date:</strong> {selectedPlan.targetDate} <br />
                <strong>Level:</strong> {selectedPlan.level || "N/A"} <br />
                <strong>Max Day Count:</strong>{" "}
                {selectedPlan.maxDayCount != null
                  ? selectedPlan.maxDayCount
                  : "N/A"}{" "}
                <br />
              </p>

              {aggregated && (
                <>
                  {/* Plan-level Stats */}
                  <p>
                    <strong>Total Plan Time:</strong> {aggregated.totalPlanTime} min
                  </p>
                  <p>
                    <strong>READ Items:</strong> {aggregated.totalReadCount} (
                    {aggregated.readTime} min), <strong>QUIZ Items:</strong>{" "}
                    {aggregated.totalQuizCount} ({aggregated.quizTime} min),{" "}
                    <strong>REVISE Items:</strong> {aggregated.totalReviseCount} (
                    {aggregated.reviseTime} min)
                  </p>
                  <p>
                    <strong>Unique Subchapters (Plan-Level):</strong>{" "}
                    {aggregated.uniqueSubChapterCount}
                  </p>

                  {/* Book Summaries */}
                  {aggregated.bookSummaries.map((b) => (
                    <div key={b.bookId} style={bookBoxStyle}>
                      <p>
                        <strong>Book ID:</strong> {b.bookId} <br />
                        <strong>Total Book Time:</strong> {b.totalTime} min
                      </p>

                      {/* Chapter Summaries */}
                      {b.chapters.map((ch) => (
                        <div key={ch.chapterId} style={chapterBoxStyle}>
                          <p>
                            <strong>Chapter ID:</strong> {ch.chapterId} <br />
                            <strong>Total Time:</strong> {ch.totalTime} min <br />
                            <strong>READ:</strong> {ch.readCount} items (
                            {ch.readTime} min), <strong>QUIZ:</strong>{" "}
                            {ch.quizCount} items ({ch.quizTime} min),{" "}
                            <strong>REVISE:</strong> {ch.reviseCount} items (
                            {ch.reviseTime} min)
                            <br />
                            <strong>Unique Subchapters:</strong>{" "}
                            {ch.subChapterCount}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Some styling consistent with your existing Panel approach */
const panelStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
};

const infoBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "10px",
  marginBottom: "15px",
};

const boxStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "10px",
  marginBottom: "15px",
};

const bookBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "4px",
  padding: "8px",
  marginBottom: "8px",
};

const chapterBoxStyle = {
  marginLeft: "1rem",
  borderLeft: "2px solid #FFD700",
  paddingLeft: "8px",
  marginBottom: "6px",
};

export default PanelE;