// src/components/BrainstormingList.jsx
import React, { useState, useEffect } from 'react';
import UserOutreachPitch from './diagrams/Business/USER/UserOutreachPitch';
import UserOutreachTree from './diagrams/Business/USER/UserOutreachTree';
import GeneralTodoDashboard from './diagrams/Business/PersonalProd/GeneralTodoDashboard';
import ProductFlowDiagram from './diagrams/Business/PRODUCT/ProductFlowDiagram';
import PitchingDashboard from './diagrams/Business/PITCH/PitchingDashboard';
import UserInterviewFeedback from './diagrams/Business/USER/UserInterviewFeedback';
import Notes from './diagrams/Business/PersonalProd/Notes';
import MonetizationBrainstorming from './diagrams/Business/PITCH/MonetizationBrainstorming';
import UserGrowthStrategy from './diagrams/Business/USER/UserGrowthStrategy';
import AnalyticsDashboard from './diagrams/Business/PRODUCT/AnalyticsDashboard';
import UserPersonas from './diagrams/Business/USER/UserPersonas';
import TimeLogger from './diagrams/Business/PersonalProd/TimeLogger';
import FlowGeneratePlan from './diagrams/TechFlowCharts/FlowGeneratePlan';
import FlowChild2 from './diagrams/TechFlowCharts/FlowChild2';
import FlowReduxPlan from './diagrams/TechFlowCharts/FlowReduxPlan';
import FlowDashboard from './diagrams/TechFlowCharts/FlowDashboard';
import HomeComponentsNodes from './diagrams/TechFlowCharts/FlowHomeComponentsNodes';
import FlowMaterialDashboard from './diagrams/TechFlowCharts/FlowMaterialDashboard';
import FlowPreLogin from './diagrams/TechFlowCharts/FlowPreLogin';
import FlowUpload from './diagrams/TechFlowCharts/FlowUpload';
import FlowProfile from './diagrams/TechFlowCharts/FlowProfile';
import FlowContentPipeline from './diagrams/TechFlowCharts/FlowContentPipeline';
import FlowAPIRoutes from './diagrams/TechFlowCharts/FlowAPIRoutes';
import ExamConfigCreator from '../Main/6.AdminPanel/Support/ExamConfigCreator';
import HospitalERDiagram from './diagrams/Business/Junk/HospitalERDiagram';
import FlowQuizRevisePipeline from './diagrams/TechFlowCharts/FlowQuizRevisePipeline';
import PromptInput from './diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptInput';
import PromptManager from './diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptManager';
import ManualBookCreator from '../Main/6.AdminPanel/Support/ManualBookCreator';
import QuestionTypesCreator from '../Main/6.AdminPanel/Support/QuestionTypesCreator';
import QuestionTypePlayground from './diagrams/Pilot|AddToDB|Coding/PilotComponents/QuizDeprecated/QuestionTypePlayground';
import FlowQuizLatest from './diagrams/TechFlowCharts/FlowQuizLatest';
import FlowQuizReact from './diagrams/TechFlowCharts/FlowQuizReact';
import QuizConfigCreator from '../Main/6.AdminPanel/Support/QuizConfigCreator';
import CSVBookUploader from '../Main/6.AdminPanel/Support/CSVBookUploader';
import FlowHolyGrailDataFlow from './diagrams/TechFlowCharts/FlowHolyGrailDataFlow';
import FileExplorer from '../Main/6.AdminPanel/Support/FileExplorer';
import FirebaseCollectionsViewer from '../Main/6.AdminPanel/Support/FirebaseCollectionsViewer';
import AdaptivePlanLoader from './diagrams/Pilot|AddToDB|Coding/PilotComponents/AdaptivePlanViewersMar23/AdaptivePlanLoader';
import AdaptivePlanConceptLoader from './diagrams/Pilot|AddToDB|Coding/PilotComponents/AdaptivePlanViewersMar23/AdaptivePlanConceptLoader';
import UploadQuestionPaper from '../Main/6.AdminPanel/Support/UploadQuestionPaper';
import UploadExamGuidelines from '../Main/6.AdminPanel/Support/UploadExamGuidelines';


