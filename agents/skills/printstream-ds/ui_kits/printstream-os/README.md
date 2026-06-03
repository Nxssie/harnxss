# PrintStream OS — UI Kit

A reference dashboard demonstrating the full PrintStream visual system: a fictional module-calibration operations console that would ship alongside a PrintStream hardware product. The goal is to exercise every token and component in a plausible product context.

## Files

- `index.html` — the live interactive kit. Loads React + Babel and the JSX modules below.
- `App.jsx` — top-level layout + fake state (selected module, live telemetry tick).
- `Sidebar.jsx` — vertical rail: logomark, module list, status chips.
- `TopBar.jsx` — fixed header with serial, search, terminal toggle.
- `ModuleHeader.jsx` — large XXXY-style title block with tag codes.
- `TelemetryGrid.jsx` — live readout tiles (value + unit + sparkline).
- `ReticleCard.jsx` — generic card with corner brackets used throughout.
- `Terminal.jsx` — slide-up terminal drawer with fake command log.
- `ActionBar.jsx` — bottom barcode strip + primary CTAs.

## Screens / states covered

1. **Default** — module B11 selected, calibrated, telemetry ticking.
2. **Select** — clicking a sidebar row switches the active module; header + readouts update.
3. **Calibrate flow** — `CALIBRATE;` button toggles a 2-second "calibrating…" state with shimmer on the progress bar; resolves to `_calibrated;`.
4. **Terminal drawer** — click the terminal chip (top-right) or press `~` to reveal the command log.
