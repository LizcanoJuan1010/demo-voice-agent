import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from '../agent/agent.service';
import { ChatService } from './chat.service';

function sseBody(chunks: string[]): { getReader: () => object } {
  let sent = false;
  const text = chunks.join('');
  const encoder = new TextEncoder();
  return {
    getReader: () => ({
      read: () => {
        if (sent) return Promise.resolve({ value: undefined, done: true });
        sent = true;
        return Promise.resolve({ value: encoder.encode(text), done: false });
      },
    }),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  const agent = { getConfig: jest.fn() };
  const config = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    agent.getConfig.mockResolvedValue({ assistantPrompt: 'PROMPT FDCPA' });
    config.get.mockImplementation((key: string) => {
      if (key === 'DEEPSEEK_API_KEY') return 'sk-test';
      if (key === 'DEEPSEEK_BASE_URL') return 'https://api.deepseek.com';
      if (key === 'DEEPSEEK_MODEL') return 'deepseek-v4-flash';
      return undefined;
    });
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: AgentService, useValue: agent },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('emite tokens del stream y envía el system prompt FDCPA + historial', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: sseBody([
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" James"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    const tokens: string[] = [];
    await service.stream(
      { messages: [{ role: 'user', content: 'Yes, this is James.' }] },
      (t) => tokens.push(t),
    );

    expect(tokens).toEqual(['Hi', ' James']);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { body: string },
    ];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    const body = JSON.parse(init.body) as {
      model: string;
      stream: boolean;
      messages: { role: string; content: string }[];
    };
    expect(body.model).toBe('deepseek-v4-flash');
    expect(body.stream).toBe(true);
    expect(body.messages[0]).toEqual({
      role: 'system',
      content: 'PROMPT FDCPA',
    });
    expect(body.messages[1]).toEqual({
      role: 'user',
      content: 'Yes, this is James.',
    });
  });

  it('falla si el LLM responde con error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    await expect(
      service.stream({ messages: [{ role: 'user', content: 'hi' }] }, () => {}),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