import Parent from './Parent';


import QuickDeleteUserData from '../Main/6.AdminPanel/Support/QuickDeleteUserData';

import TOEFLOnboardingTest from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLOnboardingTest';
import TOEFLOnboardingProcessing from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLOnboardingProcessing';
import TOEFLOnboardingView from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLOnboardingView';
import TOEFLActivitySimulator from './diagrams/Pilot|AddToDB|Coding/PilotComponents/TOEFLActivitySimulator';
import StageManagerPlayground from './diagrams/Pilot|AddToDB|Coding/PilotComponents/StageManagerPlayground';
import Explainer from './diagrams/Pilot|AddToDB|Coding/PilotComponents/Explainer';


import BookUploader from './BookUploader';






// Mapping from diagram component name to the actual component
const diagramComponents = {
  UserOutreachPitch,
  UserOutreachTree,
  GeneralTodoDashboard,
  ProductFlowDiagram,
  PitchingDashboard,
  UserInterviewFeedback,
  Notes,
  MonetizationBrainstorming,
  UserGrowthStrategy,
  AnalyticsDashboard,
  UserPersonas,
  TimeLogger,
  FlowGeneratePlan,
  FlowChild2,
  FlowReduxPlan,
  FlowDashboard,
  HomeComponentsNodes,
  FlowMaterialDashboard,
  FlowPreLogin,
  FlowUpload,
  FlowProfile,
  FlowContentPipeline,
  FlowAPIRoutes,
  ExamConfigCreator,
  HospitalERDiagram,
  FlowQuizRevisePipeline,
  PromptManager,
  PromptInput,
  ManualBookCreator,
  QuestionTypesCreator,
  QuestionTypePlayground,
  FlowQuizLatest,
  FlowQuizReact,
  QuizConfigCreator,
  CSVBookUploader,
  FlowHolyGrailDataFlow,
  FileExplorer,
  FirebaseCollectionsViewer,
  AdaptivePlanLoader,
  AdaptivePlanConceptLoader,
  UploadQuestionPaper,
  UploadExamGuidelines,
  Parent,
  QuickDeleteUserData,
  TOEFLOnboardingTest,
  TOEFLOnboardingProcessing,
  TOEFLOnboardingView,
  TOEFLActivitySimulator,
  StageManagerPlayground,
  Explainer,
  BookUploader
};

