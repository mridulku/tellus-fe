import React, { useState } from 'react';

const userOutreachPitchDetails = {
  offline: [
    {
      title: "Approach Strategy",
      content:
        "Plan to visit local libraries, community centers, cafes, and other public spaces where potential users gather. Prepare a friendly and concise pitch to introduce the product's benefits and invite feedback."
    },
    {
      title: "Pitch Content & Expectations",
      content:
        "Clearly communicate the value proposition. Explain how the product addresses common pain points and what benefits users can expect. Set realistic expectations and gather immediate feedback."
    },
    {
      title: "Onboarding Process",
      content:
        "Offer immediate sign-up options, such as paper forms or mobile demos. Provide a quick demo of the product and ensure that users leave with a clear understanding of how to start using it."
    }
  ],
  online: [
    {
      title: "Content Strategy",
      content:
        "Identify and utilize key online channels (social media, forums, and community groups) to post engaging content. Craft posts that highlight product features, benefits, and user testimonials."
    },
    {
      title: "Engagement & Follow-Up",
      content:
        "Encourage users to sign up through embedded forms and provide their email addresses for follow-up. Monitor responses closely and use personalized emails or direct messages to maintain engagement."
    },
    {
      title: "Feedback Collection",
      content:
        "Incorporate quick surveys and feedback forms in posts or follow-up communications. Analyze the responses to refine your pitch and improve both the online engagement strategy and the onboarding process."
    }
  ]
};

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
  }),
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
  }
};

export default function UserOutreachPitch() {
  const [activeTab, setActiveTab] = useState("offline");
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (category, idx) => {
    const key = `${category}-${idx}`;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = ["offline", "online"];

  return (
    <div style={styles.container}>
      <div style={styles.header}>User Outreach Pitch</div>
      <div style={styles.tabContainer}>
        {tabs.map((tab) => (
          <div
            key={tab}
            style={styles.tabButton(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>
      {userOutreachPitchDetails[activeTab].map((detail, idx) => {
        const key = `${activeTab}-${idx}`;
        return (
          <div key={key}>
            <div
              style={styles.detailItem}
              onClick={() => toggleSection(activeTab, idx)}
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
      })}
    </div>
  );
}