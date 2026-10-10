import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@mediapipe/tasks-vision"],
  serverExternalPackages: ["@mediapipe/tasks-vision"],
};

export default nextConfig;
