// ───────────────────────────────────────────────────────────────
// store/planSlice.js   •   v5  (JavaScript)
//
// ▸ fetchPlan()                 – async thunk  (unchanged)
// ▸ addFlatIndexes()            – inject flatIndex / type / quizStage
// ▸ buildCatalogFromPlanDoc()   – NEW tree: book ▸ subject ▸ grouping ▸ chapter
// ▸ setPlanDoc()                – overwrite plan without re-fetch
// ▸ mergeSubchapterConcepts()   – add concepts after lazy fetch
// ▸ memo selectors              – selectCatalog / selectSubChList / selectConcepts
// ───────────────────────────────────────────────────────────────

import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import axios from "axios";

/* ══════════════════════════════════════════════════════════════
   1 ▪ Async thunk – fetchPlan  (unchanged)
═══════════════════════════════════════════════════════════════ */
export const fetchPlan = createAsyncThunk(
  "plan/fetchPlan",
  async (
    {
      planId,
      backendURL,
      fetchUrl = "/api/adaptive-plan",
      initialActivityContext = null,
    },
    thunkAPI
  ) => {
    try {
      const { data } = await axios.get(`${backendURL}${fetchUrl}`, {
        params: { planId },
      });
      if (!data?.planDoc) {
        return thunkAPI.rejectWithValue("No planDoc in response");
      }

      return {
        planDoc: data.planDoc,
        initialActivityContext,
        requestedPlanId: planId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Error fetching plan");
    }
  }
);

/* ══════════════════════════════════════════════════════════════
   2 ▪ Helpers
═══════════════════════════════════════════════════════════════ */

/** 2-a ▸ addFlatIndexes – inject flatIndex & derive type / quizStage */
/** ▸ addFlatIndexes – inject flatIndex & derive type / quizStage */
function addFlatIndexes(planDoc) {
  let globalIdx = 0;

  const sessions = (planDoc.sessions || []).map((sess, dayIndex) => {
    const acts = (sess.activities || []).map((act) => {
      const type = (act.type || "").toLowerCase() || "read";

      /* ─── keep whatever quizStage was set in the plan ───────────── */
      let quizStage = "";
      if (type === "quiz") {
        quizStage = (act.quizStage || "").toLowerCase();   // ← no whitelist
      }

      return {
        ...act,
        type,                       // "read" | "quiz"
        quizStage,                  // may be "cumulativequiz" etc.
        dayIndex,
        flatIndex: globalIdx++,
      };
    });

    return { ...sess, activities: acts };
  });

  const flattenedActivities = [];
  sessions.forEach((s) =>
    s.activities.forEach((a) => flattenedActivities.push(a))
  );

  return { updatedPlanDoc: { ...planDoc, sessions }, flattenedActivities };
}

/** 2-b ▸ buildCatalogFromPlanDoc – derives hierarchy / subChapters / concepts
 *        TREE:  book ▸ subject ▸ grouping ▸ chapter ▸ [subChapterIds]
 */
function buildCatalogFromPlanDoc(planDoc, extraConceptMap = {}) {
  const hierarchy = {}; // nested tree
  const subChapters = [];
  const concepts = [];

  (planDoc.sessions || []).forEach((sess) =>
    (sess.activities || []).forEach((act) => {
      /* — Actual field names coming from the plan — */
      const book      = act.bookName       || "Unknown Book";
      const subject   = act.subject        || "General";
      const grouping  = act.grouping       || "Misc";
      const chapter   = act.chapterName    || "Untitled";
      const subch     = act.subChapterName || "Untitled";
      const subId     = act.subChapterId   || "";
      const conceptArr = extraConceptMap[subId] || []; // may still be empty

      /* ① Build hierarchy tree */
      if (!hierarchy[book])                   hierarchy[book] = {};
      if (!hierarchy[book][subject])          hierarchy[book][subject] = {};
      if (!hierarchy[book][subject][grouping])hierarchy[book][subject][grouping] = {};
      if (!hierarchy[book][subject][grouping][chapter])
        hierarchy[book][subject][grouping][chapter] = [];
      const arr = hierarchy[book][subject][grouping][chapter];
      if (!arr.includes(subId)) arr.push(subId);

      /* ② Flat sub-chapter record (dedup by subId) */
      if (!subChapters.find((s) => s.subChapterId === subId)) {
        subChapters.push({
          subChapterId: subId,
          book,
          subject,
          grouping,
          chapter,
          subChapter: subch,
        });
      }

      /* ③ Flat concepts */
      conceptArr.forEach((c) =>
        concepts.push({
          conceptName : typeof c === "string" ? c : c.name,
          subChapterId: subId,
          book,
          subject,
          grouping,
          chapter,
          subChapter  : subch,
        })
      );
    })
  );

  /* ④ Sort for deterministic UI render */
  subChapters.sort((a, b) =>
    `${a.book}|${a.subject}|${a.grouping}|${a.chapter}|${a.subChapter}`.localeCompare(
      `${b.book}|${b.subject}|${b.grouping}|${b.chapter}|${b.subChapter}`
    )
  );
  concepts.sort((a, b) => a.conceptName.localeCompare(b.conceptName));

  return { hierarchy, subChapters, concepts };
}

/* ══════════════════════════════════════════════════════════════
   3 ▪ Slice
═══════════════════════════════════════════════════════════════ */
const planSlice = createSlice({
  name: "plan",
  initialState: {
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,

    planDoc: null,
    flattenedActivities: [],

    catalog: { hierarchy: {}, subChapters: [], concepts: [] },

    currentIndex: -1,
    examId: "general",
  },

  reducers: {
    /* 3-a ▸ jump the current pointer */
    setCurrentIndex(state, action) {
      state.currentIndex = action.payload;
    },

    /* 3-b ▸ overwrite the whole planDoc (e.g. after an import) */
    setPlanDoc(state, action) {
      if (!action.payload) return;

      const { updatedPlanDoc, flattenedActivities } =
        addFlatIndexes(action.payload);

      state.planDoc = updatedPlanDoc;
      state.flattenedActivities = flattenedActivities;
      state.catalog = buildCatalogFromPlanDoc(updatedPlanDoc);
      state.currentIndex = flattenedActivities.length ? 0 : -1;
      state.examId = updatedPlanDoc.examId || "general";
    },

    /* 3-c ▸ merge concepts fetched lazily for one sub-chapter
             payload: { subChapterId, concepts:[…] } */
    mergeSubchapterConcepts(state, action) {
      const { subChapterId, concepts: newConcepts } = action.payload || {};
      if (!subChapterId || !Array.isArray(newConcepts)) return;

      /* quick lookup for dedup */
      const seen = {};
      state.catalog.concepts.forEach(
        (c) => (seen[`${c.conceptName}|${c.subChapterId}`] = true)
      );

      newConcepts.forEach((c) => {
        const cName = typeof c === "string" ? c : c.name;
        const key = `${cName}|${subChapterId}`;
        if (seen[key]) return;

        /* inherit meta from sub-chapter row */
        const meta = state.catalog.subChapters.find(
          (s) => s.subChapterId === subChapterId
        );
        if (!meta) return;

        state.catalog.concepts.push({
          conceptName: cName,
          subChapterId,
          ...meta, // contains book / subject / grouping / chapter / subChapter
        });
        seen[key] = true;
      });

      state.catalog.concepts.sort((a, b) =>
        a.conceptName.localeCompare(b.conceptName)
      );
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPlan.pending, (state) => {
        Object.assign(state, {
          status: "loading",
          error: null,
          planDoc: null,
          flattenedActivities: [],
          catalog: { hierarchy: {}, subChapters: [], concepts: [] },
          currentIndex: -1,
        });
      })
      .addCase(fetchPlan.fulfilled, (state, action) => {
        state.status = "succeeded";

        const { planDoc } = action.payload;
        const { updatedPlanDoc, flattenedActivities } =
          addFlatIndexes(planDoc);

        state.planDoc = updatedPlanDoc;
        state.flattenedActivities = flattenedActivities;
        state.catalog = buildCatalogFromPlanDoc(updatedPlanDoc);
        state.examId = updatedPlanDoc.examId || "general";
        state.currentIndex = flattenedActivities.length ? 0 : -1;
      })
      .addCase(fetchPlan.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

/* ══════════════════════════════════════════════════════════════
   4 ▪ Memo selectors – handy shortcuts for components
═══════════════════════════════════════════════════════════════ */
export const selectCatalog = (s) => s.plan.catalog;
export const selectSubChList = createSelector(
  selectCatalog,
  (c) => c.subChapters
);
export const selectConcepts = createSelector(
  selectCatalog,
  (c) => c.concepts
);

/* ══════════════════════════════════════════════════════════════
   5 ▪ Exports
═══════════════════════════════════════════════════════════════ */
export const {
  setCurrentIndex,
  setPlanDoc,
  mergeSubchapterConcepts,
} = planSlice.actions;

export default planSlice.reducer;