# Demo Voice Agent — Pre-Charge-Off Collections (Chase)

Live demo de un agente de voz AI para cobranza pre-charge-off de Chase Card
Services (credit card collections). Escenario **outbound**, 60 días vencido,
conforme a la FDCPA.

- **Voz**: Deepgram Voice Agent (STT `nova-3` + TTS `flux-kit-en`).
- **LLM**: DeepSeek (BYO endpoint OpenAI-compatible), con fallback a `gpt-4o-mini`.
- **DB**: SQLite vía Prisma (cuenta de demo sembrada por `db:seed`).
- **Frontend**: React + Vite (tema oscuro + orbe animado).

## Modos

- **Voice** — llamada en vivo por el navegador (Deepgram) + simulación offline.
- **Chat** — el evaluador hace de *James Carter* escribiendo (DeepSeek + SSE).

## Endpoints

- `GET /api/v1/agent` — cuenta, persona (Riley Morgan), prompt FDCPA y config.
- `POST /api/v1/chat` — streaming SSE (DeepSeek).
- `GET/POST/PATCH/DELETE /api/v1/calls` — persistencia de llamadas.
- `POST /api/v1/webhooks/deepgram` — webhook del agente.
- `GET /api/v1/health` — healthcheck.

## Desarrollo local

```bash
cd backend && npm install && cp .env.example .env   # configura las keys
npm run db:generate && npm run db:deploy && npm run db:seed
cd ../frontend && npm install
# luego, desde la raíz: task dev   (backend :3000 / frontend :5173)
```

## Despliegue (Render — gratis + HTTPS)

1. Sube este repo a GitHub.
2. En [render.com](https://render.com): **New → Blueprint** → conecta el repo.
   Render lee `render.yaml` automáticamente.
3. Configura los secretos en Environment:
   - `DEEPGRAM_API_KEY`
   - `DEEPSEEK_API_KEY`
4. Deploy → obtén la URL (`https://demo-voice-agent.onrender.com`).

## Notas

- La `deepgramApiKey` viaja al navegador (demo local/browser). Para producción,
  usa el token-grant de Deepgram o protege el endpoint.
- SQLite es efímero en Render free: se re-siembra solo en cada deploy.
- Primer arranque tras inactividad tarda ~30–60 s (cold start).
