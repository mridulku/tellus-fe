// sessionPlan.js (dummy data)

export const mockSessionPlan = {
    sessionId: "session_1234",
    userId: "user_abc",
    title: "Adaptive Study Session - Book A",
    totalEstimatedTime: 50, // in minutes (sum of all steps below)
    items: [
      {
        id: "item1",
        type: "reading",
        label: "Subchapter 1: Introduction",
        estimatedTime: 10,
        subChapterId: "sc_101", 
        // Potential additional metadata:
        // e.g. "apiEndpoint": "/api/subchapters/sc_101" to fetch text
      },
      {
        id: "item2",
        type: "quiz",
        label: "Quiz 1 - Quick Check",
        estimatedTime: 5,
        quizId: "qz_201",
        // e.g. "apiEndpoint": "/api/quizzes/qz_201"
      },
      {
        id: "item3",
        type: "break",
        label: "Short Break",
        estimatedTime: 5,
      },
      {
        id: "item4",
        type: "reading",
        label: "Subchapter 2: Deep Dive",
        estimatedTime: 15,
        subChapterId: "sc_102",
      },
      {
        id: "item5",
        type: "revision",
        label: "Revision / Flashcards",
        estimatedTime: 5,
        revisionOf: ["sc_101"], 
        // maybe an array of subChapters or quiz IDs to revise
      },
      {
        id: "item6",
        type: "quiz",
        label: "Quiz 2 - Subchapter 2",
        estimatedTime: 10,
        quizId: "qz_202",
      },
    ],
  };