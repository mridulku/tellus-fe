import React from "react";

function GamificationDashboard() {
  // Hard-coded user info & progress
  const userType = "Academic Learner"; // e.g. "Vocational", "Competitive Exam", "Casual"
  const primaryGoal = {
    goalTitle: "Finish Math Syllabus Before Semester Exams",
    currentProgress: 65, // percentage
    deadlineDaysLeft: 21,
    dailyCommitment: 2, // hours
  };

  // Hard-coded daily/weekly progress (simple bar or streak)
  const dailyActivity = [
    { day: "Mon", hours: 2 },
    { day: "Tue", hours: 3 },
    { day: "Wed", hours: 1 },
    { day: "Thu", hours: 0.5 },
    { day: "Fri", hours: 2 },
    { day: "Sat", hours: 2.5 },
    { day: "Sun", hours: 0 },
  ];

  // Hard-coded points, streak, badges
  const userPoints = 1200;
  const currentStreak = 5; // days in a row
  const nextBadge = "Silver Scholar"; // or "Gold Master," etc.

  // Hard-coded "other goals"
  const otherGoals = [
    {
      title: "Physics Revision",
      progress: 30,
    },
    {
      title: "Chemistry Lab Prep",
      progress: 50,
    },
    {
      title: "English Project",
      progress: 80,
    },
  ];

  // ======= STYLES =======
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'Open Sans', sans-serif",
    color: "#fff",
    padding: "20px",
  };

  const contentStyle = {
    width: "95%",
    maxWidth: "1200px",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "30px",
    boxSizing: "border-box",
  };

  // Header Section
  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  };

  // Big heading for the user type
  const userTypeStyle = {
    fontSize: "1.8rem",
    margin: 0,
  };

  const sectionTitleStyle = {
    marginTop: "30px",
    marginBottom: "15px",
    fontSize: "1.4rem",
    fontWeight: "bold",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
  };

  const cardSectionStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
  };

  // Main Goal Card
  const mainGoalCardStyle = {
    flex: "1 1 300px",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "20px",
    minWidth: "280px",
  };

  // Progress bar
  const progressBarContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "8px",
    height: "10px",
    overflow: "hidden",
    marginTop: "10px",
    marginBottom: "10px",
  };

  const progressBarFillStyle = (percentage) => ({
    width: `${percentage}%`,
    height: "100%",
    background: "#FFD700",
    transition: "width 0.4s ease",
  });

  // Daily Activity Card
  const dailyActivityCardStyle = {
    flex: "1 1 300px",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "20px",
    minWidth: "280px",
  };

  // Points/Streak Card
  const pointsCardStyle = {
    flex: "1 1 280px",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "20px",
    minWidth: "280px",
  };

  // Other Goals Card
  const otherGoalsStyle = {
    flex: "1 1 280px",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "20px",
    minWidth: "280px",
  };

  const dailyBarStyle = (hours) => ({
    height: "0.5rem",
    width: `${hours * 10}%`,
    backgroundColor: "#FFD700",
    borderRadius: "4px",
  });

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={userTypeStyle}>{userType}</h1>
          <h3 style={{ margin: 0 }}>
            Earn points & track progress to stay motivated!
          </h3>
        </div>

        {/* MAIN GOAL + DAILY ACTIVITY + POINTS */}
        <div style={cardSectionStyle}>
          {/* Main Goal Card */}
          <div style={mainGoalCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Your Primary Goal</h2>
            <p style={{ fontWeight: "bold", margin: "5px 0 8px 0" }}>
              {primaryGoal.goalTitle}
            </p>
            <p style={{ margin: 0 }}>
              Deadline in <strong>{primaryGoal.deadlineDaysLeft}</strong> days
            </p>
            <p style={{ margin: 0 }}>
              Daily Commitment: <strong>{primaryGoal.dailyCommitment} hrs</strong>
            </p>

            <div style={progressBarContainerStyle}>
              <div style={progressBarFillStyle(primaryGoal.currentProgress)} />
            </div>
            <p style={{ margin: 0 }}>
              Overall Progress: {primaryGoal.currentProgress}%
            </p>
          </div>

          {/* Daily Activity Card */}
          <div style={dailyActivityCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
              This Week’s Activity
            </h2>
            {dailyActivity.map((dayItem, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span style={{ width: "50px" }}>{dayItem.day}:</span>
                <div style={{ flex: "1", margin: "0 10px" }}>
                  <div style={dailyBarStyle(dayItem.hours)} />
                </div>
                <span style={{ minWidth: "30px", textAlign: "right" }}>
                  {dayItem.hours}h
                </span>
              </div>
            ))}
          </div>

          {/* Points/Streak Card */}
          <div style={pointsCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Your Stats</h2>
            <p style={{ margin: 0 }}>
              Points:{" "}
              <span style={{ color: "#FFD700", fontWeight: "bold" }}>
                {userPoints}
              </span>
            </p>
            <p style={{ margin: "5px 0" }}>
              Current Streak:{" "}
              <span style={{ color: "#FFD700", fontWeight: "bold" }}>
                {currentStreak} days
              </span>
            </p>
            <p style={{ margin: 0 }}>
              Next Badge:{" "}
              <span style={{ color: "#FFD700", fontWeight: "bold" }}>
                {nextBadge}
              </span>
            </p>
            <p style={{ marginTop: "15px" }}>
              Keep going! Each hour of study earns you <strong>10 points</strong>
              . Don’t break your streak!
            </p>
          </div>
        </div>

        {/* OTHER GOALS */}
        <h2 style={sectionTitleStyle}>Other Goals</h2>
        <div style={otherGoalsStyle}>
          {otherGoals.map((goal, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "15px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "6px",
                padding: "10px",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>{goal.title}</p>
              <div style={progressBarContainerStyle}>
                <div style={progressBarFillStyle(goal.progress)} />
              </div>
              <p style={{ margin: 0 }}>Progress: {goal.progress}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GamificationDashboard;