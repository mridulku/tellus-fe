// File: src/components/DetailedBookViewer/PanelExam.jsx
import React from "react";

/* ------------------------------------------------------------------ */
/* 1) CONFIG — add / edit exam‑specific book lists & optional icons   */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  CONFIG for every exam **except** TOEFL.                            */
/*  ‑ Each exam lists four placeholder books (EXAM1‑4).               */
/*  ‑ You can rename / add titles later; the rest of the code adapts. */
/* ------------------------------------------------------------------ */
const CONFIG = {
    /* ---------- CBSE ---------- */
    CBSE: {
      books   : ["CBSE1",  "CBSE2",  "CBSE3",  "CBSE4"],
      iconMap : {
        CBSE1: "📗",
        CBSE2: "📘",
        CBSE3: "📙",
        CBSE4: "📕",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- UPSC ---------- */
    UPSC: {
      books   : ["UPSC1",  "UPSC2",  "UPSC3",  "UPSC4"],
      iconMap : {
        UPSC1: "🏛️",
        UPSC2: "📊",
        UPSC3: "🗺️",
        UPSC4: "📜",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- NEET ---------- */
    NEET: {
      books   : ["NEET1",  "NEET2",  "NEET3",  "NEET4"],
      iconMap : {
        NEET1: "🧬",
        NEET2: "🧪",
        NEET3: "🩺",
        NEET4: "🔬",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- JEE ADVANCED ---------- */
    JEEADVANCED: {
      books   : ["JEEADVANCED1", "JEEADVANCED2", "JEEADVANCED3", "JEEADVANCED4"],
      iconMap : {
        JEEADVANCED1: "⚛️",
        JEEADVANCED2: "📐",
        JEEADVANCED3: "🧲",
        JEEADVANCED4: "🧮",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- SAT ---------- */
    SAT: {
      books   : ["SAT1",  "SAT2",  "SAT3",  "SAT4"],
      iconMap : {
        SAT1: "📝",
        SAT2: "📏",
        SAT3: "📚",
        SAT4: "📈",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- GATE ---------- */
    GATE: {
      books   : ["GATE1",  "GATE2",  "GATE3",  "GATE4"],
      iconMap : {
        GATE1: "🚪",
        GATE2: "🔧",
        GATE3: "🛠️",
        GATE4: "⚙️",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- CAT ---------- */
    CAT: {
      books   : ["CAT1",  "CAT2",  "CAT3",  "CAT4"],
      iconMap : {
        CAT1: "📊",
        CAT2: "🔢",
        CAT3: "💡",
        CAT4: "📄",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- GRE ---------- */
    GRE: {
      books   : ["GRE1",  "GRE2",  "GRE3",  "GRE4"],
      iconMap : {
        GRE1: "🧠",
        GRE2: "🗒️",
        GRE3: "✏️",
        GRE4: "📖",
      },
      unlockedIndex: 0,
    },
  
    /* ---------- FRM ---------- */
    FRM: {
      books   : ["FRM1",  "FRM2",  "FRM3",  "FRM4"],
      iconMap : {
        FRM1: "💹",
        FRM2: "📉",
        FRM3: "📈",
        FRM4: "💰",
      },
      unlockedIndex: 0,
    },
  };

/* ------------------------------------------------------------------ */
/* 2) THE FLEXIBLE PANEL                                              */
/* ------------------------------------------------------------------ */
export default function PanelExam({
  examType           = "GENERAL",
  books              = [],
  plansData          = {},
  handleStartLearning,
}) {
  /* ---------------- A. pick config or empty fallback --------------- */
  const cfg      = CONFIG[examType] ?? { books: [], iconMap: {}, unlockedIndex: 0 };
  const mustHave = cfg.books;

  /* ---------------- B. build display list -------------------------- */
  const finalTiles = mustHave.map((title, idx) => {
    const match = books.find((b) => b.name === title);   // strict match
    return {
      title,
      icon     : cfg.iconMap[title] || "📚",
      isLocked : idx > cfg.unlockedIndex,                // simple rule
      bookObj  : match || null,
    };
  });

  /* ---------------- C. UI ----------------------------------------- */
  return (
    <div style={S.container}>
      <h2 style={{ marginBottom: 10 }}>{examType} Books</h2>

      <div style={S.tiles}>
        {finalTiles.map((tile, i) => {
          // Prepare state for this tile
          let loading = false, error = null, hasPlan = false, progress = 0;
          if (tile.bookObj) {
            const info  = plansData[tile.bookObj.id] || {};
            loading     = info.loading;
            error       = info.error;
            hasPlan     = info.hasPlan;
            progress    = info.aggregatorProgress || 0;
          }

          return (
            <div key={i} style={S.tile}>
              {/* header */}
              <div style={S.headerRow}>
                <span style={S.icon}>{tile.icon}</span>
                <h3 style={S.title}>{tile.title}</h3>
              </div>

              {/* book missing */}
              {!tile.bookObj && (
                <p style={S.status}>Book not found in your library.</p>
              )}

              {/* book present */}
              {tile.bookObj && (
                tile.isLocked
                  ? (
                      /* -------- LOCKED -------- */
                      <>
                        <div style={S.barOuter}>
                          <div style={{ ...S.barInner, width: "0%" }} />
                        </div>
                        <p style={S.progress}>0% complete</p>
                        <div style={S.locked}><span>🔒 Locked</span></div>
                      </>
                    )
                  : (
                      /* -------- UNLOCKED -------- */
                      <>
                        {loading && <p style={S.status}>Loading…</p>}
                        {!loading && error && <p style={S.status}>Error: {error}</p>}
                        {!loading && !error && !hasPlan && (
                          <p style={S.status}>No plan found.</p>
                        )}
                        {!loading && !error && hasPlan && (
                          <>
                            <div style={S.barOuter}>
                              <div
                                style={{ ...S.barInner, width: `${progress}%` }}
                              />
                            </div>
                            <p style={S.progress}>{progress.toFixed(1)}% complete</p>
                            <button
                              style={S.startBtn}
                              onClick={() => handleStartLearning(tile.bookObj.id)}
                            >
                              Start Learning
                            </button>
                          </>
                        )}
                      </>
                    )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3) STYLES (same as before, just split over lines)                  */
/* ------------------------------------------------------------------ */
const S = {
  container: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20,
    marginTop: 16,
    maxWidth: 800,
    margin: "0 auto",
  },
  tile: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    aspectRatio: "1 / 1",
    padding: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  headerRow: { display: "flex", alignItems: "center", gap: 8 },
  icon:      { fontSize: "2rem" },
  title:     { margin: 0, fontSize: "1.1rem" },
  status:    { fontSize: "0.9rem", opacity: 0.7, marginTop: 8 },
  barOuter:  {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginTop: 10,
  },
  barInner:  {
    height: "100%",
    backgroundColor: "#B39DDB",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  progress:  { margin: "5px 0", fontSize: "0.85rem", opacity: 0.8 },
  locked:    {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: "bold",
    backgroundColor: "#333",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 4,
  },
  startBtn: {
    marginTop: 10,
    backgroundColor: "#B39DDB",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#000",
  },
};