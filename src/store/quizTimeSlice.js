// File: store/quizTimeSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * fetchQuizTime
 * --------------
 * GET /api/getQuizTime?docId=xxx
 * Expects server => { totalSeconds: number }
 */
export const fetchQuizTime = createAsyncThunk(
  "quizTime/fetchQuizTime",
  async ({ docId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuizTime`,
        {
          params: { docId },
        }
      );
      return res.data.totalSeconds || 0;
    } catch (err) {
      return rejectWithValue(err.message || "Error fetching quiz time");
    }
  }
);

/**
 * incrementQuizTime
 * -----------------
 * POST /api/incrementQuizTime
 * Body => {
 *   docId,
 *   increment,
 *   userId,
 *   planId,
 *   subChapterId,
 *   quizStage,
 *   dateStr,
 *   attemptNumber     // <-- NEW
 * }
 * Expects server => { newTotalSeconds: number }
 */
export const incrementQuizTime = createAsyncThunk(
  "quizTime/incrementQuizTime",
  async (
    {
      docId,
      activityId,
      increment,
      userId,
      planId,
      subChapterId,
      quizStage,
      dateStr,
      attemptNumber,
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/incrementQuizTime`,
        {
          docId,
          activityId,
          increment,
          userId,
          planId,
          subChapterId,
          quizStage,
          dateStr,
          attemptNumber, // send to server
        }
      );
      return res.data.newTotalSeconds;
    }
     catch (err) {
      return rejectWithValue(err.message || "Error incrementing quiz time");
    }
  }
);

const quizTimeSlice = createSlice({
  name: "quizTime",
  initialState: {
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchQuizTime
      .addCase(fetchQuizTime.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchQuizTime.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(fetchQuizTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // incrementQuizTime
      .addCase(incrementQuizTime.pending, (state) => {
        state.status = "loading";
      })
      .addCase(incrementQuizTime.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(incrementQuizTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default quizTimeSlice.reducer;