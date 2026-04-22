import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Salience-driven visual for each game object.
 * Phase drives which cues are active:
 *  - "cue"      : targets show full cue (glow + outline + trail based on level)
 *  - "isi"      : fades back to neutral; additional distractors fade in
 *  - "motion"   : all objects visually identical (except per-level subtle tint)
 *  - "response" : all frozen, neutral
 *  - "feedback" : override colour per selection result
 */

const COLORS = {
  cyan: new THREE.Color("#00B4D8"),
  cyanDim: new THREE.Color("#0A4F66"),
  grey: new THREE.Color("#3a4456"),
  greySubtle: new THREE.Color("#4a556a"),
  green: new THREE.Color("#06D6A0"),
  amber: new THREE.Color("#F4A261"),
  violet: new THREE.Color("#5A189A"),
};

function getBodyColor({ isTarget, phase, salience, feedback }) {
  // Feedback phase: explicit colour for every object
  if (phase === "feedback") {
    if (feedback === "hit") return COLORS.green;
    if (feedback === "commission") return COLORS.amber;
    if (feedback === "missed") return COLORS.cyan;
    return isTarget ? COLORS.greySubtle : COLORS.grey;
  }
  if (phase === "cue" && isTarget) {
    return COLORS.cyan;
  }
  // Motion / response / isi: per-level tint shift for targets only (salience erosion)
  if (isTarget && salience.tintShift > 0 && phase !== "isi") {
    // Blend cyanDim toward grey by tintShift
    const c = COLORS.cyanDim.clone().lerp(COLORS.grey, salience.tintShift);
    return c;
  }
  return COLORS.grey;
}

function getEmissive({ isTarget, phase, salience, feedback, selected }) {
  if (phase === "feedback") {
    if (feedback === "hit") return { color: COLORS.green, intensity: 1.2 };
    if (feedback === "commission") return { color: COLORS.amber, intensity: 0.8 };
    if (feedback === "missed") return { color: COLORS.cyan, intensity: 0.9 };
    return { color: COLORS.grey, intensity: 0 };
  }
  if (selected) return { color: COLORS.cyan, intensity: 0.6 };
  if (phase === "cue" && isTarget) {
    return { color: COLORS.cyan, intensity: 0.4 + salience.glow * 0.8 };
  }
  if (phase === "isi" && isTarget) {
    return { color: COLORS.cyan, intensity: 0.1 * salience.glow };
  }
  // Subtle self-illumination on all objects during neutral phases
  return { color: COLORS.grey, intensity: 0.15 };
}

// ─── Geometry components ─────────────────────────────────────────
const CommandShip = () => (
  <group>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <coneGeometry args={[0.22, 0.55, 4]} />
      <meshStandardMaterial metalness={0.6} roughness={0.35} />
    </mesh>
    <mesh position={[-0.1, 0, 0]}>
      <boxGeometry args={[0.15, 0.35, 0.08]} />
      <meshStandardMaterial metalness={0.7} roughness={0.4} />
    </mesh>
  </group>
);

const RescuePod = () => (
  <group>
    <mesh>
      <capsuleGeometry args={[0.2, 0.3, 6, 12]} />
      <meshStandardMaterial metalness={0.4} roughness={0.5} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.23, 0.035, 8, 24]} />
      <meshStandardMaterial metalness={0.5} roughness={0.35} />
    </mesh>
  </group>
);

const FuelCanister = () => (
  <group>
    <mesh rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.5, 6]} />
      <meshStandardMaterial metalness={0.55} roughness={0.4} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[0.1, 0.1, 0.52, 12]} />
      <meshStandardMaterial metalness={0.3} roughness={0.3} />
    </mesh>
  </group>
);

const Asteroid = () => (
  <mesh>
    <icosahedronGeometry args={[0.28, 0]} />
    <meshStandardMaterial
      color="#3a3f4c"
      metalness={0.1}
      roughness={0.95}
      flatShading
    />
  </mesh>
);

