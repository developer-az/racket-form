"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Anthropometrics, StrokeProfile } from "@/types/biomechanics";
import { contactPoint, getStrokeMotion } from "@/lib/motion/solver";

const BALL_R = 0.034; // ITF: 6.54–6.86 cm diameter
const G = 9.81;

/**
 * Ball timing cue. Groundstrokes/volleys: the ball arrives from the net side and
 * meets the string bed at the contact frame, then leaves toward the target.
 * Serve: the toss leaves the off hand, peaks above the contact point and drops
 * into it. Purely kinematic (parabolic arcs in normalized stroke time).
 */
export function StrokeBall({
  stroke,
  anthropometrics,
  tRef,
}: {
  stroke: StrokeProfile;
  anthropometrics: Anthropometrics;
  tRef: RefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const path = useMemo(() => {
    const motion = getStrokeMotion(stroke, anthropometrics.heightM);
    const contact = contactPoint(stroke, anthropometrics);
    return { contact, contactT: motion.contactT, tossT: motion.tossT };
  }, [stroke, anthropometrics]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = tRef.current ?? 0;
    const { contact, contactT, tossT } = path;
    const isServe = stroke.type === "serve";
    const inbound = isServe ? contactT - tossT : 0.22;
    const outbound = 0.12;
    const dtIn = contactT - t;
    const dtOut = t - contactT;

    if (dtIn >= 0 && dtIn <= inbound) {
      m.visible = true;
      const u = 1 - dtIn / inbound; // 0 → 1 toward contact
      if (isServe) {
        // Toss from release height to contact with a 0.45 m apex above contact
        const y0 = contact.y - 1.05;
        const apex = 0.45;
        const yPeak = contact.y + apex;
        // Rise then fall: piecewise parabola with the peak at 70% of the flight
        const k = 0.7;
        const y =
          u < k
            ? y0 + (yPeak - y0) * (1 - (1 - u / k) ** 2)
            : yPeak - apex * ((u - k) / (1 - k)) ** 2;
        m.position.set(contact.x - 0.05 * (1 - u), y, contact.z + 0.12 * (1 - u));
      } else {
        // Incoming from the net side with a shallow descending arc
        const dist = 7 * (1 - u);
        const drop = 0.5 * G * 0.012 * dist * dist;
        m.position.set(contact.x * (0.6 + 0.4 * u), contact.y + 0.05 * dist - drop * 0.15, contact.z - dist);
      }
      return;
    }
    if (dtOut > 0 && dtOut <= outbound) {
      m.visible = true;
      const u = dtOut / outbound;
      const dist = 9 * u;
      const rise = isServe ? -1.2 * u : 0.6 * Math.sin(u * Math.PI * 0.6);
      m.position.set(contact.x * (1 - 0.5 * u), contact.y + rise, contact.z - dist);
      return;
    }
    m.visible = false;
  });

  return (
    <mesh ref={mesh} visible={false}>
      <sphereGeometry args={[BALL_R, 14, 14]} />
      <meshLambertMaterial color="#dfff4f" emissive="#9fbf1f" emissiveIntensity={0.35} />
    </mesh>
  );
}
