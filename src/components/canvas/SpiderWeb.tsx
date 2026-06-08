import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WebNode } from "./WebNode";

export interface WebNodeData {
  id: string;
  label: string;
  position: [number, number, number];
  type: "primary" | "center" | "secondary";
  isContact?: boolean;
}

const SPOKES = 8;
const RINGS = 6;
const WEB_RADIUS = 12;
const SECTIONS = ["About", "Skills", "Projects", "Experience", "Contact"];

interface SpiderWebProps {
  onNodeClick?: (id: string) => void;
  hoveredNode?: string | null;
  setHoveredNode?: (id: string | null) => void;
}

export function SpiderWeb({ onNodeClick, hoveredNode, setHoveredNode }: SpiderWebProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const matRef = useRef<THREE.LineBasicMaterial>(null!);
  const glowRef = useRef<THREE.LineBasicMaterial>(null!);

  const { spokesGeo, ringsGeo, sagGeo, nodes } = useMemo(() => {
    const spokesPositions: number[] = [];
    const ringPositions: number[] = [];
    const sagPositions: number[] = [];

    // Radial spokes (straight from center)
    for (let s = 0; s < SPOKES; s++) {
      const angle = (s / SPOKES) * Math.PI * 2;
      const x = Math.cos(angle) * WEB_RADIUS;
      const y = Math.sin(angle) * WEB_RADIUS;
      spokesPositions.push(0, 0, 0, x, y, 0);
    }

    // Concentric rings — drawn as line segments between spoke intersections, with sag toward center
    for (let r = 1; r <= RINGS; r++) {
      const t = r / RINGS;
      const radius = t * WEB_RADIUS;
      for (let s = 0; s < SPOKES; s++) {
        const a1 = (s / SPOKES) * Math.PI * 2;
        const a2 = ((s + 1) / SPOKES) * Math.PI * 2;
        const x1 = Math.cos(a1) * radius;
        const y1 = Math.sin(a1) * radius;
        const x2 = Math.cos(a2) * radius;
        const y2 = Math.sin(a2) * radius;

        // Subdivide each ring segment into a sagging curve toward center for organic web look
        const segs = 6;
        const sag = 0.18 * (1 - t * 0.4);
        for (let i = 0; i < segs; i++) {
          const u1 = i / segs;
          const u2 = (i + 1) / segs;
          const p1 = sagPoint(x1, y1, x2, y2, u1, sag);
          const p2 = sagPoint(x1, y1, x2, y2, u2, sag);
          ringPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      }
    }

    // Extra drooping symbiote tendrils (sagging cross-threads)
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r1 = WEB_RADIUS * (0.3 + Math.random() * 0.6);
      const r2 = WEB_RADIUS * (0.3 + Math.random() * 0.6);
      const x1 = Math.cos(a) * r1;
      const y1 = Math.sin(a) * r1;
      const x2 = Math.cos(a + 0.4 + Math.random() * 0.6) * r2;
      const y2 = Math.sin(a + 0.4 + Math.random() * 0.6) * r2;
      const segs = 10;
      for (let j = 0; j < segs; j++) {
        const u1 = j / segs;
        const u2 = (j + 1) / segs;
        const p1 = sagPoint(x1, y1, x2, y2, u1, 0.35);
        const p2 = sagPoint(x1, y1, x2, y2, u2, 0.35);
        sagPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }

    const spokesGeo = new THREE.BufferGeometry();
    spokesGeo.setAttribute("position", new THREE.Float32BufferAttribute(spokesPositions, 3));
    const ringsGeo = new THREE.BufferGeometry();
    ringsGeo.setAttribute("position", new THREE.Float32BufferAttribute(ringPositions, 3));
    const sagGeo = new THREE.BufferGeometry();
    sagGeo.setAttribute("position", new THREE.Float32BufferAttribute(sagPositions, 3));

    // Section nodes: 5 primary along outer-ish ring, 1 center, decorative secondaries
    const nodes: WebNodeData[] = [];
    nodes.push({ id: "home", label: "HOME", position: [0, 0, 0], type: "center" });
    SECTIONS.forEach((label, i) => {
      const angle = (i / SECTIONS.length) * Math.PI * 2 - Math.PI / 2;
      const r = WEB_RADIUS * 0.78;
      nodes.push({
        id: label.toLowerCase(),
        label,
        position: [Math.cos(angle) * r, Math.sin(angle) * r, 0],
        type: "primary",
        isContact: label === "Contact",
      });
    });
    // Decorative secondary nodes at ring intersections
    for (let s = 0; s < SPOKES; s += 2) {
      for (let r = 2; r <= 4; r += 2) {
        const angle = (s / SPOKES) * Math.PI * 2;
        const radius = (r / RINGS) * WEB_RADIUS;
        nodes.push({
          id: `sec-${s}-${r}`,
          label: "",
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
          type: "secondary",
        });
      }
    }

    return { spokesGeo, ringsGeo, sagGeo, nodes };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.04;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.55 + Math.sin(t * 0.6) * 0.08;
    }
    if (glowRef.current) {
      glowRef.current.opacity = 0.18 + Math.sin(t * 0.4 + 1) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glow underlay */}
      <lineSegments geometry={spokesGeo}>
        <lineBasicMaterial
          ref={glowRef}
          color="#ffffff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={ringsGeo}>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Crisp white threads */}
      <lineSegments geometry={spokesGeo}>
        <lineBasicMaterial ref={matRef} color="#ffffff" transparent opacity={0.85} />
      </lineSegments>
      <lineSegments geometry={ringsGeo}>
        <lineBasicMaterial color="#e8e8e8" transparent opacity={0.55} />
      </lineSegments>
      <lineSegments geometry={sagGeo}>
        <lineBasicMaterial color="#cfcfcf" transparent opacity={0.3} />
      </lineSegments>

      {nodes.map((n) => (
        <WebNode
          key={n.id}
          node={n}
          hovered={hoveredNode === n.id}
          onClick={onNodeClick}
          onHover={setHoveredNode}
        />
      ))}
    </group>
  );
}

function sagPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  u: number,
  sag: number,
): THREE.Vector3 {
  const x = x1 + (x2 - x1) * u;
  const y = y1 + (y2 - y1) * u;
  // Pull point toward center proportional to sin(u*PI) for catenary-like sag
  const cx = (x1 + x2) * 0.5;
  const cy = (y1 + y2) * 0.5;
  const cLen = Math.hypot(cx, cy) || 1;
  const pull = Math.sin(u * Math.PI) * sag;
  return new THREE.Vector3(x - (cx / cLen) * pull, y - (cy / cLen) * pull, 0);
}
