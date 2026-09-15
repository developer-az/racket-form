"use client";

import { useEffect, useState } from "react";
import type { PaddleProfile } from "@/types/pickleball";
import { ScoreGrid } from "@/components/gear/ScoreMeter";
import { EquipmentThumb } from "@/components/gear/EquipmentThumb";
import { brandAccent } from "@/lib/equipment/media/brandColors";
import { hasExternalPaddlePhoto, paddleImageUrl } from "@/lib/pickleball/media";
import { paddleCoachingTips, paddleProUse } from "@/lib/pickleball/paddleTips";
import { paddleMoldEffect } from "@/lib/pickleball/paddleMold";
import { usePaddleStore } from "@/store/paddleStore";
import { ShotGeometryPanel } from "./PickleDiagrams";
import { PaddleCustomizePanel } from "./PaddleCustomizePanel";

type InspectorTab = "play" | "specs" | "customize" | "pro";

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "play", label: "Play" },
  { id: "specs", label: "Specs" },
  { id: "customize", label: "Customize" },
  { id: "pro", label: "Pro" },
];

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function balanceLabel(balance: number, balanceMm?: number | null) {
  if (balanceMm != null) {
    const lean = balanceMm >= 245 ? "head-forward" : balanceMm <= 232 ? "handle-biased" : "even";
    return `${balanceMm} mm · ${lean}`;
  }
  if (balance > 0.15) return "Head-forward";
  if (balance < -0.15) return "Handle-biased";
  return "Even";
}

function provenanceLabel(p: PaddleProfile) {
  if (p.specsProvenance === "pickleball-effect-lab") return "Lab-measured specs";
  if (p.specsProvenance === "coaching-estimate") return "Coaching estimate";
  return "Catalog specs";
}

function tierBadge(p: PaddleProfile) {
  if (p.catalogTier === "lab-measured") return "Lab";
  if (p.catalogTier === "tour-seed") return "Tour seed";
  return undefined;
}

