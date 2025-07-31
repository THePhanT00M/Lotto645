import { winningNumbers } from "@/data/winning-numbers"
import { saveToIndexedDB, loadFromIndexedDB, clearAllData, DB_CONSTANTS } from "@/utils/indexed-db"

// 모델 학습 상태를 관리하기 위한 이벤트 이미터
class TrainingEventEmitter {
  private listeners: { [event: string]: Function[] } = {}

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    return this
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args))
    }
    return this
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.listeners[event]
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
    return this
  }
}

export const trainingEvents = new TrainingEventEmitter()

// 모델 상태 관리
let isModelTrained = false
let isTraining = false
let trainingProgress = 0
let worker: Worker | null = null
let modelJson: any = null

// Worker 초기화
function initWorker() {
  if (typeof window === "undefined") return null
  if (worker) return worker

  try {
    worker = new Worker("/tf-worker.js")

    worker.onmessage = (e) => {
      const { type, ...data } = e.data

      switch (type) {
        case "initialized":
          console.log("TensorFlow.js 초기화 완료:", data.backend)
          // 초기화 후 자동으로 저장된 모델 로드 시도
          loadModelFromStorage()
          break

        case "trainingStart":
          isTraining = true
          trainingProgress = 0
          trainingEvents.emit("trainingStart")
          break

        case "trainingProgress":
          trainingProgress = data.progress
          trainingEvents.emit("trainingProgress", data.progress, data.metrics)
          break

        case "trainingComplete":
          isModelTrained = true
          isTraining = false
          trainingProgress = 1
          modelJson = data.modelJson
          // 모델 저장
          saveModelToStorage(modelJson, data.history)
          trainingEvents.emit("trainingComplete", data.history)
          break

        case "trainingError":
          isTraining = false
          trainingEvents.emit("trainingError", new Error(data.error))
          break

        case "trainingInfo":
          trainingEvents.emit("trainingInfo", data.message)
          break

        case "modelLoaded":
          isModelTrained = data.success
          if (data.success) {
            console.log("모델 로드 성공")
            trainingEvents.emit("modelLoaded", true)
          } else {
            console.error("모델 로드 실패")
            // 모델 로드 실패 시 저장된 데이터 정리
            handleModelLoadFailure()
          }
          break

        case "modelReset":
          isModelTrained = false
          isTraining = false
          trainingProgress = 0
          modelJson = null
          trainingEvents.emit("modelReset")
          break

        case "error":
          console.error("Worker 오류:", data.message)
          isTraining = false // 오류 발생 시 학습 상태 초기화
          trainingEvents.emit("error", new Error(data.message))
          break
      }
    }

    worker.onerror = (error) => {
      console.error("Worker 오류:", error)
      trainingEvents.emit("error", error)
    }

    // Worker 초기화
    worker.postMessage({ action: "init" })

    return worker
  } catch (error) {
    console.error("Worker 초기화 실패:", error)
    return null
  }
}

// 모델 로드 실패 처리
function handleModelLoadFailure() {
  console.log("모델 로드 실패로 인한 저장된 데이터 정리")
  try {
    // IndexedDB 사용하여 데이터 정리
    clearAllData()
      .then(() => {
        console.log("손상된 모델 데이터 정리 완료")
      })
      .catch((error) => {
        console.error("모델 데이터 정리 실패:", error)
      })
  } catch (error) {
    console.error("모델 데이터 정리 실패:", error)
  }
}

// IndexedDB에 모델 저장
async function saveModelToStorage(model: any, history: any) {
  try {
    console.log("모델 IndexedDB에 저장 중...")

    // 모델 데이터 유효성 검사
    if (!model || !model.modelTopology || !model.weightSpecs || !model.weightData) {
      console.error("저장할 모델 데이터가 유효하지 않습니다")
      return
    }

    // 모델 저장
    await saveToIndexedDB(DB_CONSTANTS.MODEL_STORE, DB_CONSTANTS.MODEL_ID, model)

    // 학습 히스토리 저장
    await saveToIndexedDB(DB_CONSTANTS.HISTORY_STORE, DB_CONSTANTS.HISTORY_ID, history)

    console.log("모델 IndexedDB에 저장 완료")
  } catch (error) {
    console.error("모델 저장 실패:", error)
  }
}

