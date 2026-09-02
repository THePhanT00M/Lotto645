"use client"

import { Loader2, Mail, Send } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** 서버와 같은 기준. 보내기 전에 걸러 헛걸음을 줄인다. */
const MIN_MESSAGE_LENGTH = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 문의하기
 *
 * 로그인하지 않아도 남길 수 있다. 답변은 남겨 준 이메일로 가므로 그 주소만
 * 받고, 나머지는 무슨 일이 있었는지 적을 자리다.
 */
export default function ContactPage() {
  const { t } = useTranslation()
  const [values, setValues] = useState({ email: "", subject: "", message: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const update = (key: keyof typeof values) => (value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: "" }))
  }

  const send = async () => {
    const found: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = t.contact.errors.email
    if (!values.subject.trim()) found.subject = t.contact.errors.subject
    if (values.message.trim().length < MIN_MESSAGE_LENGTH) found.message = t.contact.errors.message

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      setIsSent(true)
    } catch (error) {
      setErrors({ message: error instanceof Error ? error.message : t.contact.errors.failed })
    } finally {
      setIsSending(false)
    }
  }

  return (
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t.contact.title}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">{t.contact.description}</p>
        </div>

        {isSent ? (
            <Panel className="space-y-4 text-center">
              <p className="text-ink text-lg font-semibold">{t.contact.sent}</p>
              <p className="text-ink-muted text-sm">{t.contact.sentDescription}</p>

              <Button
                  variant="outline"
                  onClick={() => {
                    setValues({ email: "", subject: "", message: "" })
                    setIsSent(false)
                  }}
                  className="bg-surface border-line"
              >
                {t.contact.another}
              </Button>
            </Panel>
        ) : (
            <Panel className="space-y-5">
              <Field label={t.contact.email} htmlFor="email" error={errors.email}>
                <Input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(event) => update("email")(event.target.value)}
                    placeholder={t.contact.emailPlaceholder}
                    disabled={isSending}
                    className="bg-surface border-line"
                />
              </Field>

              <Field label={t.contact.subject} htmlFor="subject" error={errors.subject}>
                <Input
                    id="subject"
                    value={values.subject}
                    onChange={(event) => update("subject")(event.target.value)}
                    placeholder={t.contact.subjectPlaceholder}
                    disabled={isSending}
                    className="bg-surface border-line"
                />
              </Field>

              <Field label={t.contact.message} htmlFor="message" error={errors.message}>
                <textarea
                    id="message"
                    value={values.message}
                    onChange={(event) => update("message")(event.target.value)}
                    placeholder={t.contact.messagePlaceholder}
                    disabled={isSending}
                    rows={8}
                    className="bg-surface border-line text-ink placeholder:text-ink-muted w-full rounded-md border px-3 py-2 text-sm leading-relaxed disabled:opacity-50"
                />
              </Field>

              <div className="flex justify-end">
                <Button
                    onClick={() => void send()}
                    disabled={isSending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isSending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSending ? t.contact.sending : t.contact.submit}
                </Button>
              </div>
            </Panel>
        )}
      </div>
  )
}

function Field({
                 label,
                 htmlFor,
                 error,
                 children,
               }: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor} className="text-ink text-sm font-medium">
          {label}
        </Label>
        {children}
        {error && <p className="text-danger text-xs">{error}</p>}
      </div>
  )
}
