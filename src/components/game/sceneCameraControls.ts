/**
 * Reusable camera controls for Owerri Life 3D isometric scenes.
 * Supports:
 * - Touch pinch-and-zoom (2 fingers on mobile to zoom in or shrink)
 * - Single-finger touch drag (orbit yaw and pitch)
 * - Mouse wheel scrolling (smooth zoom in / shrink out on desktop)
 * - Pointer / mouse drag (orbit yaw and pitch)
 */

export interface CameraRigState {
  yaw: number;
  pitch?: number;
  zoom: number;
}

export interface CameraControlOptions {
  minZoom?: number;
  maxZoom?: number;
  minPitch?: number;
  maxPitch?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  onUpdate?: () => void;
}

export function attachSceneCameraControls(
  element: HTMLElement,
  rig: { current: CameraRigState },
  options: CameraControlOptions = {}
): () => void {
  const {
    minZoom = 0.35,
    maxZoom = 4.5,
    minPitch = 0.1,
    maxPitch = 1.35,
    rotateSpeed = 0.007,
    zoomSpeed = 0.1,
    onUpdate,
  } = options;

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchDist = 0;

  // 1. Mouse Drag
  const onMouseDown = (e: MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    rig.current.yaw += dx * rotateSpeed;
    if (typeof rig.current.pitch === "number") {
      rig.current.pitch = Math.max(minPitch, Math.min(maxPitch, rig.current.pitch + dy * rotateSpeed));
    }
    onUpdate?.();
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  // 2. Mouse Wheel Zoom (desktop / laptop trackpad)
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    rig.current.zoom = Math.max(minZoom, Math.min(maxZoom, rig.current.zoom * factor));
    onUpdate?.();
  };

  // 3. Touch Gestures (Single finger drag & 2-finger pinch-to-zoom / shrink)
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      pinchDist = 0;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      pinchDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent native mobile page zoom
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const newDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      if (pinchDist > 5 && newDist > 5) {
        const factor = newDist / pinchDist;
        rig.current.zoom = Math.max(minZoom, Math.min(maxZoom, rig.current.zoom * factor));
        pinchDist = newDist;
        onUpdate?.();
      }
    } else if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      lastX = t.clientX;
      lastY = t.clientY;

      rig.current.yaw += dx * rotateSpeed * 1.2;
      if (typeof rig.current.pitch === "number") {
        rig.current.pitch = Math.max(minPitch, Math.min(maxPitch, rig.current.pitch + dy * rotateSpeed * 1.2));
      }
      onUpdate?.();
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      isDragging = false;
      pinchDist = 0;
    } else if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      pinchDist = 0;
    }
  };

  element.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  element.addEventListener("wheel", onWheel, { passive: false });
  element.addEventListener("touchstart", onTouchStart, { passive: true });
  element.addEventListener("touchmove", onTouchMove, { passive: false });
  element.addEventListener("touchend", onTouchEnd);
  element.addEventListener("touchcancel", onTouchEnd);

  return () => {
    element.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    element.removeEventListener("wheel", onWheel);
    element.removeEventListener("touchstart", onTouchStart);
    element.removeEventListener("touchmove", onTouchMove);
    element.removeEventListener("touchend", onTouchEnd);
    element.removeEventListener("touchcancel", onTouchEnd);
  };
}
