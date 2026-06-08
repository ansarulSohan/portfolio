import { useMemo } from "react";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

export function Starfield({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 0] = (Math.random() - 0.5) * 200;
      arr[i3 + 1] = (Math.random() - 0.5) * 200;
      arr[i3 + 2] = (Math.random() - 0.5) * 200;
    }
    return arr;
  }, [count]);

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={new THREE.Color("#ffffff")}
        size={0.12}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

