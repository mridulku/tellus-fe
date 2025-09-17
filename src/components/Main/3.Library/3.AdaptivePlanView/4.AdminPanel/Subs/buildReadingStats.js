export function buildReadingStats(readActsArr, readCompArr) {
    const stats = {};
  
    // Summation logic
    for (const ra of readActsArr) {
      const subId = ra.subChapterId;
      if (!subId) continue;
      if (!stats[subId]) {
        stats[subId] = { totalTimeSpentMinutes: 0, completionDate: null };
      }
      stats[subId].totalTimeSpentMinutes += (ra.totalSeconds || 0) / 60;
    }
  
    // Completion date logic
    for (const rc of readCompArr) {
      const subId = rc.subChapterId;
      if (!subId) continue;
      if (rc.readingEndTime && typeof rc.readingEndTime.toDate === "function") {
        const endDate = rc.readingEndTime.toDate();
        if (!stats[subId]) {
          stats[subId] = { totalTimeSpentMinutes: 0, completionDate: endDate };
        } else {
          const existingDate = stats[subId].completionDate;
          if (!existingDate || endDate > existingDate) {
            stats[subId].completionDate = endDate;
          }
        }
      }
    }
  
    return stats;
  }