const Debris = () => (
  <group>
    <mesh rotation={[0.3, 0.5, 0.2]}>
      <boxGeometry args={[0.3, 0.18, 0.12]} />
      <meshStandardMaterial color="#52586a" metalness={0.6} roughness={0.4} />
    </mesh>
    <mesh position={[0.08, 0.12, 0.05]} rotation={[1.1, 0.6, 0.9]}>
      <boxGeometry args={[0.1, 0.08, 0.06]} />
      <meshStandardMaterial color="#42485a" metalness={0.6} roughness={0.4} />
    </mesh>
  </group>
);

const AlienProbe = () => (
  <group>
    <mesh>
      <sphereGeometry args={[0.22, 20, 20]} />
      <meshStandardMaterial color="#8a94a8" metalness={0.8} roughness={0.25} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.32, 0.02, 8, 28]} />
      <meshStandardMaterial color="#b0bac6" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.32, 0.02, 8, 28]} />
      <meshStandardMaterial color="#b0bac6" metalness={0.9} roughness={0.2} />
    </mesh>
  </group>
);

const SHAPE_MAP = {
  command: CommandShip,
  rescue: RescuePod,
  fuel: FuelCanister,
  asteroid: Asteroid,
  debris: Debris,
  probe: AlienProbe,
};

// ─── One game object (with full lifecycle) ───────────────────────
export const GameObject = React.forwardRef(function GameObject(
  { obj, phase, salience, selected, feedback, selectable, onTap },
  ref,
) {
  const bodyRef = useRef();
  const ringRef = useRef();
  const trailRef = useRef();

  const isTarget = obj.isTarget;
  const Shape = SHAPE_MAP[obj.kind] || Asteroid;

  // Subtle local rotation during all phases
  useFrame((state, delta) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.35;
      bodyRef.current.rotation.x += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.4;
    }
  });

  const bodyColor = getBodyColor({ isTarget, phase, salience, feedback });
  const emissive = getEmissive({
    isTarget,
    phase,
    salience,
    feedback,
    selected,
  });

  // Paint materials
  useFrame(() => {
    if (!bodyRef.current) return;
    bodyRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.color) child.material.color.copy(bodyColor);
        if (child.material.emissive) {
          child.material.emissive.copy(emissive.color);
          child.material.emissiveIntensity = emissive.intensity;
        }
      }
    });
  });

  // Show outline ring when: targets in cue/isi phase (ring salience), OR selected, OR feedback missed
  const ringActive =
    selected ||
    (phase === "cue" && isTarget && salience.outlineRing) ||
    (phase === "isi" && isTarget && salience.outlineRing) ||
    (phase === "feedback" && feedback === "missed");

  const ringColor = useMemo(() => {
    if (selected) return "#00B4D8";
    if (feedback === "hit") return "#06D6A0";
    if (feedback === "commission") return "#F4A261";
    if (feedback === "missed") return "#00B4D8";
    return "#00B4D8";
  }, [selected, feedback]);

  // Particle trail: only at Level 1 cue
  const showTrail = salience.particleTrail && phase === "cue" && isTarget;

  return (
    <group
      ref={ref}
      onPointerDown={(e) => {
        if (!selectable) return;
        e.stopPropagation();
        onTap(obj.id);
      }}
    >
      {/* Large transparent hitbox for touch-friendly tap targets.
          NOTE: visible={true} is required — Three.js raycaster skips
          invisible objects, so visible={false} would break tapping. */}
      <mesh>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyRef}>
        <Shape />
      </group>

      {/* Glow halo for targets during cue (fades by salience.glow) */}
      {phase === "cue" && isTarget && salience.glow > 0 && (
        <mesh>
          <sphereGeometry args={[0.55, 20, 20]} />
          <meshBasicMaterial
            color="#00B4D8"
            transparent
            opacity={0.12 * salience.glow}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Selection / cue outline ring */}
      {ringActive && (
        <mesh ref={ringRef} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.48, 0.55, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Particle trail (L1 only) */}
      {showTrail && (
        <group ref={trailRef}>
          {[0.15, 0.3, 0.45].map((d, i) => (
            <mesh key={i} position={[-d, 0, -0.05]}>
              <sphereGeometry args={[0.08 - i * 0.02, 8, 8]} />
              <meshBasicMaterial
                color="#00B4D8"
                transparent
                opacity={0.5 - i * 0.15}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
});
