// src/components/HomePage/useHomeData.js
import { useState, useEffect } from "react";
import { auth } from "../../../firebase"; // adjust if needed
import axios from "axios";

export function useHomeData() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Book data
  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [bookError, setBookError] = useState(null);

  // Learner goal data
  const [goal, setGoal] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState(null);

  // Reading speed data
  const [readingSpeed, setReadingSpeed] = useState(null);
  const [loadingSpeed, setLoadingSpeed] = useState(false);
  const [speedError, setSpeedError] = useState(null);

  // #4: Has Read First Subchapter
  const [hasReadSubchapter, setHasReadSubchapter] = useState(false);
  const [loadingReadSubchapter, setLoadingReadSubchapter] = useState(false);
  const [readSubchapterError, setReadSubchapterError] = useState(null);

  // #5: Has Completed Quiz
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [loadingQuizCompleted, setLoadingQuizCompleted] = useState(false);
  const [quizError, setQuizError] = useState(null);

  // Backend URL
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // 1) Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2) Fetch Book
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setBook(null);
      return;
    }

    const fetchBook = async () => {
      try {
        setLoadingBook(true);
        setBookError(null);
        const url = `${backendURL}/api/user-book?userId=${userId}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          setBook(resp.data.data); // may be null if no book
        } else {
          setBookError("Failed to fetch user book.");
        }
      } catch (err) {
        console.error("Error fetching user book:", err);
        setBookError(err.message);
      } finally {
        setLoadingBook(false);
      }
    };
    fetchBook();
  }, [authLoading, userId, backendURL]);

  // 3) Fetch Learner Goal
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setGoal(null);
      return;
    }

    const fetchGoal = async () => {
      try {
        setLoadingGoal(true);
        setGoalError(null);
        const url = `${backendURL}/api/learner-goal?userId=${userId}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          // e.g. resp.data.data = { preparationGoal: "..." } or null
          setGoal(resp.data.data?.preparationGoal || null);
        } else {
          setGoalError("Failed to fetch learner goal.");
        }
      } catch (err) {
        console.error("Error fetching learner goal:", err);
        setGoalError(err.message);
      } finally {
        setLoadingGoal(false);
      }
    };
    fetchGoal();
  }, [authLoading, userId, backendURL]);

  // 4) Fetch Reading Speed
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setReadingSpeed(null);
      return;
    }

    const fetchReadingSpeed = async () => {
      try {
        setLoadingSpeed(true);
        setSpeedError(null);
        const url = `${backendURL}/api/reading-speed?userId=${userId}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          setReadingSpeed(resp.data.data?.readingTimeSec || null);
        } else {
          setSpeedError("Failed to fetch reading speed.");
        }
      } catch (err) {
        console.error("Error fetching reading speed:", err);
        setSpeedError(err.message);
      } finally {
        setLoadingSpeed(false);
      }
    };
    fetchReadingSpeed();
  }, [authLoading, userId, backendURL]);

  // 5) Check if user has read first subchapter (stopReading event)
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setHasReadSubchapter(false);
      return;
    }

    const fetchReadSubchapter = async () => {
      try {
        setLoadingReadSubchapter(true);
        setReadSubchapterError(null);
        const url = `${backendURL}/api/has-read-first-subchapter?userId=${userId}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          // e.g. resp.data.data = { hasReadFirstSubchapter: true/false }
          setHasReadSubchapter(Boolean(resp.data.data?.hasReadFirstSubchapter));
        } else {
          setReadSubchapterError("Failed to check if user read subchapter.");
        }
      } catch (err) {
        console.error("Error checking subchapter read:", err);
        setReadSubchapterError(err.message);
      } finally {
        setLoadingReadSubchapter(false);
      }
    };
    fetchReadSubchapter();
  }, [authLoading, userId, backendURL]);

  // 6) Check if user completed quiz (quizCompleted event)
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setHasCompletedQuiz(false);
      return;
    }

    const fetchQuizCompleted = async () => {
      try {
        setLoadingQuizCompleted(true);
        setQuizError(null);
        const url = `${backendURL}/api/has-completed-quiz?userId=${userId}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          // e.g. resp.data.data = { hasCompletedQuiz: true/false }
          setHasCompletedQuiz(Boolean(resp.data.data?.hasCompletedQuiz));
        } else {
          setQuizError("Failed to check if user completed quiz.");
        }
      } catch (err) {
        console.error("Error checking quiz completion:", err);
        setQuizError(err.message);
      } finally {
        setLoadingQuizCompleted(false);
      }
    };
    fetchQuizCompleted();
  }, [authLoading, userId, backendURL]);

  return {
    userId,
    authLoading,

    // Book
    book,
    loadingBook,
    bookError,

    // Goal
    goal,
    loadingGoal,
    goalError,

    // Reading Speed
    readingSpeed,
    loadingSpeed,
    speedError,

    // Has read subchapter
    hasReadSubchapter,
    loadingReadSubchapter,
    readSubchapterError,

    // Has completed quiz
    hasCompletedQuiz,
    loadingQuizCompleted,
    quizError
  };
}