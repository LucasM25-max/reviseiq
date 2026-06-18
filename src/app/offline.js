import React, { useEffect, useCallback } from "react";
import { tx } from "./ui.jsx";

export function createIDBHelpers() {
  var dbName = "reviseiq";
  var storeName = "offlineQueue";
  function openDb() {
    return new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
        };
        req.onsuccess = function () {
          resolve(req.result);
        };
        req.onerror = function () {
          reject(req.error || new Error("idb_open_failed"));
        };
      } catch (e) {
        reject(e);
      }
    });
  }
  async function withStore(mode, fn) {
    var db = await openDb();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, mode);
      var store = tx.objectStore(storeName);
      Promise.resolve(fn(store, tx)).then(resolve).catch(reject);
      tx.onerror = function () {
        reject(tx.error || new Error("idb_tx_failed"));
      };
      tx.oncomplete = function () {
        db.close();
      };
    });
  }
  return {
    enqueue: async function (item) {
      return withStore("readwrite", function (store) {
        store.put(item);
      });
    },
    all: async function () {
      return withStore("readonly", function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.getAll();
          req.onsuccess = function () {
            resolve(req.result || []);
          };
          req.onerror = function () {
            reject(req.error || new Error("idb_getall_failed"));
          };
        });
      });
    },
    removeMany: async function (ids) {
      return withStore("readwrite", function (store) {
        (ids || []).forEach(function (id) {
          store.delete(id);
        });
      });
    },
  };
}

export const IDB_QUEUE = createIDBHelpers();

export async function syncOfflineQueue() {
  if (typeof window === "undefined") return { ok: 0, failed: 0 };
  var lockKey = "gcse:offlineSyncLock";
  if (window.__reviseiqSyncing) return { ok: 0, failed: 0, locked: true };
  window.__reviseiqSyncing = true;
  try {
    if (localStorage.getItem(lockKey) === "1")
      return { ok: 0, failed: 0, locked: true };
    localStorage.setItem(lockKey, "1");
    var rows = [];
    try {
      rows = await IDB_QUEUE.all();
    } catch (_) {
      rows = JSON.parse(
        localStorage.getItem("gcse:offlineQueue:backup") || "[]",
      );
    }
    if (!rows.length) return { ok: 0, failed: 0 };
    var okIds = [];
    var failed = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      try {
        if (typeof window.applyOfflineAction === "function") {
          await window.applyOfflineAction(row);
        } else {
          var k = "gcse:offlineApplied";
          var ex = JSON.parse(localStorage.getItem(k) || "[]");
          ex.push({ id: row.id, type: row.type, timestamp: row.timestamp });
          localStorage.setItem(k, JSON.stringify(ex.slice(-500)));
        }
        okIds.push(row.id);
      } catch (_) {
        failed++;
      }
    }
    if (okIds.length) {
      try {
        await IDB_QUEUE.removeMany(okIds);
      } catch (_) {
        var backup = rows.filter(function (r) {
          return okIds.indexOf(r.id) < 0;
        });
        localStorage.setItem(
          "gcse:offlineQueue:backup",
          JSON.stringify(backup),
        );
      }
    }
    return { ok: okIds.length, failed: failed };
  } finally {
    localStorage.removeItem(lockKey);
    window.__reviseiqSyncing = false;
  }
}

export function useOfflineQueue(user, online) {
  const enqueue = React.useCallback(
    async function (action) {
      var row = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2),
        type: action?.type || "unknown",
        payload: action?.payload || {},
        timestamp: Date.now(),
        user: user || "anon",
      };
      if (online) {
        try {
          if (typeof window.applyOfflineAction === "function") {
            await window.applyOfflineAction(row);
            return row.id;
          }
        } catch (_) {}
      }
      try {
        await IDB_QUEUE.enqueue(row);
      } catch (_) {
        var key = "gcse:offlineQueue:backup";
        var arr = JSON.parse(localStorage.getItem(key) || "[]");
        arr.push(row);
        localStorage.setItem(key, JSON.stringify(arr.slice(-1000)));
      }
      return row.id;
    },
    [online, user],
  );
  React.useEffect(function () {
    function onOnline() {
      syncOfflineQueue();
    }
    window.addEventListener("online", onOnline);
    return function () {
      window.removeEventListener("online", onOnline);
    };
  }, []);
  return { enqueue, syncOfflineQueue };
}

export function registerReviseIQServiceWorker() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    window.__reviseiqSWRegistered
  )
    return;
  window.__reviseiqSWRegistered = true;
  try {
    // One-time cleanup: drop any legacy / blob-registered workers and stale
    // caches that could otherwise keep serving an old, frozen bundle.
    if (navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker
        .getRegistrations()
        .then(function (regs) {
          regs.forEach(function (reg) {
            var su = (reg.active && reg.active.scriptURL) || "";
            if (su.indexOf("blob:") === 0 || su.indexOf("/sw.js") === -1) {
              reg.unregister().catch(function () {});
            }
          });
        })
        .catch(function () {});
    }
    // Old caches are purged by the service worker's own activate handler,
    // which keeps only the current versioned cache. We intentionally do NOT
    // delete caches by a hardcoded name here (that name went stale and could
    // wipe the live cache on every load).
    // Real file served at origin root (proper scope + MIME), network-first.
    navigator.serviceWorker
      .register("/sw.js")
      .then(function (reg) {
        if (reg && reg.update) {
          try {
            reg.update();
          } catch (_) {}
        }
      })
      .catch(function () {});
    // Auto-refresh stale clients: when a freshly deployed worker activates and
    // takes control, reload once so the user immediately gets the new build
    // instead of a frozen, cached app shell.
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (window.__riqSWReloaded) return;
      window.__riqSWReloaded = true;
      window.location.reload();
    });
  } catch (_) {}
}
