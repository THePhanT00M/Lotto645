// IndexedDB 관리를 위한 유틸리티 함수

// 데이터베이스 설정
const DB_NAME = "LottoModelDB"
const DB_VERSION = 1
const MODEL_STORE = "models"
const HISTORY_STORE = "history"

// IndexedDB 초기화
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("IndexedDB 열기 실패:", event)
      reject(new Error("IndexedDB를 열 수 없습니다."))
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 모델 저장소 생성
      if (!db.objectStoreNames.contains(MODEL_STORE)) {
        db.createObjectStore(MODEL_STORE, { keyPath: "id" })
      }

      // 학습 히스토리 저장소 생성
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: "id" })
      }
    }
  })
}

// 데이터 저장
export async function saveToIndexedDB(storeName: string, id: string, data: any): Promise<void> {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)

      const request = store.put({ id, data })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = (event) => {
        console.error(`IndexedDB ${storeName} 저장 실패:`, event)
        reject(new Error(`데이터 저장에 실패했습니다.`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("IndexedDB 저장 오류:", error)
    throw error
  }
}

// 데이터 로드
export async function loadFromIndexedDB(storeName: string, id: string): Promise<any> {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)

      const request = store.get(id)

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result
        if (result) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = (event) => {
        console.error(`IndexedDB ${storeName} 로드 실패:`, event)
        reject(new Error(`데이터 로드에 실패했습니다.`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("IndexedDB 로드 오류:", error)
    throw error
  }
}

// 데이터 삭제
export async function deleteFromIndexedDB(storeName: string, id: string): Promise<void> {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)

      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = (event) => {
        console.error(`IndexedDB ${storeName} 삭제 실패:`, event)
        reject(new Error(`데이터 삭제에 실패했습니다.`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("IndexedDB 삭제 오류:", error)
    throw error
  }
}

// 모든 저장소 데이터 삭제
export async function clearAllData(): Promise<void> {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODEL_STORE, HISTORY_STORE], "readwrite")

      const modelStore = transaction.objectStore(MODEL_STORE)
      const historyStore = transaction.objectStore(HISTORY_STORE)

      modelStore.clear()
      historyStore.clear()

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = (event) => {
        console.error("IndexedDB 데이터 초기화 실패:", event)
        reject(new Error("데이터 초기화에 실패했습니다."))
      }
    })
  } catch (error) {
    console.error("IndexedDB 초기화 오류:", error)
    throw error
  }
}

// 상수 내보내기
export const DB_CONSTANTS = {
  MODEL_STORE,
  HISTORY_STORE,
  MODEL_ID: "lottoDeepLearningModel",
  HISTORY_ID: "lottoTrainingHistory",
}
