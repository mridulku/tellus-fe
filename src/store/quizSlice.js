// store/quizSlice.js ------------------------------------------------
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchQuizStage = createAsyncThunk(
  "quiz/fetchQuizStage",
  async ({ userId, planId, subChapterId, stage }, { getState, rejectWithValue }) => {
    const key = `${subChapterId}|${stage}`;

    /* --------- early exit if already cached --------- */
    if (getState().quiz.entities[key]) {
      return { key, cached: true };
    }

    try {
      const [quizRes, revRes, conceptRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`, {
          params: { userId, planId, subchapterId: subChapterId, quizType: stage },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/getRevisions`, {
          params: { userId, planId, subchapterId: subChapterId, revisionType: stage },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
          params: { subchapterId: subChapterId },
        }),
      ]);

      return {
        key,
        cached: false,
        data: {
          quizAttempts:      quizRes.data?.attempts   ?? [],
          revisionAttempts:  revRes.data?.revisions   ?? [],
          concepts:          conceptRes.data?.concepts ?? [],
        },
      };
    } catch (err) {
      return rejectWithValue({ key, message: err.message || "network error" });
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState: {
    entities: {},          // QuizStageKey
    loading : {},          // { [key]: true }
  },
  reducers: {
    /* optional → invalidate after a new submission */
    invalidateQuizStage(state, action) {
      delete state.entities[action.payload];
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchQuizStage.pending, (st, { meta }) => {
        const key = meta.arg.subChapterId + "|" + meta.arg.stage;
        st.loading[key] = true;
      })
      .addCase(fetchQuizStage.fulfilled, (st, { payload }) => {
        const { key, cached, data } = payload;
        delete st.loading[key];
        if (!cached) {
          st.entities[key] = { ...data, fetchedAt: Date.now() };
        }
      })
      .addCase(fetchQuizStage.rejected, (st, { payload, meta }) => {
        const key = payload?.key ||
                    meta.arg.subChapterId + "|" + meta.arg.stage;
        delete st.loading[key];
        st.entities[key] = { error: payload?.message || "error" };
      });
  },
});

export const { invalidateQuizStage } = quizSlice.actions;
export default quizSlice.reducer;