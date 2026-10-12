"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Static court — shared materials, no shadow maps, low segment counts */
export function TennisCourt() {
  const courtW = 10.97;
  const courtL = 23.77;
  const singlesW = 8.23;

  const { theme } = useTheme();
  const dark = theme === "dark";

  // Neutral lab floor: the court reads as a measurement surface, not a venue
  const mats = useMemo(
    () => ({
      ground: new THREE.MeshLambertMaterial({ color: dark ? "#0d0f12" : "#eceef0" }),
      outer: new THREE.MeshLambertMaterial({ color: dark ? "#14171b" : "#e4e6e9" }),
      inner: new THREE.MeshLambertMaterial({ color: dark ? "#1a1e23" : "#dadde1" }),
      line: new THREE.MeshBasicMaterial({ color: dark ? "#59616c" : "#ffffff" }),
      net: new THREE.MeshLambertMaterial({ color: dark ? "#8b939e" : "#5a626d", transparent: true, opacity: 0.22 }),
      tape: new THREE.MeshBasicMaterial({ color: dark ? "#cfd4da" : "#ffffff" }),
      post: new THREE.MeshLambertMaterial({ color: dark ? "#3a4048" : "#2a2f36" }),
      mark: new THREE.MeshBasicMaterial({ color: dark ? "#59616c" : "#ffffff", transparent: true, opacity: 0.25 }),
    }),
    [dark],
  );

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={mats.ground}>
        <planeGeometry args={[40, 50]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.outer}>
        <planeGeometry args={[courtW + 7, courtL + 8]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={mats.inner}>
        <planeGeometry args={[courtW, courtL]} />
      </mesh>

      <CourtLine w={courtW} d={0.05} z={courtL / 2} material={mats.line} />
      <CourtLine w={courtW} d={0.05} z={-courtL / 2} material={mats.line} />
      <CourtLine w={0.05} d={courtL} x={courtW / 2} material={mats.line} />
      <CourtLine w={0.05} d={courtL} x={-courtW / 2} material={mats.line} />
      <CourtLine w={singlesW} d={0.05} z={0} material={mats.line} />
      <CourtLine w={0.05} d={courtL} x={singlesW / 2} material={mats.line} />
      <CourtLine w={0.05} d={courtL} x={-singlesW / 2} material={mats.line} />
      <CourtLine w={singlesW} d={0.05} z={6.4} material={mats.line} />
      <CourtLine w={singlesW} d={0.05} z={-6.4} material={mats.line} />
      <CourtLine w={0.05} d={12.8} x={0} material={mats.line} />

      <mesh position={[0, 0.53, 0]} material={mats.net}>
        <boxGeometry args={[courtW + 0.6, 1.07, 0.04]} />
      </mesh>
      <mesh position={[0, 1.07, 0]} material={mats.tape}>
        <boxGeometry args={[courtW + 0.8, 0.03, 0.03]} />
      </mesh>
      <mesh position={[courtW / 2 + 0.35, 0.55, 0]} material={mats.post}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
      </mesh>
      <mesh position={[-(courtW / 2 + 0.35), 0.55, 0]} material={mats.post}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 12]} material={mats.mark}>
        <circleGeometry args={[2.2, 24]} />
      </mesh>
    </group>
  );
}

function CourtLine({
  w,
  d,
  x = 0,
  z = 0,
  material,
}: {
  w: number;
  d: number;
  x?: number;
  z?: number;
  material: THREE.Material;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} material={material}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}
