// src/components/DetailedBookViewer/TOEFLOnboardingCarousel.jsx

import React, { useState, useRef } from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

export default function TOEFLOnboardingCarousel({ onFinish }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // React-slick slider settings
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  // Go to next/previous slides
  const goNext = () => sliderRef.current?.slickNext();
  const goPrev = () => sliderRef.current?.slickPrev();

  // Theme colors
  const accentPurple = "#9b59b6";
  const accentPurpleHover = "#8e44ad";

  // Shared styling
  const slideStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: isMobile ? "1rem" : "2rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: isMobile ? "1.5rem" : "2rem",
    maxWidth: isMobile ? "90%" : "600px",
    margin: "auto",
    boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
  };

  const iconContainerStyle = {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: "50%",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const buttonRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1rem",
    width: "100%",
  };

  const backButtonStyle = {
    color: "#fff",
    borderColor: "#fff",
    textTransform: "none",
    fontWeight: "bold",
    "&:hover": { borderColor: "#ccc" },
  };

  const primaryButtonStyle = {
    backgroundColor: accentPurple,
    color: "#fff",
    textTransform: "none",
    fontWeight: "bold",
    "&:hover": { backgroundColor: accentPurpleHover },
  };

  const headingStyle = {
    fontWeight: "bold",
    color: accentPurple,
    marginBottom: "1rem",
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "transparent",
        position: "relative",
        color: "#fff",
      }}
    >
      <Slider ref={sliderRef} {...settings}>
        
        {/* Slide 1 */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Hey! Welcome to Your TOEFL Journey
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              {/* Keep it short & bullet-like, with an emoji or two */}
              <div>• We’ll prep Reading, Listening, Speaking, & Writing ✍️</div>
              <div>• No big test first. Just quick questions 🤗</div>
              <div>• Let’s set up your exam details in a jiffy ⏱️</div>
            </Typography>
            {/* 
              For the first slide, we only show the Next button (on the right). 
              The Back button is hidden because currentSlide=0 
            */}
            <Box sx={buttonRowStyle}>
              <Box /> {/* Empty box placeholder to keep Next on the right */}
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={goNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 2 */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              What We'll Ask You
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              <div>• Your TOEFL exam date 🗓️</div>
              <div>• Areas you want to focus on the most 🎯</div>
              <div>• A quick sense of your current skill ⚙️</div>
            </Typography>
            {/* 
              Now we have both Back (left) and Next (right).
              Because currentSlide=1 => you can go back to Slide 1
            */}
            <Box sx={buttonRowStyle}>
              <Button
                variant="outlined"
                sx={backButtonStyle}
                onClick={goPrev}
              >
                Back
              </Button>
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={goNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 3 */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Ready for Lift-Off?
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              <div>• Daily tasks & quizzes adapt to you 🚀</div>
              <div>• No stress: short practice sessions 🧘‍♂️</div>
              <div>• Let’s finalize your plan & start improving!</div>
            </Typography>
            <Box sx={buttonRowStyle}>
              <Button
                variant="outlined"
                sx={backButtonStyle}
                onClick={goPrev}
              >
                Back
              </Button>
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={onFinish}
              >
                Finish
              </Button>
            </Box>
          </Box>
        </Box>

      </Slider>
    </Box>
  );
}