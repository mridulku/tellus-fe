import React, { useState } from 'react';

const flowSteps = [
  { id: 1, title: "Landing Page" },
  { id: 2, title: "Sign-Up Flow" },
  { id: 3, title: "Sign-In Flow" },
  { id: 4, title: "Onboarding Carousel" },
  { id: 5, title: "Upload Book Modal" },
  { id: 6, title: "Book Upload Processing" },
  { id: 7, title: "Creation of Adaptive Plan" },
  { id: 8, title: "User Understanding (Process Explanation)" },
  { id: 9, title: "Initial Adaptive Session (Dashboard Overview)" },
  { id: 10, title: "Ability to Upload More Books" },
  { id: 11, title: "Browse Multiple Books" },
  { id: 12, title: "Communication of Value & Return Triggers" },
  { id: 13, title: "Aha Moment" },
  { id: 14, title: "Monetization Trigger (Payment)" },
  { id: 15, title: "Real Impact Realized" },
  { id: 16, title: "User Sharing & Viral Growth Loop" }
];

const landingPageDetails = [
  {
    title: "MVP Version - Bare Minimum for Launch",
    content:
      "The MVP version of the landing page should effectively convey four key elements: Problem, Solution, Novelty, and Impact. The design can be minimal, but it must ensure the clarity of the value proposition. The landing page should introduce the problem in a relatable manner, propose the adaptive learning tool as the solution, highlight the unique technological aspect, and communicate the transformative impact it offers. The CTA should be direct and compelling to drive user engagement."
  },
  {
    title: "Ultimate Vision - Long-Term Goal",
    content:
      "In its ultimate form, the landing page must cater to different user mental models. Users arriving from an ad should immediately see a clear, enticing value proposition that piques their interest. For those coming via word-of-mouth or recommendations, it should reaffirm credibility. The design should evolve to provide a frictionless, conversion-optimized experience. Ideally, the page should dynamically personalize content based on the user's origin (e.g., social media, forums, professional networks). Visuals and interactive elements should reinforce the problem-solving capability of the product."
  },
  {
    title: "Testing the Hypothesis - Ensuring the Right Direction",
    content: `The goal of early-stage testing is to validate if the landing page effectively communicates the product's value and resonates with the intended audience. Strategies include:
    - Observing user reactions and understanding whether they grasp the problem statement.
    - Conducting A/B testing on different content variations to see which version performs better.
    - Directly interviewing test users to gauge their expectations and whether they find the solution compelling.
    - Measuring engagement metrics such as CTA click-through rates, time spent on page, and bounce rates.
    - Setting a benchmark (e.g., 80% of users should relate to the problem, and at least 80% should feel inclined to explore the solution further). If these thresholds aren’t met, iterate on the messaging and design.`
  },
  {
    title: "Immediate Action Items - Next Steps",
    content: `To make the landing page effective in the short term, the following steps must be taken:
    1. **Brand Identity:** Add a logo and app icon to reinforce credibility.
    2. **Content Structure:** Refine the page structure to emphasize problem identification, solution articulation, technical uniqueness, and impact.
    3. **Explainer Video:** Create and embed a concise video demonstrating how the product works and what benefits it provides.
    4. **User Feedback Loop:** Start gathering feedback from early users and continuously iterate on the content and design.
    5. **Optimize CTA:** Ensure the call-to-action is clear and incentivizes users to take the next step, whether it’s signing up, watching a demo, or exploring further.`
  }
];

