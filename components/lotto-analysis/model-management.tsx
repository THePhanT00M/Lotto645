"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { exportModel, importModel, validateModelFile } from "@/utils/deep-learning-model"

interface ModelManagementProps {
  isModelTrained: boolean
  onModelImported?: () => void
}

export function ModelManagement({ isModelTrained, onModelImported }: ModelManagementProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모델 내보내기
  const handleExport = async () => {
    if (!isModelTrained) {
      setImportMessage({ type: "error", text: "내보낼 학습된 모델이 없습니다." })
      return
    }

    setIsExporting(true)
    try {
      await exportModel()
      setImportMessage({ type: "success", text: "모델을 성공적으로 내보냈습니다." })
    } catch (error) {
      setImportMessage({
        type: "error",
        text: `모델 내보내기 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 모델 가져오기
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 유효성 검사
    const validation = validateModelFile(file)
    if (!validation.isValid) {
      setImportMessage({ type: "error", text: validation.message })
      return
    }

    setIsImporting(true)
    setImportMessage(null)

    try {
      const result = await importModel(file)
      setImportMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      })

      if (result.success && onModelImported) {
        onModelImported()
      }
    } catch (error) {
      setImportMessage({
        type: "error",
        text: `모델 가져오기 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      })
    } finally {
      setIsImporting(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 메시지 초기화
  const clearMessage = () => {
    setImportMessage(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 모델 내보내기 */}
        <Button
          onClick={handleExport}
          disabled={!isModelTrained || isExporting}
          variant="outline"
          className="flex-1 text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-600 bg-transparent hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white"
        >
          <Download className={`w-4 h-4 mr-2 ${isExporting ? "animate-pulse" : ""}`} />
          {isExporting ? "내보내는 중..." : "모델 내보내기"}
        </Button>

        {/* 모델 가져오기 */}
        <Button
          onClick={handleFileSelect}
          disabled={isImporting}
          variant="outline"
          className="flex-1 text-teal-600 dark:text-teal-400 border-teal-500 dark:border-teal-600 bg-transparent hover:bg-teal-500 dark:hover:bg-teal-600 hover:text-white dark:hover:text-white"
        >
          <Upload className={`w-4 h-4 mr-2 ${isImporting ? "animate-pulse" : ""}`} />
          {isImporting ? "가져오는 중..." : "모델 가져오기"}
        </Button>

        {/* 숨겨진 파일 입력 */}
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* 상태 메시지 */}
      {importMessage && (
        <div
          className={`p-3 rounded-lg border flex items-start gap-2 cursor-pointer ${
            importMessage.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
          onClick={clearMessage}
        >
          {importMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{importMessage.text}</p>
            <p className="text-xs mt-1 opacity-75">클릭하여 닫기</p>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="bg-gray-50 dark:bg-[#464646] rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <p className="font-medium">모델 관리 안내:</p>
            <ul className="space-y-1 ml-2">
              <li>
                • <strong>내보내기:</strong> 학습된 모델을 JSON 파일로 저장합니다.
              </li>
              <li>
                • <strong>가져오기:</strong> 이전에 내보낸 모델 파일을 불러옵니다.
              </li>
              <li>• 모델 파일에는 학습 데이터와 히스토리가 포함됩니다.</li>
              <li>• 다른 기기나 브라우저에서도 동일한 모델을 사용할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
