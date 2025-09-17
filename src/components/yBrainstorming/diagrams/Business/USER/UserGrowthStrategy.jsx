import React, { useState } from 'react';

const growthSections = [
  {
    id: 'virality',
    title: "Virality & Referral",
    details: [
      { 
        title: "Referral Program", 
        content: "Implement a robust referral system that rewards both the referrer and the referred. Consider incentives such as discounts, free premium features, or bonus content to motivate sharing." 
      },
      { 
        title: "Social Sharing", 
        content: "Integrate social sharing buttons at key engagement points. Encourage users to share their achievements, success stories, or milestones on platforms like Facebook, Twitter, and Instagram." 
      },
      { 
        title: "Word-of-Mouth", 
        content: "Leverage community building, testimonials, and user success stories. Host events, webinars, or local meetups to foster organic recommendations and trust among potential users." 
      }
    ]
  },
  {
    id: 'onlineMarketing',
    title: "Online Marketing & Collaborations",
    details: [
      { 
        title: "Digital Advertising", 
        content: "Utilize targeted ads on Google, Facebook, LinkedIn, and other platforms to reach prospective learners. Continuously test and optimize your campaigns based on conversion data." 
      },
      { 
        title: "Content Marketing", 
        content: "Develop SEO-optimized content, educational blogs, webinars, and video tutorials that build authority and drive organic traffic to your platform." 
      },
      { 
        title: "Influencer & Partnership", 
        content: "Collaborate with educators, industry experts, and influencers. Leverage guest posts, joint webinars, and co-branded content to expand your reach and credibility." 
      }
    ]
  },
  {
    id: 'growthLoop',
    title: "User Growth Loop & Retention",
    details: [
      { 
        title: "Growth Loop Optimization", 
        content: "Design a seamless user journey where every touchpoint—from sign-up to continued engagement—reinforces the growth loop. Identify and optimize key engagement triggers." 
      },
      { 
        title: "Retention Strategies", 
        content: "Implement retention tactics such as gamification, loyalty rewards, and personalized notifications to maintain user engagement and reduce churn." 
      },
      { 
        title: "Analytics & Feedback", 
        content: "Continuously monitor KPIs such as CAC, LTV, churn rate, and user engagement metrics. Use user feedback to iterate on your strategies and optimize the growth loop." 
      }
    ]
  }
];

const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#0F0F0F',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem'
  },
  sectionCard: {
    border: '1px solid #444',
    borderRadius: '4px',
    marginBottom: '1.5rem',
    padding: '1rem'
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem'
  },
  detailItem: {
    cursor: 'pointer',
    padding: '0.5rem',
    backgroundColor: '#333',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },
  detailContent: {
    padding: '0.5rem',
    backgroundColor: '#444',
    borderRadius: '4px',
    marginBottom: '0.75rem'
  }
};

export default function UserGrowthStrategy() {
  const [openDetails, setOpenDetails] = useState({});

  const toggleDetail = (sectionId, index) => {
    const key = `${sectionId}-${index}`;
    setOpenDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>User Growth Strategy</div>
      {growthSections.map(section => (
        <div key={section.id} style={styles.sectionCard}>
          <div style={styles.sectionTitle}>{section.title}</div>
          {section.details.map((detail, index) => {
            const key = `${section.id}-${index}`;
            return (
              <div key={key}>
                <div 
                  style={styles.detailItem} 
                  onClick={() => toggleDetail(section.id, index)}
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
      ))}
    </div>
  );
}