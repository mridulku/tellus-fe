/* ------------------------------------------------------------------
   planSummarySlice.js            (plain-JS, no TS generics)
   ------------------------------------------------------------------
   Local cache for:
     adaptivePlanSummaries/{planId}/subs/{subId}
   ------------------------------------------------------------------ */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFirestore,
  doc,       getDoc,
  collection,getDocs,
  Timestamp
} from "firebase/firestore";

/* ──────────────────────────── helpers ─────────────────────────── */

/** Recursively convert Firebase Timestamp → millis so Redux remains serialisable */
function serializeDoc(o) {
  if (o == null || typeof o !== "object") return o;

  /* Timestamp */
  if (o instanceof Timestamp) return o.toMillis();

  /* Array */
  if (Array.isArray(o)) return o.map(serializeDoc);

  /* Plain object */
  const out = {};
  Object.entries(o).forEach(([k, v]) => (out[k] = serializeDoc(v)));
  return out;
}

/* ══════════════════════════════════════════════════════════════
   THUNK 1 – fetch *one* sub-chapter summary
═══════════════════════════════════════════════════════════════ */
export const fetchSubSummary = createAsyncThunk(
  "planSummary/fetchSubSummary",
  async ({ planId, subId }) => {
    if (!planId || !subId)
      throw new Error("fetchSubSummary: planId and subId are required");

    const db  = getFirestore();
    const ref = doc(db, "adaptivePlanSummaries", planId, "subs", subId);
    const snap = await getDoc(ref);

    if (!snap.exists())
      throw new Error(`No summary found for sub ${subId}`);

    return { subId, payload: serializeDoc(snap.data()) };
  }
);

/* ══════════════════════════════════════════════════════════════
   THUNK 2 – bulk fetch *all* summaries for a plan
═══════════════════════════════════════════════════════════════ */
export const fetchAllSubSummaries = createAsyncThunk(
  "planSummary/fetchAllSubSummaries",
  async ({ planId }) => {
    if (!planId) throw new Error("planId required");

    const db   = getFirestore();
    const col  = collection(db, "adaptivePlanSummaries", planId, "subs");
    const snap = await getDocs(col);

    const map = {};
    snap.forEach(d => { map[d.id] = serializeDoc(d.data()); });

    return { map };              // { subId → serialised summaryDoc }
  }
);

/* ══════════════════════════════════════════════════════════════
   SLICE
═══════════════════════════════════════════════════════════════ */
const planSummarySlice = createSlice({
  name: "planSummary",
  initialState: {
    /* entity cache */
    entities : {},      // { [subId] : summaryDoc }

    /* per-sub fetch flags  */
    loading  : {},      // { [subId] : true|false }
    error    : {},      // { [subId] : "msg" }

    /* bulk-fetch flags */
    allLoaded : false,
    allLoading: false,
    allError  : null,
  },

  reducers: {},

  extraReducers: (builder) => {
    /* ───── fetchSubSummary (single) ───── */
    builder
      .addCase(fetchSubSummary.pending, (st, { meta }) => {
        const { subId } = meta.arg;
        st.loading[subId] = true;
        delete st.error[subId];
      })
      .addCase(fetchSubSummary.fulfilled, (st, { payload }) => {
        const { subId, payload: docData } = payload;
        st.loading[subId]  = false;
        st.entities[subId] = docData;
      })
      .addCase(fetchSubSummary.rejected, (st, { meta, error }) => {
        const { subId } = meta.arg;
        st.loading[subId] = false;
        st.error[subId]   = error.message;
      });

    /* ───── fetchAllSubSummaries (bulk) ───── */
    builder
      .addCase(fetchAllSubSummaries.pending, (st) => {
        st.allLoading = true;
        st.allError   = null;
      })
      .addCase(fetchAllSubSummaries.fulfilled, (st, { payload }) => {
        st.allLoading = false;
        st.allLoaded  = true;
        st.entities   = payload.map;     // overwrite / seed full cache
      })
      .addCase(fetchAllSubSummaries.rejected, (st, { error }) => {
        st.allLoading = false;
        st.allError   = error.message;
      });
  },
});

export default planSummarySlice.reducer;

/* ══════════════════════════════════════════════════════════════
   SELECTORS
═══════════════════════════════════════════════════════════════ */

/** 1) Per-stage concept-stats object */
export const selectConceptStats = (state, subId, stage) =>
  state.planSummary.entities?.[subId]?.conceptStats?.[stage] || {};

/** 2) Union of all concept names across the four quiz stages */
export const selectConceptNames = (state, subId) => {
  const cs = state.planSummary.entities?.[subId]?.conceptStats;
  if (!cs) return [];
  const names = new Set();
  Object.values(cs).forEach(stageMap =>
    Object.keys(stageMap || {}).forEach(n => names.add(n))
  );
  return Array.from(names).sort((a, b) => (a || "").localeCompare(b || ""));
};

/** 3) Top-level per-stage percentages (reading, remember, …) */
export const selectSubSummaryMeta = (state, subId) => {
  const e = state.planSummary.entities?.[subId];
  return e ? {
      readingPct   : e.readingPct    ?? 0,
      rememberPct  : e.rememberPct   ?? null,
      understandPct: e.understandPct ?? null,
      applyPct     : e.applyPct      ?? null,
      analyzePct   : e.analyzePct    ?? null,
    }
    : {
      readingPct   : 0,
      rememberPct  : null,
      understandPct: null,
      applyPct     : null,
      analyzePct   : null,
    };
};