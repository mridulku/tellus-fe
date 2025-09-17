// src/store/examSlice.js
// (adjust the import paths below if your folder structure differs)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";   // <-- correct relative path if needed

/***************************************************************************
 * async thunk: fetchExamType
 *
 * call:   dispatch(fetchExamType(firebaseUser.uid))
 * effect: reads /users/{uid}.examType  →  returns "TOEFL", "UPSC", etc.
 ***************************************************************************/
export const fetchExamType = createAsyncThunk(
  "exam/fetchExamType",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) {
        console.log("[exam] fetchExamType – no UID, returning null");
        return null;
      }

      const snap = await getDoc(doc(db, "users", userId));

      if (!snap.exists()) {
        console.log("[exam] fetchExamType – user doc missing, returning null");
        return null;
      }

      const value = snap.data().examType ?? null;
      console.log("[exam] fetchExamType – value from Firestore →", value);
      return value;           // may still be null if the field is absent
    } catch (err) {
      console.error("[exam] fetchExamType – caught error:", err);
      return rejectWithValue(err.message);
    }
  }
);

/***************************************************************************
 * slice: exam
 ***************************************************************************/
const examSlice = createSlice({
  name: "exam",

  /* initial state */
  initialState: {
    examType: null,     // unknown until thunk succeeds
    status:   "idle",   // "idle" | "loading" | "succeeded" | "failed"
    error:    null,
  },

  /* synchronous reducers */
  reducers: {
    setExamType(state, action) {
      state.examType = (action.payload || "").trim().toUpperCase();
      if (process.env.NODE_ENV !== "production") {
        console.log("[exam] reducer setExamType →", state.examType);
      }
    },
    clearExamType(state) {
      state.examType = null;
      if (process.env.NODE_ENV !== "production") {
        console.log("[exam] reducer clearExamType");
      }
    },
  },

  /* async‑thunk reducers */
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamType.pending, (state) => {
        state.status = "loading";
        state.error  = null;
        if (process.env.NODE_ENV !== "production") {
          console.log("[exam] state → loading");
        }
      })
      .addCase(fetchExamType.fulfilled, (state, action) => {
        state.status   = "succeeded";
        state.examType = (action.payload || null);
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[exam] state → succeeded, examType =", state.examType
          );
        }
      })
      .addCase(fetchExamType.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.payload || "could not fetch exam type";
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[exam] state → failed, error =", state.error
          );
        }
      });
  },
});

/* exports */
export const { setExamType, clearExamType } = examSlice.actions;
export default examSlice.reducer;