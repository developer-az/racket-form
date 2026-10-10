import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["@mediapipe/tasks-vision"],
};

export default nextConfig;
