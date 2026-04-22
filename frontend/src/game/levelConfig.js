// Space Convoy — Level parameters
// Enforce rules: never bump speed AND target count together.
// Max 5 targets, max 14 objects total.
// Salience drops BEFORE cognitive load rises.

export const LEVELS = [
  {
    level: 1,
    targetCount: 2,
    totalObjects: 6,
    speed: 1.4, // world units / second
    motionMs: 3000,
    // Salience profile
    glow: 1.0,
    outlineRing: true,
    particleTrail: true,
    tintShift: 0, // 0..1
    label: "INIT",
  },
  {
    level: 2,
    targetCount: 3,
    totalObjects: 8,
    speed: 1.4,
    motionMs: 3600,
    glow: 0.7,
    outlineRing: true,
    particleTrail: false,
    tintShift: 0,
    label: "SCOUT",
  },
  {
    level: 3,
    targetCount: 3,
    totalObjects: 10,
    speed: 1.8,
    motionMs: 4200,
    glow: 0.3,
    outlineRing: true,
    particleTrail: false,
    tintShift: 0.1,
    label: "CRUISE",
  },
  {
    level: 4,
    targetCount: 4,
    totalObjects: 12,
    speed: 1.8,
    motionMs: 5000,
    glow: 0.0,
    outlineRing: false,
    particleTrail: false,
    tintShift: 0.35,
    label: "VEIL",
  },
  {
    level: 5,
    targetCount: 4,
    totalObjects: 14,
    speed: 2.3,
    motionMs: 6000,
    glow: 0.0,
    outlineRing: false,
    particleTrail: false,
    tintShift: 0.55, // near-identical, only cue flash at trial start
    label: "GHOST",
  },
];

export const PHASE_TIMING = {
  cueMs: 1500,
  isiMs: 700,
  // motionMs comes from level
  responseMs: 2500,
  feedbackMs: 1000,
  gapMs: 600,
};

export const SCORING = {
  hit: 10,
  commission: -5,
  omission: -2,
  perfectStreakBonus: 5,
  perfectStreakThreshold: 5,
};

export const ADAPTIVE = {
  stepUpAccuracy: 0.9, // require >= 90% for 2 trials
  stepUpConsecutive: 2,
  stepDownConsecutiveErrors: 3, // 3 consecutive errored trials -> step down
};

// Target shapes and distractor shapes
export const TARGET_KINDS = ["command", "rescue", "fuel"];
export const DISTRACTOR_KINDS = ["asteroid", "debris", "probe"];