const signUpFlowDetails = [
    {
      title: "Ultimate Appearance - Sign-Up Flow",
      content: `The sign-up flow should eventually match the aesthetic of the landing page...`
    },
    {
      title: "Immediate Enhancements - Current Focus",
      content: `The following improvements are necessary:
        - Google Button Integration...
        - Session Management...
        - Loading Indicator...
        - User Data Handling...`
    }
  ];


  const signInFlowDetails = [
    {
      title: "Task to do",
      content: `Combined with Sign-Up Flow`
    }
  ];

  const onboardingCarouselDetails = [
    {
      title: "MVP Version - Bare Minimum for Launch",
      content:
        "The MVP version of the onboarding carousel should offer a straightforward, static series of slides that introduce the product’s key features and benefits. It should be simple, easy to navigate, and ensure that new users quickly grasp the core value proposition."
    },
    {
      title: "Ultimate Vision - Long-Term Goal",
      content:
        "The ultimate version of the onboarding carousel will evolve into an immersive, interactive experience that adapts to user behavior. It could include dynamic animations, personalized content, and interactive elements that guide the user seamlessly through the onboarding process, ultimately deepening engagement with the product."
    },
    {
      title: "Testing the Hypothesis - Ensuring the Right Direction",
      content: `To validate the onboarding carousel’s effectiveness, consider the following:
  - Conduct user testing sessions to observe how easily users understand and navigate the carousel.
  - Collect qualitative feedback via interviews or surveys regarding clarity and engagement.
  - Analyze key metrics such as time spent per slide and completion rates.
  - Use these insights to adjust content, layout, and interactive elements until the intended experience is achieved.`
    },
    {
      title: "Immediate Action Items - Next Steps",
      content: `For the immediate rollout, focus on:
  - Presenting the carousel in a clear, discussion-friendly format during user interviews.
  - Using early feedback to refine navigation cues and content clarity.
  - Establishing a baseline for user engagement before investing in full interactivity.
  This approach ensures that you iteratively improve the experience based on real user insights.`
    }
  ];

// Mapping each step id to its corresponding details array (if available)
const stepDetailsMapping = {
    1: landingPageDetails,
    2: signUpFlowDetails,
    3: signInFlowDetails,
    4: onboardingCarouselDetails,

    // Add more mappings as needed, e.g., 3: signInFlowDetails, etc.
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
      marginBottom: "1rem",
      fontSize: "1.5rem",
      fontWeight: "bold"
    },
    stepContainer: {
      display: "flex",
      alignItems: "center",
      marginBottom: "1rem"
    },
    stepCircle: {
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "#444",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "1rem",
      fontSize: "0.9rem",
      color: "#fff"
    },
    stepTitle: {
      fontSize: "1rem",
      flex: 1
    },
    arrow: {
      textAlign: "center",
      margin: "0.5rem 0",
      fontSize: "1.2rem",
      color: "#888"
    }
  };
  
  export default function ProductFlowDiagram() {
    const [openSections, setOpenSections] = useState({});
  
    const toggleSection = (key) => {
      setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };
  
    return (
      <div style={styles.container}>
        <div style={styles.header}>Product Flow Overview</div>
        {flowSteps.map((step, index) => (
          <div key={step.id}>
            <div style={styles.stepContainer}>
              <div style={styles.stepCircle}>{step.id}</div>
              <div style={styles.stepTitle}>{step.title}</div>
            </div>
            {/* Dynamically render details if they exist for the current step */}
            {stepDetailsMapping[step.id] &&
              stepDetailsMapping[step.id].map((section, idx) => {
                const key = `${step.id}-${idx}`;
                return (
                  <div key={key}>
                    <div
                      style={{
                        cursor: "pointer",
                        fontWeight: "bold",
                        padding: "0.5rem",
                        backgroundColor: "#333",
                        borderRadius: "4px",
                        marginBottom: "0.5rem"
                      }}
                      onClick={() => toggleSection(key)}
                    >
                      {section.title}
                    </div>
                    {openSections[key] && (
                      <div style={{ padding: "0.5rem", backgroundColor: "#444", borderRadius: "4px" }}>
                        {section.content}
                      </div>
                    )}
                  </div>
                );
              })}
            {index < flowSteps.length - 1 && <div style={styles.arrow}>↓</div>}
          </div>
        ))}
      </div>
    );
  }