export function PaddleInspector({ paddle }: { paddle: PaddleProfile }) {
  const [tab, setTab] = useState<InspectorTab>("play");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const setup = usePaddleStore((s) => s.setup);
  const tips = paddleCoachingTips(paddle);
  const pro = paddleProUse(paddle);
  const tape = hydrated ? setup.tape : [];
  const overgrips = hydrated ? setup.overgrips : 0;
  const mold = paddleMoldEffect(paddle, tape, overgrips);
  const inBag = hydrated && setup.paddleId === paddle.id;

  return (
    <article className="sf-panel space-y-4 overflow-hidden p-4 md:p-5">
      <div className="flex gap-4">
        <EquipmentThumb
          src={paddleImageUrl(paddle)}
          alt={`${paddle.brand} ${paddle.name}`}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{ color: brandAccent(paddle.brand) }}
          >
            {paddle.brand}
            {tierBadge(paddle) ? ` · ${tierBadge(paddle)}` : ""}
            {inBag ? " · yours" : ""}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight md:text-2xl">
            {paddle.name}
          </h3>
          <p className="mt-1 text-[10px] tracking-[0.1em] text-[var(--muted)] uppercase">
            {paddle.shape} · {paddle.core} · {paddle.texture}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            {provenanceLabel(paddle)}
            {hasExternalPaddlePhoto(paddle.id) ? " · TW photo" : " · SVG portrait"}
          </p>
        </div>
      </div>

      <div className="sf-tab-track" role="tablist" aria-label="Paddle inspector">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className="sf-tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "play" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{paddle.feel}</p>
          {paddle.tourPresence ? (
            <p className="border-l border-[var(--line-strong)] pl-3 text-xs leading-relaxed text-[var(--foreground)]/85">
              {paddle.tourPresence}
            </p>
          ) : null}
          {tips.length > 0 ? (
            <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)]/50 p-3.5">
              <p className="sf-kicker sf-kicker-muted">How to play this paddle</p>
              <ul className="mt-2.5 space-y-2.5">
                {tips.map((tip) => (
                  <li
                    key={tip}
                    className="border-l border-[var(--line-strong)] pl-3 text-sm leading-relaxed text-[var(--foreground)]/90"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ScoreGrid
            scores={[
              { label: "Power", value: paddle.power, accent: "var(--chart-power)" },
              { label: "Control", value: paddle.control, accent: "var(--chart-control)" },
              { label: "Spin", value: paddle.spin, accent: "var(--chart-spin)" },
              { label: "Pop", value: paddle.pop, accent: "var(--amber)" },
              { label: "Sweet spot", value: paddle.sweetSpot, accent: "var(--sky)" },
            ]}
          />
        </div>
      ) : null}

      {tab === "specs" ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Spec label="Weight" value={`${paddle.weightOz.toFixed(2)} oz`} />
          <Spec
            label="Thickness"
            value={paddle.thicknessMm != null ? `${paddle.thicknessMm} mm` : "—"}
          />
          <Spec label="Swingweight" value={paddle.swingweight != null ? String(paddle.swingweight) : "—"} />
          <Spec label="Twist weight" value={paddle.twistWeight != null ? String(paddle.twistWeight) : "—"} />
          <Spec label="Balance" value={balanceLabel(paddle.balance, paddle.balanceMm)} />
          <Spec
            label="Grip"
            value={`${paddle.gripCircumferenceIn}"${paddle.gripLengthIn != null ? ` · ${paddle.gripLengthIn}" long` : ""}`}
          />
          <Spec
            label="Face / grit"
            value={`${paddle.face.replace("-", " ")} · ${paddle.texture}${paddle.measured?.gritType ? ` (${paddle.measured.gritType})` : ""}`}
          />
          <Spec label="Edge" value={paddle.edgeGuard.replace("-", " ")} />
          {paddle.measured?.spinRpm != null ? (
            <Spec label="Measured spin" value={`${paddle.measured.spinRpm} RPM`} />
          ) : null}
          {paddle.measured?.powerMph != null ? (
            <Spec
              label="Measured power / pop"
              value={`${paddle.measured.powerMph} / ${paddle.measured.popMph ?? "—"} mph`}
            />
          ) : null}
          {paddle.approval ? <Spec label="Approval" value={paddle.approval} /> : null}
          {paddle.year ? <Spec label="Year" value={String(paddle.year)} /> : null}
          <div className="sm:col-span-2">
            <dt className="text-[var(--muted)]">Unique</dt>
            <dd className="mt-0.5 text-[var(--foreground)]">{paddle.uniqueTrait}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[var(--muted)]">Best for</dt>
            <dd className="mt-0.5 text-[var(--foreground)]">{paddle.bestFor}</dd>
          </div>
        </dl>
      ) : null}

      {tab === "customize" ? <PaddleCustomizePanel paddle={paddle} /> : null}

      {tab === "pro" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/90">{pro.headline}</p>
          <div>
            <p className="sf-kicker sf-kicker-muted">How they win with this shape</p>
            <ul className="mt-2 space-y-2">
              {pro.howTheyWin.map((line) => (
                <li
                  key={line}
                  className="border-l border-[var(--line-strong)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                >
                  <span className="text-[var(--foreground)]/90">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)]/50 p-3.5">
            <p className="sf-kicker sf-kicker-muted">Fast hands</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/90">{pro.fastHands}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)]/50 p-3.5">
            <p className="sf-kicker sf-kicker-muted">Dominate</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/90">{pro.dominate}</p>
          </div>
          {inBag && (setup.tape.length > 0 || setup.overgrips > 0) ? (
            <p className="text-xs text-[var(--muted)]">
              Your mold: hand speed {clampScore(mold.handSpeed)} · {mold.weightOz.toFixed(2)} oz
              {mold.addedMassG > 0 ? ` · +${mold.addedMassG}g tape` : ""}.
            </p>
          ) : null}
          <ShotGeometryPanel kind="hand-battle" />
        </div>
      ) : null}
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
