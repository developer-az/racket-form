"use client";

import { create } from "zustand";
import type { StrokeType } from "@/types/biomechanics";
import type { MotionClip } from "@/lib/motion/types";
import { putStudyClip, removeStudyClip, studyKey, clearStudyClips } from "@/lib/pose/registry";
import { reconstructFromVideoFile, type LandmarkerProgress } from "@/lib/pose/landmarker";
import type { ReconstructMeta } from "@/lib/pose/reconstruct";
import { useCoachStore } from "@/store/coachStore";
import { allSeedTargets, cloneSeedClip, SEED_META } from "@/data/motion/seeds";
import { getPlayer } from "@/data/players";

export type StudyKind = "seed" | "upload";

export type StudyRecord = {
  key: string;
  playerId: string;
  stroke: StrokeType;
  clip: MotionClip;
  kind: StudyKind;
  sourceName: string;
  durationSec: number;
  reconstructedAt: number;
  meanVisibility: number;
  hittingSide: "left" | "right";
  frameCount: number;
};

type StudyStatus = "idle" | "working" | "ready" | "error";

interface StudyState {
  hydrated: boolean;
  records: Record<string, StudyRecord>;
  lastKey: string | null;
  status: StudyStatus;
  progress: number;
  detail: string;
  error: string | null;
  hydrate: () => Promise<void>;
  recordFor: (playerId: string, stroke: StrokeType) => StudyRecord | undefined;
  attachVideo: (opts: {
    file: File;
    playerId: string;
    stroke: StrokeType;
    handedness: "left" | "right";
    oneHanded: boolean;
  }) => Promise<void>;
  applyLastTo: (playerId: string) => void;
  clearCurrent: (playerId: string, stroke: StrokeType) => void;
}

const DB_NAME = "racket-form-study";
const STORE = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function idbAll(): Promise<StudyRecord[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result ?? []) as StudyRecord[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function idbPut(record: StudyRecord): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* private mode / blocked */
  }
}

async function idbDel(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

function install(record: StudyRecord) {
  putStudyClip(record.clip);
}

function toRecord(
  clip: MotionClip,
  meta: ReconstructMeta,
  sourceName: string,
  durationSec: number,
): StudyRecord {
  return {
    key: clip.id,
    playerId: clip.playerId,
    stroke: clip.stroke,
    clip,
    kind: "upload",
    sourceName,
    durationSec,
    reconstructedAt: Date.now(),
    meanVisibility: meta.meanVisibility,
    hittingSide: meta.hittingSide,
    frameCount: clip.frameCount,
  };
}

function seedRecord(playerId: string, stroke: StrokeType, oneHanded: boolean): StudyRecord {
  const clip = cloneSeedClip(playerId, stroke, oneHanded);
  const meta = SEED_META[stroke];
  return {
    key: clip.id,
    playerId,
    stroke,
    clip,
    kind: "seed",
    sourceName: meta.name,
    durationSec: Math.max(1, clip.frameCount / 20),
    reconstructedAt: 0,
    meanVisibility: 0.85,
    hittingSide: clip.authoredHand,
    frameCount: clip.frameCount,
  };
}

function installSeeds(records: Record<string, StudyRecord>) {
  for (const target of allSeedTargets()) {
    const key = studyKey(target.playerId, target.stroke);
    if (records[key]?.kind === "upload") continue;
    const row = seedRecord(target.playerId, target.stroke, target.oneHanded);
    records[key] = row;
    install(row);
  }
}

function seededRecords(): Record<string, StudyRecord> {
  const records: Record<string, StudyRecord> = {};
  installSeeds(records);
  return records;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  hydrated: false,
  records: seededRecords(),
  lastKey: null,
  status: "ready",
  progress: 0,
  detail: "",
  error: null,

  hydrate: async () => {
    if (get().hydrated) return;
    const rows = (await idbAll()).filter((row) => row.kind !== "seed");
    const records: Record<string, StudyRecord> = {};
    clearStudyClips();
    for (const row of rows) {
      records[row.key] = { ...row, kind: "upload" };
      install(row);
    }
    installSeeds(records);
    const uploads = rows.sort((a, b) => b.reconstructedAt - a.reconstructedAt);
    set({
      hydrated: true,
      records,
      lastKey: uploads[0]?.key ?? null,
      status: "ready",
    });
  },

  recordFor: (playerId, stroke) => get().records[studyKey(playerId, stroke)],

  attachVideo: async ({ file, playerId, stroke, handedness, oneHanded }) => {
    useCoachStore.getState().setPlaying(false);
    set({ status: "working", progress: 0, detail: "Starting…", error: null });
    const onProgress = (p: LandmarkerProgress) => {
      set({ progress: p.progress, detail: p.detail });
    };
    try {
      const { clip, meta, durationSec } = await reconstructFromVideoFile(
        file,
        { playerId, stroke, handedness, oneHanded },
        onProgress,
      );
      const record = toRecord(clip, meta, file.name, durationSec);
      install(record);
      const records = { ...get().records, [record.key]: record };
      set({ records, lastKey: record.key, status: "ready", progress: 1, detail: "Ready", error: null });
      useCoachStore.getState().setPlaying(true);
      void idbPut(record);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reconstruction failed";
      set({ status: "error", error: message, detail: message, progress: 0 });
    }
  },

  applyLastTo: (playerId) => {
    const last = get().lastKey ? get().records[get().lastKey!] : undefined;
    if (!last) return;
    const clip: MotionClip = {
      ...last.clip,
      id: studyKey(playerId, last.stroke),
      playerId,
      quats: last.clip.quats.slice(),
      root: last.clip.root.slice(),
      phases: last.clip.phases.map((p) => ({ ...p })),
    };
    const record: StudyRecord = {
      ...last,
      key: clip.id,
      playerId,
      clip,
      kind: "upload",
      reconstructedAt: Date.now(),
    };
    install(record);
    const records = { ...get().records, [record.key]: record };
    set({ records, lastKey: record.key, status: "ready" });
    void idbPut(record);
  },

  clearCurrent: (playerId, stroke) => {
    const key = studyKey(playerId, stroke);
    removeStudyClip(key);
    const records = { ...get().records };
    delete records[key];
    const player = getPlayer(playerId);
    const oneHanded = player?.strokes[stroke].oneHanded ?? true;
    const seeded = seedRecord(playerId, stroke, oneHanded);
    records[key] = seeded;
    install(seeded);
    const lastUpload = Object.values(records).find((r) => r.kind === "upload");
    set({
      records,
      lastKey: get().lastKey === key ? lastUpload?.key ?? null : get().lastKey,
      status: "ready",
    });
    void idbDel(key);
  },
}));
