import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "./Starfield";
import { SpiderWeb } from "./SpiderWeb";
import { Spider } from "./Spider";

interface SceneProps {
  onSectionSelect?: (id: string) => void;
}

export function Scene({ onSectionSelect }: SceneProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [spiderTarget, setSpiderTarget] = useState<[number, number, number] | null>(null);

  const handleNodeClick = (id: string) => {
    // Find node position via a tiny lookup, but easier: pass to web — we duplicate the lookup
    const sections = ["about", "skills", "projects", "experience", "contact"];
    const i = sections.indexOf(id);
    if (id === "home") {
      setSpiderTarget([0, 0, 0]);
    } else if (i >= 0) {
      const angle = (i / sections.length) * Math.PI * 2 - Math.PI / 2;
      const r = 12 * 0.78;
      setSpiderTarget([Math.cos(angle) * r, Math.sin(angle) * r, 0]);
    }
    onSectionSelect?.(id);
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 2000, position: [0, 0, 28] }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#000000"), 1);
        }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 10, 15]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-15, -10, 10]} intensity={0.6} color="#cccccc" />

        <Starfield count={2200} />
        <CameraRig hoveredNode={hoveredNode} />
        <SpiderWeb
          onNodeClick={handleNodeClick}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
        />
        <Spider target={spiderTarget} />
      </Canvas>
    </div>
  );
}

function CameraRig({ hoveredNode: _ }: { hoveredNode: string | null }) {
  const { camera, gl } = useThree();
  const theta = useRef(0);
  const phi = useRef(Math.PI / 2);
  const distance = useRef(28);
  const targetTheta = useRef(0);
  const targetPhi = useRef(Math.PI / 2);
  const targetDistance = useRef(28);
  const dragging = useRef(false);
  const lastMouse = useRef<[number, number]>([0, 0]);
  const lastInteraction = useRef(performance.now());

  useEffect(() => {
    const canvas = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      lastMouse.current = [e.clientX, e.clientY];
      lastInteraction.current = performance.now();
    };
    const onUp = () => (dragging.current = false);
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current[0];
      const dy = e.clientY - lastMouse.current[1];
      lastMouse.current = [e.clientX, e.clientY];
      targetTheta.current -= dx * 0.005;
      targetPhi.current = Math.max(
        0.3,
        Math.min(Math.PI - 0.3, targetPhi.current - dy * 0.005),
      );
      lastInteraction.current = performance.now();
    };
    const onWheel = (e: WheelEvent) => {
      targetDistance.current = Math.max(
        14,
        Math.min(50, targetDistance.current + e.deltaY * 0.02),
      );
      lastInteraction.current = performance.now();
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame(() => {
    const idle = performance.now() - lastInteraction.current > 3000;
    if (idle) targetTheta.current += 0.0015;

    theta.current += (targetTheta.current - theta.current) * 0.08;
    phi.current += (targetPhi.current - phi.current) * 0.08;
    distance.current += (targetDistance.current - distance.current) * 0.08;

    const x = distance.current * Math.sin(phi.current) * Math.sin(theta.current);
    const y = distance.current * Math.cos(phi.current);
    const z = distance.current * Math.sin(phi.current) * Math.cos(theta.current);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
