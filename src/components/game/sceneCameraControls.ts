/**
 * Camera controls for Owerri Life 3D rooms.
 * Two fingers pinch to zoom. One finger drags to turn.
 * The mouse wheel zooms on desktop.
 */

export interface CameraRigState {
  yaw: number;
  pitch?: number;
  zoom: number;
}

export const VIEW_ZOOM = { min: 0.2, max: 9, speed: 0.18 } as const;

export function clampViewZoom(zoom: number, factor = 1) {
  return Math.min(VIEW_ZOOM.max, Math.max(VIEW_ZOOM.min, zoom * factor));
}

export function phonePullback() {
  if (typeof window === "undefined") return 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  return coarse || narrow ? 1.6 : 1;
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
  options: CameraControlOptions = {},
): () => void {
  const {
    minZoom = VIEW_ZOOM.min,
    maxZoom = VIEW_ZOOM.max,
    minPitch = 0.1,
    maxPitch = 1.35,
    rotateSpeed = 0.007,
    zoomSpeed = VIEW_ZOOM.speed,
    onUpdate,
  } = options;

  element.style.touchAction = "none";
  const canvas = element.querySelector("canvas");
  if (canvas instanceof HTMLElement) canvas.style.touchAction = "none";
  const htmlTouch = document.documentElement.style.touchAction;
  const bodyTouch = document.body.style.touchAction;
  document.documentElement.style.touchAction = "none";
  document.body.style.touchAction = "none";

  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.pointerType === "mouse") {
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        /* The pointer can already be gone on a phone pinch. */
      }
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      lastX = event.clientX;
      lastY = event.clientY;
      pinchDist = 0;
    } else if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      if (event.cancelable) {
        try {
          event.preventDefault();
        } catch {
          /* Some phones mark the gesture passive. */
        }
      }
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 8 && dist > 8) {
        const amplified = Math.pow(dist / pinchDist, 1.55);
        rig.current.zoom = Math.max(minZoom, Math.min(maxZoom, rig.current.zoom * amplified));
        pinchDist = dist;
        onUpdate?.();
      }
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    rig.current.yaw += dx * rotateSpeed;
    if (typeof rig.current.pitch === "number") {
      rig.current.pitch = Math.max(minPitch, Math.min(maxPitch, rig.current.pitch + dy * rotateSpeed));
    }
    onUpdate?.();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (pointers.size < 2 || !event.cancelable) return;
    try {
      event.preventDefault();
    } catch {
      /* Ignore a passive pinch on the page. */
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const only = [...pointers.values()][0];
      lastX = only.x;
      lastY = only.y;
    }
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    } else {
      pinchDist = 0;
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    rig.current.zoom = Math.max(minZoom, Math.min(maxZoom, rig.current.zoom * factor));
    onUpdate?.();
  };

  element.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  element.addEventListener("touchmove", onTouchMove, { passive: false });
  element.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    document.documentElement.style.touchAction = htmlTouch;
    document.body.style.touchAction = bodyTouch;
    element.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    element.removeEventListener("touchmove", onTouchMove);
    element.removeEventListener("wheel", onWheel);
  };
}
