// src/components/DetailedBookViewer/ProcessAnimation.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  IconButton,
  Collapse,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Safely parse numeric prefix from strings like "3. Something" => 3.
 */
function getNumericPrefix(title) {
  if (typeof title !== 'string') return 999999;
  const match = title.trim().match(/^(\d+)\./);
  if (!match) return 999999;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? 999999 : num;
}

/**
 * Styled progress bar in purple (visual flair).
 */
const PurpleLinearProgress = styled(LinearProgress)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)', // lighter track color
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#9b59b6', // the purple fill
  },
}));

/**
 * ProcessAnimation
 *
 * Props:
 *  - userId (string)          : The current user's ID
 *  - backendURL (string, optional)
 *  - colorScheme (string, optional)
 *  - onShowPlanModal (fn)     : Called when we reach step 8 => create plan;
 *                               we pass the local bookId up to the parent.
 *
 * This component simulates an "analysis" of the recently uploaded book,
 * then invites the user to create an adaptive plan. We no longer
 * render EditAdaptivePlanModal inline.
 */
export default function ProcessAnimation({
  userId,
  backendURL,
  colorScheme,
  onShowPlanModal
}) {
  // We'll store the "latest" bookId from the server
  const [bookId, setBookId] = useState('');

  // The step-based states: -1 => not started; 0..8 => the animation
  const [currentStep, setCurrentStep] = useState(-1);

  // The real chapters data
  const [chapters, setChapters] = useState([]);
  // For "typing out" the chapter list in step 3
  const [displayedChapters, setDisplayedChapters] = useState([]);
  // For sub-chapters at step 5
  const [displayedSubChapters, setDisplayedSubChapters] = useState({});
  // A numeric count to show "3. X chapters detected"
  const [numChaptersDetected, setNumChaptersDetected] = useState(0);

  // For toggling expansions of sub-chapters
  const [expandedChapters, setExpandedChapters] = useState({});

  // Local state for a "fake" progress bar while waiting 20s
  const [progress, setProgress] = useState(0);

  /**
   * 1) Fetch chapters + subchapters for a given bookId
   * 2) Kick off step-based animation => setCurrentStep to 0
   */
  async function handleStartProcessing(latestBookId) {
    if (!userId || !latestBookId) {
      console.warn('Missing userId or bookId for processing data.');
      return;
    }
    try {
      const baseURL = backendURL || import.meta.env.VITE_BACKEND_URL;
      // e.g. GET /api/process-book-data?userId=XYZ&bookId=ABC
      const res = await axios.get(`${baseURL}/api/process-book-data`, {
        params: { userId, bookId: latestBookId },
      });
      const data = res.data || {};
      const rawChapters = Array.isArray(data.chapters) ? data.chapters : [];

      // Clean & sort chapters
      const cleanedChapters = rawChapters
        .filter((c) => c && typeof c.name === 'string')
        .map((ch) => {
          const rawSubs = Array.isArray(ch.subchapters) ? ch.subchapters : [];
          const sortedSubs = rawSubs
            .filter((s) => s && typeof s.name === 'string')
            .sort((a, b) => {
              const aVal = getNumericPrefix(a.name);
              const bVal = getNumericPrefix(b.name);
              return aVal - bVal;
            });
          return { ...ch, subchapters: sortedSubs };
        })
        .sort((a, b) => {
          const aVal = getNumericPrefix(a.name);
          const bVal = getNumericPrefix(b.name);
          return aVal - bVal;
        });

      setChapters(cleanedChapters);
      setNumChaptersDetected(cleanedChapters.length);

      // Reset typed data
      setDisplayedChapters([]);
      setDisplayedSubChapters({});
      setExpandedChapters({});

      // Start the step animation at 0
      setCurrentStep(0);
    } catch (err) {
      console.error('Failed to fetch process-book-data:', err);
      alert('Error fetching data. Check the console/logs.');
    }
  }

  /**
   * On mount => wait 20 seconds => fetch the "latest book" => then handleStartProcessing
   */
  useEffect(() => {
    if (!userId) return;

    // Reset progress bar
    setProgress(0);

    // Each second => +5% => in 20 seconds we reach 100%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + 5;
        return nextVal >= 100 ? 100 : nextVal;
      });
    }, 1000);

    // After 20 seconds => fetch latest book => start processing
    const fetchTimer = setTimeout(() => {
      fetchLatestBookAndProcess();
    }, 20000);

    // Cleanup intervals
    return () => {
      clearTimeout(fetchTimer);
      clearInterval(progressInterval);
    };
  }, [userId]);

  async function fetchLatestBookAndProcess() {
    try {
      const baseURL = backendURL || import.meta.env.VITE_BACKEND_URL;
      // GET /api/latest-book?userId=...
      const res = await axios.get(`${baseURL}/api/latest-book`, {
        params: { userId },
      });
      const data = res.data || {};
      if (!data.bookId) {
        console.error('No latest book found for this user.');
        return;
      }
      setBookId(data.bookId);
      // Then load chapters for that book
      handleStartProcessing(data.bookId);
    } catch (err) {
      console.error('Error fetching latest-book:', err);
    }
  }

  /**
   * The step-based side effect for the animation
   */
  useEffect(() => {
    if (currentStep < 0) return; // not started yet

    switch (currentStep) {
      case 0:
        // after 1s => step 1
        setTimeout(() => setCurrentStep(1), 1000);
        break;
      case 1:
        // after 1s => step 2
        setTimeout(() => setCurrentStep(2), 1000);
        break;
      case 2:
        // after 1s => step 3
        setTimeout(() => setCurrentStep(3), 1000);
        break;
      case 3: {
        // Type out each chapter name one by one
        setDisplayedChapters([]);
        let index = 0;
        const interval = setInterval(() => {
          const ch = chapters[index];
          if (!ch) {
            clearInterval(interval);
            setTimeout(() => setCurrentStep(4), 500);
            return;
          }
          setDisplayedChapters((prev) => [...prev, ch.name]);
          index++;
          if (index >= chapters.length) {
            clearInterval(interval);
            setTimeout(() => setCurrentStep(4), 500);
          }
        }, 150);
        break;
      }
      case 4:
        // after 1s => step 5
        setTimeout(() => setCurrentStep(5), 1000);
        break;
      case 5:
        // sub-chapters => type them out with short delay for each chapter
        (async () => {
          let newObj = {};
          for (let i = 0; i < chapters.length; i++) {
            const c = chapters[i];
            if (!c || !Array.isArray(c.subchapters)) continue;
            // gather subchapter names
            const subNames = c.subchapters.map((s) => s.name || '');
            newObj[c.name] = subNames;
            setDisplayedSubChapters({ ...newObj });
            // short delay for "detecting" the next
            await new Promise((r) => setTimeout(r, 200));
          }
          setTimeout(() => setCurrentStep(6), 1000);
        })();
        break;
      case 6:
        // after 1s => step 7
        setTimeout(() => setCurrentStep(7), 1000);
        break;
      case 7:
        // after 1s => step 8
        setTimeout(() => setCurrentStep(8), 1000);
        break;
      case 8:
        // Ready to create a plan
        break;
      default:
        break;
    }
  }, [currentStep, chapters]);

  // Renders spinner or check icon next to each step
  function renderStepStatus(stepIndex) {
    if (currentStep === stepIndex) {
      return (
        <CircularProgress size={18} sx={{ ml: 1, color: '#4CAF50' }} />
      );
    }
    if (currentStep > stepIndex) {
      return (
        <CheckCircleIcon sx={{ ml: 1, fontSize: '1.25rem', color: '#4CAF50' }} />
      );
    }
    return null;
  }

  // A "card" container style for the animation content
  const containerStyle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
    maxWidth: '600px',
    margin: '0 auto',
  };

  return (
    <Box sx={containerStyle}>
      {/* If we haven't started => show the progress bar */}
      {currentStep < 0 && (
        <Box textAlign="center">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Please wait...
          </Typography>
          <Box sx={{ width: '80%', margin: '0 auto' }}>
            <PurpleLinearProgress variant="determinate" value={progress} />
          </Box>
          <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#aaa' }}>
            Fetching your latest uploaded book...
          </Typography>
        </Box>
      )}

      {/* If we have started => show the steps */}
      {currentStep >= 0 && (
        <>
          {/* Step 0 */}
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            1. Upload Complete
            {renderStepStatus(0)}
          </Typography>

          {/* Step 1 */}
          {currentStep >= 1 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
            >
              2. Analyzing Content
              {renderStepStatus(1)}
            </Typography>
          )}

          {/* Step 2 */}
          {currentStep >= 2 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
            >
              3. {numChaptersDetected} Chapters Detected
              {renderStepStatus(2)}
            </Typography>
          )}

          {/* Step 3 => typed-out chapters */}
          {currentStep >= 3 && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {displayedChapters.map((chName, idx) => (
                <Typography key={idx} variant="body1">
                  {chName}
                </Typography>
              ))}
            </Box>
          )}

          {/* Step 4 */}
          {currentStep >= 4 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
            >
              4. Analyzing Chapters
              {renderStepStatus(4)}
            </Typography>
          )}

          {/* Step 5 */}
          {currentStep >= 5 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
            >
              5. Sub-chapters Detected
              {renderStepStatus(5)}
            </Typography>
          )}

          {/* Collapsible sub-chapters */}
          {currentStep >= 5 && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {Object.keys(displayedSubChapters).map((chapterName) => {
                const subs = displayedSubChapters[chapterName] || [];
                const isExpanded = expandedChapters[chapterName] || false;

                return (
                  <Box key={chapterName} sx={{ mb: 2 }}>
                    {/* Chapter row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleToggleExpand(chapterName)}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {chapterName}
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 1, color: '#aaa' }}>
                        ({subs.length} sub-chapters detected)
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ color: '#ccc', ml: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(chapterName);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List sx={{ pl: 3, listStyleType: 'disc', color: '#ccc' }}>
                        {subs.map((subName, i) => (
                          <ListItem
                            key={i}
                            sx={{
                              display: 'list-item',
                              pl: 0,
                              py: 0.2,
                            }}
                          >
                            {subName}
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Step 6 */}
          {currentStep >= 6 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
            >
              6. Analyzing Sub-chapters
              {renderStepStatus(6)}
            </Typography>
          )}

          {/* Step 7 */}
          {currentStep >= 7 && (
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
            >
              7. All Content Absorbed
              {renderStepStatus(7)}
            </Typography>
          )}

          {/* Step 8 => "Create Plan" button => calls onShowPlanModal with our bookId */}
          {currentStep === 8 && (
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                onClick={() => {
                  // Pass the local bookId upward, so the parent can open the plan wizard
                  if (onShowPlanModal) {
                    onShowPlanModal(bookId);
                  }
                }}
              >
                Create Adaptive Plan
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}