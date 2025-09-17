import { configureStore } from "@reduxjs/toolkit";
import planReducer from "./planSlice"; // We'll define planSlice in the next snippet
import authReducer from "./authSlice"; // <-- import your new auth slice
import examReducer from "./examSlice"; // <--- import the new slice
import timeTrackingReducer from "./timeTrackingSlice"; // <--- new
import readingReducer from "./readingSlice";
import quizTimeReducer from "./quizTimeSlice";
import reviseTimeReducer from "./reviseTimeSlice";
import aggregatorReducer from "./aggregatorSlice";
import quizReducer from "./quizSlice"; // <-- import the quiz slice
import  planSummaryReducer from "./planSummarySlice"; // <-- import the plan summary slice
import conceptReducer from "./conceptSlice"; // <-- import the concept slice


export const store = configureStore({
  reducer: {
    plan: planReducer,
    aggregator: aggregatorReducer,
    auth: authReducer, 
    exam: examReducer, // <--- add the exam slice
    timeTracking: timeTrackingReducer, // <--- add it
    reading: readingReducer,
    quizTime: quizTimeReducer,
    reviseTime: reviseTimeReducer,
    quiz: quizReducer,
    planSummary: planSummaryReducer, // <-- add the plan summary slice
    concept: conceptReducer,

    // <-- add the auth slice
    // ... add other slices as needed
  },
});

if (import.meta.env.MODE === "development") {
  window.__APP_STORE__ = store;
}

export default store;