// IndexedDB에서 모델 로드
async function loadModelFromStorage() {
  try {
    console.log("저장된 모델 확인 중...")

    // IndexedDB에서 모델 로드
    const modelData = await loadFromIndexedDB(DB_CONSTANTS.MODEL_STORE, DB_CONSTANTS.MODEL_ID)

    if (modelData) {
      console.log("저장된 모델 발견! 로드 시도 중...")

      try {
        // 모델 데이터 유효성 검사
        if (!modelData || !modelData.modelTopology || !modelData.weightSpecs || !modelData.weightData) {
          console.error("저장된 모델 데이터가 손상되었습니다")
          handleModelLoadFailure()
          return false
        }

        console.log("모델 데이터 파싱 성공")
        modelJson = modelData

        // Worker에 모델 로드 요청
        const w = worker || initWorker()
        if (w) {
          w.postMessage({
            action: "load",
            data: { modelJson: modelData },
          })
          return true
        }
      } catch (parseError) {
        console.error("모델 데이터 파싱 실패:", parseError)
        handleModelLoadFailure()
        return false
      }
    } else {
      console.log("저장된 모델이 없습니다.")
    }
    return false
  } catch (error) {
    console.error("저장된 모델 로드 실패:", error)
    handleModelLoadFailure()
    return false
  }
}

// 모델 로드 (외부에서 호출)
export async function loadModel() {
  try {
    return await loadModelFromStorage()
  } catch (error) {
    console.error("모델 로드 실패:", error)
    return false
  }
}

// 모델 학습
export async function trainModel() {
  if (isTraining) {
    return { success: false, message: "이미 학습 중입니다." }
  }

  try {
    // 학습 시작 전 상태 초기화
    isModelTrained = false
    isTraining = true
    trainingProgress = 0

    const worker = initWorker()
    if (!worker) {
      throw new Error("Web Worker를 초기화할 수 없습니다. 브라우저가 Web Worker를 지원하지 않을 수 있습니다.")
    }

    worker.postMessage({
      action: "train",
      data: { winningNumbers },
    })

    return { success: true, message: "학습이 시작되었습니다." }
  } catch (error) {
    console.error("모델 학습 시작 실패:", error)
    isTraining = false // 오류 시 학습 상태 초기화
    return { success: false, message: `모델 학습 시작 실패: ${error}` }
  }
}

// 번호 추천
export async function predictNumbers() {
  if (!isModelTrained) {
    throw new Error("모델이 학습되지 않았습니다.")
  }

  return new Promise<number[]>((resolve, reject) => {
    try {
      const worker = initWorker()
      if (!worker) {
        throw new Error("Web Worker를 초기화할 수 없습니다.")
      }

      // 최근 5회 당첨 번호를 입력으로 사용
      const recentDraws = winningNumbers.slice(-5).flatMap((draw) => draw.numbers)

      // 예측 결과를 받기 위한 일회성 이벤트 리스너
      const messageHandler = (e: MessageEvent) => {
        const { type, numbers, message } = e.data
        if (type === "prediction") {
          worker.removeEventListener("message", messageHandler)
          resolve(numbers)
        } else if (type === "error") {
          worker.removeEventListener("message", messageHandler)
          reject(new Error(message))
        }
      }

      worker.addEventListener("message", messageHandler)

      // 예측 요청 (전체 당첨 번호 데이터도 함께 전달)
      worker.postMessage({
        action: "predict",
        data: {
          recentDraws,
          winningNumbers,
        },
      })
    } catch (error) {
      console.error("번호 예측 실패:", error)
      reject(error)
    }
  })
}

// 모델 상태 확인
export function getModelStatus() {
  return {
    isModelTrained,
    isTraining,
    trainingProgress,
  }
}

