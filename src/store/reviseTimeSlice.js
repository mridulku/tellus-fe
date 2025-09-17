// File: store/reviseTimeSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * fetchReviseTime
 * ----------------
 * GET /api/getReviseTime?docId=xxx
 * Expects server => { totalSeconds: number }
 */
export const fetchReviseTime = createAsyncThunk(
  "reviseTime/fetchReviseTime",
  async ({ docId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getReviseTime`,
        {
          params: { docId },
        }
      );
      return res.data.totalSeconds || 0;
    } catch (err) {
      return rejectWithValue(err.message || "Error fetching revise time");
    }
  }
);

/**
 * incrementReviseTime
 * -------------------
 * POST /api/incrementReviseTime
 * Body => {
 *   docId,
 *   increment,
 *   userId,
 *   planId,
 *   subChapterId,
 *   quizStage,
 *   dateStr,
 *   revisionNumber
 * }
 * Expects server => { newTotalSeconds: number }
 */
export const incrementReviseTime = createAsyncThunk(
  "reviseTime/incrementReviseTime",
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
      revisionNumber
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/incrementReviseTime`,
        {
          docId,
          activityId,
          increment,
          userId,
          planId,
          subChapterId,
          quizStage,
          dateStr,
          revisionNumber,
        }
      );
      return res.data.newTotalSeconds;
    } catch (err) {
      return rejectWithValue(err.message || "Error incrementing revise time");
    }
  }
);

const reviseTimeSlice = createSlice({
  name: "reviseTime",
  initialState: {
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchReviseTime
      .addCase(fetchReviseTime.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReviseTime.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(fetchReviseTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // incrementReviseTime
      .addCase(incrementReviseTime.pending, (state) => {
        state.status = "loading";
      })
      .addCase(incrementReviseTime.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(incrementReviseTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default reviseTimeSlice.reducer;