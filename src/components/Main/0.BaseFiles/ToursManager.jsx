// src/components/DetailedBookViewer/ToursManager.jsx
import React, { useState, useEffect } from "react";
import Tour from "reactour";

/** -----------------------------------------
 * Step arrays: define them outside the component
 * so they don't get re-defined on every render
 ------------------------------------------*/
const overviewSteps = [
  { selector: "#panelA", content: "Panel A in overview." },
  { selector: "#panelB", content: "Panel B in overview." },
];

const libraryNoBookSteps = [
  { selector: "#libraryNoBookStart", content: "Welcome to Library (no book selected)." },
  { selector: "#libraryNoBookGrid", content: "Here’s the grid of available books." },
];

const libraryBookSelectedSteps = [
  { selector: "#libraryBookSelectedTitle", content: "You have selected a book." },
  { selector: "#libraryBookOverview", content: "Check out the book details here." },
];

const librarySubchapterSteps = [
  { selector: "#summarizebutton", content: "Click here to get a summary of this subchapter's content." },
  { selector: "#askdoubtbutton", content: "Have questions or doubts? Ask them here!" },
  { selector: "#dynamictutorbutton", content: "Open the dynamic tutor for interactive learning and Q&A." },
  { selector: "#fontsizebutton", content: "Adjust the font size for a comfortable reading experience." },
  { selector: "#startreadingbutton", content: "If not yet reading, click here to start reading mode." },
  { selector: "#stopreadingbutton", content: "Already reading? Use this to stop when you're done." },
  { selector: "#takequizbutton", content: "Take a quiz to test your knowledge of this subchapter." },
  { selector: "#takeanotherquizbutton", content: "You can retake or try another quiz for further practice." },
];

function ToursManager({
  viewMode,
  selectedBook,
  selectedSubChapter,
  triggerTour,
  onTourDone,
}) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [steps, setSteps] = useState([]);

  // -------------------------------------------------------
  // 1) Main effect: build steps array & open/close the tour
  // -------------------------------------------------------
  useEffect(() => {
    let newSteps = [];

    // Decide which base steps to load
    if (viewMode === "overview") {
      newSteps = overviewSteps;
    } else if (viewMode === "library") {
      // No book selected
      if (!selectedBook) {
        newSteps = libraryNoBookSteps;
      }
      // Book selected but NO subchapter
      else if (selectedBook && !selectedSubChapter) {
        newSteps = libraryBookSelectedSteps;
      }
      // Subchapter selected
      else if (selectedSubChapter) {
        newSteps = librarySubchapterSteps;
      }
    } else {
      // e.g. if mode=adaptive or profile => skip
      newSteps = [];
    }

    // If user clicked the "?" button, filter out steps for missing DOM elements
    let finalSteps = newSteps;
    if (triggerTour) {
      finalSteps = newSteps.filter((step) => {
        const el = document.querySelector(step.selector);
        return Boolean(el);
      });
    }

    setSteps(finalSteps);

    // If we have steps & user triggered the tour => open
    if (triggerTour && finalSteps.length > 0) {
      setIsTourOpen(true);
    } else {
      setIsTourOpen(false);
    }
  }, [
    // Do NOT include the step arrays themselves here
    viewMode,
    selectedBook,
    selectedSubChapter,
    triggerTour,
  ]);

  // ------------------------------------------------------------------------
  // 2) Additional effect: force-close the tour if user changes viewMode
  //    BUT only if it's currently open to avoid repeated setIsTourOpen(false)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (isTourOpen) {
      // if user changes viewMode while the tour is open => close
      setIsTourOpen(false);
      // If needed, notify parent
      if (onTourDone) onTourDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]); 
  // We do not include isTourOpen in the dependencies to avoid
  // double-calling setIsTourOpen, but we check it once here.

  // If the user manually closes the tour:
  function handleClose() {
    setIsTourOpen(false);
    if (onTourDone) onTourDone();
  }

  return (
    <Tour
      steps={steps}
      isOpen={isTourOpen}
      onRequestClose={handleClose}
      accentColor="#0084FF"
      rounded={8}
    />
  );
}

export default ToursManager;