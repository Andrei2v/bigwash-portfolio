import { LOCAL_MODE } from '$lib/api/client.js';

export const TILE_URL = 'https://tile.openstreetmap.org';
export const GEOCODER_URL = 'https://photon.komoot.io';
const MAX_LATITUDE = 85.05112878;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const validLocation = (latitude, longitude) => typeof latitude === 'number' && typeof longitude === 'number' &&
  Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

export function worldPoint(latitude, longitude, zoom) {
  const size = 256 * 2 ** zoom;
  const sine = Math.sin(clamp(latitude, -MAX_LATITUDE, MAX_LATITUDE) * Math.PI / 180);
  return { x: (longitude + 180) / 360 * size, y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size };
}

export function coordinates(x, y, zoom) {
  const size = 256 * 2 ** zoom;
  return { longitude: ((x / size * 360) % 360 + 360) % 360 - 180,
    latitude: Math.atan(Math.sinh(Math.PI * (1 - 2 * clamp(y, 0, size) / size))) * 180 / Math.PI };
}

export function mapTiles(center, zoom, width, height) {
  const point = worldPoint(center.latitude, center.longitude, zoom);
  const left = point.x - width / 2, top = point.y - height / 2;
  const count = 2 ** zoom;
  const tiles = [];
  for (let y = Math.max(0, Math.floor(top / 256)); y <= Math.min(count - 1, Math.floor((top + height - 1) / 256)); y++) {
    for (let x = Math.floor(left / 256); x <= Math.floor((left + width - 1) / 256); x++) {
      const wrappedX = (x % count + count) % count;
      tiles.push({ id: `${zoom}/${x}/${y}`, url: `${TILE_URL}/${zoom}/${wrappedX}/${y}.png`, left: x * 256 - left, top: y * 256 - top });
    }
  }
  return tiles;
}

export function photonPlaces(data) {
  if (!data || !Array.isArray(data.features)) throw new Error('geocodeFailed');
  return data.features.flatMap(feature => {
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    if (feature.geometry?.type !== 'Point' || !validLocation(latitude, longitude)) return [];
    const p = feature.properties ?? {};
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const parts = [p.name, street, p.city || p.locality || p.district, p.state, p.country].filter(value => typeof value === 'string' && value.trim());
    const address = [...new Set(parts)].join(', ');
    return address ? [{ latitude, longitude, address }] : [];
  });
}

const cache = new Map();
let nextRequest = 0;
let queue = Promise.resolve();

// User-triggered requests only; cache repeat lookups and serialize calls to the public DEV service.
export async function geocode({ address, latitude, longitude, signal }) {
  if (!LOCAL_MODE) throw new Error('configUnavailable');
  const reverse = address === undefined;
  if (reverse ? !validLocation(latitude, longitude) : !address.trim()) throw new Error('locationInvalid');
  const query = reverse ? `lat=${latitude}&lon=${longitude}&limit=1` : `q=${encodeURIComponent(address.trim())}&limit=5`;
  const url = `${GEOCODER_URL}/${reverse ? 'reverse' : 'api'}/?${query}`;
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (cache.has(url)) return structuredClone(cache.get(url));
  const previous = queue;
  let release;
  queue = new Promise(resolve => { release = resolve; });
  await previous;
  try {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const wait = Math.max(0, nextRequest - Date.now());
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    nextRequest = Date.now() + 1100;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' });
      if (!response.ok) throw new Error('geocodeFailed');
      const places = photonPlaces(await response.json());
      if (!places.length) throw new Error('geocodeNotFound');
      cache.set(url, places);
      if (cache.size > 64) cache.delete(cache.keys().next().value);
      return structuredClone(places);
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      throw new Error(error.message === 'geocodeNotFound' ? 'geocodeNotFound' : 'geocodeFailed');
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  } finally { release(); }
}
