// src/storage.js
// Persistence layer that backs window.storage.
//
// Contract used throughout the app:
//   await window.storage.get(key, global?)   -> { value: string } | null
//                                               (callers do: if (r?.value) JSON.parse(r.value))
//   await window.storage.set(key, str, global?) -> stores an already-stringified value
//   await window.storage.list(prefix, global?)   -> { keys: string[] }
//   await window.storage.delete(key, global?)    -> removes a key
//
// Backed by localStorage, with an in-memory fallback for environments where
// localStorage is unavailable (private mode, SSR, build-time evaluation).

const memory = new Map();

function hasLocalStorage() {
  try {
    const k = "__riq_ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

const useLS = typeof window !== "undefined" && hasLocalStorage();

function rawGet(key) {
  if (useLS) return window.localStorage.getItem(key);
  return memory.has(key) ? memory.get(key) : null;
}
function rawSet(key, value) {
  if (useLS) window.localStorage.setItem(key, value);
  else memory.set(key, value);
}
function rawDelete(key) {
  if (useLS) window.localStorage.removeItem(key);
  else memory.delete(key);
}
function rawKeys() {
  if (useLS) {
    const out = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k != null) out.push(k);
    }
    return out;
  }
  return Array.from(memory.keys());
}

const storage = {
  // Returns { value } (raw stored string) or null when the key is absent.
  async get(key /*, global */) {
    const value = rawGet(key);
    return value == null ? null : { value };
  },
  // Stores a string value. Callers JSON.stringify beforehand.
  async set(key, value /*, global */) {
    rawSet(key, value == null ? "" : String(value));
    return true;
  },
  // Removes a key.
  async delete(key /*, global */) {
    rawDelete(key);
    return true;
  },
  // Returns { keys } for every stored key that begins with prefix.
  async list(prefix = "" /*, global */) {
    const keys = rawKeys().filter((k) => k.startsWith(prefix));
    return { keys };
  },
};

if (typeof window !== "undefined") {
  window.storage = storage;
}

export default storage;
