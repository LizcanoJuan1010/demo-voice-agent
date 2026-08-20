# Demo Voice Agent — Frontend

Vista única del demo de agente de voz de cobranza pre-charge-off (Chase Card
Services). Tema oscuro minimalista + orbe animado (ojos que siguen el cursor).

## Modos

- **Voice**: llamada en vivo por el navegador vía `@deepgram/react` (Deepgram
  Voice Agent) y/o una simulación guionada offline (`Play demo simulation`).
- **Chat**: modo texto interactivo — el evaluador hace de James Carter y el
  agente FDCPA (DeepSeek) responde. Funciona sin voz.

## Dev

```bash
npm install
npm run dev            # http://localhost:5173
```

El proxy de Vite enruta `/api` al backend (`http://localhost:3000` por defecto;
ajustable con `API_PROXY_TARGET`).

## Build / lint

```bash
npm run build
npm run lint
```
