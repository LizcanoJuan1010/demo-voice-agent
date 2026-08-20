import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'

type Props = {
  liveAvailable: boolean
  active: boolean
  liveActive: boolean
  muted: boolean
  onStartLive: () => void
  onStartDemo: () => void
  onStop: () => void
  onToggleMute: () => void
}

export function CallControls({
  liveAvailable,
  active,
  liveActive,
  muted,
  onStartLive,
  onStartDemo,
  onStop,
  onToggleMute,
}: Props) {
  if (active) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-8">
          {liveActive && (
            <button
              type="button"
              className="group flex flex-col items-center gap-2"
              onClick={onToggleMute}
            >
              <div
                className={`flex size-14 items-center justify-center rounded-full border-2 transition-all ${
                  muted
                    ? 'border-white bg-white/10 text-white'
                    : 'border-outline-variant text-on-surface-variant group-hover:border-white group-hover:text-white'
                }`}
              >
                <Icon name={muted ? 'mic_off' : 'mic'} />
              </div>
              <span className="text-label-sm text-on-surface-variant">
                {muted ? 'Unmute' : 'Mute'}
              </span>
            </button>
          )}
          <button
            type="button"
            className="group flex flex-col items-center gap-2"
            onClick={onStop}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-error text-on-error shadow-lg transition-all hover:bg-error/90 hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] active:scale-90">
              <Icon name="call_end" filled />
            </div>
            <span className="text-label-sm text-on-surface-variant">End</span>
          </button>
        </div>
        <p className="text-label-sm text-on-surface-variant">
          {liveActive ? 'Live call in progress' : 'Call in progress…'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {liveAvailable && (
        <Button
          variant="primary"
          className="btn-glow rounded-full px-7 py-3.5 text-body-md"
          onClick={onStartLive}
        >
          <Icon name="call" className="text-[22px]" />
          Start live call
        </Button>
      )}
      <Button
        variant="cta"
        className="btn-glow rounded-full px-7 py-3.5 text-body-md"
        onClick={onStartDemo}
      >
        <Icon name="smart_toy" className="text-[22px]" />
        Play demo simulation
      </Button>
    </div>
  )
}
