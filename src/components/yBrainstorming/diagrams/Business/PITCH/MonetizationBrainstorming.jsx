import React, { useState } from 'react';

const monetizationSections = [
  {
    id: "timingMechanisms",
    title: "Monetization Timing & Mechanisms",
    details: [
      { 
        title: "When to Monetize", 
        content: "Decide the optimal point at which to introduce monetization. For example, after significant engagement or when a key milestone is reached. Analyze user behavior and product usage data to identify that tipping point." 
      },
      { 
        title: "Monetization Mechanisms", 
        content: "Options include subscriptions, in-app purchases, freemium upgrades, ads, or one-time payments. Evaluate which mechanism best aligns with your product's value and user expectations." 
      },
      { 
        title: "User Psychology", 
        content: "Understand triggers that prompt users to pay. Consider factors such as perceived value, trust, urgency, and the presentation of the offer. Use insights to design nudges that encourage conversion." 
      }
    ]
  },
  {
    id: "userSegmentation",
    title: "User Segmentation & Pricing Strategy",
    details: [
      { 
        title: "User Types & Willingness to Pay", 
        content: "Segment users by behavior and demographics. Estimate pricing tiers for various segments (e.g., basic, premium, enterprise) and gauge what each group is likely to pay." 
      },
      { 
        title: "Pricing Models", 
        content: "Consider models such as subscription, pay-per-use, or one-time purchase. Compare market standards and competitor pricing to find a balance that maximizes conversion without sacrificing perceived value." 
      }
    ]
  },
  {
    id: "costAnalysis",
    title: "Cost Analysis & Financial Metrics",
    details: [
      { 
        title: "Customer Acquisition Cost (CAC)", 
        content: "Calculate the cost of acquiring a new user by including marketing, sales, and onboarding expenses. This metric is crucial for setting pricing and assessing ROI." 
      },
      { 
        title: "Lifetime Value (LTV)", 
        content: "Estimate the revenue per user over the lifetime of their relationship with the product. Comparing LTV with CAC will inform your sustainability and growth strategies." 
      },
      { 
        title: "Operational Costs", 
        content: "Break down costs such as token expenses, server costs, and marketing spend. Quantify these on a per-user basis to understand overall profitability." 
      }
    ]
  },
  {
    id: "conversionMetrics",
    title: "Conversion & Retention Metrics",
    details: [
      { 
        title: "Conversion Rates", 
        content: "Determine the percentage of free users who convert to paid. Use historical data or industry benchmarks to set realistic conversion targets." 
      },
      { 
        title: "Drop-Off & Retention Rates", 
        content: "Measure the drop-off rates at various stages of the user journey and track retention percentages. Identify critical points where users churn and adjust your strategy accordingly." 
      }
    ]
  },
  {
    id: "strategyTactics",
    title: "Monetization Strategies & Nudging Tactics",
    details: [
      { 
        title: "Nudging Strategies", 
        content: "Employ tactics like limited-time offers, free trials, loyalty programs, and personalized messaging to encourage users to convert." 
      },
      { 
        title: "Segmented Strategies", 
        content: "Develop tailored strategies for different user segments. For example, premium users might receive exclusive offers while casual users could benefit from introductory discounts." 
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
    maxWidth: "900px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "1.5rem"
  },
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

export default function MonetizationBrainstorming() {
  const [openSections, setOpenSections] = useState({});

  const toggleDetail = (sectionId, detailIndex) => {
    const key = `${sectionId}-${detailIndex}`;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Monetization Brainstorming</div>
      {monetizationSections.map((section) => (
        <div key={section.id} style={styles.sectionCard}>
          <div style={styles.sectionTitle}>{section.title}</div>
          {section.details.map((detail, idx) => {
            const key = `${section.id}-${idx}`;
            return (
              <div key={key}>
                <div
                  style={styles.detailItem}
                  onClick={() => toggleDetail(section.id, idx)}
                >
                  {detail.title}
                </div>
                {openSections[key] && (
                  <div style={styles.detailContent}>{detail.content}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}