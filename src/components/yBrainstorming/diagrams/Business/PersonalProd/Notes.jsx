import React, { useState } from 'react';

// Static list of notes that you can update in the component code.
const staticNotes = [
  {
    id: 'id1',
    title: 'Note 1 Title',
    answer: 'This is the answer for note 1. Add details as needed.'
  },
  {
    id: 'id2',
    title: 'Note 2 Title',
    answer: 'This is the answer for note 2. Add details as needed.'
  },
  {
    id: 'id3',
    title: 'Note 3 Title',
    answer: 'This is the answer for note 3. Add details as needed.'
  }
  // Simply add more notes here as you need.
];

const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#0F0F0F",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto"
  },
  header: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    textAlign: "center"
  },
  noteCard: {
    border: "1px solid #444",
    borderRadius: "4px",
    marginBottom: "1rem",
    padding: "0.75rem"
  },
  noteTitle: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "0.5rem"
  },
  noteContent: {
    padding: "0.5rem",
    backgroundColor: "#333",
    borderRadius: "4px",
    marginTop: "0.5rem"
  }
};

export default function BrainstormingNotes() {
  const [openNotes, setOpenNotes] = useState({});

  const toggleNote = (id) => {
    setOpenNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Brainstorming Notes</div>
      {staticNotes.map((note) => (
        <div key={note.id} style={styles.noteCard}>
          <div style={styles.noteTitle} onClick={() => toggleNote(note.id)}>
            {note.title}
          </div>
          {openNotes[note.id] && (
            <div style={styles.noteContent}>
              {note.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}