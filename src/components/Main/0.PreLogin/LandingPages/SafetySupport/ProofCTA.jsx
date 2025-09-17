import React, { useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import googleIcon from '../../logo.png';          // adjust path if needed
import DemoRequestModal from './DemoRequestModal'; // adjust path if needed

const GoogleLogo = () => (
  <img
    src={googleIcon}
    alt="G"
    width={18}
    height={18}
    style={{ marginRight: 8, verticalAlign: 'middle' }}
  />
);

export default function ProofCTA() {
  /* modal open/close */
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ py: 10, bgcolor: '#1a0033' }}>
        <Container sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 2, color: '#FFD54F' }}
          >
            Cut training prep from days to minutes – boost compliance
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: 580,
              mx: 'auto',
            }}
          >
            Join the paid pilot. Upload <strong>3 photos</strong> → get your first
            safety clip &amp; audit bundle in <strong>24 h</strong>. Then let the
            system guide you to a zero-incident audit.
          </Typography>

          <Button
            variant="contained"
            size="large"
            color="secondary"
            sx={{ fontWeight: 600 }}
            onClick={() => setOpen(true)}
          >
            <GoogleLogo />
            Request Demo
          </Button>
        </Container>
      </Box>

      {/* demo modal */}
      <DemoRequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
