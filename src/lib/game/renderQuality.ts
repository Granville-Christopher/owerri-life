import * as THREE from "three";

export function makeRenderer(options: THREE.WebGLRendererParameters = {}) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    ...options,
  });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  renderer.setPixelRatio(Math.min(dpr, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}
