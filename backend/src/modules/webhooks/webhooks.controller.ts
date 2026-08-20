import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Deepgram Voice Agent can forward conversation events to a webhook via the
 * `agent_events_url` field set on the agent. Event payloads vary by event type;
 * this handler is deliberately tolerant and maps common fields onto the `Call`
 * record. Adapt the field extraction to your exact event schema as needed.
 */
interface DeepgramEvent {
  type?: string;
  conversation_id?: string;
  call_id?: string;
  status?: string;
  ended_at?: string;
  transcript?: string;
  summary?: string;
  recording_url?: string;
  data?: Record<string, unknown>;
}

const STATUS_MAP: Record<string, string> = {
  started: 'in_progress',
  in_progress: 'in_progress',
  speaking: 'in_progress',
  ended: 'completed',
  error: 'failed',
  failed: 'failed',
};

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('deepgram')
  @HttpCode(HttpStatus.NO_CONTENT)
  async receiveDeepgram(@Body() body: DeepgramEvent): Promise<void> {
    const event = { ...body, ...(body.data ?? {}) };
    const callId = event.conversation_id ?? event.call_id;
    if (!callId) return;

    const status = event.status ? STATUS_MAP[event.status] : undefined;
    const data: Prisma.CallUncheckedCreateInput = {
      id: callId,
      ...(status && { status }),
      ...(event.ended_at && { endedAt: new Date(event.ended_at) }),
      ...(event.summary && { summary: event.summary }),
      ...(event.transcript ? { transcript: event.transcript } : {}),
      ...(event.recording_url
        ? { metadata: { recordingUrl: event.recording_url } }
        : {}),
    };

    await this.prisma.call.upsert({
      where: { id: callId },
      create: data,
      update: data,
    });
  }
}
