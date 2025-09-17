import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, Button, Stack
} from '@mui/material';
import MenuIcon  from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/CloseRounded';

import googleIcon        from '../../logo.png';         // adjust path
import DemoRequestModal  from './DemoRequestModal';     // adjust path

/* ── tiny helper for “G” logo inside CTA ── */
const GoogleLogo = () => (
  <img
    src={googleIcon}
    alt="G"
    width={18}
    height={18}
    style={{ marginRight: 8, verticalAlign: 'middle' }}
  />
);

export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [demoOpen,   setDemoOpen]   = useState(false);   // ← modal state

  const cta = 'Request Demo';

  return (
    <>
      {/* ───────── Top bar ───────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backdropFilter: 'none',
          transition: 'all .3s',
          '&.scrolled': {
            bgcolor: 'rgba(10,0,30,.6)',
            backdropFilter: 'blur(8px)'
          }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={() => (window.location = '/')}
          >
            🚀 talk-ai.co
          </Typography>

          {/* ----- desktop button: SAME outlined style you had ---- */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Button
              variant="outlined"             /* << stays outlined */
              color="primary"
              onClick={() => setDemoOpen(true)}
            >
              <GoogleLogo />
              {cta}
            </Button>
          </Box>

          {/* burger icon for mobile */}
          <IconButton
            sx={{ display: { xs: 'flex', md: 'none' } }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ───────── Mobile drawer ───────── */}
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { bgcolor: 'background.default' } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* same outlined button inside drawer */}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setDrawerOpen(false);
                setDemoOpen(true);
              }}
            >
              <GoogleLogo />
              {cta}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* ───────── Demo modal ───────── */}
      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
