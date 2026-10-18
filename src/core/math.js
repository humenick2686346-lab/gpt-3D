export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const mix = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export function random(seed = 197333) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function terrainHeight(x, z) {
  const distance = Math.hypot(x, z);
  const fade = smoothstep(65, 220, distance);
  return fade * (Math.sin(x * .008 + .7) * Math.cos(z * .006) * 4 + Math.sin(z * .017 + x * .009) * 1.7) - .8;
}
export function pathDistance(x, z) {
  return Math.abs(x - (Math.sin(z * .0045) * 72 + Math.sin(z * .011) * 14));
}
export function formatTime(hour) {
  const minutes = Math.round(clamp(hour, 0, 24) * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
