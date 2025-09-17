/* ──────────────────────────────────────────────────────────────────────────
   src/components/BookExplorer.jsx
   Book ➜ Subject ➜ Group ➜ Chapter ➜ Sub-chapter ➜ Concept admin tool
   – real / filler tagging + filter
   – inline summary edit
   – concept list + “Generate concepts” triggers
   ─────────────────────────────────────────────────────────────────────────*/

import React, { useEffect, useState, useCallback } from "react";
import {
  collection, query, where, getDocs,
  updateDoc, doc, writeBatch,
} from "firebase/firestore";
import { db } from "../../../../firebase";            // ← adjust if needed

/* ═════════ helpers ═════════ */
const numPrefix = (t="") => { const m=t.match(/^(\d+(?:\.\d+)?)/); return m?+m[1]:1e9; };
const byNum     = (a,b) => numPrefix(a.name)-numPrefix(b.name);
const processHTML = (h="") => h.replace(/\\n/g,"\n").replace(/\r?\n/g," ")
  .split(/<\/p>/i).map(p=>p.trim()).filter(Boolean).map(p=>p+"</p>").join("");
const chip = (bg)=>({background:bg,color:"#fff",borderRadius:4,padding:"2px 6px",
  fontSize:"0.7rem",fontWeight:600,cursor:"pointer"});

/* ═════════ inline editor ═════════ */
function EditableSummary({ label,value,onSave }) {
  const[edit,setEdit]=useState(false);const[draft,set]=useState(value||"");
  useEffect(()=>{if(!edit)set(value||"");},[value,edit]);
  return(
    <details open={edit} style={{marginLeft:"1rem",marginTop:"0.4rem"}}>
      <summary style={{fontWeight:500}}>
        {label}
        {!edit&&<button type="button" onClick={()=>setEdit(true)} style={{marginLeft:8}}>✏️ Edit</button>}
      </summary>
      {edit?(
        <div style={{marginLeft:"1rem"}}>
          <textarea rows={6} style={{width:"100%",fontFamily:"monospace"}}
                    value={draft} onChange={e=>set(e.target.value)}/>
          <div style={{marginTop:4}}>
            <button onClick={async()=>{await onSave(draft);setEdit(false);}}>💾 Save</button>
            <button style={{marginLeft:8}} onClick={()=>{set(value||"");setEdit(false);}}>✖️ Cancel</button>
          </div>
        </div>
      ):(
        <pre style={{marginLeft:"1rem",whiteSpace:"pre-wrap",fontFamily:"monospace"}}>{value}</pre>
      )}
    </details>
  );
}

