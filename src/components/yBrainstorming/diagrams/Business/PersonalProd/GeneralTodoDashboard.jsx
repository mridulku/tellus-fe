import React, { useState } from 'react';

const todosData = [
  {
    id: 1,
    category: "User",
    target: "Onboard at least 1 user",
    tasks: [
      "Go to the library and talk to people",
      "Post at relevant channels or groups",
      "Engage early adopters for feedback"
    ]
  },
  {
    id: 2,
    category: "Product",
    target: "Ensure end-to-end functionality",
    tasks: [
      "Test core features from signup to usage",
      "Identify and document pain points",
      "Plan iteration for tailored experience"
    ]
  },
  {
    id: 3,
    category: "Fundraising",
    target: "No clear goal defined yet",
    tasks: [
      "Monitor potential investor feedback",
      "Prepare preliminary pitch materials"
    ]
  },
  {
    id: 4,
    category: "Tech",
    target: "Focus on robust product development",
    tasks: [
      "Ensure code quality and scalability",
      "Integrate automated testing",
      "Optimize performance for core features"
    ]
  }
];

const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#0F0F0F",
    borderRadius: "8px",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    maxWidth: "600px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    fontWeight: "bold"
  },
  categoryCard: {
    border: "1px solid #444",
    borderRadius: "4px",
    marginBottom: "1rem",
    padding: "1rem"
  },
  categoryTitle: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    cursor: "pointer"
  },
  categoryTarget: {
    fontStyle: "italic",
    marginBottom: "0.75rem"
  },
  taskItem: {
    padding: "0.5rem",
    backgroundColor: "#333",
    borderRadius: "4px",
    marginBottom: "0.5rem"
  }
};

export default function GeneralTodoDashboard() {
  const [openCategories, setOpenCategories] = useState({});

  const toggleCategory = (id) => {
    setOpenCategories((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>General To-Do Dashboard</div>
      {todosData.map((todo) => (
        <div key={todo.id} style={styles.categoryCard}>
          <div style={styles.categoryTitle} onClick={() => toggleCategory(todo.id)}>
            {todo.category}
          </div>
          <div style={styles.categoryTarget}>
            Target: {todo.target}
          </div>
          {openCategories[todo.id] &&
            todo.tasks.map((task, idx) => (
              <div key={idx} style={styles.taskItem}>
                {task}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}