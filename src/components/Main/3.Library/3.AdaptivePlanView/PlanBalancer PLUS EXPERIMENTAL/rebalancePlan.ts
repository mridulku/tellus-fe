/* ------------------------------------------------------------------
   Pure utility – NO firestore or axios in here, only data massaging
   ------------------------------------------------------------------ */
   export interface Activity {
    activityId : string;
    type       : 'READ' | 'QUIZ';
    quizStage? : string;
    timeNeeded : number;
    completed  : boolean;
    deferred   : boolean;
    replicaIndex?: number;
    /** new: was this activity already considered by the algorithm? */
    processed? : boolean;
    /* … plus any extra fields you keep around (chapterName etc.) … */
  }
  
  export interface Session {
    sessionLabel : string;
    locked       : boolean;
    activities   : Activity[];
  }
  
  export interface Plan {
    dailyReadingTimeUsed : number;
    sessions             : Session[];
  }
  
  /* ------------------------------------------------------------------
     rebalancePlan( plan, sessionIndex, aggregatorStub )
     – sessionIndex   : day we’re running *today*   (0-based)
     – we re-run from 0 … sessionIndex-1 (the past)     ← changed
     ------------------------------------------------------------------ */
  export function rebalancePlan<T extends Plan>(
    input            : T,
    todaySessionIdx  : number,
    _agg             : Record<string, unknown>  // not used in this mock
  ): T {
  
    const plan = structuredClone(input);                     // never mutate
    const limit = plan.dailyReadingTimeUsed || 30;
  
    /* ------------------------------------------------------------
       1. mark “past” sessions locked and copy *only* incomplete &
          *unprocessed* tasks forward (so we never touch them again)
       ------------------------------------------------------------ */
    for (let d = 0; d < Math.min(todaySessionIdx, plan.sessions.length); d++) {
      const sess = plan.sessions[d];
  
      if (sess.locked) continue;                  // already processed earlier
      sess.locked = true;
  
      const incomplete: Activity[] = [];
  
      sess.activities.forEach(act => {
        if (act.processed) return;                // already handled earlier
        act.processed = true;
  
        if (!act.completed) {
          act.deferred = true;                    // mark original
          const copy = structuredClone(act);
          copy.deferred = false;
          copy.completed = false;
          copy.processed = false;
          copy.replicaIndex = (act.replicaIndex ?? 0) + 1;
          incomplete.push(copy);
        }
      });
  
      if (!incomplete.length) continue;
  
      /* prepend copies to next session – or create a new one */
      if (d + 1 < plan.sessions.length) {
        plan.sessions[d + 1].activities.unshift(...incomplete);
      } else {
        plan.sessions.push({
          sessionLabel: String(plan.sessions.length + 1),
          locked      : false,
          activities  : incomplete,
        });
      }
    }
  
    /* ------------------------------------------------------------
       2. rebalance every **future** session so that the sum of
          timeNeeded never exceeds the daily limit
       ------------------------------------------------------------ */
    let futureActs: Activity[] = [];
    for (let d = todaySessionIdx; d < plan.sessions.length; d++) {
      futureActs.push(...plan.sessions[d].activities);
    }
  
    plan.sessions.splice(todaySessionIdx);        // throw away “future”
    let bucket: Activity[] = [];
    let bucketTime = 0;
  
    futureActs.forEach(act => {
      const t = act.timeNeeded || 0;
      if (bucketTime + t > limit && bucket.length) {
        pushBucket(bucket);
        bucket = [];
        bucketTime = 0;
      }
      bucket.push(act);
      bucketTime += t;
    });
    if (bucket.length) pushBucket(bucket);
  
    function pushBucket(arr: Activity[]) {
      plan.sessions.push({
        sessionLabel: String(plan.sessions.length + 1),
        locked      : false,
        activities  : arr,
      });
    }
  
    return plan;
  }