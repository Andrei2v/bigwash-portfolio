<script>
  import { onDestroy } from 'svelte';
  import { language } from '$lib/localisation/language.svelte.js';
  import { geocode, validLocation, worldPoint, coordinates, mapTiles } from '$lib/location.js';

  let { address = '', latitude = null, longitude = null, disabled = false, onchange = () => {}, onbusy = () => {} } = $props();
  let center = $state({ latitude: 49, longitude: 31 });
  let zoom = $state(5);
  let width = $state(600);
  const height = 250;
  let results = $state([]);
  let busy = $state(false);
  let error = $state('');
  let tilesFailed = $state(false);
  let controller;
  let revision = 0;
  let requestAddress = '';
  let drag;
  let dragged = false;
  const selected = $derived(validLocation(latitude, longitude));
  const tiles = $derived(mapTiles(center, zoom, width || 600, height));
  const marker = $derived.by(() => {
    if (!selected) return null;
    const point = worldPoint(latitude, longitude, zoom), view = worldPoint(center.latitude, center.longitude, zoom);
    const size = 256 * 2 ** zoom;
    const dx = ((point.x - view.x + size / 2) % size + size) % size - size / 2;
    return { left: dx + width / 2, top: point.y - view.y + height / 2 };
  });

  $effect(() => { if (validLocation(latitude, longitude)) { center = { latitude, longitude }; zoom = 15; } });
  $effect(() => { if (busy && address !== requestAddress) cancelRequest(); });
  onDestroy(cancelRequest);

  function cancelRequest() {
    revision++;
    controller?.abort();
    busy = false;
    onbusy(false);
  }
  async function lookup(point = null) {
    cancelRequest();
    if (disabled) return;
    error = '';
    results = [];
    if (!point && !address.trim()) { error = 'locationInvalid'; return; }
    if (point) onchange({ ...point, address: '' });
    requestAddress = point ? '' : address;
    const current = revision;
    controller = new AbortController();
    busy = true;
    onbusy(true);
    try {
      const places = await geocode({ ...(point || { address }), signal: controller.signal });
      if (current !== revision) return;
      busy = false;
      onbusy(false);
      results = point ? [] : places;
      onchange(point ? { ...point, address: places[0].address } : places[0]);
    } catch (failure) {
      if (current === revision && failure.name !== 'AbortError') error = failure.message;
    } finally { if (current === revision) { busy = false; onbusy(false); } }
  }
  function selectPoint(event) {
    if (disabled || dragged) { dragged = false; return; }
    const box = event.currentTarget.getBoundingClientRect();
    const point = worldPoint(center.latitude, center.longitude, zoom);
    const x = event.detail ? event.clientX - box.left : width / 2;
    const y = event.detail ? event.clientY - box.top : height / 2;
    lookup(coordinates(point.x + x - width / 2, point.y + y - height / 2, zoom));
  }
  function pan(x, y) {
    const point = worldPoint(center.latitude, center.longitude, zoom);
    center = coordinates(point.x + x, point.y + y, zoom);
  }
  function keydown(event) {
    const moves = { ArrowLeft: [-100, 0], ArrowRight: [100, 0], ArrowUp: [0, -100], ArrowDown: [0, 100] };
    if (moves[event.key]) { event.preventDefault(); pan(...moves[event.key]); }
  }
  function pointerdown(event) {
    dragged = false;
    drag = { x: event.clientX, y: event.clientY, point: worldPoint(center.latitude, center.longitude, zoom) };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointermove(event) {
    if (!drag) return;
    const x = event.clientX - drag.x, y = event.clientY - drag.y;
    if (Math.abs(x) + Math.abs(y) > 5) dragged = true;
    if (dragged) center = coordinates(drag.point.x - x, drag.point.y - y, zoom);
  }
  function manualCoordinates(event, key) {
    cancelRequest();
    const value = event.currentTarget.value === '' ? null : Number(event.currentTarget.value);
    onchange({ address, latitude, longitude, [key]: value });
  }
</script>

<div class="location-picker">
  <p>{language.t('review.locationHint')}</p>
  <button type="button" class="location-search" disabled={disabled || busy || !address.trim()} onclick={() => lookup()}>{language.t(busy ? 'review.geocodeLoading' : 'review.locationSearch')}</button>
  {#if error}<p role="alert">{language.t(`review.${error}`)}</p>{/if}
  {#if results.length > 1}
    <ul class="location-results">{#each results as place}<li><button type="button" onclick={() => { cancelRequest(); results = []; onchange(place); }}>{place.address}</button></li>{/each}</ul>
  {/if}
  <div class="map-frame" bind:clientWidth={width}>
    <button type="button" class="map-surface" disabled={disabled} aria-label={language.t('review.locationMap')} onclick={selectPoint} onkeydown={keydown}
      onpointerdown={pointerdown} onpointermove={pointermove} onpointerup={() => drag = null} onpointercancel={() => { drag = null; dragged = false; }}>
      {#each tiles as tile (tile.id)}<img src={tile.url} alt="" draggable="false" decoding="async" referrerpolicy="strict-origin-when-cross-origin" style:left={`${tile.left}px`} style:top={`${tile.top}px`} onerror={() => tilesFailed = true}>{/each}
      {#if marker}<span class="map-marker" style:left={`${marker.left}px`} style:top={`${marker.top}px`}>📍</span>{/if}
    </button>
    <div class="map-zoom"><button type="button" disabled={disabled || zoom >= 18} aria-label={language.t('review.mapZoomIn')} onclick={() => zoom++}>+</button><button type="button" disabled={disabled || zoom <= 3} aria-label={language.t('review.mapZoomOut')} onclick={() => zoom--}>−</button></div>
    <a class="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
  </div>
  {#if tilesFailed}<p role="status">{language.t('review.mapUnavailable')}</p>{/if}
  <div class="coordinate-fields">
    <label>{language.t('review.latitude')}<input id="wash-latitude" type="number" min="-90" max="90" step="any" value={latitude ?? ''} disabled={disabled} oninput={event => manualCoordinates(event, 'latitude')}></label>
    <label>{language.t('review.longitude')}<input id="wash-longitude" type="number" min="-180" max="180" step="any" value={longitude ?? ''} disabled={disabled} oninput={event => manualCoordinates(event, 'longitude')}></label>
  </div>
</div>

<style>
  .location-picker { margin: 12px 0; color: var(--text-main); }
  p { color: var(--text-muted); font-size: 12px; line-height: 1.5; }
  [role="alert"] { color: #ef4444; }
  button { cursor: pointer; color: var(--text-main); background: var(--input-bg, var(--bg-card)); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; }
  button:disabled { cursor: default; opacity: 0.6; }
  .map-frame { position: relative; height: 250px; margin-top: 12px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #dbe4e9; }
  .map-surface { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; border-radius: 0; touch-action: none; cursor: crosshair; overflow: hidden; }
  .map-surface img { position: absolute; width: 256px; height: 256px; max-width: none; pointer-events: none; }
  .map-marker { position: absolute; transform: translate(-50%, -100%); font-size: 28px; pointer-events: none; }
  .map-zoom { position: absolute; top: 8px; left: 8px; display: grid; gap: 4px; }
  .map-zoom button { background: var(--bg-card); }
  .map-attribution { position: absolute; right: 0; bottom: 0; background: #fffE; color: #1e293b; padding: 3px 5px; font-size: 10px; }
  .coordinate-fields { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
  label { flex: 1; min-width: 130px; font-size: 12px; color: var(--text-muted); }
  input { display: block; box-sizing: border-box; margin-top: 5px; width: 100%; padding: 9px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--input-bg, var(--bg-card)); color: var(--text-main); }
  .location-results { padding: 0; list-style: none; max-height: 140px; overflow-y: auto; }
  .location-results button { text-align: left; width: 100%; }
</style>
