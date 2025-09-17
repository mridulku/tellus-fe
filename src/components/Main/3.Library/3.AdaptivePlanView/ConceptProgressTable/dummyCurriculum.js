/**
 * dummyCurriculum.js  –  ultra-minimal demo data
 *
 * 2 subjects → 1 topic → 1 chapter → 1 sub-chapter → 2 concepts each
 * ───────────────────────────────────────────────────────────────────
 *  •  quizAttempts :  oldest → newest   (true = pass, false = fail)
 *  •  nextRevDate  :  ISO string; omit it or set null if not due
 */

export const curriculum = {
    /* =============================================================== */
    Physics: [
      {
        topic: "Kinematics",
        chapters: [
          {
            name: "Motion in 1-D",
            subs: [
              {
                name: "Displacement & Distance",
                conceptList: [
                  {
                    /* fully mastered – shows “Next Rev.” date */
                    name:         "Distance vs Displacement",
                    weight:       80,                     // High
                    confidence:   72,                     // High
                    quizAttempts: [true, true, true],
                    nextRevDate:  "2025-05-15",
                    stages: { reading:100, remember:100,
                              understand:100, apply:100, analyze:100 }
                  },
                  {
                    /* mid-journey – only reading done */
                    name:         "Position-time graph",
                    weight:       45,                     // Med
                    confidence:   30,                     // Low
                    quizAttempts: [false, true],
                    nextRevDate:  null,                   // ignored (journey incomplete)
                    stages: { reading:60,  remember:null,
                              understand:null, apply:null, analyze:null }
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
  
    /* =============================================================== */
    Biology: [
      {
        topic: "Cell Biology",
        chapters: [
          {
            name: "Cell Structure",
            subs: [
              {
                name: "Plasma Membrane",
                conceptList: [
                  {
                    /* mastered */
                    name:         "Fluid mosaic model",
                    weight:       60,
                    confidence:   80,
                    quizAttempts: [true, true, true],
                    nextRevDate:  "2025-05-18",
                    stages: { reading:100, remember:100,
                              understand:100, apply:100, analyze:100 }
                  },
                  {
                    /* still at Remember stage */
                    name:         "Transport proteins",
                    weight:       55,
                    confidence:   48,
                    quizAttempts: [true, false],
                    nextRevDate:  null,
                    stages: { reading:100, remember:40,
                              understand:0, apply:null, analyze:null }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };