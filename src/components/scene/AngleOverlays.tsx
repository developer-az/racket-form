"use client";

import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import type { SkeletonDriver } from "./BiomechanicalSkeleton";

type Arc = { id: string; label: string; points: THREE.Vector3[]; labelPos: THREE.Vector3 };

/** Arc between two bones meeting at `joint`, sampled by slerping the bone directions. */
function jointArc(joint: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.Vector3[] {
  const da = a.clone().sub(joint).normalize();
  const db = b.clone().sub(joint).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(da, db);
  const pts: THREE.Vector3[] = [];
  const id = new THREE.Quaternion();
  for (let i = 0; i <= 12; i++) {
    const qi = id.clone().slerp(q, i / 12);
    pts.push(joint.clone().addScaledVector(da.clone().applyQuaternion(qi), radius));
  }
  return pts;
}

/** Horizontal line through `center` along the projected a→b direction. */
function lineAcross(center: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, half: number, y: number) {
  const d = b.clone().sub(a);
  d.y = 0;
  if (d.lengthSq() < 1e-8) d.set(1, 0, 0);
  d.normalize();
  const c = new THREE.Vector3(center.x, y, center.z);
  return [c.clone().addScaledVector(d, -half), c.clone().addScaledVector(d, half)];
}

/**
 * Angle HUD drawn on the solved skeleton: elbow and front-knee flexion at the
 * real joints, plus shoulder-line vs hip-line (X-factor) projected on a ring
 * at the pelvis. Refreshed ~10×/s to avoid Text/Line churn.
 */
export function AngleOverlays({
  driverRef,
  visible,
  accent,
  secondary,
}: {
  driverRef: RefObject<SkeletonDriver>;
  visible: boolean;
  accent: string;
  /** Hip line, so the two rotation lines read as separate channels */
  secondary: string;
}) {
  const accum = useRef(0);
  const [arcs, setArcs] = useState<Arc[]>([]);

  useFrame((_, dt) => {
    if (!visible) return;
    accum.current += dt;
    if (accum.current < 0.1) return;
    accum.current = 0;
    const p = driverRef.current?.pose;
    if (!p) return;
    const m = p.measured;
    const frontLead = p.leadAnkle.z <= p.trailAnkle.z;
    const hip = frontLead ? p.leadHip : p.trailHip;
    const knee = frontLead ? p.leadKnee : p.trailKnee;
    const ankle = frontLead ? p.leadAnkle : p.trailAnkle;
    const ringY = p.pelvis.y + 0.02;

    setArcs([
      {
        id: "elbow",
        label: `Elbow ${Math.round(m.elbowFlexion)}°`,
        points: jointArc(p.hitElbow, p.hitShoulder, p.hitWrist, 0.09),
        labelPos: p.hitElbow.clone().add(new THREE.Vector3(0, 0.1, 0)),
      },
      {
        id: "knee",
        label: `Knee ${Math.round(m.frontKneeFlexion)}°`,
        points: jointArc(knee, hip, ankle, 0.1),
        labelPos: knee.clone().add(new THREE.Vector3(0, 0.02, -0.12)),
      },
      {
        id: "shoulders",
        label: `X-factor ${Math.round(Math.abs(m.separation))}°`,
        points: lineAcross(p.pelvis, p.nonHitShoulder, p.hitShoulder, 0.32, ringY),
        labelPos: new THREE.Vector3(p.pelvis.x, ringY + 0.08, p.pelvis.z - 0.36),
      },
      {
        id: "hips",
        label: "",
        points: lineAcross(p.pelvis, p.leadHip, p.trailHip, 0.26, ringY),
        labelPos: p.pelvis.clone(),
      },
    ]);
  });

  if (!visible) return null;

  return (
    <group>
      {arcs.map((o) => (
        <group key={o.id}>
          <Line
            points={o.points}
            color={o.id === "hips" ? secondary : accent}
            lineWidth={o.id === "elbow" || o.id === "knee" ? 2.5 : 2}
            transparent
            opacity={0.9}
            depthTest={false}
          />
          {o.label && (
            <Text
              position={o.labelPos}
              fontSize={0.06}
              color={accent}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.008}
              outlineColor="#0a0b0d"
            >
              {o.label}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}
