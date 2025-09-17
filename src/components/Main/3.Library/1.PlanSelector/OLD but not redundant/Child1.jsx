import React, { useState, useEffect } from "react";
import axios               from "axios";
import { useSelector }     from "react-redux";
import {
  Box, Typography, LinearProgress, IconButton, Pagination,
  TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/* ------------------------------------------------------------------ */
/* 1.  SHARED HELPERS (generic list)                                  */
/* ------------------------------------------------------------------ */
const getBookIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("math"))    return "📐";
  if (lower.includes("science")) return "🔬";
  if (lower.includes("history")) return "🏰";
  if (lower.includes("art"))     return "🎨";
  return "📚";
};

/* ------------------------------------------------------------------ */
/* 2.  TOEFL CONSTANTS                                                */
/* ------------------------------------------------------------------ */
const TOEFL_BOOK_ORDER = [
  "TOEFL Reading Guidebook",
  "TOEFL Writing Guidebook",
  "TOEFL Speaking Guidebook",
  "TOEFL Listening Guidebook"
];
const getToeflBookIcon = (name) => ({
  "TOEFL Reading Guidebook"   : "📖",
  "TOEFL Writing Guidebook"   : "✍️",
  "TOEFL Speaking Guidebook"  : "🗣️",
  "TOEFL Listening Guidebook" : "🎧"
}[name] || "📚");

/* ------------------------------------------------------------------ */
/* 3.  FIXED‑TILE CONFIG FOR OTHER EXAMS                              */
/* ------------------------------------------------------------------ */
export const PANEL_BOOK_CONFIG = {
  CBSE:         { books:["CBSE1","CBSE2","CBSE3","CBSE4"],
                  iconMap:{ CBSE1:"📘", CBSE2:"📙", CBSE3:"📗", CBSE4:"📕" } },
  JEEADVANCED:  { books:["JEEADVANCED1","JEEADVANCED2","JEEADVANCED3","JEEADVANCED4"],
                  iconMap:{ JEEADVANCED1:"⚙️",JEEADVANCED2:"🧪",JEEADVANCED3:"📐",JEEADVANCED4:"🔋" } },
  NEET:         { books:["NEET1","NEET2","NEET3","NEET4"],
                  iconMap:{ NEET1:"🫀", NEET2:"🧠", NEET3:"🦴", NEET4:"🧬" } },
  SAT:          { books:["SAT1","SAT2","SAT3","SAT4"],
                  iconMap:{ SAT1:"📝", SAT2:"📏", SAT3:"📐", SAT4:"📚" } },
  GATE:         { books:["GATE1","GATE2","GATE3","GATE4"],
                  iconMap:{ GATE1:"⚙️", GATE2:"🔧", GATE3:"📊", GATE4:"🔬" } },
  CAT:          { books:["CAT1","CAT2","CAT3","CAT4"],
                  iconMap:{ CAT1:"📈", CAT2:"📉", CAT3:"💹", CAT4:"📊" } },
  GRE:          { books:["GRE1","GRE2","GRE3","GRE4"],
                  iconMap:{ GRE1:"📝", GRE2:"📚", GRE3:"📖", GRE4:"✍️" } },
  UPSC:         { books:["UPSC1","UPSC2","UPSC3","UPSC4"],
                  iconMap:{ UPSC1:"📜", UPSC2:"🗺️", UPSC3:"🏛️", UPSC4:"⚖️" } },
  FRM:          { books:["FRM1","FRM2","FRM3","FRM4"],
                  iconMap:{ FRM1:"💰", FRM2:"📊", FRM3:"📉", FRM4:"📈" } }
};

