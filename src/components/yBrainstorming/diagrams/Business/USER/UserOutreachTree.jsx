import React, { useState } from 'react';

// Redesigned data structure with separate buckets (tabs) per category
const outreachData = [
    {
      id: 1,
      category: "Academic Learners (K–12 & College)",
      channels: [
        {
          name: "Reddit",
          links: [
            "r/HighSchool",
            "r/HomeworkHelp",
            "r/College",
            "r/AcademicAdvice",
            "r/Students",
            "r/StudyTips",
            "r/AskAcademia",
            "r/Professors",
            "r/GradSchool",
            "r/Scholarships"
          ]
        },
        {
          name: "Discord",
          links: [
            "Homework Help Central",
            "Study Together",
            "Language Learning Community",
            "High School Tutoring",
            "College Friends",
            "STEM Study Group",
            "Humanities Hub",
            "Exam Prep Support",
            "Math Homework Help",
            "Science Enthusiasts"
          ]
        },
        {
          name: "Instagram",
          links: [
            "@studygram",
            "@studyblr",
            "@studytipsdaily",
            "@collegehacks",
            "@academicsuccess",
            "@studentlife",
            "@universitytips",
            "@examstressrelief",
            "@notetaking",
            "@onlinelearning"
          ]
        }
      ]
    },
    {
      id: 2,
      category: "Competitive Exam Learners",
      channels: [
        {
          name: "Reddit",
          links: [
            "r/SAT",
            "r/ACT",
            "r/MCAT",
            "r/LSAT",
            "r/GRE",
            "r/GMAT",
            "r/CPA",
            "r/BarExam",
            "r/USMLE",
            "r/CFA"
          ]
        },
        {
          name: "Discord",
          links: [
            "SAT Prep",
            "MCAT Study Group",
            "LSAT Unplugged",
            "GRE Prep Club",
            "GMAT Quantum",
            "CPA Exam Review",
            "Bar Exam Support",
            "USMLE Success",
            "CFA Level I Prep",
            "Exam Warriors"
          ]
        },
        {
          name: "Instagram",
          links: [
            "@satprep",
            "@mcatprep",
            "@lsatprep",
            "@greprep",
            "@gmatprep",
            "@cpaexam",
            "@barexam",
            "@usmleprep",
            "@cfaprep",
            "@examstrategy"
          ]
        }
      ]
    },
    {
      id: 3,
      category: "Vocational Learners",
      channels: [
        {
          name: "Reddit",
          links: [
            "r/learnprogramming",
            "r/webdev",
            "r/graphic_design",
            "r/ITCareerQuestions",
            "r/EngineeringStudents",
            "r/AskElectricians",
            "r/MechanicAdvice",
            "r/Culinary",
            "r/Carpentry",
            "r/Welding"
          ]
        },
        {
          name: "Discord",
          links: [
            "Coding Community",
            "Web Developers",
            "Graphic Design Hub",
            "IT Career Network",
            "Engineering Lounge",
            "Electrician's Guild",
            "Mechanic's Pit",
            "Culinary Arts",
            "Carpentry Crew",
            "Welding Workshop"
          ]
        },
        {
          name: "LinkedIn Groups",
          links: [
            "Software Developers Network",
            "Web Development Professionals",
            "Graphic Design Professionals",
            "IT Support Group",
            "Engineering Connections",
            "Electricians Network",
            "Automotive Technicians",
            "Culinary Professionals",
            "Carpentry Experts",
            "Welding Professionals"
          ]
        }
      ]
    },
    {
      id: 4,
      category: "Casual Learners",
      channels: [
        {
          name: "Reddit",
          links: [
            "r/IWantToLearn",
            "r/selfimprovement",
            "r/DIY",
            "r/LifeProTips",
            "r/learnsomething",
            "r/TodayILearned",
            "r/HowTo",
            "r/DecidingToBeBetter",
            "r/GetMotivated",
            "r/Art"
          ]
        },
        {
          name: "Discord",
          links: [
            "Study Together",
            "Self-Improvement Community",
            "DIY Enthusiasts",
            "Life Hacks",
            "Learn Something New",
            "Motivation Station",
            "Art & Design",
            "Music Lovers",
            "Language Exchange",
            "Book Club"
          ]
        },
        {
          name: "YouTube Channels",
          links: [
            "CrashCourse",
            "TED-Ed",
            "AsapSCIENCE",
            "SmarterEveryDay",
            "Vsauce",
            "Khan Academy",
            "CGP Grey",
            "MinutePhysics",
            "The School of Life",
            "HowToBasic"
          ]
        },
        {
          name: "Facebook Groups",
          links: [
            "Self Improvement: Motivation & Inspiration",
            "DIY & Home Improvement",
            "Life Hacks & Tips",
            "Learn Something New Every Day",
            "Art and Drawing",
            "Music Enthusiasts",
            "Language Learners",
            "Book Lovers Club",
            "Cooking and Recipes",
            "Photography Enthusiasts"
          ]
        }
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
    marginBottom: "1rem",
    fontSize: "1.5rem",
    fontWeight: "bold"
  },
  categoryCard: {
    marginBottom: "1rem",
    padding: "0.5rem",
    border: "1px solid #444",
    borderRadius: "4px"
  },
  categoryTitle: {
    marginBottom: "0.5rem",
    fontSize: "1.2rem",
    fontWeight: "bold"
  },
  tabsContainer: {
    display: "flex",
    marginBottom: "0.5rem"
  },
  tabButton: (active) => ({
    cursor: "pointer",
    padding: "0.5rem 1rem",
    backgroundColor: active ? "#333" : "#444",
    marginRight: "0.5rem",
    borderRadius: "4px"
  }),
  linkItem: {
    padding: "0.25rem 0"
  }
};

export default function UserOutreachDiagram() {
  // Track active tab for each category by id
  const [activeTabs, setActiveTabs] = useState({});

  const handleTabChange = (categoryId, tabIndex) => {
    setActiveTabs((prev) => ({ ...prev, [categoryId]: tabIndex }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>User Outreach Summary</div>
      {outreachData.map((category) => {
        // Set the default active tab index to 0 if not set yet
        const activeTabIndex = activeTabs[category.id] ?? 0;
        return (
          <div key={category.id} style={styles.categoryCard}>
            <div style={styles.categoryTitle}>{category.category}</div>
            <div style={styles.tabsContainer}>
              {category.channels.map((channel, index) => (
                <div
                  key={index}
                  style={styles.tabButton(activeTabIndex === index)}
                  onClick={() => handleTabChange(category.id, index)}
                >
                  {channel.name}
                </div>
              ))}
            </div>
            <div>
              {category.channels[activeTabIndex].links.map((link, idx) => (
                <div key={idx} style={styles.linkItem}>
                  {link}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}