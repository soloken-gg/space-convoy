import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Scene3D from "./Scene3D";
import HUD from "./HUD";
import ConfirmButton from "./ConfirmButton";
import WelcomeScreen from "./WelcomeScreen";
import SummaryScreen from "./SummaryScreen";
import FeedbackBanner from "./FeedbackBanner";
import PauseOverlay from "./PauseOverlay";
import {
  LEVELS,
  PHASE_TIMING,
  SCORING,
  ADAPTIVE,
  TARGET_KINDS,
  DISTRACTOR_KINDS,
} from "./levelConfig";
import {
  playLock,
  playUnlock,
  playCorrect,
  playError,
  playCue,
  playEngineHum,
  stopEngineHum,
  playStreak,
} from "./sounds";
import { hapticSelect, hapticHit, hapticMiss } from "./haptics";

const SESSION_TRIAL_COUNT = 12;

let __oidCounter = 0;
const nextObjectId = () => `obj-${++__oidCounter}-${Math.random().toString(36).slice(2, 6)}`;

function buildObjects(level) {
  const { targetCount, totalObjects } = level;
  const distractorCount = totalObjects - targetCount;
  const objs = [];
  for (let i = 0; i < targetCount; i++) {
    const kind = TARGET_KINDS[i % TARGET_KINDS.length];
    objs.push({
      id: nextObjectId(),
      kind,
      isTarget: true,
      seed: Math.random() * 100,
    });
  }
  for (let i = 0; i < distractorCount; i++) {
    const kind = DISTRACTOR_KINDS[i % DISTRACTOR_KINDS.length];
    objs.push({
      id: nextObjectId(),
      kind,
      isTarget: false,
      seed: Math.random() * 100,
    });
  }
  // Shuffle for pure visual ordering (doesn't affect physics)
  return objs.sort(() => Math.random() - 0.5);
}

