import { initializeApp } from 'firebase/app'
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy
} from 'firebase/firestore'

// Paste your Firebase config here in Part 2
const firebaseConfig = {
  apiKey: "AIzaSyDpYEu-uFFXe8tdr3xVaKLB2_-vO9cgU4M",
  authDomain: "reviseiq-25b69.firebaseapp.com",
  projectId: "reviseiq-25b69",
  storageBucket: "reviseiq-25b69.firebasestorage.app",
  messagingSenderId: "101390114831",
  appId: "1:101390114831:web:3840366067c5dfed61437a",
  measurementId: "G-N4L5WFR4B1"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Matches the window.storage API exactly:
// get(key, shared) → { key, value, shared } or throws
// set(key, value, shared) → { key, value, shared }
// delete(key, shared) → { key, deleted, shared }
// list(prefix, shared) → { keys, shared }

function collectionName(shared) {
  return shared ? 'shared' : 'personal'
}

export const storage = {
  async get(key, shared = false) {
    const col = collectionName(shared)
    const ref = doc(db, col, encodeKey(key))
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('Key not found: ' + key)
    return { key, value: snap.data().value, shared }
  },

  async set(key, value, shared = false) {
    const col = collectionName(shared)
    const ref = doc(db, col, encodeKey(key))
    await setDoc(ref, { value, key, updatedAt: Date.now() })
    return { key, value, shared }
  },

  async delete(key, shared = false) {
    const col = collectionName(shared)
    const ref = doc(db, col, encodeKey(key))
    await deleteDoc(ref)
    return { key, deleted: true, shared }
  },

  async list(prefix = '', shared = false) {
    const col = collectionName(shared)
    const colRef = collection(db, col)
    const snap = await getDocs(colRef)
    const keys = []
    snap.forEach(d => {
      const k = d.data().key || decodeKey(d.id)
      if (!prefix || k.startsWith(prefix)) keys.push(k)
    })
    return { keys, prefix, shared }
  }
}

function encodeKey(key) {
  // Firestore doc IDs can't contain / so encode it
  return key.replace(/\//g, '__SLASH__')
}

function decodeKey(id) {
  return id.replace(/__SLASH__/g, '/')
}

// Install as window.storage so the existing app code works without changes
if (typeof window !== 'undefined') {
  window.storage = storage
}
