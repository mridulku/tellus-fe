// src/store/timeTrackingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// 1) Thunk to fetch daily time
export const fetchDailyTime = createAsyncThunk(
  "timeTracking/fetchDailyTime",
  async ({ planId, userId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/dailyTime`,
        {
          params: { planId, userId },
        }
      );
      return res.data.totalSeconds || 0;
    } catch (err) {
      return rejectWithValue(err.message || "Error fetching daily time");
    }
  }
);

// 2) Thunk to increment daily time
export const incrementDailyTime = createAsyncThunk(
  "timeTracking/incrementDailyTime",
  async ({ planId, userId, increment }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/incrementTime`, {
        planId,
        userId,
        increment,
      });
      // If server returns new total => we can pass it. If not, just pass increment
      return res.data.newTotalSeconds; 
    } catch (err) {
      return rejectWithValue(err.message || "Error incrementing daily time");
    }
  }
);

const timeTrackingSlice = createSlice({
  name: "timeTracking",
  initialState: {
    dailyTime: 0, // total day-level time in seconds
    status: "idle", 
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchDailyTime
      .addCase(fetchDailyTime.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDailyTime.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dailyTime = action.payload; // totalSeconds
      })
      .addCase(fetchDailyTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // incrementDailyTime
      .addCase(incrementDailyTime.fulfilled, (state, action) => {
        // If server returns a new total, we can set that.
        // Or if it returns nothing, we could just manually add the increment.
        if (action.payload) {
          state.dailyTime = action.payload;
        } else {
          // If server doesn't return new total, do nothing
          // Or we can guess it and add the increment
          // state.dailyTime += 15 (for example)
        }
      });
  },
});

export default timeTrackingSlice.reducer;