export default function Game() {
  const [screen, setScreen] = useState("welcome"); // welcome | playing | paused | summary
  const [nickname, setNickname] = useState("Pilot");
  const [levelIndex, setLevelIndex] = useState(0); // 0..4
  const [phase, setPhase] = useState("gap");
  const [objects, setObjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastDelta, setLastDelta] = useState(null);
  const [streakMsg, setStreakMsg] = useState(null);
  const [trialsCompleted, setTrialsCompleted] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [trialsLog, setTrialsLog] = useState([]);

  const consecutivePerfectRef = useRef(0);
  const consecutiveErrorRef = useRef(0);
  const responseStartTsRef = useRef(null);
  const trialStartTsRef = useRef(null);
  const selectionTimesRef = useRef({}); // {objId: ts}
  const timerRef = useRef(null);

  const level = LEVELS[levelIndex];

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Trial orchestration ─────────────────────────────────────────
  const startTrial = useCallback(() => {
    if (screen !== "playing") return;
    clearTimer();
    const lvl = LEVELS[levelIndex];
    const newObjs = buildObjects(lvl);
    setObjects(newObjs);
    setSelectedIds([]);
    setFeedbackMap({});
    setLastDelta(null);
    selectionTimesRef.current = {};
    trialStartTsRef.current = Date.now();
    setPhase("cue");
    playCue();
    // cue -> isi
    timerRef.current = setTimeout(() => {
      setPhase("isi");
      timerRef.current = setTimeout(() => {
        setPhase("motion");
        playEngineHum();
        timerRef.current = setTimeout(() => {
          stopEngineHum();
          setPhase("response");
          responseStartTsRef.current = Date.now();
          // Auto-advance if user is idle (max response window)
          timerRef.current = setTimeout(() => {
            finalizeTrial(newObjs, null);
          }, PHASE_TIMING.responseMs + 3000);
        }, lvl.motionMs);
      }, PHASE_TIMING.isiMs);
    }, PHASE_TIMING.cueMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, levelIndex]);

  // Kick off first trial when entering 'playing'
  useEffect(() => {
    if (screen === "playing" && phase === "gap" && objects.length === 0) {
      startTrial();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Pause cancels pending timers; resume restarts current phase sequence
  useEffect(() => {
    if (screen === "paused") {
      clearTimer();
      stopEngineHum();
    }
  }, [screen]);

  // ── Selection handling ──────────────────────────────────────────
  const handleTap = useCallback(
    (id) => {
      if (phase !== "response") return;
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          playUnlock();
          delete selectionTimesRef.current[id];
          return prev.filter((x) => x !== id);
        }
        if (prev.length >= level.targetCount) {
          // Already locked max; ignore
          return prev;
        }
        playLock();
        hapticSelect();
        selectionTimesRef.current[id] = Date.now();
        return [...prev, id];
      });
    },
    [phase, level.targetCount],
  );

  // ── Confirm / finalize trial ────────────────────────────────────
  const finalizeTrial = useCallback(
    (objsArg, selectedArg) => {
      clearTimer();
      const objs = objsArg || objects;
      const selected = selectedArg || selectedIds;
      const targetIdsSet = new Set(
        objs.filter((o) => o.isTarget).map((o) => o.id),
      );
      const selectedSet = new Set(selected);

      const hits = [];
      const commissions = [];
      const missed = [];
      const fbMap = {};
      objs.forEach((o) => {
        const sel = selectedSet.has(o.id);
        const isT = targetIdsSet.has(o.id);
        if (sel && isT) {
          hits.push(o.id);
          fbMap[o.id] = "hit";
        } else if (sel && !isT) {
          commissions.push(o.id);
          fbMap[o.id] = "commission";
        } else if (!sel && isT) {
          missed.push(o.id);
          fbMap[o.id] = "missed";
        } else {
          fbMap[o.id] = null;
        }
      });

      let delta =
        hits.length * SCORING.hit +
        commissions.length * SCORING.commission +
        missed.length * SCORING.omission;

      const perfect = hits.length === targetIdsSet.size && commissions.length === 0;

      // Streak logic
      let newStreak = streak;
      let newMaxStreak = maxStreak;
      let newStreakMsg = null;
      if (perfect) {
        newStreak = streak + 1;
        if (newStreak >= 3 && newStreak !== streak) {
          newStreakMsg = `${newStreak} IN A ROW!`;
          playStreak();
        }
        newMaxStreak = Math.max(maxStreak, newStreak);
        // +5 bonus when rolling streak of 5 consecutive fully-correct trials
        if (newStreak > 0 && newStreak % SCORING.perfectStreakThreshold === 0) {
          delta += SCORING.perfectStreakBonus;
        }
      } else {
        newStreak = 0;
      }

      // Feedback sounds / haptics
      if (perfect) {
        playCorrect();
        hapticHit();
      } else {
        playError();
        hapticMiss();
      }

      // Compute reaction times per hit (from response-phase start)
      const rts = {};
      Object.entries(selectionTimesRef.current).forEach(([id, ts]) => {
        rts[id] = ts - (responseStartTsRef.current || ts);
      });

      // Build trial log entry
      const logEntry = {
        trialIndex: trialsCompleted + 1,
        level: level.level,
        levelLabel: level.label,
        targetCount: level.targetCount,
        totalObjects: level.totalObjects,
        speed: level.speed,
        salience: {
          glow: level.glow,
          outlineRing: level.outlineRing,
          particleTrail: level.particleTrail,
          tintShift: level.tintShift,
        },
        targetIds: [...targetIdsSet],
        selectedIds: [...selectedSet],
        hits,
        commissions,
        missed,
        reactionTimesMs: rts,
        scoreDelta: delta,
        perfect,
        timestampStart: trialStartTsRef.current,
        timestampEnd: Date.now(),
      };

      // Adaptive difficulty
      const accuracy =
        targetIdsSet.size > 0 ? hits.length / targetIdsSet.size : 0;
      let nextLevelIndex = levelIndex;
      if (accuracy >= ADAPTIVE.stepUpAccuracy) {
        consecutivePerfectRef.current += 1;
        consecutiveErrorRef.current = 0;
        if (
          consecutivePerfectRef.current >= ADAPTIVE.stepUpConsecutive &&
          levelIndex < LEVELS.length - 1
        ) {
          nextLevelIndex = levelIndex + 1;
          consecutivePerfectRef.current = 0;
        }
      } else {
        consecutivePerfectRef.current = 0;
        if (!perfect) {
          consecutiveErrorRef.current += 1;
          if (
            consecutiveErrorRef.current >= ADAPTIVE.stepDownConsecutiveErrors &&
            levelIndex > 0
          ) {
            nextLevelIndex = levelIndex - 1;
            consecutiveErrorRef.current = 0;
          }
        } else {
          consecutiveErrorRef.current = 0;
        }
      }

      setScore((s) => Math.max(0, s + delta));
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);
      setStreakMsg(newStreakMsg);
      setLastDelta(delta);
      setFeedbackMap(fbMap);
      setPhase("feedback");
      setTrialsLog((prev) => [...prev, logEntry]);

      const nextTrialIdx = trialsCompleted + 1;
      setTrialsCompleted(nextTrialIdx);

      // Feedback -> gap -> next trial or end
      timerRef.current = setTimeout(() => {
        setPhase("gap");
        setStreakMsg(null);
        if (nextTrialIdx >= SESSION_TRIAL_COUNT) {
          setScreen("summary");
          return;
        }
        if (nextLevelIndex !== levelIndex) {
          setLevelIndex(nextLevelIndex);
        }
        timerRef.current = setTimeout(() => {
          // Reset objects to trigger new-trial effect
          setObjects([]);
        }, PHASE_TIMING.gapMs);
      }, PHASE_TIMING.feedbackMs);
    },
    [
      objects,
      selectedIds,
      streak,
      maxStreak,
      trialsCompleted,
      levelIndex,
      level.level,
      level.label,
      level.targetCount,
      level.totalObjects,
      level.speed,
      level.glow,
      level.outlineRing,
      level.particleTrail,
      level.tintShift,
    ],
  );

  // Re-trigger trial when objects cleared during gap
  useEffect(() => {
    if (screen === "playing" && objects.length === 0 && phase === "gap") {
      const t = setTimeout(() => {
        startTrial();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [screen, objects.length, phase, startTrial]);

  const handleConfirm = () => {
    if (phase !== "response") return;
    if (selectedIds.length !== level.targetCount) return;
    finalizeTrial(null, null);
  };

  const handleStart = (name) => {
    setNickname(name);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLevelIndex(0);
    setTrialsCompleted(0);
    setTrialsLog([]);
    setObjects([]);
    setSelectedIds([]);
    setFeedbackMap({});
    setPhase("gap");
    consecutivePerfectRef.current = 0;
    consecutiveErrorRef.current = 0;
    setScreen("playing");
  };

  const handlePause = () => {
    if (screen === "playing") setScreen("paused");
  };
  const handleResume = () => {
    if (screen === "paused") {
      setScreen("playing");
      // Restart from a clean trial (safest — preserves stimulus control)
      setObjects([]);
      setSelectedIds([]);
      setFeedbackMap({});
      setPhase("gap");
    }
  };
  const handleEndSession = () => {
    clearTimer();
    stopEngineHum();
    setScreen("summary");
  };

  const handlePlayAgain = () => {
    handleStart(nickname);
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      nickname,
      finalScore: score,
      maxStreak,
      totalTrials: trialsLog.length,
      trials: trialsLog,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `space-convoy-${nickname}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const confirmEnabled =
    phase === "response" && selectedIds.length === level.targetCount;
  const correctTrials = trialsLog.filter((t) => t.perfect).length;

  return (
    <div
      className={`stage-portrait no-select ${reducedMotion ? "reduced-motion" : ""}`}
    >
      <div
        className="stage-portrait__inner"
        data-testid="game-stage"
      >
        {/* 3D Scene is always mounted so welcome shows the background too */}
        <Scene3D
          objects={screen === "playing" ? objects : []}
          phase={phase}
          salience={level}
          selectedIds={selectedIds}
          feedbackMap={feedbackMap}
          onTap={handleTap}
          reducedMotion={reducedMotion}
        />

        {screen === "playing" && (
          <>
            <HUD
              score={score}
              level={level.level}
              levelLabel={level.label}
              targetCount={level.targetCount}
              streak={streak}
              onPause={handlePause}
              phase={phase}
            />
            <FeedbackBanner
              delta={phase === "feedback" ? lastDelta : null}
              streakMsg={streakMsg}
            />
            <ConfirmButton
              visible={phase === "response"}
              enabled={confirmEnabled}
              selectedCount={selectedIds.length}
              requiredCount={level.targetCount}
              onClick={handleConfirm}
            />
            <div
              className="absolute left-4 bottom-4 text-[10px] uppercase tracking-[0.25em] text-white/40 font-primary"
              data-testid="trial-counter"
            >
              Trial {Math.min(trialsCompleted + 1, SESSION_TRIAL_COUNT)} /{" "}
              {SESSION_TRIAL_COUNT}
            </div>
          </>
        )}

        <AnimatePresence>
          {screen === "paused" && (
            <PauseOverlay onResume={handleResume} onEnd={handleEndSession} />
          )}
        </AnimatePresence>

        {screen === "welcome" && (
          <WelcomeScreen
            onStart={handleStart}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={() => setReducedMotion((r) => !r)}
          />
        )}

        {screen === "summary" && (
          <SummaryScreen
            session={{
              nickname,
              score,
              maxStreak,
              trials: trialsLog,
              correctTrials,
            }}
            onPlayAgain={handlePlayAgain}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}
