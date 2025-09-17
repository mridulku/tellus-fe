/* SliceViewer.jsx ──────────────────────────────────────────────────────────
   Enhanced version:
   • adds Book-/Chapter-/Sub-chapter annotations
   • persists structured data into Firestore
   • still shows a collapsible preview of every slice
   ------------------------------------------------------------------------*/

   import React, { useEffect, useState } from 'react';
   import {
     ref, listAll, getDownloadURL,
   } from 'firebase/storage';
   import {
     collection, addDoc, serverTimestamp,
   } from 'firebase/firestore';
   import { storage, db } from '../../../../firebase';   // ← make sure db is exported too
   
   function SliceViewer({ userId, folderPath = 'BookSlices/ChemNCRTCh1' }) {
     /* ───────────────────────────────────────────────────────────────────────
        Local state
        ──────────────────────────────────────────────────────────────────── */
     const [bookName, setBookName] = useState('');
     const [items,    setItems]    = useState([]);   // [{ name, src, meta… }]
     const [loading,  setLoading]  = useState(true);
     const [error,    setError]    = useState(null);
     const [saving,   setSaving]   = useState(false);
   
     /* ───────────────────────────────────────────────────────────────────────
        Load images once on mount
        ──────────────────────────────────────────────────────────────────── */
     useEffect(() => {
       (async () => {
         try {
           const folderRef    = ref(storage, folderPath);
           const { items }    = await listAll(folderRef);
           const withUrls     = await Promise.all(
             items.map(async (i) => ({
               name: i.name,
               src : await getDownloadURL(i),
               chapterStart    : false,
               subchapterStart : false,
               chapterName     : '',
               subchapterName  : '',
             })),
           );
   
           withUrls.sort((a, b) =>
             a.name.localeCompare(b.name, undefined, { numeric: true })
           );
           setItems(withUrls);
         } catch (e) {
           setError(e);
         } finally {
           setLoading(false);
         }
       })();
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);
   
     /* ───────────────────────────────────────────────────────────────────────
        Field helpers
        ──────────────────────────────────────────────────────────────────── */
     const updateItem = (index, patch) =>
       setItems((curr) => {
         const clone = [...curr];
         clone[index] = { ...clone[index], ...patch };
   
         /* Business rule: if chapterStart becomes true,
            force subchapterStart to true as well */
         if (patch.chapterStart) {
           clone[index].subchapterStart = true;
         }
         return clone;
       });
   
     /* ───────────────────────────────────────────────────────────────────────
        Submit handler
        ──────────────────────────────────────────────────────────────────── */
     async function handleSubmit() {
       if (!bookName.trim()) {
         alert('Please enter a Book name.');
         return;
       }
       // Quick validation of required names
       for (const row of items) {
         if (row.chapterStart && !row.chapterName.trim()) {
           alert(`Page “${row.name}” is the first of a chapter – please enter the chapter name.`);
           return;
         }
         if (row.subchapterStart && !row.subchapterName.trim()) {
           alert(`Page “${row.name}” is the first of a sub-chapter – please enter the sub-chapter name.`);
           return;
         }
       }
   
       setSaving(true);
       try {
         /* 1. create the book */
         const bookRef = await addDoc(collection(db, 'books_demo'), {
           name: bookName.trim(),
           userId,
           createdAt: serverTimestamp(),
         });
         const bookId = bookRef.id;
   
         /* 2. walk once to create chapter docs & remember their ids */
         const chapterIds = new Map();   // name → firestore id
         for (const row of items) {
           if (row.chapterStart && !chapterIds.has(row.chapterName)) {
             const chapRef = await addDoc(collection(db, 'chapters_demo'), {
               name   : row.chapterName,
               bookId,
               userId,
               createdAt: serverTimestamp(),
             });
             chapterIds.set(row.chapterName, chapRef.id);
           }
         }
   
         /* 3. second pass: group consecutive pages
               that share the same chapter / sub-chapter */
         let currentChapter   = '';
         let currentChapterId = '';
         let currentSub       = '';
         let imageBucket      = [];   // links for the running sub-chapter
   
         for (let i = 0; i < items.length; ++i) {
           const row = items[i];
   
           // Promote inherited names if not a start
           if (row.chapterStart) {
             currentChapter   = row.chapterName;
             currentChapterId = chapterIds.get(currentChapter);
           }
           if (row.subchapterStart) {
             // Flush the previous sub-chapter before starting a new one
             if (imageBucket.length) {
               await addDoc(collection(db, 'subchapters_demo'), {
                 name     : currentSub,
                 bookId,
                 chapterId: currentChapterId,
                 userId,
                 imageLinks: imageBucket,
                 createdAt: serverTimestamp(),
               });
               imageBucket = [];
             }
             currentSub = row.subchapterName;
           }
   
           imageBucket.push(row.src);
   
           // If this is the last row, flush once more
           if (i === items.length - 1) {
             await addDoc(collection(db, 'subchapters_demo'), {
               name     : currentSub,
               bookId,
               chapterId: currentChapterId,
               userId,
               imageLinks: imageBucket,
               createdAt: serverTimestamp(),
             });
           }
         }
   
         alert('✅  All data saved to Firestore!');
       } catch (e) {
         console.error(e);
         alert(`Failed: ${e.message}`);
       } finally {
         setSaving(false);
       }
     }
   
     /* ───────────────────────────────────────────────────────────────────────
        Render
        ──────────────────────────────────────────────────────────────────── */
     if (loading) return <p>Loading…</p>;
     if (error)   return <p style={{ color: 'crimson' }}>🚨 {String(error)}</p>;
   
     return (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 680 }}>
         {/* Book name ******************************************************************/}
         <label style={{ fontWeight: 600 }}>
           Book name&nbsp;
           <input
             type="text"
             value={bookName}
             onChange={(e) => setBookName(e.target.value)}
             style={{ width: '100%', marginTop: 4 }}
             placeholder="e.g. “Organic Chemistry Vol-1”"
           />
         </label>
   
         {/* Image list *****************************************************************/}
         {items.map(({ name, src, chapterStart, subchapterStart, chapterName, subchapterName }, idx) => (
           <details
             key={src}
             style={{
              border: '1px solid #444',
                    borderRadius: 4,
                    padding: '0.5rem 0.75rem',
                    background: '#1E1E1E',
             }}
           >
             <summary
               style={{
                 cursor: 'pointer',
                 fontWeight: '600',
                 listStyle: 'none',
                 outline: 'none',
               }}
             >
               {name}
             </summary>
   
             {/* Expanded panel *********************************************************/}
             <div
               style={{
                 marginTop: '0.75rem',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '0.75rem',
               }}
             >
               <img
                 src={src}
                 alt={name}
                 style={{
                   maxWidth: '100%',
                   borderRadius: 4,
                   boxShadow: '0 2px 8px rgba(0,0,0,.1)',
                 }}
               />
   
               {/* Meta-data form controls *********************************************/}
               <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label>
                   <input
                     type="checkbox"
                     checked={chapterStart}
                     onChange={(e) => updateItem(idx, { chapterStart: e.target.checked })}
                   />
                   &nbsp;Start of chapter
                 </label>
   
                 {chapterStart && (
                     <input
                       type="text"
                       placeholder="Chapter name"
                       value={chapterName}
                       onChange={(e) => updateItem(idx, { chapterName: e.target.value })}
                       style={{
                         paddingLeft: 8,
                         background: '#2A2A2A',
                         color: '#FFF',
                         border: '1px solid #555',
                       }}
                     />
                 )}
   
                 <label>
                   <input
                     type="checkbox"
                     checked={subchapterStart}
                     disabled={chapterStart}   // locked if a chapter also starts here
                     onChange={(e) => updateItem(idx, { subchapterStart: e.target.checked })}
                   />
                   &nbsp;Start of sub-chapter
                 </label>
   
                 {(subchapterStart || chapterStart) && (   /* chapterStart forces this true */
                   <input
                     type="text"
                     placeholder="Sub-chapter name"
                     value={subchapterName}
                     onChange={(e) => updateItem(idx, { subchapterName: e.target.value })}
                     style={{ paddingLeft: 8 }}
                   />
                 )}
               </fieldset>
   
               {/* Download URL as before ***********************************************/}
                 <code
    style={{
      fontSize: '0.8rem',
      wordBreak: 'break-all',
      background: '#222',
      padding: '0.5rem',
      border: '1px solid #444',
      borderRadius: 4,
    }}
               >
                 <a href={src} target="_blank" rel="noopener noreferrer">
                   {src}
                 </a>
               </code>
             </div>
           </details>
         ))}
   
         {/* Submit *********************************************************************/}
         <button
           type="button"
           disabled={saving}
           style={{
             padding: '0.75rem 1.25rem',
             fontWeight: 600,
             borderRadius: 4,
             border: 'none',
             background: saving ? '#ccc' : '#1976d2',
             color: '#fff',
             cursor: saving ? 'default' : 'pointer',
             marginTop: '1rem',
             alignSelf: 'flex-start',
           }}
           onClick={handleSubmit}
         >
           {saving ? 'Saving…' : 'Submit to Firestore'}
         </button>
       </div>
     );
   }
   
   export default SliceViewer;