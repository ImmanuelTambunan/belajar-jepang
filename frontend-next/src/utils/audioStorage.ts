/**
 * IndexedDB Storage Engine for Custom User-Uploaded Audio
 * Allows users to store custom .mp3/.ogg recordings per character offline in browser.
 */

const DB_NAME = 'NihongoSoraAudioDB'
const DB_VERSION = 1
const STORE_NAME = 'custom_audio'

export interface CustomAudioRecord {
  romaji: string
  symbol: string
  blob: Blob
  mimeType: string
  fileName: string
  fileSize: number
  updatedAt: number
}

let dbInstance: IDBDatabase | null = null

/**
 * Initializes and opens the IndexedDB database
 */
function openAudioDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB tidak tersedia di server-side.'))
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'romaji' })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal membuka IndexedDB audio.'))
    }
  })
}

/**
 * Saves or updates a custom audio file for a specific character
 */
export async function saveCustomAudio(
  romaji: string,
  symbol: string,
  file: File | Blob,
  fileName = 'custom_audio.mp3'
): Promise<CustomAudioRecord> {
  const db = await openAudioDB()
  const normalizedRomaji = romaji.toLowerCase().trim()

  const record: CustomAudioRecord = {
    romaji: normalizedRomaji,
    symbol: symbol.trim(),
    blob: file,
    mimeType: file.type || 'audio/mpeg',
    fileName: (file as File).name || fileName,
    fileSize: file.size,
    updatedAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(record)

    request.onsuccess = () => {
      // Dispatch custom event so all active components update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nihongo_sora_custom_audio_updated', {
            detail: { romaji: normalizedRomaji, action: 'save' },
          })
        )
      }
      resolve(record)
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal menyimpan file audio ke IndexedDB.'))
    }
  })
}

/**
 * Retrieves custom audio record for a specific character romaji
 */
export async function getCustomAudio(
  romaji: string
): Promise<CustomAudioRecord | null> {
  const db = await openAudioDB()
  const normalizedRomaji = romaji.toLowerCase().trim()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(normalizedRomaji)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal membaca audio dari IndexedDB.'))
    }
  })
}

/**
 * Deletes custom audio for a specific character
 */
export async function deleteCustomAudio(romaji: string): Promise<void> {
  const db = await openAudioDB()
  const normalizedRomaji = romaji.toLowerCase().trim()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(normalizedRomaji)

    request.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nihongo_sora_custom_audio_updated', {
            detail: { romaji: normalizedRomaji, action: 'delete' },
          })
        )
      }
      resolve()
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal menghapus audio dari IndexedDB.'))
    }
  })
}

/**
 * Returns a dictionary of all custom audio records indexed by romaji
 */
export async function getAllCustomAudio(): Promise<Record<string, CustomAudioRecord>> {
  const db = await openAudioDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const records: CustomAudioRecord[] = request.result || []
      const map: Record<string, CustomAudioRecord> = {}
      for (const rec of records) {
        map[rec.romaji] = rec
      }
      resolve(map)
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal mengambil semua audio kustom.'))
    }
  })
}

/**
 * Clears all custom audio records from IndexedDB
 */
export async function clearAllCustomAudio(): Promise<void> {
  const db = await openAudioDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nihongo_sora_custom_audio_updated', {
            detail: { action: 'clear' },
          })
        )
      }
      resolve()
    }

    request.onerror = () => {
      reject(request.error || new Error('Gagal mereset semua audio kustom.'))
    }
  })
}
