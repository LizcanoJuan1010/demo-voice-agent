import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  AgentMicrophone,
  AgentSession,
  type AgentSettingsObject,
} from '@deepgram/agents'
import type {
  DeepgramAgentConfig,
  TranscriptLine,
} from '../../data/agentConfig'

export type LiveState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

export type LiveCallHandle = {
  start: () => Promise<void>
  stop: () => void
  setMicMuted: (muted: boolean) => void
}

type Props = {
  config: DeepgramAgentConfig
  apiKey: string
  onConversation: (lines: TranscriptLine[]) => void
  onState: (state: LiveState) => void
}

/**
 * Reproductor de TTS que enruta el audio por un <audio> (MediaStream) en vez
 * de ctx.destination. Avisa por `onDrain` cuando la cola de audio se agotó
 * (el agente dejó de SONAR de verdad), que es la señal correcta para reabrir
 * el micrófono en el half-duplex.
 */
class VoicePlayer {
  private ctx: AudioContext | null = null
  private node: AudioWorkletNode | null = null
  private el: HTMLAudioElement | null = null

  async init(onDrain?: () => void): Promise<void> {
    const ctx = new AudioContext({ sampleRate: 24000 })
    void ctx.resume()
    const dest = ctx.createMediaStreamDestination()
    const el = new Audio()
    el.srcObject = dest.stream
    // Llamado dentro del gesto de usuario (click "Start live call").
    void el.play().catch(() => {})
    await ctx.audioWorklet.addModule('/audio/pcm-player-processor.js')
    const node = new AudioWorkletNode(ctx, 'pcm-player-processor', {
      outputChannelCount: [1],
    })
    node.port.onmessage = (event) => {
      if (event.data?.type === 'drained') onDrain?.()
    }
    node.connect(dest)
    this.ctx = ctx
    this.node = node
    this.el = el
  }

  queue(chunk: ArrayBuffer): void {
    this.node?.port.postMessage(chunk, [chunk])
  }

  interrupt(): void {
    this.node?.port.postMessage({ cmd: 'clear' })
  }

  async dispose(): Promise<void> {
    if (this.el) {
      this.el.pause()
      this.el.srcObject = null
      this.el = null
    }
    this.node?.disconnect()
    this.node = null
    if (this.ctx) {
      await this.ctx.close()
      this.ctx = null
    }
  }
}

export const LiveCall = forwardRef<LiveCallHandle, Props>(function LiveCall(
  { config, apiKey, onConversation, onState },
  ref,
) {
  const sessionRef = useRef<AgentSession | null>(null)
  const micRef = useRef<AgentMicrophone | null>(null)
  const playerRef = useRef<VoicePlayer | null>(null)
  const conversationRef = useRef<TranscriptLine[]>([])
  // Mute manual del usuario (botón). Se respeta por encima del half-duplex.
  const userMutedRef = useRef(false)
  const unmuteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const emitConversation = useCallback(() => {
    onConversation([...conversationRef.current])
  }, [onConversation])

  const setLiveState = useCallback(
    (state: LiveState) => onState(state),
    [onState],
  )

  const stop = useCallback(() => {
    if (unmuteTimerRef.current) clearTimeout(unmuteTimerRef.current)
    unmuteTimerRef.current = null
    micRef.current?.stop()
    micRef.current = null
    sessionRef.current?.disconnect()
    sessionRef.current = null
    void playerRef.current?.dispose()
    playerRef.current = null
    conversationRef.current = []
    emitConversation()
    setLiveState('ended')
  }, [emitConversation, setLiveState])

  const start = useCallback(async () => {
    if (sessionRef.current) return
    try {
      userMutedRef.current = false
      let agentSpeaking = false

      const unmuteMic = () => {
        if (unmuteTimerRef.current) clearTimeout(unmuteTimerRef.current)
        unmuteTimerRef.current = null
        agentSpeaking = false
        if (!userMutedRef.current) micRef.current?.unmute()
      }

      // El reproductor drenó su cola = el agente dejó de SONAR de verdad.
      // Debounce para no reabrir el mic en huecos breves entre chunks de TTS.
      const onDrain = () => {
        if (unmuteTimerRef.current) clearTimeout(unmuteTimerRef.current)
        unmuteTimerRef.current = setTimeout(unmuteMic, 300)
      }

      const player = new VoicePlayer()
      await player.init(onDrain)
      playerRef.current = player

      const session = new AgentSession({
        auth: { apiKey },
        agent: config as unknown as AgentSettingsObject,
        audio: { output: { encoding: 'linear16', sampleRate: 24000 } },
      })
      sessionRef.current = session

      session.on('audio', (chunk: ArrayBuffer) => {
        // El primer chunk de TTS es la señal CONFIABLE de que el agente habla:
        // silenciar el mic ANTES de reproducir bloquea el loopback digital.
        if (!agentSpeaking) {
          agentSpeaking = true
          micRef.current?.mute()
        }
        // Cancelar cualquier unmute pendiente (gap entre chunks del turno).
        if (unmuteTimerRef.current) {
          clearTimeout(unmuteTimerRef.current)
          unmuteTimerRef.current = null
        }
        player.queue(chunk)
      })

      session.on('agent-audio-done', () => {
        // Safety net: si `drained` no llega, reabrir el mic igualmente.
        if (unmuteTimerRef.current) clearTimeout(unmuteTimerRef.current)
        unmuteTimerRef.current = setTimeout(unmuteMic, 5000)
      })

      session.on('conversation-text', (msg) => {
        const content = (msg as { content?: string }).content?.trim()
        if (!content) return
        const role =
          (msg as { role?: string }).role === 'user' ? 'user' : 'ai'
        conversationRef.current = [
          ...conversationRef.current,
          { id: crypto.randomUUID(), role, text: content },
        ]
        emitConversation()
      })
      session.on('connecting', () => setLiveState('connecting'))
      session.on('connected', () => setLiveState('connected'))
      session.on('reconnecting', () => setLiveState('connecting'))
      session.on('disconnected', () => {
        /* cierre del servidor: se refleja vía estado */
      })
      session.on('sdk-error', () => setLiveState('error'))
      session.on('error', () => setLiveState('error'))

      setLiveState('connecting')
      await session.connect()

      const mic = new AgentMicrophone(
        (data: ArrayBuffer) => {
          if (session.state === 'connected') session.sendAudio(data)
        },
        {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      )
      micRef.current = mic
      await mic.start()
      setLiveState('connected')
    } catch (err) {
      stop()
      setLiveState('error')
      throw err
    }
  }, [apiKey, config, emitConversation, setLiveState, stop])

  const setMicMuted = useCallback((muted: boolean) => {
    userMutedRef.current = muted
    if (muted) micRef.current?.mute()
    else micRef.current?.unmute()
  }, [])

  useImperativeHandle(
    ref,
    () => ({ start, stop, setMicMuted }),
    [start, stop, setMicMuted],
  )

  useEffect(() => stop, [stop])

  return null
})
