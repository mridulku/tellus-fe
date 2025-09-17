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
  /* =================================================================== */
/* inline styles – “dense” version                                     */
const styles = {
  /* container row */
  panel: {
    display:        "flex",
    flexWrap:       "wrap",
    columnGap:      16,          // tighter gap
    rowGap:         6,
    padding:        6,           // <<< was 15
    borderRadius:   6,
    background:     "transparent",     // blend with page
  backdropFilter: "none",
    alignItems:     "center",
    justifyContent: "space-between",
    minHeight:      48,          // keeps strip thin
  },

  /* each mini-card */
  card: {
    flex: "1 1 160px",  // shrink-to-fit
    display:        "flex",
    alignItems:     "center",
    gap:            8,           // tighter gap
    padding:        "4px 8px",   // <<< was 12 × 16
    borderRadius:   6,
    background:     "transparent",   // no inner slabs
    color:          "#fff",
  },

  iconWrap: {
    background: "rgba(255,255,255,0.20)",
    width:      28,              // <<< was 40
    height:     28,
    borderRadius: "50%",
    display:    "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,                // <<< was 22
  },

  txtCol: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  val: {
    fontWeight: 600,
    fontSize: "0.9rem",          // <<< was 1.05
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },

  lbl: {
    fontSize: "0.68rem",         // <<< was 0.8
    opacity: 0.8,
    lineHeight: 1.2,
  },

  /* progress bar (today’s target) */
  barTrack: {
    marginTop: 3,
    width: "100%",
    height: 4,                   // thinner
    background: "rgba(255,255,255,0.25)",
    borderRadius: 2,
  },
  barFill: {
    height: "100%",
    background: "#B39DDB",
    borderRadius: 2,
  },
};