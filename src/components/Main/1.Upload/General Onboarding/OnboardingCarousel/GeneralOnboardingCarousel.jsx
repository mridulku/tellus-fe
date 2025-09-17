// src/components/DetailedBookViewer/OnboardingCarousel.jsx

import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

export default function GeneralOnboardingCarousel({ onFinish }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = {
    infinite: false,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  const goNext = () => sliderRef.current?.slickNext();
  const goPrev = () => sliderRef.current?.slickPrev();

  const accentPurple = '#9b59b6';  
  const accentPurpleHover = '#8e44ad';

  const slideStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: isMobile ? '1rem' : '2rem',
  };

  const cardStyle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: isMobile ? '1.5rem' : '2rem',
    maxWidth: isMobile ? '90%' : '600px',
    margin: 'auto',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  };

  const iconContainerStyle = {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: '50%',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const backButtonStyle = {
    color: '#fff',
    borderColor: '#fff',
    textTransform: 'none',
    '&:hover': { borderColor: '#ccc' },
  };

  const primaryButtonStyle = {
    backgroundColor: accentPurple,
    color: '#fff',
    textTransform: 'none',
    fontWeight: 'bold',
    '&:hover': { backgroundColor: accentPurpleHover },
  };

  const headingStyle = {
    fontWeight: 'bold',
    color: accentPurple,
    marginBottom: '1rem',
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'transparent',
        position: 'relative',
        color: '#fff',
      }}
    >
      <Slider ref={sliderRef} {...settings}>
        {/* Slide 1: Upload Any Content */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Upload Any Content
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              Our platform lets you upload textbooks, PDFs, or articles.
              We'll transform them into a personalized learning experience.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 2: Smart Study Plans */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Smart Study Plans
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              We create a custom plan that breaks your content into manageable chunks,
              so you can study at your own pace.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 3: Quizzes & Summaries */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Quizzes & Summaries
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              Test yourself with quick quizzes and let our summarization tools help you recall key ideas. 
              Our system continuously learns your strengths, so you'll improve faster.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
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
