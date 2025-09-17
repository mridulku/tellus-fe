/*  ─────────────────────────────────────────────────────────────
    StatsPanel.jsx – unified “at-a-glance” strip
    -------------------------------------------------------------
    • Props ……  userId  (string, required)
    • Redux …   exam.examType  (exam name, kept in global store)
    • API  ……   /api/daily-time, /api/daily-time-all, /api/user
    • UI   ……   6 mini-cards laid out in a responsive flex row
  ───────────────────────────────────────────────────────────── */

  import React, { useEffect, useState } from "react";
  import { useSelector }              from "react-redux";
  import axios                        from "axios";
  
  /* MUI icons */
  import AccessTimeIcon from "@mui/icons-material/AccessTime";
  import FlagIcon       from "@mui/icons-material/Flag";
  import MenuBookIcon   from "@mui/icons-material/MenuBook";
  import TimelapseIcon  from "@mui/icons-material/Timelapse";
  import WhatshotIcon   from "@mui/icons-material/Whatshot";
  import SchoolIcon     from "@mui/icons-material/School";
  
  /* ────────────────────────────────────────────────────────── */
  /* helper → seconds ⇒ “X h Y m” */
  const fmtHHMM = (sec) =>
    (sec >= 3600 ? `${Math.floor(sec / 3600)}h ` : "") +
    `${Math.floor((sec % 3600) / 60)}m`;
  
  /* helper → Date ⇒ yyyy-mm-dd */
  const ymd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  
  /* helper → compute current streak */
  function calcStreak(dateMap) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = ymd(d);
      if ((dateMap.get(key) || 0) > 0) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }
  
  /* =================================================================== */
  export default function StatsPanel({ userId }) {
    /* Redux – exam label (e.g. “NEET”) */
    const examType = useSelector((s) => s.exam.examType);
  
    /* ─── state ─────────────────────────────────────────── */
    const [timeTodaySec, setTimeTodaySec] = useState(0);  // “Time studied today”
    const [targetPct,    setTargetPct   ] = useState(60); // % of today's target   (stub/demo)
  
    const [totalTimeSec, setTotalTimeSec] = useState(0);  // cumulative
    const [streakDays,   setStreakDays  ] = useState(0);  // current streak
  
    const [userEmail,    setUserEmail   ] = useState("user@example.com");
  
    /* ─── fetch #1 – daily time (today) ─────────────────── */
    useEffect(() => {
      if (!userId) return;
  
      const todayStr = ymd(new Date());
  
      (async () => {
        try {
          const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/daily-time`,
            { params: { userId, dateStr: todayStr } }
          );
          if (data?.success) setTimeTodaySec(data.sumSeconds || 0);
        } catch (e) {
          console.error("/api/daily-time error:", e);
        }
      })();
    }, [userId]);
  
    /* ─── fetch #2 – full log for total-time + streak ───── */
    useEffect(() => {
      if (!userId) return;
  
      (async () => {
        try {
          const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/daily-time-all`,
            { params: { userId } }
          );
          if (!data?.success) return;
  
          const map = new Map();
          let tot = 0;
          (data.records || []).forEach((r) => {
            const s = r.sumSeconds || 0;
            tot += s;
            map.set(r.dateStr, s);
          });
  
          setTotalTimeSec(tot);
          setStreakDays(calcStreak(map));
        } catch (e) {
          console.error("/api/daily-time-all error:", e);
        }
      })();
    }, [userId]);
  
    /* ─── fetch #3 – user doc for email (and fallback exam) ─ */
    useEffect(() => {
      if (!userId) return;
  
      (async () => {
        try {
          const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/user`,
            { params: { userId } }
          );
          if (data?.success && data.user?.username)
            setUserEmail(data.user.username);
        } catch (e) {
          console.error("/api/user error:", e);
        }
      })();
    }, [userId]);
  
    /* ================================================================= */
    return (
      <div style={styles.panel}>
        {/* 1️⃣ Time studied today */}
        <StatCard
          icon={<AccessTimeIcon />}
          value={fmtHHMM(timeTodaySec)}
          label="Time Studied Today"
        />
  
        {/* 2️⃣ Today’s target */}
        <StatCard
          icon={<FlagIcon />}
          value={`${targetPct}%`}
          label="Today's Target"
          barPct={targetPct}
        />
  
       
  
        {/* 4️⃣ Total time (all-time) */}
        <StatCard
          icon={<TimelapseIcon />}
          value={fmtHHMM(totalTimeSec)}
          label="Total Time Studied"
        />
  
        {/* 5️⃣ Current streak */}
        <StatCard
          icon={<WhatshotIcon />}
          value={`${streakDays} day${streakDays === 1 ? "" : "s"}`}
          label="Current Streak"
        />
  
        {/* 6️⃣ Profile / Exam */}
        <StatCard
          icon={<SchoolIcon />}
          value={userEmail}
          label={examType ? `Exam — ${examType}` : "Profile"}
        />
      </div>
    );
  }
  
  /* =================================================================== */
  /* Generic tiny-card component                                         */
  function StatCard({ icon, value, label, barPct }) {
    return (
      <div style={styles.card}>
        <div style={styles.iconWrap}>{icon}</div>
  
        <div style={styles.txtCol}>
          <span style={styles.val}>{value}</span>
          <span style={styles.lbl}>{label}</span>
  
          {typeof barPct === "number" && (
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFill, width: `${barPct}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  /* =================================================================== */
  /* inline styles – tweak freely                                        */
  const styles = {
    /* container row */
    panel: {
      display:        "flex",
  flexWrap:       "wrap",        // allow wrapping **only when necessary**
  columnGap:      24,            // horiz. space between cards
  rowGap:         12,            // gap if it *does* wrap
  padding:        15,
  borderRadius:   8,
  background:     "rgba(255,255,255,.07)",
  backdropFilter: "blur(6px)",
  alignItems:     "stretch",
  justifyContent: "flex-start",  // or "space-between"
    },
  
    /* each mini-card */
    card: {
      flex:           "1 1 180px",   // grow | shrink | basis
  display:        "flex",
  alignItems:     "center",
  gap:            12,
  padding:        "12px 16px",
  borderRadius:   8,
  background:     "rgba(255,255,255,.16)",
  color:          "#fff",
    },
  
    iconWrap: {
      background: "rgba(255,255,255,0.25)",
      width: 40,
      height: 40,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
    },
  
    txtCol: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
  
    val: {
      fontWeight: 700,
      fontSize: "1.05rem",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
    },
  
    lbl: {
      fontSize: "0.8rem",
      opacity: 0.85,
      lineHeight: 1.2,
    },
  
    /* progress bar (for today’s target) */
    barTrack: {
      marginTop: 4,
      width: "100%",
      height: 6,
      background: "rgba(255,255,255,0.30)",
      borderRadius: 3,
    },
    barFill: {
      height: "100%",
      background: "#B39DDB",
      borderRadius: 3,
    },
  };