/* ------------------------------------------------------------------ */
/* 4.  MAIN COMPONENT                                                 */
/* ------------------------------------------------------------------ */
export default function Child1({
  userId,
  onBookSelect      = () => {},
  onOpenOnboarding  = () => {}
}) {
  const examType = useSelector(s => s.exam.examType);
  const [booksData,      setBooksData]      = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);

  /* Fetch once ----------------------------------------------------- */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
          { params:{ userId } }
        );
        setBooksData(res.data?.success ? res.data.data : []);
      } catch (e) {
        console.error("books-user:", e);
        setBooksData([]);
      }
    })();
  }, [userId]);

  /* ================================================================
     1)  TOEFL  –  locked panel, first tile unlocked
  =================================================================*/
  if (examType === "TOEFL") {
    /* tiny helper for Reading progress ----------------------------- */
    const computeProgress = (book) => {
      if (!book) return 0;
      let total = 0, done = 0;
      (book.chapters || []).forEach(ch => {
        (ch.subChapters || []).forEach(sub => {
          total += 1;
          if (sub.isDone) done += 1;
        });
      });
      return total ? Math.round((done / total) * 100) : 0;
    };

    const tiles = TOEFL_BOOK_ORDER.map((title, idx) => {
      const match = booksData.find(b => b.name === title) || null;
      return {
        title,
        icon    : getToeflBookIcon(title),
        bookObj : match,
        locked  : idx > 0,
        progress: idx === 0 && match ? computeProgress(match) : 0
      };
    });

    return (
      <SpecialPanel
        tiles={tiles}
        selectedBookId={selectedBookId}
        setSelectedBook={setSelectedBookId}
        onBookSelect={onBookSelect}
        plusDisabled        /* hide "+" */
      />
    );
  }

  /* ================================================================
     2)  OTHER EXAMS WITH FIXED PANEL (CBSE, JEEADVANCED, …)
  =================================================================*/
  const cfg = PANEL_BOOK_CONFIG[examType];
  if (cfg) {
    const tiles = cfg.books.map((title, idx) => {
      const match = booksData.find(b => b.name === title) || null;
      return {
        title,
        icon    : cfg.iconMap[title] || "📚",
        bookObj : match,
        locked  : idx > 0,          // first tile unlocked
        progress: 0                 // can compute later if needed
      };
    });

    return (
      <SpecialPanel
        tiles={tiles}
        selectedBookId={selectedBookId}
        setSelectedBook={setSelectedBookId}
        onBookSelect={onBookSelect}
        plusDisabled        /* hide "+" */
      />
    );
  }

  /* ================================================================
     3)  FALLBACK  – searchable list with upload button
  =================================================================*/
  return (
    <GenericBookList
      booksData={booksData}
      selectedBookId={selectedBookId}
      setSelectedBookId={setSelectedBookId}
      onBookSelect={onBookSelect}
      onOpenOnboarding={onOpenOnboarding}
    />
  );
}

/* ================================================================= */
/* <SpecialPanel> – shared 4‑tile layout (locked / unlocked)          */
/* ================================================================= */
function SpecialPanel({
  tiles,
  selectedBookId,
  setSelectedBook,
  onBookSelect,
  plusDisabled
}) {
  return (
    <Box sx={{ background:"#000", color:"#fff", p:2 }}>
      <Typography variant="h6" sx={{ fontWeight:"bold", mb:2 }}>
        My Materials
      </Typography>

      <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
        {tiles.map(tb => {
          const found      = Boolean(tb.bookObj);
          const isSelected = tb.bookObj?.id === selectedBookId;

          return (
            <Box
              key={tb.title}
              sx={{
                p:2,
                borderRadius:1,
                background: isSelected ? "rgba(187,134,252,.3)" : "rgba(255,255,255,.06)",
                border:     isSelected ? "2px solid #BB86FC"   : "1px solid rgba(255,255,255,.15)",
                cursor:     found && !tb.locked ? "pointer" : "default"
              }}
              onClick={()=>{
                if (found && !tb.locked) {
                  setSelectedBook(tb.bookObj.id);
                  onBookSelect(tb.bookObj.id, tb.bookObj.name);
                }
              }}
            >
              {/* header */}
              <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1 }}>
                <Typography sx={{ fontSize:"1.5rem" }}>{tb.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight:"bold" }}>
                  {tb.title}
                </Typography>
              </Box>

              {/* body */}
              {!found && (
                <Typography variant="body2" sx={{ opacity:.7 }}>
                  Not found in your library.
                </Typography>
              )}

              {found && (
                tb.locked ? (
                  <>
                    <LinearProgress value={0} variant="determinate" sx={progressStyle}/>
                    <Typography variant="caption" sx={{ opacity:.8 }}>0% complete</Typography>
                    <Box sx={lockChip}><span role="img" aria-label="lock">🔒</span> Locked</Box>
                  </>
                ) : (
                  <>
                    <LinearProgress value={tb.progress} variant="determinate" sx={progressStyle}/>
                    <Typography variant="caption" sx={{ opacity:.8 }}>
                      {tb.progress}% complete
                    </Typography>
                  </>
                )
              )}
            </Box>
          );
        })}
      </Box>

      {!plusDisabled && (
        <IconButton sx={{ color:"#4CAF50", mt:2 }} title="Upload">
          <AddIcon/>
        </IconButton>
      )}
    </Box>
  );
}

