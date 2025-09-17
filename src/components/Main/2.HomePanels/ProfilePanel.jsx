// ────────────────────────────────────────────────────────────────
// File: src/components/ProfilePanel.jsx
// Reads examType from Redux instead of /api/user
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useSelector }             from "react-redux";
import axios                       from "axios";

import EmailIcon     from "@mui/icons-material/Email";
import EventIcon     from "@mui/icons-material/Event";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import WhatshotIcon  from "@mui/icons-material/Whatshot";
import SchoolIcon    from "@mui/icons-material/School";   // exam row

export default function ProfilePanel({ userId }) {
  /* ─── Redux: examType (always up‑to‑date across app) ─── */
  const examType = useSelector((state) => state.exam.examType);

  /* ─── ① basic user doc (email, joined) ─── */
  const [userEmail,  setUserEmail ] = useState("unknown@example.com");
  const [joinedDate, setJoinedDate] = useState(null);

  /* ─── ② usage stats ─── */
  const [totalTimeSec,  setTotalTimeSec ] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  /* ─── fetch /api/user – we still need e‑mail + join date ─── */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user`,
          { params: { userId } }
        );
        if (res.data?.success && res.data.user) {
          const { username, createdAt } = res.data.user;
          setUserEmail(username || "no-email@example.com");

          if (createdAt) {
            const d = new Date(createdAt);
            if (!isNaN(d)) setJoinedDate(d);
          }
        }
      } catch (err) {
        console.error("ProfilePanel /api/user:", err);
      }
    })();
  }, [userId]);

  /* ─── fetch /api/daily-time-all – unchanged ─── */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/daily-time-all`,
          { params: { userId } }
        );
        if (!res.data?.success) return;

        const records = res.data.records || [];
        const dateMap = new Map();
        let tot = 0;

        records.forEach((r) => {
          tot += r.sumSeconds || 0;
          dateMap.set(r.dateStr, r.sumSeconds || 0);
        });

        setTotalTimeSec(tot);
        setCurrentStreak(computeStreak(dateMap));
      } catch (err) {
        console.error("ProfilePanel /api/daily-time-all:", err);
      }
    })();
  }, [userId]);

  /* ─── helpers ─── */
  function computeStreak(dateMap) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = fmt(d);
      const used = dateMap.get(key) || 0;
      if (used > 0) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }
  const fmt   = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtUI = (d) => d.toLocaleDateString(undefined,{ year:"numeric", month:"short", day:"numeric" });
  const fmtT  = (s) => (s>=3600?`${Math.floor(s/3600)}h `:"") + `${Math.floor((s%3600)/60)}m`;

  /* ─── render ─── */
  const avatarChar = userEmail?.[0]?.toUpperCase() || "U";

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>My Profile</h2>

      {/* profile block */}
      <div style={styles.profileCard}>
        <div style={styles.avatarRow}>
          <div style={styles.avatar}>{avatarChar}</div>
          <div>
            <p style={styles.line}><EmailIcon sx={iconSX}/> {userEmail}</p>
            {joinedDate && (
              <p style={styles.line}><EventIcon sx={iconSX}/> Joined on {fmtUI(joinedDate)}</p>
            )}
            {examType && (
              <p style={styles.line}><SchoolIcon sx={iconSX}/> Exam — {examType}</p>
            )}
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={styles.statsCol}>
        <StatCard bg="#4DD0E1" Icon={TimelapseIcon} label="Total Time Studied" value={fmtT(totalTimeSec)} />
        <StatCard bg="#FFB74D" Icon={WhatshotIcon}  label="Current Streak"     value={`${currentStreak} day${currentStreak===1?"":"s"}`} />
      </div>
    </div>
  );
}

/* ─── small reusable card ─── */
function StatCard({ bg, Icon, label, value }) {
  return (
    <div style={{ ...styles.statCard, backgroundColor: bg }}>
      <div style={styles.statIconWrap}><Icon sx={{ fontSize: 30 }} /></div>
      <div><p style={styles.statLabel}>{label}</p><p style={styles.statValue}>{value}</p></div>
    </div>
  );
}

/* ─── styling ─── */
const iconSX = { fontSize: 16, verticalAlign: "middle", marginRight: 6 };

const styles = {
  container:  { width:"100%", maxWidth:720, margin:"0 auto", color:"#fff" },
  header:     { marginBottom:16, borderBottom:"1px solid #555", paddingBottom:8 },
  profileCard:{ background:"rgba(255,255,255,0.1)", borderRadius:8, padding:16, marginBottom:16 },
  avatarRow:  { display:"flex", alignItems:"center", gap:16 },
  avatar:     { width:60, height:60, borderRadius:"50%", background:"#888",
                display:"flex", justifyContent:"center", alignItems:"center",
                fontSize:"1.2rem", fontWeight:"bold" },
  line:       { margin:0, fontSize:"0.9rem", opacity:0.85, display:"flex", alignItems:"center" },
  statsCol:   { display:"flex", flexDirection:"column", gap:16 },
  statCard:   { borderRadius:8, padding:12, color:"#000", display:"flex", alignItems:"center", gap:12 },
  statIconWrap:{ background:"rgba(255,255,255,0.3)", borderRadius:"50%", width:48, height:48,
                 display:"flex", justifyContent:"center", alignItems:"center" },
  statLabel:  { margin:0, fontSize:"0.8rem" },
  statValue:  { margin:0, fontSize:"1.25rem", fontWeight:"bold" },
};