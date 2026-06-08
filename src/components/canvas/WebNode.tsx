import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WebNodeData } from "./SpiderWeb";

interface WebNodeProps {
  node: WebNodeData;
  hovered: boolean;
  onClick?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function WebNode({ node, hovered, onClick, onHover }: WebNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const [phase] = useState(() => Math.random() * Math.PI * 2);

  const baseSize =
    node.type === "center" ? 0.45 : node.type === "primary" ? 0.32 : 0.12;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 1.8 + phase) * 0.08;
    const targetScale = (hovered ? 1.6 : 1) * pulse;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(targetScale);
    }
    if (haloRef.current) {
      const haloPulse = 1 + Math.sin(t * 2.2 + phase) * 0.15;
      haloRef.current.scale.setScalar((hovered ? 2.2 : 1.4) * haloPulse);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (hovered ? 0.5 : 0.25) + Math.sin(t * 1.5 + phase) * 0.08;
    }
  });

  if (node.type === "secondary") {
    return (
      <mesh position={node.position}>
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial color="#888" transparent opacity={0.6} />
      </mesh>
    );
  }

  return (
    <group position={node.position}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(node.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover?.(null);
          document.body.style.cursor = "crosshair";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(node.id);
        }}
      >
        <sphereGeometry args={[baseSize * 0.55, 24, 24]} />
        <meshBasicMaterial color={node.isContact ? "#ffffff" : "#f5f5f5"} />
      </mesh>
    </group>
  );
}
