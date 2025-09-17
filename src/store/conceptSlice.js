/* ------------------------------------------------------------------
   conceptSlice.js            (plain-JS, no TS generics)
   ------------------------------------------------------------------
   Local Redux cache for the learner-specific spaced-repetition deck.

   Firestore layout  (matches your console screenshot)
   ──────────────────────────────────────────────────────────────
      adaptivePlanSummaries/{planId}/concepts/{docId}

   Example document
   ──────────────────────────────────────────────────────────────
   {
     conceptName   : "Rate Expression for a Bimolecular Reaction",
     planId        : "KLs4IF3VEgaw1u1TqAiI",
     subId         : "0t9Eg8kkhAbNK19tNBnt",
     easeFactor    : 2.5,
     intervalDays  : 7,
     nextDue       : <Timestamp>,
     attempts      : [ { ts:<Timestamp>, pass:true }, … ],
     createdAt     : <Timestamp>,
     updatedAt     : <Timestamp>
   }
   ------------------------------------------------------------------ */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFirestore,
  collection, getDocs,
  doc,        getDoc,
} from "firebase/firestore";

/* ───────────────────────── helpers ────────────────────────── */

/** Firestore Timestamp → ISO string (or keep string as-is) */
const tsToISO = (ts) =>
  ts && typeof ts.seconds === "number"
    ? new Date(ts.seconds * 1000).toISOString()
    : typeof ts === "string"
    ? ts
    : null;

/** Strip non-serializable Timestamps from a raw doc object */
function serializeDoc(raw = {}) {
  const copy = { ...raw };

  ["createdAt", "updatedAt", "nextDue"].forEach((k) => {
    if (copy[k]) copy[k] = tsToISO(copy[k]);
  });

  if (Array.isArray(copy.attempts)) {
    copy.attempts = copy.attempts.map((a) => ({
      ...a,
      ts: tsToISO(a.ts),
    }));
  }

  /* convenience mirror */
  if (copy.nextDue && !copy.nextDueISO) copy.nextDueISO = copy.nextDue;

  return copy;
}

/* ══════════════════════════════════════════════════════════════
   THUNK 1 – bulk-load *all* concept docs for a plan
═══════════════════════════════════════════════════════════════ */
export const fetchConceptDocs = createAsyncThunk(
  "concept/fetchConceptDocs",
  async ({ planId }) => {
    if (!planId) throw new Error("planId required");

    const db = getFirestore();
    /*  🔧 PATH FIX — now inside adaptivePlanSummaries 🔧  */
    const col = collection(db, "adaptivePlanSummaries", planId, "concepts");

    const snap = await getDocs(col);

    const map = {};
    snap.forEach((d) => {
      map[d.id] = serializeDoc(d.data());
    });

    return { map }; // payload: { map : { docId → conceptDoc } }
  }
);

/* ══════════════════════════════════════════════════════════════
   THUNK 2 – fetch ONE concept doc (rare, e.g. instant refresh)
═══════════════════════════════════════════════════════════════ */
export const fetchConceptDoc = createAsyncThunk(
  "concept/fetchConceptDoc",
  async ({ planId, docId }) => {
    if (!planId || !docId) throw new Error("planId & docId required");

    const db  = getFirestore();
    /*  🔧 PATH FIX — same adjustment here 🔧  */
    const ref = doc(db, "adaptivePlanSummaries", planId, "concepts", docId);

    const snap = await getDoc(ref);
    if (!snap.exists())
      throw new Error(`No concept doc ${docId} for plan ${planId}`);

    return { docId, payload: serializeDoc(snap.data()) };
  }
);

/* ══════════════════════════════════════════════════════════════
   SLICE
═══════════════════════════════════════════════════════════════ */
const conceptSlice = createSlice({
  name: "concept",
  initialState: {
    entities   : {},   // { [docId]: conceptDoc }
    loading    : {},   // { [docId]: true|false }
    error      : {},   // { [docId]: "msg" }

    allLoaded  : false,
    allLoading : false,
    allError   : null,
  },

  reducers: {
    /* add optimistic-update reducers here later if you like */
  },

  extraReducers: (builder) => {
    /* ───── bulk loader ───── */
    builder
      .addCase(fetchConceptDocs.pending, (st) => {
        st.allLoading = true;
        st.allError   = null;
      })
      .addCase(fetchConceptDocs.fulfilled, (st, { payload }) => {
        st.allLoading = false;
        st.allLoaded  = true;
        st.entities   = payload.map;          // seed / overwrite cache
      })
      .addCase(fetchConceptDocs.rejected, (st, { error }) => {
        st.allLoading = false;
        st.allError   = error.message;
      });

    /* ───── single-doc loader ───── */
    builder
      .addCase(fetchConceptDoc.pending, (st, { meta }) => {
        st.loading[meta.arg.docId] = true;
        delete st.error[meta.arg.docId];
      })
      .addCase(fetchConceptDoc.fulfilled, (st, { payload }) => {
        st.loading[payload.docId] = false;
        st.entities[payload.docId] = payload.payload;
      })
      .addCase(fetchConceptDoc.rejected, (st, { meta, error }) => {
        st.loading[meta.arg.docId] = false;
        st.error[meta.arg.docId]   = error.message;
      });
  },
});

export default conceptSlice.reducer;

/* ══════════════════════════════════════════════════════════════
   SELECTORS
═══════════════════════════════════════════════════════════════ */

/** Deck as array – earliest `nextDueISO` first */
export function selectConceptDocs(state) {
  return Object.values(state.concept.entities || {}).sort((a, b) =>
    (a.nextDueISO || "").localeCompare(b.nextDueISO || "")
  );
}

/** Lookup by Firestore doc-ID */
export function selectConceptDoc(state, docId) {
  return state.concept.entities?.[docId] || null;
}

/* legacy alias – some files still import this name */
export const selectConceptById = selectConceptDoc;

/* Helper if you ever switch to deterministic IDs */
export const buildConceptDocId = ({ planId, subId, conceptName }) =>
  `${planId}_${subId}_${conceptName.replace(/\s+/g, "_")}`;