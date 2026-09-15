"use client";

import { useState } from "react";
import type { PaddleProfile, PaddleTapeZone } from "@/types/pickleball";
import { ScoreGrid, ScoreMeter } from "@/components/gear/ScoreMeter";
import { AisleChip, ChipRow } from "@/components/gear/CatalogShop";
import {
  PADDLE_TAPE_MASS_G,
  PADDLE_TAPE_ZONES,
  createPaddleTapePiece,
  paddleMoldEffect,
  stockRecipe,
} from "@/lib/pickleball/paddleMold";
import { usePaddleStore } from "@/store/paddleStore";
import { PaddleTapeDiagram } from "./PaddleTapeDiagram";

export function PaddleCustomizePanel({ paddle }: { paddle: PaddleProfile }) {
  const setup = usePaddleStore((s) => s.setup);
  const setPaddle = usePaddleStore((s) => s.setPaddle);
  const setOvergrips = usePaddleStore((s) => s.setOvergrips);
  const setTape = usePaddleStore((s) => s.setTape);
  const [zone, setZone] = useState<PaddleTapeZone>("tip");

  const inBag = setup.paddleId === paddle.id;
  const mold = paddleMoldEffect(paddle, setup.tape, setup.overgrips);
  const recipe = stockRecipe(paddle);
  const zoneMeta = PADDLE_TAPE_ZONES[zone];

  const addTape = () => {
    if (!inBag) setPaddle(paddle.id, `${paddle.brand} ${paddle.name}`);
    setTape([...setup.tape, createPaddleTapePiece(zone, PADDLE_TAPE_MASS_G)]);
  };

  const removeLastAtZone = () => {
    const idx = [...setup.tape].map((p, i) => ({ p, i })).reverse().find((x) => x.p.zone === zone)?.i;
    if (idx == null) return;
    setTape(setup.tape.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`sf-btn ${inBag ? "sf-btn-secondary" : "sf-btn-primary"}`}
          onClick={() => setPaddle(paddle.id, `${paddle.brand} ${paddle.name}`)}
        >
          {inBag ? "Your paddle" : "Use this paddle"}
        </button>
        {(setup.tape.length > 0 || setup.overgrips > 0) && (
          <button
            type="button"
            className="sf-btn sf-btn-ghost text-xs"
            onClick={() => {
              setTape([]);
              setOvergrips(0);
            }}
          >
            Clear tape & grips
          </button>
        )}
      </div>

      <div>
        <p className="sf-kicker sf-kicker-muted">Stock recipe</p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Read-only build of this paddle. Tape and overgrips below are the edits.
        </p>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {recipe.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] tracking-wide text-[var(--muted)] uppercase">{row.label}</dt>
              <dd className="text-[var(--foreground)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
        <PaddleTapeDiagram
          paddle={paddle}
          pieces={setup.tape}
          selectedZone={zone}
          onZoneClick={setZone}
        />
        <div className="space-y-3">
          <ChipRow label="Tape zone">
            {(Object.keys(PADDLE_TAPE_ZONES) as PaddleTapeZone[]).map((z) => (
              <AisleChip
                key={z}
                label={PADDLE_TAPE_ZONES[z].label}
                active={zone === z}
                onClick={() => setZone(z)}
              />
            ))}
          </ChipRow>
          <p className="text-xs leading-relaxed text-[var(--muted)]">{zoneMeta.hint}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="sf-btn sf-btn-secondary text-xs" onClick={addTape}>
              Add {PADDLE_TAPE_MASS_G}g
            </button>
            <button type="button" className="sf-btn sf-btn-ghost text-xs" onClick={removeLastAtZone}>
              Remove {PADDLE_TAPE_ZONES[zone].label}
            </button>
          </div>
          <ChipRow label="Overgrips">
            {[0, 1, 2].map((n) => (
              <AisleChip
                key={n}
                label={n === 0 ? "Stock grip" : `${n} wrap${n > 1 ? "s" : ""}`}
                active={setup.overgrips === n}
                onClick={() => {
                  if (!inBag) setPaddle(paddle.id, `${paddle.brand} ${paddle.name}`);
                  setOvergrips(n);
                }}
              />
            ))}
          </ChipRow>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-sunken)]/70 p-3.5">
        <p className="sf-kicker sf-kicker-muted">Live mold (teaching)</p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Starts from this paddle’s scores, then tape / overgrip. Not lab percentiles.
        </p>
        <div className="mt-3 space-y-3">
          <ScoreGrid
            scores={[
              { label: "Power", value: mold.power, accent: "var(--chart-power)" },
              { label: "Control", value: mold.control, accent: "var(--chart-control)" },
              { label: "Spin", value: mold.spin, accent: "var(--chart-spin)" },
              { label: "Pop", value: mold.pop, accent: "var(--amber)" },
              { label: "Sweet spot", value: mold.sweetSpot, accent: "var(--sky)" },
            ]}
          />
          <ScoreMeter label="Hand speed" value={mold.handSpeed} accent="var(--accent)" />
          <p className="text-xs text-[var(--muted)]">
            {mold.weightOz.toFixed(2)} oz
            {mold.addedMassG > 0 ? ` · +${mold.addedMassG}g tape` : ""}
            {" · "}
            {mold.gripCircumferenceIn}&quot; grip
          </p>
          {mold.notes.length > 0 ? (
            <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--muted)]">
              {mold.notes.map((n) => (
                <li key={n} className="border-l border-[var(--line-strong)] pl-2.5">
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--muted)]">Stock setup — add tape or an overgrip to shift the mold.</p>
          )}
        </div>
      </div>
    </div>
  );
}
