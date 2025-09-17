import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux';
import { store } from './store/store';

/* -------------  add these four imports ------------- */
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';          // adjust path if yours differs
/* --------------------------------------------------- */

/* -------------  one‑time listener ------------------ */
onAuthStateChanged(auth, async (fbUser) => {
  if (!fbUser) return;

  const ref  = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const have = snap.exists() ? snap.data().examType : null;
  const want = sessionStorage.getItem('pendingExam');   // "UPSC", "CAT", …

  if (!have && want) {
    await setDoc(ref, { examType: want }, { merge: true });
  }

  sessionStorage.removeItem('pendingExam');
});
/* --------------------------------------------------- */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();