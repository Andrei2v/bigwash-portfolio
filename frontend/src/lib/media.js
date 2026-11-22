import { LOCAL_MODE } from '$lib/api/client.js';

export const MEDIA_FILE_LIMIT = 2 * 1024 * 1024;
export const MEDIA_TOTAL_LIMIT = 50 * 1024 * 1024;
export const MEDIA_IMAGE_LIMIT = 10;
const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const assetId = value => /^[a-zA-Z0-9_-]{1,80}$/.test(value ?? '');

// Only generated asset references survive. URLs, styles and event attributes never do.
export function sanitizeMedia(html, assets = []) {
  const template = document.createElement('template');
  template.innerHTML = String(html).slice(0, 100000);
  const result = document.createElement('div');
  const ids = new Set(assets.map(asset => asset.id));
  const allowed = new Set(['B', 'I', 'U', 'BR', 'P', 'DIV']);
  const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'VIDEO', 'AUDIO']);
  function copy(node, parent) {
    if (node.nodeType === 3) { parent.append(document.createTextNode(node.textContent)); return; }
    if (node.nodeType !== 1 || blocked.has(node.tagName)) return;
    if (node.tagName === 'IMG') {
      const id = node.getAttribute('data-asset-id');
      if (assetId(id) && ids.has(id)) {
        const image = document.createElement('img');
        image.setAttribute('data-asset-id', id);
        parent.append(image);
      }
      return;
    }
    const tag = node.tagName === 'STRONG' ? 'B' : node.tagName === 'EM' ? 'I' : node.tagName;
    const target = allowed.has(tag) ? document.createElement(tag.toLowerCase()) : parent;
    if (target !== parent) parent.append(target);
    for (const child of node.childNodes) copy(child, target);
  }
  for (const node of template.content.childNodes) copy(node, result);
  return result.innerHTML;
}

export function referencedMedia(html, images) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const used = new Set([...template.content.querySelectorAll('img[data-asset-id]')].map(img => img.dataset.assetId));
  return images.filter(image => used.has(image.id));
}

export async function readMediaFile(file) {
  if (!imageTypes.includes(file.type)) throw Error('mediaFileType');
  if (!file.size || file.size > MEDIA_FILE_LIMIT) throw Error('mediaFileSize');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const actual = bytes[0] === 137 && ascii(1, 4) === 'PNG' ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
    : ['GIF87a', 'GIF89a'].includes(ascii(0, 6)) ? 'image/gif'
    : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : '';
  if (actual !== file.type) throw Error('mediaFileType');
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth * image.naturalHeight <= 16000000 ? resolve() : reject(Error('mediaDimensions'));
      image.onerror = () => reject(Error('mediaFileType'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
  return { id: crypto.randomUUID(), blob: file, name: file.name, type: file.type, size: file.size };
}

function validDocument(value) {
  return value && typeof value.enabled === 'boolean' && typeof value.text === 'string' &&
    value.text.length <= 100000 && Array.isArray(value.images) && value.images.length <= MEDIA_IMAGE_LIMIT &&
    new Set(value.images.map(image => image.id)).size === value.images.length &&
    value.images.every(image => assetId(image.id) && imageTypes.includes(image.type) && image.blob instanceof Blob &&
      image.blob.type === image.type && image.blob.size === image.size && image.size > 0 && image.size <= MEDIA_FILE_LIMIT);
}

// A document and its Blobs commit together; cancelled drafts never write files.
export function createMediaStore(pultId, legacyStore) {
  let revision = null;
  let loaded = false;
  let legacySnapshot;
  const legacyKey = `bigwash.local.v1.media.${pultId}`;
  const readLegacy = () => {
    try { return localStorage.getItem(legacyKey); }
    catch { throw Error('configReadFailed'); }
  };
  async function open() {
    if (!LOCAL_MODE) throw Error('configUnavailable');
    if (typeof indexedDB === 'undefined') throw Error('mediaStorageUnavailable');
    return new Promise((resolve, reject) => {
      let blocked = false;
      const request = indexedDB.open('bigwash-media-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id' });
      request.onsuccess = () => {
        if (blocked) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close(); resolve(request.result);
      };
      request.onerror = request.onblocked = () => { blocked = true; reject(Error('mediaStorageUnavailable')); };
    });
  }
  return {
    async load() {
      loaded = false;
      const db = await open();
      try {
        const record = await new Promise((resolve, reject) => {
          const tx = db.transaction('documents');
          const request = tx.objectStore('documents').get(String(pultId));
          tx.oncomplete = () => resolve(request.result);
          tx.onabort = tx.onerror = () => reject(Error('configReadFailed'));
        });
        let value = record;
        if (!record) {
          legacySnapshot = readLegacy();
          value = { ...legacyStore.load(), images: [] };
          if (readLegacy() !== legacySnapshot) throw Error('configConflict');
        }
        if (!validDocument(value)) throw Error('configReadFailed');
        revision = record?.revision ?? null;
        loaded = true;
        return { enabled: value.enabled, text: value.text, images: value.images };
      } finally { db.close(); }
    },
    async save(draft) {
      if (!LOCAL_MODE) throw Error('configUnavailable');
      if (!loaded) throw Error('configReadFailed');
      if (draft.text.length > 100000) throw Error('mediaTextSize');
      if (revision === null && readLegacy() !== legacySnapshot) throw Error('configConflict');
      const text = sanitizeMedia(draft.text, draft.images);
      const value = { ...draft, text, images: referencedMedia(text, draft.images) };
      if (!validDocument(value)) throw Error('configInvalid');
      const db = await open();
      const nextRevision = crypto.randomUUID();
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('documents', 'readwrite');
          const store = tx.objectStore('documents');
          let reason = 'configSaveFailed';
          const request = store.getAll();
          request.onsuccess = () => {
            try {
            const records = request.result;
            if ((records.find(record => record.id === String(pultId))?.revision ?? null) !== revision) {
              reason = 'configConflict'; tx.abort(); return;
            }
            const bytes = [...records.filter(record => record.id !== String(pultId)), value]
              .reduce((sum, record) => sum + record.images.reduce((n, image) => n + image.size, 0), 0);
            if (bytes > MEDIA_TOTAL_LIMIT) { reason = 'mediaStorageFull'; tx.abort(); return; }
            store.put({ ...value, id: String(pultId), revision: nextRevision });
            } catch { tx.abort(); }
          };
          tx.oncomplete = resolve;
          tx.onabort = tx.onerror = () => reject(Error(reason));
        });
        revision = nextRevision;
        return value;
      } finally { db.close(); }
    }
  };
}