// 모델 초기화
export function resetModel() {
  try {
    // 상태 초기화
    isModelTrained = false
    isTraining = false
    trainingProgress = 0
    modelJson = null

    const worker = initWorker()
    if (worker) {
      worker.postMessage({ action: "reset" })
    }

    // IndexedDB 사용하여 데이터 정리
    clearAllData()
      .then(() => {
        console.log("모델 데이터 초기화 완료")
      })
      .catch((error) => {
        console.error("모델 데이터 초기화 실패:", error)
      })

    return true
  } catch (error) {
    console.error("모델 초기화 실패:", error)
    return false
  }
}

// 학습 히스토리 가져오기
export async function getTrainingHistory() {
  try {
    // IndexedDB에서 히스토리 로드
    const history = await loadFromIndexedDB(DB_CONSTANTS.HISTORY_STORE, DB_CONSTANTS.HISTORY_ID)
    return history || null
  } catch (error) {
    console.error("학습 히스토리 로드 실패:", error)
    return null
  }
}

// 브라우저 환경에서만 Worker 초기화
if (typeof window !== "undefined") {
  initWorker()
}

// 모델 내보내기
export async function exportModel(): Promise<void> {
  if (!isModelTrained || !modelJson) {
    throw new Error("내보낼 학습된 모델이 없습니다.")
  }

  try {
    // 학습 히스토리도 함께 가져오기
    const history = await getTrainingHistory()

    // 내보낼 데이터 구성
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      modelData: modelJson,
      trainingHistory: history,
      metadata: {
        trainingDataSize: winningNumbers.length,
        modelType: "Sequential Neural Network",
        description: "로또 번호 예측을 위한 딥러닝 모델",
      },
    }

    // JSON 문자열로 변환
    const jsonString = JSON.stringify(exportData, null, 2)

    // Blob 생성
    const blob = new Blob([jsonString], { type: "application/json" })

    // 파일 다운로드
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `lotto-model-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log("모델 내보내기 완료")
  } catch (error) {
    console.error("모델 내보내기 실패:", error)
    throw error
  }
}

// 모델 가져오기
export async function importModel(file: File): Promise<{ success: boolean; message: string }> {
  try {
    // 파일 읽기
    const text = await file.text()
    const importData = JSON.parse(text)

    // 데이터 유효성 검사
    if (!importData.modelData || !importData.version) {
      throw new Error("유효하지 않은 모델 파일입니다.")
    }

    // 모델 데이터 유효성 검사
    const modelData = importData.modelData
    if (!modelData.modelTopology || !modelData.weightSpecs || !modelData.weightData) {
      throw new Error("모델 데이터가 손상되었습니다.")
    }

    console.log("모델 파일 검증 완료, 가져오기 시작...")

    // 기존 모델 초기화
    resetModel()

    // 새 모델 데이터 저장
    await saveModelToStorage(modelData, importData.trainingHistory)

    // Worker에 모델 로드 요청
    const worker = initWorker()
    if (worker) {
      modelJson = modelData
      worker.postMessage({
        action: "load",
        data: { modelJson: modelData },
      })
    }

    return {
      success: true,
      message: `모델을 성공적으로 가져왔습니다. (내보낸 날짜: ${new Date(importData.exportDate).toLocaleDateString()})`,
    }
  } catch (error) {
    console.error("모델 가져오기 실패:", error)
    return {
      success: false,
      message: `모델 가져오기 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    }
  }
}

// 모델 파일 유효성 검사
export function validateModelFile(file: File): { isValid: boolean; message: string } {
  // 파일 크기 검사 (최대 50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, message: "파일 크기가 너무 큽니다. (최대 50MB)" }
  }

  // 파일 확장자 검사
  if (!file.name.toLowerCase().endsWith(".json")) {
    return { isValid: false, message: "JSON 파일만 지원됩니다." }
  }

  return { isValid: true, message: "유효한 파일입니다." }
}
