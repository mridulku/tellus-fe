import React, { useState } from 'react';

// --- Data Definitions ---

const timelinePitchingDetails = [
  {
    title: "Investor Research",
    content:
      "Aggregate data about different investors from various sources, compile lists, and evaluate investor profiles to identify the best fit."
  },
  {
    title: "Pitch Creation",
    content:
      "Develop a compelling pitch deck, refine messaging, and tailor the content to address investor pain points and market opportunities."
  },
  {
    title: "Outreach",
    content:
      "Reach out via emails, calls, networking events, and online platforms to schedule pitch meetings with prospective investors."
  },
  {
    title: "Interviews & Feedback",
    content:
      "Conduct pitch meetings, gather feedback from investors, and iterate on the pitch deck to improve clarity and impact."
  },
  {
    title: "Qualification Check",
    content:
      "Assess if key performance metrics and prerequisites are met before formally asking for funding."
  }
];

const qualificationMetrics = [
  {
    title: "User Growth",
    content:
      "Achieve a target of 10K active users within the first 6 months to demonstrate market traction."
  },
  {
    title: "Revenue Milestones",
    content:
      "Reach a monthly revenue of $50K to validate the business model and operational scalability."
  },
  {
    title: "Market Penetration",
    content:
      "Secure at least 5 strategic partnerships or pilot projects to confirm market interest."
  }
];

const fundsNeededDetails = [
  {
    title: "Initial Seed",
    content:
      "Aim to raise $500K to cover product development, initial marketing, and operational costs for market entry."
  },
  {
    title: "Scaling Investment",
    content:
      "Post milestone achievement, target a Series A round of $2M to scale operations, expand the team, and increase market reach."
  }
];

const monetizationPotential = [
  {
    title: "Revenue Streams",
    content:
      "Plan to generate income through subscriptions, in-app purchases, advertising, and strategic partnerships."
  },
  {
    title: "Market Opportunity",
    content:
      "Tapping into a large addressable market in the edtech sector with proven growth trends."
  },
  {
    title: "User Acquisition",
    content:
      "Leverage data-driven digital marketing and organic community-building to optimize customer acquisition costs."
  }
];

const pitchDeckDetails = [
  {
    title: "Problem Statement",
    content:
      "Clearly articulate the market gap and pain points that your product addresses. Explain the urgency and the impact of the problem on potential users."
  },
  {
    title: "Solution",
    content:
      "Detail how your product uniquely solves the problem. Outline the core features, benefits, and the technology that underpins your solution."
  },
  {
    title: "Unique Value Proposition",
    content:
      "Highlight what sets your product apart from competitors. Showcase your innovative approach, market differentiation, and competitive edge."
  },
  {
    title: "Technical Differentiation",
    content:
      "Provide an overview of your proprietary technology, scalability potential, and how it offers a sustainable competitive advantage."
  }
];

// Grouping all sections into one structured array.
// The "isTabbed" flag on the Pitch Deck section triggers a tabbed interface.
const pitchingSections = [
  {
    id: "timeline",
    title: "Timeline of Pitching",
    details: timelinePitchingDetails
  },
  {
    id: "metrics",
    title: "Qualification Metrics",
    details: qualificationMetrics
  },
  {
    id: "funds",
    title: "Funds Needed",
    details: fundsNeededDetails
  },
  {
    id: "monetization",
    title: "Monetization Potential",
    details: monetizationPotential
  },
  {
    id: "pitchdeck",
    title: "Pitch Deck",
    details: pitchDeckDetails,
    isTabbed: true
  }
];

// --- Styling ---
const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#0F0F0F",
    borderRadius: "8px",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    fontWeight: "bold"
  },
  section: {
    marginBottom: "2rem",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "1rem"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "0.75rem"
  },
  detailItem: {
    cursor: "pointer",
    fontWeight: "bold",
    padding: "0.5rem",
    backgroundColor: "#333",
    borderRadius: "4px",
    marginBottom: "0.5rem"
  },
  detailContent: {
    padding: "0.5rem",
    backgroundColor: "#444",
    borderRadius: "4px",
    marginBottom: "0.5rem"
  },
  tabContainer: {
    display: "flex",
    marginBottom: "1rem"
  },
  tabButton: (active) => ({
    cursor: "pointer",
    padding: "0.5rem 1rem",
    backgroundColor: active ? "#333" : "#444",
    marginRight: "0.5rem",
    borderRadius: "4px"
  })
};

// --- React Component ---
export default function PitchingDashboard() {
  // Manage open state for accordion details
  const [openSections, setOpenSections] = useState({});
  // Manage active tab for tabbed sections (by section id)
  const [activeTabs, setActiveTabs] = useState({});

  const toggleSection = (sectionId, idx) => {
    const key = `${sectionId}-${idx}`;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabChange = (sectionId, tabIndex) => {
    setActiveTabs((prev) => ({ ...prev, [sectionId]: tabIndex }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Fundraising & Pitching Dashboard</div>
      {pitchingSections.map((section) => (
        <div key={section.id} style={styles.section}>
          <div style={styles.sectionTitle}>{section.title}</div>
          {section.isTabbed ? (
            <>
              <div style={styles.tabContainer}>
                {section.details.map((detail, idx) => {
                  const isActive = (activeTabs[section.id] ?? 0) === idx;
                  return (
                    <div
                      key={idx}
                      style={styles.tabButton(isActive)}
                      onClick={() => handleTabChange(section.id, idx)}
                    >
                      {detail.title}
                    </div>
                  );
                })}
              </div>
              <div style={styles.detailContent}>
                {section.details[activeTabs[section.id] ?? 0].content}
              </div>
            </>
          ) : (
            section.details.map((detail, idx) => {
              const key = `${section.id}-${idx}`;
              return (
                <div key={key}>
                  <div
                    style={styles.detailItem}
                    onClick={() => toggleSection(section.id, idx)}
                  >
                    {detail.title}
                  </div>
                  {openSections[key] && (
                    <div style={styles.detailContent}>
                      {detail.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}