# Demo Voice Agent — Backend

Backend mínimo (NestJS + Prisma + SQLite) para el demo de agente de voz de
cobranza **pre-charge-off** de Chase Card Services (escenario outbound).

Sin login, sin roles, sin RAG personalizable. Una sola cuenta de demo sembrada
en SQLite (los datos **no** están quemados en el código).

## Stack

- **Voz**: Deepgram Voice Agent (STT `nova-3` + TTS `aura-2-thalia-en`).
- **LLM**: DeepSeek como BYO endpoint OpenAI-compatible (opcional; sin key se
  usa el LLM gestionado de Deepgram `gpt-4o-mini`).
- **DB**: SQLite vía Prisma (modelos `Account` + `Call`).

## Endpoints

- `GET /api/v1/agent` — cuenta (de DB), persona (Riley Morgan), prompt FDCPA y
  el config inline de Deepgram para el SDK de navegador.
- `GET /api/v1/agent/deepgram-token` — mintea un token corto de Deepgram
  (`/v1/auth/grant`) para el cliente web (la clave nunca va al navegador).
- `POST /api/v1/chat` — modo chat interactivo: el mismo agente FDCPA responde
  por texto usando DeepSeek como LLM. Es el camino "live" que funciona de
  inmediato (equivale al "chat test" que el free de Vapi permite).
- `GET/POST/PATCH/DELETE /api/v1/calls` — persistencia simple de llamadas.
- `POST /api/v1/webhooks/deepgram` — recibe eventos del agente de Deepgram.
- `GET /api/v1/health` — healthcheck.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # configura DEEPGRAM_API_KEY (y DeepSeek opcional)
npm run db:generate
npm run db:deploy           # aplica migraciones (crea el .db)
npm run db:seed             # siembra la cuenta de James Carter
npm run start:dev
```

API en `http://localhost:3000/api/v1`.

## Tests

```bash
npm test          # unit tests (10)
npm run test:e2e  # e2e (migra + siembra un SQLite e2e.db aislado)
```

## Cumplimiento FDCPA

El prompt del agente (construido en `src/modules/agent/agent.config.ts` a
partir de la cuenta de la DB) incluye: mini-Miranda ("this is an attempt to
collect a debt..."), verificación de identidad (right-party), prohibición de
acoso/amenazas/engaños, opciones de pago y captura de promesa de pago. Ver
los unit tests que validan estos marcadores de cumplimiento.
