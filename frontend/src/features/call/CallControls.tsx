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
  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-outline-variant/40 bg-surface-container-low/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-4 px-margin-mobile py-5 md:flex-row md:px-margin-desktop">
        {active ? (
          <>
            <div className="flex items-center gap-6">
              {liveActive && (
                <button
                  type="button"
                  className="group flex flex-col items-center gap-1"
                  onClick={onToggleMute}
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-full border-2 transition-all ${
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
                className="group flex flex-col items-center gap-1"
                onClick={onStop}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-error text-on-error shadow-lg transition-all hover:bg-error/90 active:scale-90">
                  <Icon name="call_end" filled />
                </div>
                <span className="text-label-sm text-on-surface-variant">
                  End
                </span>
              </button>
            </div>
            <p className="text-label-sm text-on-surface-variant">
              {liveActive ? 'Live call in progress' : 'Call in progress…'}
            </p>
          </>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {liveAvailable && (
              <Button
                variant="primary"
                className="rounded-full px-6 py-3"
                onClick={onStartLive}
              >
                <Icon name="call" className="text-[20px]" />
                Start live call
              </Button>
            )}
            <Button
              variant="cta"
              className="rounded-full px-6 py-3"
              onClick={onStartDemo}
            >
              <Icon name="smart_toy" className="text-[20px]" />
              Play demo simulation
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
