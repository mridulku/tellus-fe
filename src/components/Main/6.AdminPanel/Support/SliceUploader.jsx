// ────────────────────────────────────────────────────────────
//  src/components/SliceUploader.jsx
// ────────────────────────────────────────────────────────────
import React, { useState } from "react";
import axios from "axios";

/**
 * SliceUploader
 * ──────────────
 * 1.  Upload PDF + CSV → /api/upload-slices  (returns ordered PNG URLs)
 * 2.  Renders an accordion for every slice
 * 3.  Inside each slice: 3 booleans + 2 text-fields
 *     • chapterStart  → if ☑ sets subChapterStart = true (cannot be false)
 *     • subChapterStart
 *     • exclude
 *     • chapterName
 *     • subChapterName
 *
 *   No back-end persistence yet – state only lives in the component.
 */
export default function SliceUploader({ apiRoot = import.meta.env.VITE_BACKEND_URL }) {
  /* ------------------------------------------------------------------ */
  /* local state                                                         */
  /* ------------------------------------------------------------------ */
  const [pdfFile,  setPdfFile]  = useState(null);
  const [csvFile,  setCsvFile]  = useState(null);
  const [uploading,setUploading]= useState(false);
  const [slices,   setSlices]   = useState([]);  // [{ url, open, chapterStart… }]
  const [error,    setError]    = useState("");

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  /** toggle <details> accordion */
  const toggleOpen = (i) =>
    setSlices((arr) =>
      arr.map((s, idx) => (idx === i ? { ...s, open: !s.open } : s))
    );

  /** update any field inside slice i */
  const updateSlice = (i, payload) =>
    setSlices((arr) =>
      arr.map((s, idx) => (idx === i ? { ...s, ...payload } : s))
    );

  /* ------------------------------------------------------------------ */
  /* handle upload                                                       */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile || !csvFile) {
      setError("Choose both a PDF and its CSV cut file first.");
      return;
    }
    try {
      setError("");
      setUploading(true);

      const fd = new FormData();
      fd.append("pdfFile", pdfFile);
      fd.append("csvFile", csvFile);

      const { data } = await axios.post(
        `${apiRoot}/api/upload-slices`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (!data?.urls?.length) throw new Error("Server returned no slice URLs");

      // create local slice objects with default meta-fields
      const initial = data.urls.map((u) => ({
        url:  apiRoot + u,
        open: false,
        chapterStart:     false,
        subChapterStart:  false,
        exclude:          false,
        chapterName:      "",
        subChapterName:   "",
      }));
      setSlices(initial);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        "Upload failed – see console for details."
      );
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  return (
    <section style={st.wrap}>
      <h2 style={st.h}>PDF → slice uploader</h2>

      {/* upload form */}
      <form onSubmit={handleSubmit} style={st.form}>
        <label style={st.lab}>
          PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0] || null)}
          />
        </label>

        <label style={st.lab}>
          CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files[0] || null)}
          />
        </label>

        <button disabled={uploading} style={st.btn}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {error && <p style={st.err}>{error}</p>}

      {/* accordion list */}
      {slices.length > 0 && (
        <>
          <h3 style={st.h3}>Slices ({slices.length})</h3>
          <ul style={st.ul}>
            {slices.map((s, idx) => (
              <li key={idx} style={st.li}>
                <details
                  open={s.open}
                  onToggle={() => toggleOpen(idx)}
                  style={st.details}
                >
                  <summary style={st.summary}>
                    Slice&nbsp;{idx + 1}
                    <span style={st.arrow}>{s.open ? "▾" : "▸"}</span>
                  </summary>

                  {/* preview image */}
                  <img src={s.url} alt="" style={st.img} />

                  {/* meta-fields */}
                  <div style={st.meta}>
                    <label>
                      <input
                        type="checkbox"
                        checked={s.chapterStart}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateSlice(idx, {
                            chapterStart: val,
                            subChapterStart: val ? true : s.subChapterStart,
                          });
                        }}
                      />
                      &nbsp;Chapter&nbsp;start
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={s.subChapterStart}
                        onChange={(e) =>
                          updateSlice(idx, {
                            subChapterStart: e.target.checked,
                            chapterStart:
                              s.chapterStart || e.target.checked, // keep rule
                          })
                        }
                      />
                      &nbsp;Sub-chapter&nbsp;start
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={s.exclude}
                        onChange={(e) =>
                          updateSlice(idx, { exclude: e.target.checked })
                        }
                      />
                      &nbsp;Exclude
                    </label>

                    <label style={st.textLab}>
                      Chapter&nbsp;name
                      <input
                        type="text"
                        value={s.chapterName}
                        onChange={(e) =>
                          updateSlice(idx, { chapterName: e.target.value })
                        }
                        style={st.text}
                      />
                    </label>

                    <label style={st.textLab}>
                      Sub-chapter&nbsp;name
                      <input
                        type="text"
                        value={s.subChapterName}
                        onChange={(e) =>
                          updateSlice(idx, { subChapterName: e.target.value })
                        }
                        style={st.text}
                      />
                    </label>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* quick inline styles – swap for Tailwind / CSS-in-JS later */
const st = {
  wrap:   { maxWidth: 960, margin: "2rem auto", fontFamily: "system-ui" },
  h:      { marginBottom: ".75rem" },
  form:   { display: "flex", gap: "1rem", flexWrap: "wrap",
            alignItems: "flex-end", marginBottom: "1rem" },
  lab:    { display: "flex", flexDirection: "column", fontSize: ".9rem" },
  btn:    { padding: ".4rem 1rem", background: "#0060df",
            color: "#fff", border: "none", cursor: "pointer" },
  err:    { color: "crimson" },
  h3:     { margin: "1.5rem 0 .5rem", fontWeight: 600 },
  ul:     { listStyle: "none", padding: 0, margin: 0 },
  li:     { marginBottom: ".35rem" },
  details:{ border: "1px solid #ccc", borderRadius: 4, padding: ".25rem" },
  summary:{ cursor: "pointer", userSelect: "none",
            display: "flex", justifyContent: "space-between",
            fontWeight: 500 },
  arrow:  { marginLeft: ".5rem" },
  img:    { width: "100%", height: "auto", margin: ".5rem 0",
            border: "1px solid #999" },
  meta:   { display: "flex", flexDirection: "column", gap: ".3rem",
            fontSize: ".85rem" },
  textLab:{ display: "flex", flexDirection: "column", gap: ".15rem" },
  text:   { padding: ".25rem", fontSize: ".85rem" },
};