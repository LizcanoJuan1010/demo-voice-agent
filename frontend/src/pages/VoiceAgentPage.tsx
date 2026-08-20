import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '../components/ui/Icon'
import { FALLBACK_AGENT_CONFIG, type AgentConfig, type TranscriptLine } from '../data/agentConfig'
import { fetchAgentConfig } from '../lib/api'
import { AccountPanel } from '../features/call/AccountPanel'
import { CallControls } from '../features/call/CallControls'
import { TranscriptPanel } from '../features/call/TranscriptPanel'
import { AiOrb, type AiOrbState } from '../features/call/AiOrb'
import { LiveCall, type LiveCallHandle, type LiveState } from '../features/call/LiveCall'
import { useDemoCall } from '../features/call/useDemoCall'
import { ChatPanel } from '../features/chat/ChatPanel'
import { useChat } from '../features/chat/useChat'
import StrokeText from '../components/ui/StrokeText'
import { ThreeBackground } from '../components/ui/ThreeBackground'

type Mode = 'voice' | 'chat'

export function VoiceAgentPage() {
  const [config, setConfig] = useState<AgentConfig>(FALLBACK_AGENT_CONFIG)
  const [liveAvailable, setLiveAvailable] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<Mode>('voice')

  const demo = useDemoCall()
  const chat = useChat()

  const [liveConversation, setLiveConversation] = useState<TranscriptLine[]>([])
  const [liveState, setLiveState] = useState<LiveState>('idle')
  const [liveMuted, setLiveMuted] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const liveRef = useRef<LiveCallHandle>(null)

  useEffect(() => {
    fetchAgentConfig()
      .then((cfg) => {
        setConfig(cfg)
        setLiveAvailable(Boolean(cfg.deepgramApiKey))
      })
      .catch(() => {
        setLiveAvailable(false)
      })
  }, [])

  const handleConversation = useCallback((lines: TranscriptLine[]) => {
    setLiveConversation(lines)
  }, [])

  const handleLiveState = useCallback((state: LiveState) => {
    setLiveState(state)
  }, [])

  const liveActive = liveState === 'connected' || liveState === 'connecting'
  const demoActive = demo.status === 'ringing' || demo.status === 'in_progress'

  const startLive = useCallback(async () => {
    setLiveError(null)
    setLiveConversation([])
    try {
      await liveRef.current?.start()
    } catch (err) {
      setLiveError(
        (err as Error)?.message ?? 'No se pudo iniciar la llamada en vivo',
      )
      setLiveState('error')
    }
  }, [])

  const stop = useCallback(() => {
    if (liveActive) liveRef.current?.stop()
    demo.reset()
  }, [liveActive, demo])

  const toggleMute = useCallback(() => {
    const next = !liveMuted
    liveRef.current?.setMicMuted(next)
    setLiveMuted(next)
  }, [liveMuted])

  const copyConfig = useCallback(async () => {
    const payload = {
      persona: config.persona,
      assistantPrompt: config.assistantPrompt,
      deepgramAgentConfig: config.deepgramAgentConfig,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [config])

  const active = liveActive || demoActive
  const ended =
    demo.status === 'completed' ||
    liveState === 'ended' ||
    liveState === 'error'
  const muted = liveActive && liveMuted

  const transcript: TranscriptLine[] = liveActive ? liveConversation : demo.lines
  const lastRole = transcript[transcript.length - 1]?.role
  const orbState: AiOrbState = ended
    ? 'ended'
    : muted
      ? 'muted'
      : lastRole === 'ai'
        ? 'speaking'
        : 'listening'

  const chipLabel = liveActive
    ? 'Live AI'
    : demoActive
      ? 'AI on the line'
      : ended
        ? 'Ended'
        : 'Ready'

  return (
    <div className="relative min-h-svh bg-background text-on-background">
      <ThreeBackground />
      <div className="aurora pointer-events-none fixed inset-0" />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-margin-mobile pt-16 pb-28 md:pt-24">
        <div className="fade-up flex w-full flex-col items-center">
          <StrokeText
            text="Demo Voice Agent"
            fontSize={84}
            fontWeight={800}
            letterSpacing={-2}
            strokeColor="#A78BFA"
            fillColor="#F8FAFC"
            strokeWidth={1.2}
            drawDuration={1.6}
            fillDelay={0.25}
            stagger={0.05}
            ease="power2.out"
            fillMode="wipe"
            trigger="mount"
            className="w-full max-w-2xl"
          />

          <div className="mt-8 flex flex-col items-center gap-6">
            <span className="flex items-center gap-2 text-label-sm uppercase tracking-[0.2em] text-white/45">
              <span
                className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulse bg-accent' : 'bg-white/30'}`}
              />
              {chipLabel}
            </span>

            <div className="glass flex gap-1 rounded-full p-1">
              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`rounded-full px-5 py-2 text-label-sm font-semibold transition-all duration-300 ${
                  mode === 'voice'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                Voice
              </button>
              <button
                type="button"
                onClick={() => setMode('chat')}
                className={`rounded-full px-5 py-2 text-label-sm font-semibold transition-all duration-300 ${
                  mode === 'chat'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                Chat
              </button>
            </div>
          </div>
        </div>

        {mode === 'chat' ? (
          <div className="fade-up delay-2 mt-12 w-full">
            <ChatPanel
              className="glass h-[calc(100svh-16rem)] min-h-[520px]"
              messages={chat.messages}
              isStreaming={chat.isStreaming}
              error={chat.error}
              personaName={config.persona.name}
              onSend={chat.send}
              onReset={chat.reset}
            />
          </div>
        ) : (
          <div className="mt-12 flex w-full flex-col gap-8">
            <div className="fade-up delay-2 glass ai-glow flex w-full flex-col items-center gap-10 rounded-[2rem] px-6 py-14 md:px-14">
              <div style={{ '--orb-size': 'min(40vh, 20rem)' } as CSSProperties}>
                <AiOrb state={orbState} />
              </div>

              <div className="text-center">
                <h2 className="text-headline-md font-bold text-white text-glow">
                  {config.persona.name}
                </h2>
                <p className="mt-1 text-label-md text-white/45">
                  {config.persona.role}
                </p>
                <p className="mt-3 text-label-md text-white/60">
                  {liveError
                    ? liveError
                    : demo.status === 'completed'
                      ? 'Call completed'
                      : active
                        ? muted
                          ? 'Muted'
                          : lastRole === 'ai'
                            ? 'Speaking…'
                            : 'Listening…'
                        : 'Start a call to begin'}
                </p>
              </div>

              {demo.outcome && (
                <div className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-3">
                  <Icon name="task_alt" className="text-white" />
                  <div>
                    <p className="text-label-sm uppercase tracking-wide text-white/40">
                      Outcome
                    </p>
                    <p className="text-body-md font-semibold text-white">
                      {demo.outcome.label} — {demo.outcome.value}
                    </p>
                  </div>
                </div>
              )}

              <CallControls
                liveAvailable={liveAvailable}
                active={active}
                liveActive={liveActive}
                muted={muted}
                onStartLive={startLive}
                onStartDemo={demo.start}
                onStop={stop}
                onToggleMute={toggleMute}
              />
            </div>

            <div className="fade-up delay-3 glass-soft w-full rounded-3xl p-6">
              <h3 className="mb-4 flex items-center gap-2 text-label-sm font-semibold uppercase tracking-wide text-white/45">
                <Icon name="subtitles" className="text-[18px]" />
                Transcript
              </h3>
              <TranscriptPanel
                lines={transcript}
                emptyHint="The transcript will appear here. Start a live call or play the demo simulation."
              />
            </div>

            <div className="fade-up delay-4 grid w-full gap-8 md:grid-cols-2">
              <AccountPanel account={config.account} />

              <div className="glass-soft flex flex-col rounded-3xl p-6">
                <h3 className="mb-2 flex items-center gap-2 text-label-sm font-semibold uppercase tracking-wide text-white/45">
                  Agent prompt
                  <Icon name="auto_awesome" className="text-[18px]" />
                </h3>
                <p className="mb-4 text-label-sm text-white/45">
                  FDCPA-compliant system prompt for Deepgram Voice Agent / Vapi /
                  Retell / Ultravox.
                </p>
                <button
                  type="button"
                  onClick={copyConfig}
                  className="btn-glow mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-label-md font-semibold text-black"
                >
                  <Icon
                    name={copied ? 'check' : 'content_copy'}
                    className="text-[20px]"
                  />
                  {copied ? 'Copied!' : 'Copy agent config'}
                </button>
              </div>
            </div>

            <p className="fade-up delay-5 px-2 text-center text-label-sm leading-relaxed text-white/35">
              Compliance — Mini-Miranda disclosure, AI + recording disclosure,
              right-party verification, no threats or harassment, and a clear
              promise-to-pay recap. Demo only · not a legal compliance reference.
            </p>
          </div>
        )}
      </main>

      {liveAvailable && (
        <LiveCall
          ref={liveRef}
          config={config.deepgramAgentConfig}
          apiKey={config.deepgramApiKey ?? ''}
          onConversation={handleConversation}
          onState={handleLiveState}
        />
      )}
    </div>
  )
}
