import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Chip, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import googleIcon from '../../logo.png';
import DemoRequestModal from './DemoRequestModal';

/* ---------------- helper: Google logo inside the button ---------------- */
const GoogleLogo = () => (
  <img
    src={googleIcon}
    alt="G"
    width={18}
    height={18}
    style={{ marginRight: 8, verticalAlign: 'middle' }}
  />
);

const chips = [
  'Site-specific clip in 60 seconds',
  'Targets your highest-risk hazards',
  'Cuts training prep by 90 %',
];

export default function Hero() {
  /* ---------- modal state (default = closed) ---------- */
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(150deg,#19002c 0%,#29005a 55%,#070012 100%)',
      }}
    >
      <Container>

        {/* Hero Heading */}
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 3 }}>
          Train smarter, stay safer.
        </Typography>

        <Typography
          variant="h6"
          sx={{ maxWidth: 720, mb: 4, color: 'text.secondary' }}
        >
          AI-generated, site-specific safety videos delivered in minutes –
          in every language your shop-floor speaks.
        </Typography>

        {/* ----- CTA button that opens modal ----- */}
        <Button
          variant="contained"
          size="large"
          color="secondary"
          sx={{ fontWeight: 600, mb: 3 }}
          onClick={() => setOpen(true)}
        >
          <GoogleLogo />
          Request Demo
        </Button>

        {/* chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {chips.map((c) => (
            <Chip
              key={c}
              icon={<CheckCircleIcon sx={{ color: '#FFD700' }} />}
              label={c}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'text.secondary' }}
            />
          ))}
        </Stack>
      </Container>

      {/* --- Modal itself --- */}
      <DemoRequestModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}
