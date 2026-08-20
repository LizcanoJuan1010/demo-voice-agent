import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from './agent.service';

const ACCOUNT_ROW = {
  consumerName: 'James Carter',
  accountNumber: 'CH-7723849',
  cardLastFour: '3849',
  creditor: 'Chase Card Services',
  balanceOwedCents: 384722,
  daysPastDue: 60,
  minimumPaymentCents: 9450,
  pastDueAmountCents: 18900,
  monthlyPaymentCents: 9450,
};

describe('AgentService', () => {
  let service: AgentService;
  const prisma = { account: { findFirst: jest.fn() } };
  const config = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.account.findFirst.mockResolvedValue(ACCOUNT_ROW);
    config.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  it('lee la cuenta desde la DB (no quemada) y formatea los montos', async () => {
    const { account } = await service.getConfig();
    expect(prisma.account.findFirst).toHaveBeenCalled();
    expect(account.consumerName).toBe('James Carter');
    expect(account.balanceOwed).toBe('$3,847.22');
    expect(account.pastDueAmount).toBe('$189.00');
    expect(account.minimumPaymentDue).toBe('$94.50');
    expect(account.accountNumber).toBe('CH-7723849');
  });

  it('el prompt cumple la mini-Miranda (FDCPA) y trae los datos de la cuenta', async () => {
    const { assistantPrompt } = await service.getConfig();
    expect(assistantPrompt).toContain(
      'attempt to collect a debt, and any information obtained will be used for that purpose',
    );
    expect(assistantPrompt).toContain('James Carter');
    expect(assistantPrompt).toContain('$3,847.22');
    expect(assistantPrompt).toMatch(/NO HARASSMENT OR ABUSE/);
    expect(assistantPrompt).toMatch(/NO FALSE OR MISLEADING STATEMENTS/);
    expect(assistantPrompt).toMatch(/RIGHT-PARTY VERIFICATION/);
  });

  it('arma el config inline de Deepgram con el prompt (sin greeting auto-hablado)', async () => {
    const { deepgramAgentConfig } = await service.getConfig();
    expect(deepgramAgentConfig.think.prompt).toContain('James Carter');
    expect(deepgramAgentConfig.listen.provider.model).toBe('nova-3');
    expect(deepgramAgentConfig.speak.provider.type).toBe('deepgram');
    expect(deepgramAgentConfig.speak.provider.model).toBe('flux-kit-en');
    expect('greeting' in deepgramAgentConfig).toBe(false);
  });

  it('usa DeepSeek como LLM BYO cuando hay key', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'DEEPSEEK_API_KEY') return 'sk-test';
      if (key === 'DEEPSEEK_BASE_URL') return 'https://api.deepseek.com';
      if (key === 'DEEPSEEK_MODEL') return 'deepseek-v4-flash';
      return undefined;
    });
    const { deepgramAgentConfig } = await service.getConfig();
    expect(deepgramAgentConfig.think.provider.model).toBe('deepseek-v4-flash');
    expect(deepgramAgentConfig.think.endpoint.url).toBe(
      'https://api.deepseek.com/v1/chat/completions',
    );
    expect(deepgramAgentConfig.think.endpoint.headers.authorization).toBe(
      'Bearer sk-test',
    );
  });

  it('falla claro si no hay cuenta sembrada', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    await expect(service.getConfig()).rejects.toBeInstanceOf(NotFoundException);
  });
});