// Sample static data representing past brainstorming sessions.
// Added "isImportant" for each. Feel free to change which ones are true/false.
const sampleBrainstormings = [
  {
    id: 1,
    title: 'Junk: USER: Outreach Pitch',
    timestamp: new Date('2025-03-20T10:00:00Z'),
    diagramComponent: 'UserOutreachPitch',
    isImportant: false
  },
  {
    id: 2,
    title: 'Junk: USER: Channels',
    timestamp: new Date('2025-03-18T15:30:00Z'),
    diagramComponent: 'UserOutreachTree',
    isImportant: false
  },
  {
    id: 3,
    title: 'Junk: PersonalProd: GeneralTodoDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'GeneralTodoDashboard',
    isImportant: true
  },
  {
    id: 4,
    title: 'Junk: PRODUCT: Flow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ProductFlowDiagram',
    isImportant: false
  },
  {
    id: 5,
    title: 'Junk: PITCH: Dashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PitchingDashboard',
    isImportant: false
  },
  {
    id: 6,
    title: 'Junk: USER: Interview',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserInterviewFeedback',
    isImportant: false
  },
  {
    id: 7,
    title: 'Junk: PersonalProd: Notes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Notes',
    isImportant: false
  },
  {
    id: 8,
    title: 'Junk: PITCH: Monetization',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'MonetizationBrainstorming',
    isImportant: true
  },
  {
    id: 9,
    title: 'Junk: USER: Growth Loops',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserGrowthStrategy',
    isImportant: false
  },
  {
    id: 10,
    title: 'Junk: PRODUCT: AnalyticsDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AnalyticsDashboard',
    isImportant: false
  },
  {
    id: 11,
    title: 'Junk: USER: Personas',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UserPersonas',
    isImportant: false
  },
  {
    id: 12,
    title: 'Junk: PersonalProd: TimeLogger',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TimeLogger',
    isImportant: false
  },
  {
    id: 13,
    title: '3. Documentation: AdaptivePlanFlow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowGeneratePlan',
    isImportant: false
  },
  {
    id: 14,
    title: '3. Documentation: FlowChild2',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowChild2',
    isImportant: false
  },
  {
    id: 15,
    title: '3. Documentation: FlowReduxPlan',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowReduxPlan',
    isImportant: false
  },
  {
    id: 16,
    title: '3. Documentation: FlowDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowDashboard',
    isImportant: false
  },
  {
    id: 17,
    title: '3. Documentation: FlowHomeComponentsNodes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HomeComponentsNodes',
    isImportant: false
  },
  {
    id: 18,
    title: '3. Documentation: FlowMaterialDashboard',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowMaterialDashboard',
    isImportant: false
  },
  {
    id: 19,
    title: '3. Documentation: FlowPreLogin',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowPreLogin',
    isImportant: false
  },
  {
    id: 20,
    title: '3. Documentation: FlowUpload',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowUpload',
    isImportant: false
  },
  {
    id: 21,
    title: '3. Documentation: FlowProfile',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowProfile',
    isImportant: false
  },
  {
    id: 22,
    title: '3. Documentation: FlowContentPipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowContentPipeline',
    isImportant: false
  },
  {
    id: 23,
    title: '3. Documentation: FlowAPIRoutes',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowAPIRoutes',
    isImportant: false
  },
  {
    id: 24,
    title: '1. AdminPanel: Adaptive: ExamConfigCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ExamConfigCreator',
    isImportant: false
  },
  {
    id: 25,
    title: 'Junk: HospitalERDiagram',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'HospitalERDiagram',
    isImportant: false
  },
  {
    id: 26,
    title: '3. Documentation: FlowQuizRevisePipeline',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizRevisePipeline',
    isImportant: false
  },
  {
    id: 27,
    title: '1. AdminPanel: Quiz: PromptManager',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptManager',
    isImportant: false
  },
  {
    id: 28,
    title: '1. AdminPanel: Quiz: PromptInput',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'PromptInput',
    isImportant: false
  },
  {
    id: 29,
    title: '1. AdminPanel: Ingestion: ManualBookCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'ManualBookCreator',
    isImportant: false
  },
  {
    id: 30,
    title: '1. AdminPanel: Quiz: QuestionTypesCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypesCreator',
    isImportant: false
  },
  {
    id: 31,
    title: '1. AdminPanel: Quiz: QuestionTypePlayground',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuestionTypePlayground',
    isImportant: false
  },
  {
    id: 32,
    title: '3. Documentation: FlowQuizLatest',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizLatest',
    isImportant: true
  },
  {
    id: 33,
    title: '3. Documentation: FlowQuizReact',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowQuizReact',
    isImportant: false
  },
  {
    id: 34,
    title: '1. AdminPanel: Quiz: QuizConfigCreator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuizConfigCreator',
    isImportant: false
  },
  {
    id: 35,
    title: '1. AdminPanel: Ingestion: CSVBookUploader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'CSVBookUploader',
    isImportant: false
  },
  {
    id: 36,
    title: '3. Documentation: FlowHolyGrailDataFlow',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FlowHolyGrailDataFlow',
    isImportant: false
  },
  {
    id: 37,
    title: '1. AdminPanel: Coding: FileExplorer',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FileExplorer',
    isImportant: false
  },
  {
    id: 38,
    title: '1. AdminPanel: Coding: FirebaseCollectionsViewer',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'FirebaseCollectionsViewer',
    isImportant: false
  },
  {
    id: 39,
    title: '1. AdminPanel: Adaptive: AdaptivePlanLoader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AdaptivePlanLoader',
    isImportant: false
  },
  {
    id: 40,
    title: '1. AdminPanel: Adaptive: AdaptivePlanConceptLoader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'AdaptivePlanConceptLoader',
    isImportant: false
  },
  {
    id: 41,
    title: '1. AdminPanel: Ingestion: UploadQuestionPaper',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UploadQuestionPaper',
    isImportant: false
  },
  {
    id: 42,
    title: '1. AdminPanel: Ingestion: UploadExamGuidelines',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'UploadExamGuidelines',
    isImportant: false
  },
  {
    id: 43,
    title: 'Junk: 2. PilotComponents: Parent',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Parent',
    isImportant: false
  },
  {
    id: 44,
    title: '1. AdminPanel: Coding: QuickDeleteUserData',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'QuickDeleteUserData',
    isImportant: false
  },
  {
    id: 44,
    title: 'Junk: 2. PilotComponents: TOEFLOnboardingTest',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLOnboardingTest',
    isImportant: false
  },
  {
    id: 45,
    title: 'Junk: 2. PilotComponents: TOEFLOnboardingProcessing',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLOnboardingProcessing',
    isImportant: false
  },
  {
    id: 46,
    title: 'Junk: 2. PilotComponents: TOEFLOnboardingView',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLOnboardingView',
    isImportant: false
  },
  {
    id: 47,
    title: 'Junk: 2. PilotComponents: TOEFLActivitySimulator',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'TOEFLActivitySimulator',
    isImportant: false
  },
  {
    id: 48,
    title: 'Junk: 2. PilotComponents: StageManagerPlayground',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'StageManagerPlayground',
    isImportant: false
  },
  {
    id: 49,
    title: 'Junk: 2. PilotComponents: Explainer',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'Explainer',
    isImportant: false
  },
  {
    id: 50,
    title: 'New: BookUploader',
    timestamp: new Date('2025-03-19T15:30:00Z'),
    diagramComponent: 'BookUploader',
    isImportant: false
  },



  




  










  


  



  


  





  


  




  



  



  




  


  
];

