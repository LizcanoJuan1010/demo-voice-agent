import { useCallback, useEffect, useRef, useState } from 'react'

export type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

type SseFrame = { event: string; data: unknown }

function parseFrame(raw: string): SseFrame | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:'))
      dataLines.push(line.slice(5).replace(/^ /, ''))
  }
  if (dataLines.length === 0) return null
  const payload = dataLines.join('\n')
  try {
    return { event, data: JSON.parse(payload) } as SseFrame
  } catch {
    return { event, data: payload }
  }
}

export function useChat(initialAssistantMessage?: string) {
  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    initialAssistantMessage
      ? [{ id: makeId(), role: 'assistant', content: initialAssistantMessage }]
      : [],
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const apiHistory = messages.map((m) => ({ role: m.role, content: m.content }))
      apiHistory.push({ role: 'user', content: trimmed })

      const assistantId = makeId()
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setIsStreaming(true)
      setError(null)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ messages: apiHistory }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let sep = buffer.indexOf('\n\n')
          while (sep !== -1) {
            const frame = parseFrame(buffer.slice(0, sep))
            buffer = buffer.slice(sep + 2)
            if (frame) {
              if (frame.event === 'token') {
                const token = (frame.data as { text?: string })?.text ?? ''
                if (token) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + token } : m,
                    ),
                  )
                }
              } else if (frame.event === 'error') {
                setError(
                  (frame.data as { message?: string })?.message ??
                    'The agent hit an error.',
                )
              }
            }
            sep = buffer.indexOf('\n\n')
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          setError('The agent is not available right now. Please try again.')
        }
      } finally {
        if (mountedRef.current) setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages(
      initialAssistantMessage
        ? [{ id: makeId(), role: 'assistant', content: initialAssistantMessage }]
        : [],
    )
    setError(null)
    setIsStreaming(false)
  }, [initialAssistantMessage])

  return { messages, isStreaming, error, send, reset }
}
