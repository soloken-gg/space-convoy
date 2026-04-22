# Space Convoy — PRD

## Original Problem Statement
3D interactive cognitive training game "Space Convoy" — a Multiple Object Tracking (MOT) task for children aged 8–18 that trains divided attention. Runs on a 32-inch 9:16 portrait touchscreen kiosk at 1080×1920. Five difficulty levels with salience progression (glow → outline → tint → no cue). Exact trial phase timings (cue 1500ms, ISI 500-1000ms, motion 3-6s, response 2-3s, feedback 800-1000ms, gap 500-800ms). Scoring +10/-5/-2 with 5-streak bonus. Adaptive difficulty. Full trial logging.

## User Choices
- Stack: React + @react-three/fiber + @react-three/drei + framer-motion (frontend-only)
- No backend persistence; JSON log export
- Anonymous play (nickname only)
- Sound asset stubs (user will supply audio later)
- All 5 levels + adaptive + full logging from v1

## User Personas
- Primary: Children aged 8–18 in a quiet clinical/educational setting
- Secondary: Clinicians / educators running the kiosk session and exporting logs

## Architecture
- React 19 + CRA/CRACO
- 3D: Three.js via @react-three/fiber + @react-three/drei
- Motion: framer-motion for HUD overlays, welcome/summary
- State: React hooks + reducer-style timers; phase state machine
- Portrait stage: 9:16 letter-boxed stage at `/src/App.css`
- R3F lives under `/src/game/` (excluded from visual-edits babel plugin via craco wrapper to avoid R3F prop pollution)

## Implemented (Feb 2026)
- Welcome screen with nickname + reduced-motion toggle
- 3D playfield: starfield (3-layer parallax), drifting nebula clouds, lighting
- Six object kinds: Command Ship, Rescue Pod, Fuel Canister (targets) / Asteroid, Debris, Alien Probe (distractors)
- Trial state machine: cue → isi → motion → response → feedback → gap
- Salience progression per level: glow+trail (L1) → glow+outline (L2) → outline (L3) → tint-only (L4) → near-identical (L5)
- Objects bounce off walls; curved-path motion
- Tap-to-lock with ring feedback + lock counter
- Confirm button appears only when exact required count selected
- Pause overlay with Resume + End Session
- Feedback colors: hit (green), commission (amber), missed (cyan reveal)
- Scoring: +10/-5/-2, +5 bonus per 5-streak
- Adaptive difficulty: 2 × ≥90% acc → step up; 3 × errored trials → step down
- Session summary: total score, accuracy, max streak, top level, JSON export
- Reduced-motion mode (disables background effects)
- Full `data-testid` coverage
- 12-trial default session

## Backlog

### P1
- Wire user-supplied audio files (engine hum, chime, cue tone)
- Add a simple tutorial overlay on first run
- Level step-up visual celebration

### P2
- Session length setting (short / standard / extended)
- Per-session CSV export
- Clinician dashboard (requires backend)
- Multi-session history (requires backend)
- Advanced analytics (reaction time distributions)

## Test Credentials
N/A — anonymous play, no authentication.
