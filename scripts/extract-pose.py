#!/usr/bin/env python3
"""Extract BlazePose world landmarks from a study video (MediaPipe Tasks, CPU)."""

from __future__ import annotations

import argparse
import json
import sys

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)


def extract(path: str, model: str, fps: float) -> list[dict]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise SystemExit(f"Could not open {path}")
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(src_fps / fps)))

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=model,
            delegate=BaseOptions.Delegate.CPU,
        ),
        running_mode=RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.4,
        min_pose_presence_confidence=0.4,
        min_tracking_confidence=0.4,
    )
    frames: list[dict] = []
    with PoseLandmarker.create_from_options(options) as landmarker:
        i = 0
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            if i % step != 0:
                i += 1
                continue
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            ts = int(round((i / src_fps) * 1000))
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
            result = landmarker.detect_for_video(image, ts)
            i += 1
            if not result.pose_world_landmarks:
                continue
            world = result.pose_world_landmarks[0]
            image_lms = result.pose_landmarks[0] if result.pose_landmarks else []
            frames.append(
                {
                    "time": ts / 1000.0,
                    "world": [
                        {
                            "x": lm.x,
                            "y": lm.y,
                            "z": lm.z,
                            "visibility": getattr(lm, "visibility", 1.0) or 1.0,
                        }
                        for lm in world
                    ],
                    "image": [
                        {
                            "x": lm.x,
                            "y": lm.y,
                            "z": lm.z,
                            "visibility": getattr(lm, "visibility", 1.0) or 1.0,
                        }
                        for lm in image_lms
                    ],
                }
            )
    cap.release()
    return frames


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--model", default="/tmp/study-videos/pose_landmarker_lite.task")
    p.add_argument("--fps", type=float, default=20.0)
    args = p.parse_args()
    frames = extract(args.video, args.model, args.fps)
    with open(args.out, "w") as f:
        json.dump({"frames": frames}, f)
    print(f"{args.video}: {len(frames)} frames -> {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
