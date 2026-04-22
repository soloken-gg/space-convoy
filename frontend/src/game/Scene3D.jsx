import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Starfield, Nebula } from "./Starfield";
import { GameObject } from "./Objects3D";

// World-plane bouncing object controller
function ObjectsGroup({
  objects,
  phase,
  salience,
  selectedIds,
  feedbackMap,
  onTap,
}) {
  const { viewport } = useThree();
  const groupRefs = useRef({});
  const velRef = useRef({});
  const seededRef = useRef(false);
  const selectable = phase === "response";

  // Seed initial positions & velocities when objects list changes
  useEffect(() => {
    const halfW = viewport.width / 2 - 0.6;
    const halfH = viewport.height / 2 - 0.6;
    velRef.current = {};
    seededRef.current = false;

    objects.forEach((obj) => {
      velRef.current[obj.id] = {
        x: (Math.random() - 0.5) * 2 * salience.speed,
        y: (Math.random() - 0.5) * 2 * salience.speed,
      };
    });

    // Set initial positions (non-overlapping) via refs
    const placed = [];
    objects.forEach((obj) => {
      let tries = 0;
      let x,
        y,
        ok = false;
      while (!ok && tries < 40) {
        x = (Math.random() - 0.5) * 2 * halfW;
        y = (Math.random() - 0.5) * 2 * halfH;
        ok = placed.every(
          (p) => Math.hypot(p.x - x, p.y - y) > 1.1,
        );
        tries++;
      }
      placed.push({ x, y });
      const g = groupRefs.current[obj.id];
      if (g) {
        g.position.set(x, y, 0);
      }
    });
    seededRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects]);

  useFrame((state, delta) => {
    if (phase !== "motion") return;
    const halfW = viewport.width / 2 - 0.55;
    const halfH = viewport.height / 2 - 0.55;
    const t = state.clock.elapsedTime;

    objects.forEach((obj) => {
      const g = groupRefs.current[obj.id];
      const v = velRef.current[obj.id];
      if (!g || !v) return;
      // Curved path: add a small sinusoidal perpendicular perturbation
      const perpX = -v.y;
      const perpY = v.x;
      const wobble = Math.sin(t * 1.2 + obj.seed) * 0.35;
      g.position.x += (v.x + perpX * wobble * 0.1) * delta;
      g.position.y += (v.y + perpY * wobble * 0.1) * delta;

      // Wall bounce
      if (g.position.x > halfW) {
        g.position.x = halfW;
        v.x = -Math.abs(v.x);
      } else if (g.position.x < -halfW) {
        g.position.x = -halfW;
        v.x = Math.abs(v.x);
      }
      if (g.position.y > halfH) {
        g.position.y = halfH;
        v.y = -Math.abs(v.y);
      } else if (g.position.y < -halfH) {
        g.position.y = -halfH;
        v.y = Math.abs(v.y);
      }
    });
  });

  return (
    <group>
      {objects.map((obj) => (
        <GameObject
          key={obj.id}
          ref={(el) => (groupRefs.current[obj.id] = el)}
          obj={obj}
          phase={phase}
          salience={salience}
          selected={selectedIds.includes(obj.id)}
          feedback={feedbackMap[obj.id]}
          selectable={selectable}
          onTap={onTap}
        />
      ))}
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[-3, 5, 4]}
        intensity={1.3}
        color="#e8f4ff"
      />
      <directionalLight
        position={[3, -4, 3]}
        intensity={0.75}
        color="#00B4D8"
      />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#5A189A" />
    </>
  );
}

export default function Scene3D({
  objects,
  phase,
  salience,
  selectedIds,
  feedbackMap,
  onTap,
  reducedMotion,
}) {
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0A1628", 1);
      }}
    >
      <Lights />
      {!reducedMotion && <Starfield count={280} />}
      {!reducedMotion && <Nebula />}
      <ObjectsGroup
        objects={objects}
        phase={phase}
        salience={salience}
        selectedIds={selectedIds}
        feedbackMap={feedbackMap}
        onTap={onTap}
      />
    </Canvas>
  );
}
