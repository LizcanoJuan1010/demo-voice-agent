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
      <div className="mist-overlay pointer-events-none absolute inset-0" />

      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant/40 bg-background/70 px-margin-mobile py-4 backdrop-blur-md md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <span className="text-display-lg-mobile font-extrabold tracking-tighter text-white md:text-display-lg">
            Demo Voice Agent
          </span>
          <div className="rounded-full bg-white/10 px-2 py-0.5">
            <span className="text-label-sm uppercase text-white">{chipLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-full border border-outline-variant bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`rounded-full px-4 py-1.5 text-label-sm transition-colors ${
                mode === 'voice'
                  ? 'bg-white font-bold text-black'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Voice
            </button>
            <button
              type="button"
              onClick={() => setMode('chat')}
              className={`rounded-full px-4 py-1.5 text-label-sm transition-colors ${
                mode === 'chat'
                  ? 'bg-white font-bold text-black'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-container-max flex-grow grid-cols-1 gap-gutter px-margin-mobile pt-24 pb-32 md:px-margin-desktop lg:grid-cols-12">
        <div className="flex flex-col gap-stack-lg lg:col-span-7">
          {mode === 'voice' ? (
            <>
              <div className="relative flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-outline-variant bg-surface-container-lowest/60 p-stack-lg shadow-lg backdrop-blur-sm">
                <div style={{ '--orb-size': 'min(46vh, 22rem)' } as CSSProperties}>
                  <AiOrb state={orbState} />
                </div>
                <div className="text-center">
                  <h2 className="mb-1 text-headline-md text-white">
                    {config.persona.name} — {config.persona.role}
                  </h2>
                  <p className="flex items-center justify-center gap-2 text-label-md text-on-surface-variant">
                    <span
                      className={`h-2 w-2 rounded-full ${active ? 'animate-pulse bg-white' : 'bg-outline'}`}
                    />
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
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-outline-variant bg-white/5 px-4 py-3">
                    <Icon name="task_alt" className="text-white" />
                    <div>
                      <p className="text-label-sm uppercase text-on-surface-variant">
                        Outcome
                      </p>
                      <p className="text-body-md font-bold text-white">
                        {demo.outcome.label} — {demo.outcome.value}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <TranscriptPanel
                lines={transcript}
                emptyHint="The transcript will appear here. Start a live call or play the demo simulation."
              />
            </>
          ) : (
            <ChatPanel
              messages={chat.messages}
              isStreaming={chat.isStreaming}
              error={chat.error}
              personaName={config.persona.name}
              onSend={chat.send}
              onReset={chat.reset}
            />
          )}
        </div>

        <div className="flex flex-col gap-stack-lg lg:col-span-5">
          <AccountPanel account={config.account} />

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-lg">
            <h3 className="mb-3 flex items-center gap-2 text-headline-md text-white">
              Agent prompt
              <Icon name="auto_awesome" className="text-white" />
            </h3>
            <p className="mb-3 text-label-sm text-on-surface-variant">
              FDCPA-compliant system prompt for Deepgram Voice Agent / Vapi /
              Retell / Ultravox.
            </p>
            <button
              type="button"
              onClick={copyConfig}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-label-md text-black transition-all hover:opacity-90"
            >
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[20px]" />
              {copied ? 'Copied!' : 'Copy agent config'}
            </button>
          </div>

          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5 text-label-sm text-on-surface-variant">
            <p className="mb-1 font-bold text-white">Compliance</p>
            Mini-Miranda disclosure, AI + recording disclosure, right-party
            verification, no threats or harassment, and a clear promise-to-pay
            recap. Demo only — not a legal compliance reference.
          </div>
        </div>
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

      {mode === 'voice' && (
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
      )}
    </div>
  )
}
