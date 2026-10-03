/**
 * 媒体存储：IndexedDB 保存壁纸 Blob（支持大体积视频），
 * IDB 不可用时退化为仅会话内存。
 */

export interface MediaRecord {
  id: string
  blob: Blob
  mime: string
  name: string
  addedAt: number
}

const DB_NAME = 'dsh-plugin-media-wallpaper'
const STORE = 'media'
const DB_VERSION = 1

let memoryFallback: Map<string, MediaRecord> | null = null
let dbPromise: Promise<IDBDatabase | null> | null = null

function hasIndexedDB(): boolean {
  return typeof globalThis.indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (!hasIndexedDB()) {
        memoryFallback ??= new Map()
        resolve(null)
        return
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => {
          memoryFallback ??= new Map()
          resolve(null)
        }
      } catch {
        memoryFallback ??= new Map()
        resolve(null)
      }
    })
  }
  return dbPromise
}

export async function putMedia(record: MediaRecord): Promise<void> {
  const db = await openDb()
  if (!db) {
    memoryFallback?.set(record.id, record)
    return
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function getMedia(id: string): Promise<MediaRecord | null> {
  const db = await openDb()
  if (!db) return memoryFallback?.get(id) ?? null
  return await new Promise((resolve) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    req.onsuccess = () => resolve((req.result as MediaRecord | undefined) ?? null)
    req.onerror = () => resolve(null)
  })
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDb()
  if (!db) {
    memoryFallback?.delete(id)
    return
  }
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
    tx.onabort = () => resolve()
  })
}

/** objectURL 生命周期：同一时刻只持有一个媒体 URL。 */
let currentUrl: string | null = null

export function takeObjectUrl(blob: Blob): string {
  releaseObjectUrl()
  currentUrl = URL.createObjectURL(blob)
  return currentUrl
}

export function currentObjectUrl(): string | null {
  return currentUrl
}

export function releaseObjectUrl(): void {
  if (currentUrl !== null) {
    try {
      URL.revokeObjectURL(currentUrl)
    } catch {
      // ignore
    }
    currentUrl = null
  }
}
