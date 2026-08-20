// AudioWorklet de reproducción para el audio TTS de Deepgram (PCM16LE,
// AudioContext de playback a 24000 Hz). Cola simple de chunks Float32;
// `{cmd:'clear'}` vacía la cola de inmediato (barge-in). Cuando la cola se
// drena por completo, avisa al hilo principal con `{type:'drained'}` — es la
// señal para reabrir el micrófono (half-duplex) SOLO cuando el agente dejó de
// sonar de verdad.
class PcmPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.queue = []
    this.readOffset = 0
    this.suspended = false
    this.port.onmessage = (event) => {
      if (event.data?.cmd === 'clear') {
        this.queue = []
        this.readOffset = 0
        return
      }
      if (event.data?.cmd === 'suspended') {
        this.suspended = Boolean(event.data.value)
        return
      }
      const int16 = new Int16Array(event.data)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i += 1) {
        const s = int16[i]
        float32[i] = s < 0 ? s / 0x8000 : s / 0x7fff
      }
      this.queue.push(float32)
      if (!this.suspended) return
      let total = 0
      for (const c of this.queue) total += c.length
      while (total > 48000 && this.queue.length > 1) {
        total -= this.queue.shift().length
        this.readOffset = 0
      }
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0][0]
    let outIdx = 0
    const hadData = this.queue.length > 0
    while (outIdx < output.length) {
      if (this.queue.length === 0) {
        output.fill(0, outIdx)
        break
      }
      const current = this.queue[0]
      const remaining = current.length - this.readOffset
      const toCopy = Math.min(remaining, output.length - outIdx)
      output.set(current.subarray(this.readOffset, this.readOffset + toCopy), outIdx)
      outIdx += toCopy
      this.readOffset += toCopy
      if (this.readOffset >= current.length) {
        this.queue.shift()
        this.readOffset = 0
      }
    }
    if (hadData && this.queue.length === 0 && this.readOffset === 0) {
      this.port.postMessage({ type: 'drained' })
    }
    return true
  }
}

registerProcessor('pcm-player-processor', PcmPlayerProcessor)
