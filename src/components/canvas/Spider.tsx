import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SpiderProps {
  target: [number, number, number] | null;
  onArrival?: () => void;
}

export function Spider({ target, onArrival }: SpiderProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const legsRef = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Mesh>(null!);
  const eyeR = useRef<THREE.Mesh>(null!);
  const pos = useRef(new THREE.Vector3(0, 0, 0.3));
  const start = useRef(new THREE.Vector3(0, 0, 0.3));
  const targetVec = useRef<THREE.Vector3 | null>(null);
  const progress = useRef(1);
  const lastTarget = useRef<string>("");

  const legs = useMemo(() => {
    const arr: { side: 1 | -1; angle: number; phase: number }[] = [];
    for (const s of [1, -1] as const) {
      for (let i = 0; i < 4; i++) {
        const angle = -0.4 + (i / 3) * 0.8;
        arr.push({ side: s, angle, phase: i * 0.4 + (s === 1 ? 0 : 0.6) });
      }
    }
    return arr;
  }, []);

  // Detect target change
  if (target) {
    const key = target.join(",");
    if (key !== lastTarget.current) {
      lastTarget.current = key;
      start.current.copy(pos.current);
      targetVec.current = new THREE.Vector3(...target).add(new THREE.Vector3(0, 0, 0.3));
      progress.current = 0;
    }
  }

  useFrame((_, dt) => {
    const t = performance.now() / 1000;

    // Traversal
    if (targetVec.current && progress.current < 1) {
      progress.current = Math.min(1, progress.current + dt / 1.2);
      const p = easeInOutCubic(progress.current);
      pos.current.lerpVectors(start.current, targetVec.current, p);
      // Arc bump on Z axis
      pos.current.z = start.current.z + (targetVec.current.z - start.current.z) * p +
        Math.sin(progress.current * Math.PI) * 0.6;
      if (progress.current >= 1) {
        onArrival?.();
      }
    }

    if (groupRef.current) {
      const bob = Math.sin(t * 1.5) * 0.04;
      groupRef.current.position.set(
        pos.current.x,
        pos.current.y,
        pos.current.z + bob,
      );
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;
      // Face direction of travel
      if (targetVec.current && progress.current < 1) {
        const dir = new THREE.Vector3().subVectors(targetVec.current, start.current);
        groupRef.current.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;
      }
    }

    // Animate legs
    if (legsRef.current) {
      const speed = progress.current < 1 ? 8 : 2;
      legsRef.current.children.forEach((leg, i) => {
        const data = legs[i];
        if (!data) return;
        const wobble = Math.sin(t * speed + data.phase) * 0.25;
        leg.rotation.x = wobble;
        leg.rotation.z = data.side * (0.6 + Math.sin(t * speed + data.phase) * 0.15);
      });
    }

    // Eye glint
    const eyePulse = 0.7 + Math.sin(t * 3) * 0.3;
    if (eyeL.current)
      (eyeL.current.material as THREE.MeshBasicMaterial).color.setScalar(eyePulse);
    if (eyeR.current)
      (eyeR.current.material as THREE.MeshBasicMaterial).color.setScalar(eyePulse);
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh scale={[0.5, 0.35, 0.6]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.45, 0.05]} scale={[0.32, 0.28, 0.32]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* White symbiote spider emblem on back */}
      <mesh position={[0, 0, 0.22]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.18, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      {/* Eyes */}
      <mesh ref={eyeL} position={[-0.1, 0.55, 0.25]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={eyeR} position={[0.1, 0.55, 0.25]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Legs */}
      <group ref={legsRef}>
        {legs.map((leg, i) => (
          <group
            key={i}
            position={[leg.side * 0.18, leg.angle * 0.4, 0]}
            rotation={[0, 0, leg.side * 0.6]}
          >
            <mesh position={[leg.side * 0.3, 0, 0]} rotation={[0, 0, leg.side * 0.4]}>
              <cylinderGeometry args={[0.025, 0.02, 0.6, 6]} />
              <meshStandardMaterial color="#0a0a0a" />
            </mesh>
            <mesh position={[leg.side * 0.55, -0.15, 0]} rotation={[0, 0, leg.side * 1.0]}>
              <cylinderGeometry args={[0.02, 0.012, 0.5, 6]} />
              <meshStandardMaterial color="#080808" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
