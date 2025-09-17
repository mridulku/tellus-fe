import React, { useState } from 'react';

const analyticsSections = [
  {
    id: "userEngagement",
    title: "User Engagement",
    details: [
      {
         title: "Daily & Monthly Active Users",
         content: "Chart or metrics showing DAU and MAU trends over time. (Placeholder for interactive chart or KPI display)"
      },
      {
         title: "Session Duration & Bounce Rate",
         content: "Metrics detailing average session lengths and bounce rates. (Placeholder for interactive chart or KPI display)"
      }
    ]
  },
  {
    id: "learningOutcomes",
    title: "Learning Outcomes",
    details: [
      {
         title: "Quiz & Test Performance",
         content: "Metrics on average scores, pass rates, and improvement trends. (Placeholder for interactive chart or KPI display)"
      },
      {
         title: "Content Interaction",
         content: "Insights on how learners interact with adaptive content, including completion rates and engagement. (Placeholder for interactive chart or KPI display)"
      }
    ]
  },
  {
    id: "revenue",
    title: "Revenue & Monetization",
    details: [
      {
         title: "Conversion Rates & LTV",
         content: "Analysis of free-to-paid conversion rates, customer lifetime value, and revenue per user. (Placeholder for interactive chart or KPI display)"
      },
      {
         title: "Cost & ROI Analysis",
         content: "Metrics on customer acquisition cost, marketing ROI, and revenue projections. (Placeholder for interactive chart or KPI display)"
      }
    ]
  },
  {
    id: "technicalPerformance",
    title: "Technical Performance",
    details: [
      {
         title: "API Performance Metrics",
         content: "Charts and metrics on API response times, error rates, and uptime. (Placeholder for interactive chart or KPI display)"
      },
      {
         title: "Server & Infrastructure",
         content: "Analysis of server load, resource usage, and scalability metrics. (Placeholder for interactive chart or KPI display)"
      }
    ]
  }
];

const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#0F0F0F",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1000px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "1.5rem"
  },
  tabContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem"
  },
  tabButton: (active) => ({
    cursor: "pointer",
    padding: "0.5rem 1rem",
    backgroundColor: active ? "#333" : "#444",
    margin: "0 0.5rem",
    borderRadius: "4px"
  }),
  sectionCard: {
    border: "1px solid #444",
    borderRadius: "4px",
    marginBottom: "1.5rem",
    padding: "1rem"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "0.75rem"
  },
  detailItem: {
    cursor: "pointer",
    padding: "0.5rem",
    backgroundColor: "#333",
    borderRadius: "4px",
    marginBottom: "0.5rem",
    fontWeight: "bold"
  },
  detailContent: {
    padding: "0.5rem",
    backgroundColor: "#444",
    borderRadius: "4px",
    marginBottom: "0.75rem"
  }
};

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState(analyticsSections[0].id);
  const [openDetails, setOpenDetails] = useState({});

  const toggleDetail = (sectionId, index) => {
    const key = `${sectionId}-${index}`;
    setOpenDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSection = analyticsSections.find(section => section.id === activeTab);

  return (
    <div style={styles.container}>
      <div style={styles.header}>Analytics & API Dashboard</div>
      <div style={styles.tabContainer}>
        {analyticsSections.map(section => (
          <div 
            key={section.id} 
            style={styles.tabButton(activeTab === section.id)}
            onClick={() => setActiveTab(section.id)}
          >
            {section.title}
          </div>
        ))}
      </div>
      {activeSection && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>{activeSection.title}</div>
          {activeSection.details.map((detail, idx) => {
            const key = `${activeSection.id}-${idx}`;
            return (
              <div key={key}>
                <div 
                  style={styles.detailItem}
                  onClick={() => toggleDetail(activeSection.id, idx)}
                >
                  {detail.title}
                </div>
                {openDetails[key] && (
                  <div style={styles.detailContent}>
                    {detail.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}