/* ================================================================= */
/* <GenericBookList> – original searchable / paginated list           */
/* ================================================================= */
function GenericBookList({
  booksData,
  selectedBookId,
  setSelectedBookId,
  onBookSelect,
  onOpenOnboarding
}) {
  /* --- local state ------------------------------------------------ */
  const [page, setPage]           = useState(1);
  const booksPerPage              = 5;
  const [search, setSearch]       = useState("");
  const [sort,   setSort]         = useState("NEWEST");

  /* --- filtering / sorting ---------------------------------------- */
  const filtered = booksData.filter(b =>
    (b.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a,b)=>{
    const dA = a.createdAt ? new Date(a.createdAt) : 0;
    const dB = b.createdAt ? new Date(b.createdAt) : 0;
    const nA = (a.name||"").toLowerCase();
    const nB = (b.name||"").toLowerCase();
    switch (sort){
      case "NEWEST":     return dB - dA;
      case "OLDEST":     return dA - dB;
      case "ALPHA_ASC":  return nA.localeCompare(nB);
      case "ALPHA_DESC": return nB.localeCompare(nA);
      default:           return 0;
    }
  });

  /* --- stats (progress) ------------------------------------------- */
  const stats = sorted.map(bk=>{
    let tot=0, done=0;
    (bk.chapters||[]).forEach(c=>{
      (c.subChapters||[]).forEach(s=>{
        tot+=1;
        if (s.isDone) done+=1;
      });
    });
    return { ...bk, progress: tot ? Math.round(done/tot*100) : 0 };
  });

  /* --- pagination slice ------------------------------------------- */
  const start = (page-1)*booksPerPage;
  const shown = stats.slice(start, start+booksPerPage);

  /* --- render ------------------------------------------------------ */
  return (
    <Box sx={{ background:"#000", color:"#fff", p:2, display:"flex", flexDirection:"column", gap:2 }}>
      {/* header */}
      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
        <Typography variant="h6" sx={{ fontWeight:"bold" }}>My Materials</Typography>
        <IconButton sx={{ color:"#4CAF50" }} onClick={onOpenOnboarding} title="Upload">
          <AddIcon/>
        </IconButton>
      </Box>

      {/* search + sort */}
      <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
        <TextField
          placeholder="Search…"
          size="small"
          value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }}
          sx={{ width:160, input:{color:"#fff"} }}
        />
        <FormControl size="small" sx={{ minWidth:120 }}>
          <InputLabel sx={{ color:"#fff" }}>Sort</InputLabel>
          <Select
            value={sort}
            label="Sort"
            onChange={e=>{ setSort(e.target.value); setPage(1); }}
            sx={{ color:"#fff" }}
          >
            <MenuItem value="NEWEST">Newest</MenuItem>
            <MenuItem value="OLDEST">Oldest</MenuItem>
            <MenuItem value="ALPHA_ASC">A → Z</MenuItem>
            <MenuItem value="ALPHA_DESC">Z → A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* list */}
      {shown.map(bk=>{
        const isSel = bk.id === selectedBookId;
        return (
          <Box
            key={bk.id}
            sx={{
              p:1, display:"flex", gap:1.5, alignItems:"center",
              borderRadius:1,
              background: isSel ? "rgba(187,134,252,.3)" : "rgba(255,255,255,.06)",
              border:     isSel ? "2px solid #BB86FC"   : "1px solid rgba(255,255,255,.15)",
              cursor:"pointer"
            }}
            onClick={()=>{ setSelectedBookId(bk.id); onBookSelect(bk.id,bk.name); }}
          >
            <Box sx={{ fontSize:"1.5rem", width:"2rem", textAlign:"center" }}>{getBookIcon(bk.name)}</Box>
            <Box sx={{ flex:1 }}>
              <Typography sx={{ fontWeight:"bold", lineHeight:1.2 }}>{bk.name}</Typography>
              <Typography variant="caption" sx={{ opacity:.8 }}>
                {bk.createdAt ? new Date(bk.createdAt).toLocaleDateString() : "—"}
              </Typography>
              <LinearProgress value={bk.progress} variant="determinate" sx={progressStyle}/>
              <Typography variant="caption" sx={{ opacity:.8 }}>
                {bk.progress}% complete
              </Typography>
            </Box>
          </Box>
        );
      })}

      {/* pagination */}
      {stats.length > booksPerPage && (
        <Box sx={{ display:"flex", justifyContent:"center", mt:1 }}>
          <Pagination
            count={Math.ceil(stats.length / booksPerPage)}
            page={page}
            onChange={(e,v)=>setPage(v)}
            siblingCount={0}
            sx={{
              "& .MuiPaginationItem-root": { color:"#fff", borderColor:"rgba(255,255,255,.3)" },
              "& .MuiPaginationItem-root.Mui-selected": { background:"#BB86FC", color:"#000" },
              "& .MuiPaginationItem-ellipsis": { color:"#fff" }
            }}
          />
        </Box>
      )}
    </Box>
  );
}

/* --- tiny shared style snippets ----------------------------------- */
const progressStyle = {
  height:6, borderRadius:1, background:"rgba(255,255,255,.3)",
  my:1, "& .MuiLinearProgress-bar":{ background:"#FFD700" }
};
const lockChip = {
  mt:1, display:"inline-flex", alignItems:"center", gap:.5,
  background:"#333", color:"#fff", px:1, py:.5, borderRadius:1,
  fontSize:"0.9rem", fontWeight:"bold"
};