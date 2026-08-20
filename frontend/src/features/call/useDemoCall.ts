import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEMO_OUTCOME,
  DEMO_SCRIPT,
  type CallOutcome,
  type TranscriptLine,
} from '../../data/agentConfig'

export type DemoStatus = 'idle' | 'ringing' | 'in_progress' | 'completed'

export function useDemoCall() {
  const [status, setStatus] = useState<DemoStatus>('idle')
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [outcome, setOutcome] = useState<CallOutcome | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setLines([])
    setStatus('idle')
    setOutcome(null)
  }, [clearTimers])

  const start = useCallback(() => {
    reset()
    setStatus('ringing')
    let delay = 900
    DEMO_SCRIPT.forEach((entry, index) => {
      const id = index
      timers.current.push(
        setTimeout(() => {
          setStatus((s) => (s === 'ringing' ? 'in_progress' : s))
          setLines((prev) => [...prev, { id, role: entry.role, text: entry.text }])
        }, delay),
      )
      delay += entry.role === 'ai' ? 1500 : 800
    })
    timers.current.push(
      setTimeout(() => {
        setStatus('completed')
        setOutcome(DEMO_OUTCOME)
      }, delay + 500),
    )
  }, [reset])

  useEffect(() => clearTimers, [clearTimers])

  return { status, lines, outcome, start, reset }
}
