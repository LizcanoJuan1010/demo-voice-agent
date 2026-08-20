import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import type { ChatMsg } from './useChat'

type Props = {
  messages: ChatMsg[]
  isStreaming: boolean
  error: string | null
  personaName: string
  onSend: (text: string) => void
  onReset: () => void
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:0ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:150ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:300ms]" />
    </span>
  )
}

export function ChatPanel({
  messages,
  isStreaming,
  error,
  personaName,
  onSend,
  onReset,
}: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    const value = input.trim()
    if (!value || isStreaming) return
    onSend(value)
    setInput('')
  }

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
      <header className="flex items-center gap-3 border-b border-outline-variant/40 px-5 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-white text-black">
          <Icon name="psychology" className="text-[20px]" />
        </div>
        <div className="min-w-0">
          <p className="text-label-md font-bold text-white">{personaName}</p>
          <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span
              className={`size-2 rounded-full ${isStreaming ? 'animate-pulse bg-white' : 'bg-white/60'}`}
            />
            {isStreaming ? 'Typing…' : 'On the line · pre-charge-off collections'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          aria-label="Restart call"
          title="Restart call"
          className="ml-auto flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-white"
        >
          <Icon name="restart_alt" className="text-[20px]" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-4 rounded-lg border border-outline-variant/40 bg-white/5 px-3 py-2 text-label-sm text-on-surface-variant">
          You are playing{' '}
          <span className="font-bold text-white">James Carter</span>. Start by
          saying "Hi", then respond as the consumer would on the call.
        </p>
        <div className="flex flex-col gap-3">
          {messages.map((m) =>
            m.role === 'assistant' ? (
              <div key={m.id} className="chat-msg flex items-start gap-3">
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black">
                  <Icon name="psychology" className="text-[18px]" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-outline-variant bg-surface-container-high p-4 text-body-md text-on-surface">
                  {m.content ? (
                    <span className="whitespace-pre-wrap">
                      {m.content}
                      {isStreaming && m.id === lastAssistantId && (
                        <span className="typing-cursor" />
                      )}
                    </span>
                  ) : isStreaming ? (
                    <ThinkingDots />
                  ) : null}
                </div>
              </div>
            ) : (
              <div key={m.id} className="chat-msg flex items-start justify-end gap-3">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-none bg-white p-4 text-body-md text-black shadow-md">
                  {m.content}
                </div>
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-variant text-on-surface">
                  <Icon name="person" className="text-[18px]" />
                </div>
              </div>
            ),
          )}
          {error && (
            <p className="text-center text-label-sm text-error">{error}</p>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/40 p-4">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-end rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-2 transition-colors focus-within:border-white/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder="Reply as James Carter…"
              className="max-h-32 flex-1 resize-none bg-transparent text-body-md text-white outline-none placeholder:text-outline"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className="flex size-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-black shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" filled className="text-[20px]" />
          </button>
        </div>
        <p className="mt-2 text-center text-label-sm text-outline">
          Enter sends · Shift+Enter for a new line
        </p>
      </div>
    </div>
  )
}
