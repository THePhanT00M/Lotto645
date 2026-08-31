"use client"

import { useCallback, useState, type ChangeEvent } from "react"

/** 필드 id별 에러 메시지 */
export type FormErrors = Record<string, string>

/**
 * 인증 폼의 값과 필드별 에러를 함께 관리한다.
 *
 * 사용자가 입력을 고치면 해당 필드의 에러는 바로 지운다.
 */
export function useAuthForm<T extends Record<string, string>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target

    setValues((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => {
      if (!(id in prev)) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  return { values, setValues, errors, setErrors, isSubmitting, setIsSubmitting, handleChange, reset }
}

/** 이메일 형식이 그럴듯한지 확인한다. */
export const isValidEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email)
