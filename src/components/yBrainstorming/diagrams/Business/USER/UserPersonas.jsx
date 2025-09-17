import React, { useState } from 'react';

const userPersonas = [
  {
    id: 'academic',
    title: "Academic Learners",
    description: "Engaged in formal education (K–12 & College) with structured routines, exam-driven preparation, and resource-dependent learning.",
    sections: [
      { 
        title: "Daily Routine", 
        content: "Outline the structured day: scheduled classes, study sessions, homework, extracurricular activities, and rest periods. Identify how these time blocks affect their learning pace and stress levels." 
      },
      { 
        title: "Preparation & Goals", 
        content: "Detail what they are preparing for (exams, assignments, college admissions), their short- and long-term academic goals, and how success is measured (grades, test scores, project outcomes)." 
      },
      { 
        title: "Resources & Tools", 
        content: "List current resources such as textbooks, online courses, tutoring sessions, digital study aids, and classroom tools. Consider accessibility, cost, and effectiveness." 
      },
      { 
        title: "Challenges & Pain Points", 
        content: "Identify common issues: exam stress, time management problems, comprehension difficulties, and external pressures from academia. Highlight what triggers anxiety and disengagement." 
      },
      { 
        title: "Financial & Performance Metrics", 
        content: "Estimate typical spending on educational tools, tuition, tutoring, and materials. Note performance metrics like GPA, standardized test scores, and progress tracking." 
      },
      { 
        title: "Product Fit & Differentiation", 
        content: "Examine how your adaptive learning product can uniquely address these needs—through personalized study plans, interactive content, and performance feedback that stands out from traditional methods." 
      }
    ]
  },
  {
    id: 'vocational',
    title: "Vocational Learners",
    description: "Focused on skill-based education and trades, these learners seek practical training, certifications, and job readiness through hands-on experience.",
    sections: [
      { 
        title: "Daily Routine", 
        content: "Describe a typical day including on-the-job training, practical workshops, and balancing work with learning. Emphasize real-world applications and skill practice." 
      },
      { 
        title: "Preparation & Goals", 
        content: "Define the goals—acquiring certifications, gaining specific job skills, and building a portfolio. Outline milestones like practical exams and industry-standard assessments." 
      },
      { 
        title: "Resources & Tools", 
        content: "List available resources: vocational courses, apprenticeships, online tutorials, workshops, and toolkits. Note any limitations in access or quality." 
      },
      { 
        title: "Challenges & Pain Points", 
        content: "Highlight issues like limited access to hands-on training, balancing work-study demands, financial constraints, and the pressure to quickly acquire marketable skills." 
      },
      { 
        title: "Financial & Performance Metrics", 
        content: "Include costs related to certifications, course fees, and equipment. Also, track success through job placements, skill assessments, and industry-recognized qualifications." 
      },
      { 
        title: "Product Fit & Differentiation", 
        content: "Discuss how your product can simulate real-world tasks, offer on-demand practical modules, and integrate feedback to bridge gaps in conventional vocational training." 
      }
    ]
  },
  {
    id: 'casual',
    title: "Casual Learners",
    description: "Self-motivated individuals learning for personal growth and enrichment, often with flexible schedules and diverse interests.",
    sections: [
      { 
        title: "Daily Routine", 
        content: "Illustrate a flexible, unstructured routine with sporadic learning sessions, learning on the go, and integrating learning with daily life activities." 
      },
      { 
        title: "Preparation & Goals", 
        content: "Focus on personal interests and self-improvement rather than formal achievements. Goals might include acquiring a new skill, exploring a hobby, or general knowledge enhancement." 
      },
      { 
        title: "Resources & Tools", 
        content: "Mention informal resources such as YouTube tutorials, blogs, podcasts, free online courses, and community forums. Evaluate their ease-of-access and relevance." 
      },
      { 
        title: "Challenges & Pain Points", 
        content: "Identify struggles with consistency, lack of structure, and difficulty measuring progress. Consider the impact of a busy lifestyle and competing interests." 
      },
      { 
        title: "Financial & Performance Metrics", 
        content: "Often minimal monetary investment; success may be measured by personal satisfaction, qualitative growth, or achieving a new hobby milestone." 
      },
      { 
        title: "Product Fit & Differentiation", 
        content: "Explain how your product can offer engaging, bite-sized learning experiences, flexible scheduling, and personalized recommendations that keep casual learners motivated." 
      }
    ]
  },
  {
    id: 'competitive',
    title: "Competitive Exam Learners",
    description: "Intensively preparing for competitive exams (SAT, GRE, etc.), these learners follow rigorous study plans focused on high performance and measurable outcomes.",
    sections: [
      { 
        title: "Daily Routine", 
        content: "Outline a strict, disciplined schedule involving multiple study sessions, timed practice tests, and regular coaching or group study sessions." 
      },
      { 
        title: "Preparation & Goals", 
        content: "Concentrate on achieving high scores, mastering subject matter, and excelling in practice tests. Goals are quantifiable—target scores, percentile improvements, and rank advancements." 
      },
      { 
        title: "Resources & Tools", 
        content: "Include structured resources like coaching centers, specialized test prep courses, online mock tests, and curated study materials." 
      },
      { 
        title: "Challenges & Pain Points", 
        content: "Address issues such as exam pressure, stress from intense competition, information overload, and burnout from prolonged study sessions." 
      },
      { 
        title: "Financial & Performance Metrics", 
        content: "Track significant investments in coaching fees, exam registration costs, and other preparatory expenses. Performance is measured through mock test scores and actual exam results." 
      },
      { 
        title: "Product Fit & Differentiation", 
        content: "Showcase how your adaptive learning app can offer targeted practice, stress-management resources, and real-time performance feedback to improve exam readiness." 
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
  personaCard: {
    border: "1px solid #444",
    borderRadius: "4px",
    marginBottom: "1.5rem",
    padding: "1rem"
  },
  personaTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "0.5rem"
  },
  personaDescription: {
    fontSize: "1rem",
    fontStyle: "italic",
    marginBottom: "1rem"
  },
  sectionItem: {
    cursor: "pointer",
    padding: "0.5rem",
    backgroundColor: "#333",
    borderRadius: "4px",
    marginBottom: "0.5rem",
    fontWeight: "bold"
  },
  sectionContent: {
    padding: "0.5rem",
    backgroundColor: "#444",
    borderRadius: "4px",
    marginBottom: "0.75rem"
  }
};

export default function UserPersonas() {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (personaId, sectionIndex) => {
    const key = `${personaId}-${sectionIndex}`;
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>User Personas</div>
      {userPersonas.map(persona => (
        <div key={persona.id} style={styles.personaCard}>
          <div style={styles.personaTitle}>{persona.title}</div>
          <div style={styles.personaDescription}>{persona.description}</div>
          {persona.sections.map((section, index) => {
            const key = `${persona.id}-${index}`;
            return (
              <div key={key}>
                <div style={styles.sectionItem} onClick={() => toggleSection(persona.id, index)}>
                  {section.title}
                </div>
                {openSections[key] && (
                  <div style={styles.sectionContent}>
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}