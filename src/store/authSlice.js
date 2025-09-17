// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /* core identity */
  userId      : null,
  email       : null,
  displayName : null,
  photoURL    : null,

  /* meta flags */
  loading : false,   // e.g. while exchanging tokens
  error   : null,    // auth-related error message (if any)
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /* --------------------------------------------------------------
       Generic setter – pass any subset of fields, we merge in place.
       Example: dispatch(setAuth({ userId, email, displayName }))
    -------------------------------------------------------------- */
    setAuth(state, { payload }) {
      if (payload && typeof payload === "object") {
        Object.assign(state, payload);
      }
    },

    /* --------------------------------------------------------------
       Backward-compat helper — keep existing `dispatch(setUserId(id))`
       calls working. Internally just forwards to setAuth.
    -------------------------------------------------------------- */
    setUserId(state, { payload }) {
      state.userId = payload ?? null;
    },

    /* Optional helpers for UI flows */
    setAuthLoading(state, { payload }) {
      state.loading = !!payload;
      if (payload) state.error = null;
    },
    setAuthError(state, { payload }) {
      state.error   = payload || null;
      state.loading = false;
    },

    /* Logout / hard reset */
    clearAuth() {
      return { ...initialState };
    },
  },
});

/* ---------- action creators ---------- */
export const {
  setAuth,
  setUserId,
  setAuthLoading,
  setAuthError,
  clearAuth,
} = authSlice.actions;

/* ---------- selectors ---------- */
export const selectAuth     = (state) => state.auth;
export const selectUserId   = (state) => state.auth.userId;
export const selectIsAuthed = (state) => !!state.auth.userId;

export default authSlice.reducer;