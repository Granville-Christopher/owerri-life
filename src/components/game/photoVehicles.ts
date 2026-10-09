import * as THREE from "three";
import { CAR_CATALOG, type CarDeal } from "@/lib/game/content";

const PHOTOS: Record<string, string> = {
  corolla: "/cars/corolla.jpg",
  "camry-v6": "/cars/camry-v6.jpg",
  accord: "/cars/accord.jpg",
  hilux: "/cars/hilux.jpg",
  "lexus-rx": "/cars/lexus-rx.jpg",
  "benz-c300": "/cars/benz-c300.jpg",
  prado: "/cars/prado.jpg",
  "sports-coupe": "/cars/sports-coupe.jpg",
  "range-rover": "/cars/range-rover.jpg",
  "g-wagon": "/cars/g-wagon.jpg",
  "bmw-m4": "/cars/bmw-m4.jpg",
  "tesla-3": "/cars/tesla-3.jpg",
  "porsche-911": "/cars/porsche-911.jpg",
  "tesla-s": "/cars/tesla-s.jpg",
  maybach: "/cars/maybach.jpg",
  bentley: "/cars/bentley.jpg",
  urus: "/cars/urus.jpg",
  huracan: "/cars/huracan.jpg",
  ferrari: "/cars/ferrari.jpg",
  rolls: "/cars/rolls.jpg",
  bugatti: "/cars/bugatti.jpg",
  okada: "/cars/okada.jpg",
  cab: "/cars/cab.jpg",
  bus: "/cars/bus.jpg",
  "Executive Sedan": "/cars/camry-v6.jpg",
};

const LENGTH: Record<string, number> = {
  okada: 2.15,
  cab: 4.4,
  bus: 7.2,
  hilux: 4.8,
  prado: 4.7,
  "range-rover": 4.8,
  "g-wagon": 4.6,
  urus: 4.7,
  "lexus-rx": 4.6,
  huracan: 4.3,
  ferrari: 4.4,
  "bmw-m4": 4.5,
  "porsche-911": 4.3,
  "sports-coupe": 4.5,
  bugatti: 4.6,
  maybach: 5.2,
  rolls: 5.4,
  bentley: 4.6,
};

const textures = new Map<string, THREE.Texture>();

export function photoForVehicle(id?: string | null) {
  if (id && PHOTOS[id]) return PHOTOS[id];
  const deal = CAR_CATALOG.find((car) => car.id === id || car.name === id);
  if (deal && PHOTOS[deal.id]) return PHOTOS[deal.id];
  return PHOTOS.corolla;
}

export function photoLength(id?: string | null) {
  if (id && LENGTH[id]) return LENGTH[id];
  return 4.5;
}

function texture(url: string) {
  const hit = textures.get(url);
  if (hit) return hit;
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  textures.set(url, tex);
  return tex;
}

/** A real photograph standing in the world — not a box car. */
export function makePhotoVehicle(id: string, opts?: { length?: number }): THREE.Group {
  const group = new THREE.Group();
  const length = opts?.length ?? photoLength(id);
  const height = id === "okada" ? length * 0.62 : id === "bus" ? length * 0.38 : length * 0.5;
  const mat = new THREE.MeshBasicMaterial({
    map: texture(photoForVehicle(id)),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(length, height), mat);
  face.position.y = height * 0.5;
  const back = face.clone();
  back.rotation.y = Math.PI;
  group.add(face, back);
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(length * 0.92, Math.max(1.1, length * 0.34)),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = 0.02;
  group.add(shade);
  return group;
}

export function makePhotoCar(car: Pick<CarDeal, "id"> | string) {
  return makePhotoVehicle(typeof car === "string" ? car : car.id);
}

const FLEET = CAR_CATALOG.map((car) => car.id);

export function makeTrafficPhoto(index: number) {
  return makePhotoVehicle(FLEET[index % FLEET.length]);
}
