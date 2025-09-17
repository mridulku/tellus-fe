// src/components/Loader.jsx
import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, LinearProgress, Typography } from "@mui/material";


/**
 * Loader
 * ─────────────────────────────────────────────────────────
 * • type        "spinner" | "bar"
 * • fullScreen  true  → glass-blur overlay
 * • message     optional status text
 * • determinate true  → use `percent`
 *                 false → auto-fill 0→90 % in `smoothMs` (default 30 000 ms)
 * • percent     0-100  (when determinate=true)
 * • accent      bar / spinner colour
 * • done        when true the bar snaps 90→100 % in 300 ms, then unmount loader
 *               (*you don’t have to pass it; just hide the component as before.
 *                Including it only gives you the “snap-finish” animation.*)
 */
export default function Loader({
  type = "spinner",
  fullScreen = false,
  message = "Loading…",
  determinate = false,
  percent = 0,
  accent = "#BB86FC",
  smoothMs = 30_000,          // total time to reach 90 %
  done = false,               // optional: animate 90→100 %
  zIndex = 1400,
}) {
  /* ------------------------------------------------------------------
     Auto-progress state (only when !determinate)
  ------------------------------------------------------------------ */
  const [autoPct, setAutoPct] = useState(0);   // 0 → 90
  const animRef = useRef(null);

  useEffect(() => {
    if (determinate) return;                   // skip for determinate bars
    const step = 90 / (smoothMs / 100);        // update every 100 ms
    animRef.current = setInterval(() => {
      setAutoPct((p) => (p + step >= 90 ? 90 : p + step));
    }, 100);
    return () => clearInterval(animRef.current);
  }, [determinate, smoothMs]);

  /* ---------- snap 90 → 100 when `done` prop flips true ---------- */
  const [snapPct, setSnapPct] = useState(0);   // 0 or 100 (after snap)

  useEffect(() => {
    if (!done) return;
    // short 300 ms animation
    const t0 = Date.now();
    const tick = () => {
      const dt = Date.now() - t0;
      const p = Math.min(100, 90 + (10 * dt) / 300);
      setSnapPct(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    tick();
  }, [done]);

  /* ------------------------------------------------------------------
     Wrapper
  ------------------------------------------------------------------ */
  const Wrapper = ({ children }) =>
    fullScreen ? (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(0,0,0,.55)",
          backdropFilter: "blur(4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex,
        }}
      >
        {children}
      </Box>
    ) : (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          py: 2,
        }}
      >
        {children}
      </Box>
    );

  /* ------------------------------------------------------------------ */
  const barValue = determinate
    ? percent
    : done
    ? snapPct
    : autoPct;

  return (
    <Wrapper>
      {type === "spinner" ? (
        <CircularProgress sx={{ color: accent }} />
      ) : (
        <Box sx={{ width: 260 }}>
          <LinearProgress
            variant="determinate"                       // always determinate now
            value={barValue}
            sx={{
              "& .MuiLinearProgress-bar": { bgcolor: accent },
              bgcolor: "rgba(255,255,255,.15)",
              height: 6,
              borderRadius: 3,
            }}
          />
        </Box>
      )}
      {message && (
        <Typography
          sx={{ mt: 1, fontSize: 14, color: "#fff", textAlign: "center" }}
        >
          {message}
        </Typography>
      )}
    </Wrapper>
  );
}