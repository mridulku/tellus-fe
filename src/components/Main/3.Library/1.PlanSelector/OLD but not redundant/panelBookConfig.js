// panelBookConfig.js
// ------------------------------------------------------------------
// Exams that get the SAME 4‑tile "locked / unlocked" panel as TOEFL.
// Edit book titles or emoji any time; Child1 will pick them up automatically.
// ------------------------------------------------------------------

export const PANEL_BOOK_CONFIG = {
    CBSE: {
      bookOrder: ["CBSE1", "CBSE2", "CBSE3", "CBSE4"],
      iconMap:   { CBSE1: "📘", CBSE2: "📗", CBSE3: "📙", CBSE4: "📒" },
      unlockedIndex: 0,
    },
    JEEADVANCED: {
      bookOrder: ["JEEADVANCED1", "JEEADVANCED2", "JEEADVANCED3", "JEEADVANCED4"],
      iconMap:   { JEEADVANCED1: "🔬", JEEADVANCED2: "📐", JEEADVANCED3: "🧮", JEEADVANCED4: "🔭" },
      unlockedIndex: 0,
    },
    NEET: {
      bookOrder: ["NEET1", "NEET2", "NEET3", "NEET4"],
      iconMap:   { NEET1: "🧬", NEET2: "🩺", NEET3: "🔬", NEET4: "💉" },
      unlockedIndex: 0,
    },
    SAT: {
      bookOrder: ["SAT1", "SAT2", "SAT3", "SAT4"],
      iconMap:   { SAT1: "📝", SAT2: "📊", SAT3: "🧠", SAT4: "📚" },
      unlockedIndex: 0,
    },
    GATE: {
      bookOrder: ["GATE1", "GATE2", "GATE3", "GATE4"],
      iconMap:   { GATE1: "⚙️", GATE2: "🛠️", GATE3: "📐", GATE4: "💡" },
      unlockedIndex: 0,
    },
    CAT: {
      bookOrder: ["CAT1", "CAT2", "CAT3", "CAT4"],
      iconMap:   { CAT1: "📈", CAT2: "🔢", CAT3: "🧮", CAT4: "🗂️" },
      unlockedIndex: 0,
    },
    GRE: {
      bookOrder: ["GRE1", "GRE2", "GRE3", "GRE4"],
      iconMap:   { GRE1: "📝", GRE2: "📖", GRE3: "📊", GRE4: "🧠" },
      unlockedIndex: 0,
    },
    UPSC: {
      bookOrder: ["UPSC1", "UPSC2", "UPSC3", "UPSC4"],
      iconMap:   { UPSC1: "🏛️", UPSC2: "🗺️", UPSC3: "📜", UPSC4: "⚖️" },
      unlockedIndex: 0,
    },
    FRM: {
      bookOrder: ["FRM1", "FRM2", "FRM3", "FRM4"],
      iconMap:   { FRM1: "💹", FRM2: "📈", FRM3: "💰", FRM4: "📊" },
      unlockedIndex: 0,
    },
  };