import { Icon } from '../../components/ui/Icon'
import type { TranscriptLine } from '../../data/agentConfig'

type Props = {
  lines: TranscriptLine[]
  emptyHint?: string
}

export function TranscriptPanel({ lines, emptyHint }: Props) {
  return (
    <div className="scroll-hide flex max-h-[320px] flex-grow flex-col gap-3 overflow-y-auto p-2">
      {lines.length === 0 && emptyHint && (
        <p className="text-center text-label-md text-white/40">{emptyHint}</p>
      )}
      {lines.map((line) =>
        line.role === 'ai' ? (
          <div key={String(line.id)} className="flex items-start gap-3">
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Icon name="psychology" className="text-[18px]" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white/6 px-4 py-3">
              <p className="text-body-md text-white">{line.text}</p>
            </div>
          </div>
        ) : (
          <div key={String(line.id)} className="flex items-start justify-end gap-3">
            <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-white px-4 py-3 text-black">
              <p className="text-body-md italic">&ldquo;{line.text}&rdquo;</p>
            </div>
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <Icon name="person" className="text-[18px]" />
            </div>
          </div>
        ),
      )}
    </div>
  )
}
