import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Parallax star field: three depth layers of points
export function Starfield({ count = 280 }) {
  const layers = useMemo(() => {
    const make = (n, spread, sizeMin, sizeMax, opacity) => {
      const positions = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * spread.x;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
        positions[i * 3 + 2] = spread.z;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const size = (sizeMin + sizeMax) / 2;
      return { geometry, opacity, size };
    };
    return [
      make(Math.floor(count * 0.5), { x: 14, y: 24, z: -6 }, 0.02, 0.05, 0.4),
      make(Math.floor(count * 0.3), { x: 12, y: 20, z: -4 }, 0.03, 0.07, 0.6),
      make(Math.floor(count * 0.2), { x: 10, y: 18, z: -2 }, 0.04, 0.1, 0.9),
    ];
  }, [count]);

  const refs = [useRef(), useRef(), useRef()];

  useFrame((state, delta) => {
    refs.forEach((r, i) => {
      if (r.current) {
        r.current.rotation.z += delta * 0.002 * (i + 1);
        r.current.position.y += delta * 0.01 * (i + 1);
        if (r.current.position.y > 2) r.current.position.y = -2;
      }
    });
  });

  return (
    <group>
      {layers.map((layer, idx) => (
        <points
          key={idx}
          ref={refs[idx]}
          geometry={layer.geometry}
        >
          <pointsMaterial
            color="#ffffff"
            size={layer.size}
            transparent
            opacity={layer.opacity}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  );
}

// Soft nebula clouds: large low-opacity sprites that drift
export function Nebula() {
  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref1.current) {
      ref1.current.position.x = -1.5 + Math.sin(t * 0.05) * 0.5;
      ref1.current.position.y = 2 + Math.cos(t * 0.03) * 0.5;
    }
    if (ref2.current) {
      ref2.current.position.x = 1.5 + Math.sin(t * 0.04 + 1) * 0.5;
      ref2.current.position.y = -2.5 + Math.cos(t * 0.05 + 2) * 0.5;
    }
    if (ref3.current) {
      ref3.current.position.x = Math.sin(t * 0.03 + 3) * 1.5;
      ref3.current.position.y = 0 + Math.cos(t * 0.025 + 4) * 1;
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <mesh ref={ref1}>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial
          color="#5A189A"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ref2}>
        <circleGeometry args={[3.5, 32]} />
        <meshBasicMaterial
          color="#00B4D8"
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ref3}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial
          color="#3a1d6e"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
