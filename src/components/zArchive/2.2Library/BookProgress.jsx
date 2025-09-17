import React from "react";

/**
 * A single stacked bar for proficient (blue), read-only (green),
 * unread (gray), plus a tiny textual summary below it.
 */
function CombinedProgressBar({
  label,
  readOrProficientWords,
  proficientWords,
  totalWords,
}) {
  const total = totalWords || 0;
  const rp = readOrProficientWords || 0;
  const prof = proficientWords || 0;

  // Segments
  const proficientSegment = Math.min(prof, total);
  const readOnlySegment = Math.min(rp - prof, total - prof);
  const unreadSegment = Math.max(total - rp, 0);

  // Convert to percentages
  const profPct = total > 0 ? (proficientSegment / total) * 100 : 0;
  const readPct = total > 0 ? (readOnlySegment / total) * 100 : 0;
  const unreadPct = total > 0 ? (unreadSegment / total) * 100 : 0;

  // For numeric details
  const readTotalPct = total > 0 ? (rp / total) * 100 : 0;
  const profTotalPct = total > 0 ? (prof / total) * 100 : 0;

  // The container for the stacked bar
  const containerStyle = {
    display: "flex",
    width: "180px",
    height: "10px",
    borderRadius: "6px",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.3)",
  };

  const proficientStyle = {
    width: `${profPct}%`,
    backgroundColor: "blue",
    transition: "width 0.3s",
  };

  const readStyle = {
    width: `${readPct}%`,
    backgroundColor: "green",
    transition: "width 0.3s",
  };

  const unreadStyle = {
    width: `${unreadPct}%`,
    backgroundColor: "gray",
    transition: "width 0.3s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {/* 1) Small label at top */}
      <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{label}</div>

      {/* 2) The stacked bar */}
      <div style={containerStyle}>
        <div style={proficientStyle} />
        <div style={readStyle} />
        <div style={unreadStyle} />
      </div>

      {/* 3) The textual details in a tiny form:
             e.g. "Read: 40% (4000 / 10000),
                  Proficient: 20% (2000 / 10000)" */}
      <div style={{ fontSize: "0.8rem", lineHeight: "1.2" }}>
        <div>
          <strong>Read:</strong> {readTotalPct.toFixed(2)}% ({rp} / {total})
        </div>
        <div>
          <strong>Proficient:</strong> {profTotalPct.toFixed(2)}% ({prof} / {total})
        </div>
      </div>
    </div>
  );
}

function BookProgress({
  book,
  selectedChapter,
  selectedSubChapter,
  getBookProgressInfo,
}) {
  if (!book) return null;
  const bp = getBookProgressInfo(book.bookName);
  if (!bp) return null;

  // Attempt to find aggregator for the selected chapter
  let cp = null;
  if (selectedChapter && bp.chapters) {
    cp = bp.chapters.find((c) => c.chapterName === selectedChapter.chapterName);
  }
  // Or deduce from subchapter
  if (!cp && selectedSubChapter && bp.chapters) {
    for (const chapterAgg of bp.chapters) {
      const foundSub = chapterAgg.subChapters.find(
        (sub) => sub.subChapterName === selectedSubChapter.subChapterName
      );
      if (foundSub) {
        cp = chapterAgg;
        break;
      }
    }
  }

  // Subchapter proficiency
  let subChapterColor = "red";
  let subChapterText = "Not Read";
  if (selectedSubChapter) {
    if (selectedSubChapter.proficiency === "proficient") {
      subChapterText = "Read & Prof.";
      subChapterColor = "blue";
    } else if (selectedSubChapter.proficiency === "read") {
      subChapterText = "Just Read";
      subChapterColor = "green";
    }
  }

  // We'll layout everything in a single horizontal row:
  // [Book Column] [Chapter Column if any] [Subchapter Proficiency]
  const outerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "20px",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "0.85rem",
  };

  const columnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-start",
  };

  return (
    <div style={outerStyle}>
      {/* BOOK column */}
      <div style={columnStyle}>
        <CombinedProgressBar
          label="Book Progress"
          readOrProficientWords={bp.totalWordsReadOrProficient}
          proficientWords={bp.totalWordsProficient}
          totalWords={bp.totalWords}
        />
      </div>

      {/* CHAPTER column, if aggregator found */}
      {cp && (
        <div style={columnStyle}>
          <CombinedProgressBar
            label="Chapter Progress"
            readOrProficientWords={cp.totalWordsReadOrProficient}
            proficientWords={cp.totalWordsProficient}
            totalWords={cp.totalWords}
          />
        </div>
      )}

      {/* SUBCHAPTER: Just the proficiency color label */}
      {selectedSubChapter && (
        <div style={columnStyle}>
          <strong>Subchapter Status:</strong>
          <span style={{ color: subChapterColor }}>{subChapterText}</span>
        </div>
      )}
    </div>
  );
}

export default BookProgress;