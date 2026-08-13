const SETTINGS_KEY = 'riftwad:settings:v2';
const SAVE_INDEX_KEY = 'riftwad:save-index:v1';
const SAVE_PREFIX = 'riftwad:save:v1';

export const DEFAULT_SETTINGS = Object.freeze({
  crt: true,
  smoothing: false,
  scale: 'auto',
  sensitivity: 1.0,
  gamepadDeadzone: 0.25,
  masterVolume: 1.0,
  sfxVolume: 1.0,
  musicVolume: 0.6,
  performanceMode: 'auto',
});

export function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
    return true;
  } catch {
    return false;
  }
}

export function profileIdFor({ catalogId, wadHeaders = [] } = {}) {
  if (catalogId) return `catalog:${catalogId}`;
  const fingerprint = wadHeaders.map((header, index) => {
    const type = header?.type ?? 'WAD';
    const lumps = header?.numLumps ?? 0;
    return `${index}-${type}-${lumps}`;
  }).join('_');
  return `local:${fingerprint || 'unknown'}`;
}

export function listSaveSlots(profileId) {
  const index = readSaveIndex();
  const entries = index[profileId] ?? {};
  return Object.entries(entries)
    .map(([name, meta]) => ({ name, ...meta }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function readSaveBytes(profileId, name) {
  try {
    const raw = localStorage.getItem(saveKey(profileId, name));
    return raw == null ? null : base64ToBytes(raw);
  } catch {
    return null;
  }
}

export function writeSaveBytes(profileId, name, bytes) {
  try {
    const encoded = bytesToBase64(bytes);
    localStorage.setItem(saveKey(profileId, name), encoded);
    const index = readSaveIndex();
    index[profileId] ??= {};
    index[profileId][name] = {
      size: bytes.byteLength,
      updatedAt: new Date().toISOString(),
    };
    writeSaveIndex(index);
    return { ok: true, meta: index[profileId][name] };
  } catch (error) {
    return { ok: false, error };
  }
}

export function exportSaveBundle(profileId) {
  const slots = listSaveSlots(profileId);
  const saves = {};
  for (const slot of slots) {
    const raw = localStorage.getItem(saveKey(profileId, slot.name));
    if (raw) saves[slot.name] = { ...slot, payload: raw };
  }
  return JSON.stringify({
    schema: 'riftwad-save-bundle-v1',
    profileId,
    createdAt: new Date().toISOString(),
    saves,
  }, null, 2);
}

export function importSaveBundle(serialized, expectedProfileId) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  if (!parsed || parsed.schema !== 'riftwad-save-bundle-v1' || !parsed.saves || typeof parsed.saves !== 'object') {
    throw new Error('This file is not a valid RIFTWAD save export.');
  }
  if (expectedProfileId && parsed.profileId !== expectedProfileId) {
    throw new Error('This save export belongs to a different WAD profile.');
  }
  const profileId = parsed.profileId;
  const index = readSaveIndex();
  index[profileId] ??= {};
  let imported = 0;
  for (const [name, entry] of Object.entries(parsed.saves)) {
    if (!/^doomsav[0-5]\.dsg$/.test(name) || !entry?.payload) continue;
    const bytes = base64ToBytes(entry.payload);
    localStorage.setItem(saveKey(profileId, name), entry.payload);
    index[profileId][name] = {
      size: bytes.byteLength,
      updatedAt: entry.updatedAt ?? new Date().toISOString(),
    };
    imported++;
  }
  writeSaveIndex(index);
  return { profileId, imported };
}

function readSaveIndex() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_INDEX_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSaveIndex(index) {
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
}

function saveKey(profileId, name) {
  return `${SAVE_PREFIX}:${profileId}:${name}`;
}

function bytesToBase64(bytes) {
  const CHUNK = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