function BrainstormingList() {
  const [brainstormings, setBrainstormings] = useState(sampleBrainstormings);
  const [selectedSession, setSelectedSession] = useState(null);

  // Sorting criteria: "alphabetical-desc" (A->Z), "alphabetical-asc" (Z->A), "date" (newest first)
  const [sortCriteria, setSortCriteria] = useState("alphabetical-desc");

  // Filter by importance: "all" or "important"
  const [importanceFilter, setImportanceFilter] = useState("all");

  // Track collapsible state for categories. Key: category name, Value: bool (true = collapsed)
  // Default is collapsed: so `true` for all categories.
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Toggles the collapsed state of a given category
  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggles "isImportant" for a single session
  const toggleImportant = (id) => {
    setBrainstormings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, isImportant: !b.isImportant } : b
      )
    );
  };

  useEffect(() => {
    // On first render, initialize all categories as collapsed = true
    const allCategories = new Set();
    sampleBrainstormings.forEach((s) => {
      const cat = parseCategory(s.title);
      allCategories.add(cat);
    });

    const collapseMap = {};
    allCategories.forEach((cat) => {
      collapseMap[cat] = true; // default collapsed
    });
    setCollapsedCategories(collapseMap);
  }, []);

  // Helper: extracts category from a title (the part before ":")
  const parseCategory = (fullTitle) => {
    const parts = fullTitle.split(":");
    if (parts.length > 1) {
      return parts[0].trim();
    }
    // If somehow no colon, just treat entire title as category
    return fullTitle.trim();
  };

  // Returns the items filtered by importance, grouped by category, and sorted.
  // 1) Filter by importance
  // 2) Group by category
  // 3) Sort categories A->Z
  // 4) Sort items by the selected sort criteria
  const getGroupedAndSortedBrainstormings = () => {
    // 1) Filter by importance
    let filtered = brainstormings;
    if (importanceFilter === "important") {
      filtered = filtered.filter((item) => item.isImportant);
    }

    // 2) Group by category
    const grouped = {};
    filtered.forEach((item) => {
      const category = parseCategory(item.title);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // 3) Sort categories A->Z
    const sortedCategories = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b)
    );

    // 4) Sort items within each category by sortCriteria
    sortedCategories.forEach((cat) => {
      grouped[cat].sort((a, b) => {
        if (sortCriteria === "alphabetical-desc") {
          // A -> Z
          return a.title.localeCompare(b.title);
        } else if (sortCriteria === "alphabetical-asc") {
          // Z -> A
          return b.title.localeCompare(a.title);
        } else if (sortCriteria === "date") {
          // Newest first
          return b.timestamp - a.timestamp;
        }
        return 0;
      });
    });

    return { grouped, sortedCategories };
  };

  // If a session is selected, show the corresponding diagram
  if (selectedSession) {
    const DiagramComponent = diagramComponents[selectedSession.diagramComponent];
    return (
      <div style={styles.container}>
        <button style={styles.backButton} onClick={() => setSelectedSession(null)}>
          ← Back to Sessions
        </button>
        {DiagramComponent ? (
          <div style={styles.diagramContainer}>
            <DiagramComponent brainstorming={selectedSession} />
          </div>
        ) : (
          <div>Diagram component not implemented.</div>
        )}
      </div>
    );
  }

  // Otherwise, show the grouped list of sessions
  const { grouped, sortedCategories } = getGroupedAndSortedBrainstormings();

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Brainstorming Sessions</h1>

      {/* Sorting + Importance Filter */}
      <div style={styles.controlsRow}>
        <div style={styles.controlGroup}>
          <label style={styles.sortLabel}>Sort by: </label>
          <select
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="alphabetical-desc">Alphabetical (A → Z)</option>
            <option value="alphabetical-asc">Alphabetical (Z → A)</option>
            <option value="date">Date (Newest First)</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.sortLabel}>Filter:</label>
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="all">All</option>
            <option value="important">Important</option>
          </select>
        </div>
      </div>

      {/* Render each category as collapsible */}
      {sortedCategories.map((category) => {
        const sessions = grouped[category];
        // If a category has 0 sessions (after filtering), skip
        if (!sessions || sessions.length === 0) return null;

        const isCollapsed = collapsedCategories[category] ?? true;

        return (
          <div key={category} style={styles.categoryContainer}>
            {/* Category Header */}
            <div
              style={styles.categoryHeader}
              onClick={() => toggleCategoryCollapse(category)}
            >
              <span style={styles.categoryTitle}>{category}</span>
              <span style={styles.collapseIndicator}>
                {isCollapsed ? "[+]" : "[-]"}
              </span>
            </div>

            {/* Sessions inside category */}
            {!isCollapsed && (
              <div style={styles.sessionList}>
                {sessions.map((session) => (
                  <div key={session.id} style={styles.sessionRow}>
                    <button
                      style={styles.sessionButton}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div style={styles.buttonContent}>
                        <span style={styles.title}>{session.title}</span>
                        <span style={styles.timestamp}>
                          {session.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </button>
                    {/* Toggle important icon/button */}
                    <button
                      style={styles.importantButton}
                      onClick={() => toggleImportant(session.id)}
                    >
                      {session.isImportant ? "★" : "☆"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#0F0F0F',
    color: '#fff',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '1rem',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center'
  },
  sortLabel: {
    marginRight: '0.5rem'
  },
  sortSelect: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #444',
    backgroundColor: '#1F1F1F',
    color: '#fff'
  },
  categoryContainer: {
    marginBottom: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: '#222',
    cursor: 'pointer',
  },
  categoryTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  collapseIndicator: {
    marginLeft: '1rem'
  },
  sessionList: {
    padding: '0.5rem 1rem'
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  sessionButton: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem',
    cursor: 'pointer',
    textAlign: 'left'
  },
  buttonContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#aaa'
  },
  timestamp: {
    fontSize: '0.85rem',
    color: '#aaa'
  },
  importantButton: {
    marginLeft: '0.5rem',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  backButton: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  diagramContainer: {
    width: '100%',
    height: '80vh',
    backgroundColor: '#000',
    border: '1px solid #444',
    borderRadius: '4px',
    overflow: 'hidden'
  }
};

export default BrainstormingList;