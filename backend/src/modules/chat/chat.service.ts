import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentService } from '../agent/agent.service';
import { ChatDto } from './chat.dto';

interface DeepSeekStreamChunk {
  choices?: { delta?: { content?: string } }[];
}

/**
 * Modo chat del demo con streaming SSE: el mismo agente FDCPA (prompt armado
 * con la cuenta de la DB) responde token por token usando DeepSeek como LLM.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly agent: AgentService,
    private readonly config: ConfigService,
  ) {}

  async stream(dto: ChatDto, onToken: (token: string) => void): Promise<void> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'DEEPSEEK_API_KEY no está configurada en backend/.env',
      );
    }

    const baseUrl =
      this.config.get<string>('DEEPSEEK_BASE_URL') ??
      'https://api.deepseek.com';
    const model = this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';
    const { assistantPrompt } = await this.agent.getConfig();

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: assistantPrompt },
          ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        temperature: 0.4,
      }),
    });

    if (!res.ok || !res.body) {
      throw new ServiceUnavailableException(
        `El LLM no respondió correctamente (HTTP ${res.status})`,
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);

        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload && payload !== '[DONE]') {
            try {
              const chunk = JSON.parse(payload) as DeepSeekStreamChunk;
              const token = chunk.choices?.[0]?.delta?.content;
              if (token) onToken(token);
            } catch {
              /* línea no JSON: se ignora */
            }
          }
        }
        nl = buffer.indexOf('\n');
      }
    }
  }
}