/* ═════════ main component ═════════ */
export default function BookExplorer({ userId }) {

  /* state */
  const [books,setBooks]           = useState([]);
  const [bookId,setBookId]         = useState("");
  const [tree,setTree]             = useState([]);     // subject→group→chapters
  const [subs,setSubs]             = useState([]);     // flat sub-chapters
  const [concepts,setConcepts]     = useState({});     // subId → concepts[]
  const [loading,setLoading]       = useState(false);
  const [filter,setFilter]         = useState("all");  // all | real | filler
  const [pending,setPending]       = useState(new Set()); // subIds queued

  /* arrow markers */
  const arrowCSS=`details summary{cursor:pointer;}
    details summary::-webkit-details-marker{display:none;}
    details summary::marker{content:'';}
    details summary::before{content:"▶";display:inline-block;width:1rem;
      transition:transform .15s}
    details[open]>summary::before{content:"▼";}`;

  /* load books for user */
  useEffect(()=>{ if(!userId) return;
    (async()=>{
      const snap=await getDocs(query(collection(db,"books_demo"),where("userId","==",userId)));
      const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name));
      setBooks(rows); if(rows.length&&!bookId) setBookId(rows[0].id);
    })();
  },[userId]);

  /* load single book */
  const loadBook=useCallback(async(id)=>{
    setLoading(true);

    const chapSnap=await getDocs(query(collection(db,"chapters_demo"),where("bookId","==",id)));
    const chapters=chapSnap.docs.map(d=>({id:d.id,...d.data()}));

    const subSnap=await getDocs(query(collection(db,"subchapters_demo"),where("bookId","==",id)));
    const subRows=subSnap.docs.map(d=>({id:d.id,...d.data()})).sort(byNum);
    setSubs(subRows);

    const conSnap=await getDocs(query(collection(db,"subchapterConcepts"),where("bookId","==",id)));
    const conDict={}; conSnap.docs.forEach(d=>{const r={id:d.id,...d.data()};(conDict[r.subChapterId]??=[]).push(r);});
    setConcepts(conDict);

    /* build subject→group→chapters tree */
    const subjMap={};
    chapters.forEach(c=>{
      const subj=c.subject||"Uncategorised", grp=c.grouping||"Other";
      (subjMap[subj]??={}); (subjMap[subj][grp]??=[]).push(c);
    });
    const t=Object.entries(subjMap).sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([subject,gObj])=>({subject,
        groups:Object.entries(gObj).sort((a,b)=>a[0].localeCompare(b[0]))
          .map(([grouping,chs])=>({grouping,chapters:chs.sort(byNum)}))
      }));
    setTree(t); setLoading(false);
  },[]);

  useEffect(()=>{ if(bookId) loadBook(bookId); },[bookId,loadBook]);

  /* util: visible sub-chapter? */
  const visible = s => filter==="all" ? true
                     : filter==="real" ? !!s.realContentAdded : !s.realContentAdded;

  /* toggle real/filler */
  const flipReal = async (id,val)=>{ await updateDoc(doc(db,"subchapters_demo",id),{realContentAdded:val});
    setSubs(rows=>rows.map(r=>r.id===id?{...r,realContentAdded:val}:r)); };

  /* bulk mark real */
  const bulkReal = async ids=>{ if(!ids.length) return;
    const batch=writeBatch(db); ids.forEach(id=>batch.update(doc(db,"subchapters_demo",id),{realContentAdded:true}));
    await batch.commit(); setSubs(rows=>rows.map(r=>ids.includes(r.id)?{...r,realContentAdded:true}:r)); };

  /* queue concept extraction */
  const queueOne = async id=>{
    if(pending.has(id)) return;
    setPending(p=>new Set([...p,id]));
    await updateDoc(doc(db,"subchapters_demo",id),{conceptExtractionRequested:true});
    setPending(p=>{const n=new Set(p);n.delete(id);return n;});
  };
  const queueMany = async ids=>{
    if(!ids.length) return;
    setPending(p=>new Set([...p,...ids]));
    const batch=writeBatch(db); ids.forEach(id=>batch.update(doc(db,"subchapters_demo",id),{conceptExtractionRequested:true}));
    await batch.commit();
    setPending(p=>{const n=new Set(p);ids.forEach(i=>n.delete(i));return n;});
  };

  /* render */
  return (
    <div style={{padding:"1rem",fontFamily:"sans-serif"}}>
      <style>{arrowCSS}</style>
      <h2>📚 Book Explorer (admin)</h2>

      {/* top-bar */}
      <div style={{marginBottom:"0.6rem"}}>
        <label>Book&nbsp;
          <select value={bookId} onChange={e=>setBookId(e.target.value)}>
            {books.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        {tree.length>0&&(
          <span style={{marginLeft:12,...chip(
            filter==="all"?"#888":filter==="real"?"#2e7d32":"#c62828")}}
            onClick={()=>setFilter(f=>f==="all"?"real":f==="real"?"filler":"all")}>
            {filter==="all"?"All":filter==="real"?"Real only":"Filler only"}
          </span>
        )}
      </div>

      {loading&&<p>Loading…</p>}

       {!loading && tree
   /* 1️⃣  skip a whole SUBJECT if every group inside is empty after filtering */
   .filter(subj => subj.groups.some(grp =>
       grp.chapters.some(chap =>
         subs.some(s => s.chapterId===chap.id && visible(s))
       )
     )
   )
   .map(subj=>(
     <details key={subj.subject} open>
       <summary style={{fontSize:"1.1rem",fontWeight:700}}>
         {subj.subject}
       </summary>

       {subj.groups
         /* 2️⃣  skip a GROUP if every chapter ends up empty */
         .filter(grp =>
           grp.chapters.some(chap =>
             subs.some(s => s.chapterId===chap.id && visible(s))
           )
         )
         .map(grp=>(
         <details key={grp.grouping}
                  open
                  style={{marginLeft:"1rem",marginTop:"0.4rem"}}>
           <summary style={{fontWeight:650}}>{grp.grouping}</summary>

              {grp.chapters.map(chap=>{
                const subRows=subs.filter(s=>s.chapterId===chap.id&&visible(s));
                if(subRows.length===0) return null;

                const notReal=subRows.filter(s=>!s.realContentAdded).map(s=>s.id);
                const zeroConcept=subRows.filter(s=>(concepts[s.id]||[]).length===0).map(s=>s.id);

                return(
                  <details key={chap.id} style={{marginLeft:"1rem",marginTop:"0.4rem"}}>
                    <summary style={{fontWeight:600}}>
                      {chap.name}
                      {notReal.length>0&&(
                        <button style={{marginLeft:8,...chip("#2e7d32")}}
                                onClick={e=>{e.stopPropagation();bulkReal(notReal);}}>
                          ✅ Mark all real
                        </button>)}
                      {zeroConcept.length>0&&(
                        <button style={{marginLeft:8,...chip("#1976d2")}}
                                onClick={e=>{e.stopPropagation();queueMany(zeroConcept);}}>
                          ⚡ Generate all concepts
                        </button>)}
                    </summary>

                    {/* sub-chapters */}
                    {subRows.map(sub=>{
                      const list=concepts[sub.id]||[];
                      const queued=pending.has(sub.id);
                      return(
                        <details key={sub.id} style={{marginLeft:"1rem",marginTop:"0.3rem"}}>
                          <summary style={{fontWeight:600}}>
                            {sub.name}
                            <span onClick={e=>{e.stopPropagation();flipReal(sub.id,!sub.realContentAdded);}}
                                  style={{marginLeft:6,...chip(sub.realContentAdded?"#2e7d32":"#c62828")}}>
                              {sub.realContentAdded?"Real":"Filler"}
                            </span>
                            {list.length===0?(
                              <button style={{marginLeft:6,...chip(queued?"#888":"#1976d2")}}
                                      disabled={queued}
                                      onClick={e=>{e.stopPropagation();queueOne(sub.id);}}>
                                {queued?"⏳":"⚡ Generate concepts"}
                              </button>
                            ):(
                              <span style={{marginLeft:6,...chip("#4caf50")}}>
                                {list.length} concepts
                              </span>
                            )}
                          </summary>

                          {/* concept names */}
                          {list.length>0&&(
                            <ul style={{marginLeft:"1.5rem",marginTop:"0.2rem"}}>
                              {list.map(c=><li key={c.id}>🧩 {c.name}</li>)}
                            </ul>
                          )}

                          {/* summaries */}
                          <EditableSummary
                            label="🔧 Raw summary"
                            value={sub.summary}
                            onSave={txt=>updateDoc(doc(db,"subchapters_demo",sub.id),{summary:txt})}
                          />
                          <details open style={{marginLeft:"1rem",marginTop:"0.4rem"}}>
                            <summary style={{fontWeight:500}}>✨ Processed summary</summary>
                            <div style={{marginLeft:"1rem"}}
                                 dangerouslySetInnerHTML={{__html:processHTML(sub.summary)}}/>
                          </details>
                        </details>
                      );
                    })}
                  </details>
                );
              })}
            </details>
          ))}
        </details>
      ))}
    </div>
  );
}