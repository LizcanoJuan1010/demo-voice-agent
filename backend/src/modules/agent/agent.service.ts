import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountView,
  AGENT_PERSONA,
  buildAssistantPrompt,
  buildDeepgramAgentConfig,
  formatUsd,
} from './agent.config';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getConfig() {
    const account = await this.getAccountView();
    const assistantPrompt = buildAssistantPrompt(account);
    const deepgramAgentConfig = buildDeepgramAgentConfig(account, {
      apiKey: this.config.get<string>('DEEPSEEK_API_KEY'),
      baseUrl: this.config.get<string>('DEEPSEEK_BASE_URL'),
      model: this.config.get<string>('DEEPSEEK_MODEL'),
    });

    return {
      account,
      persona: AGENT_PERSONA,
      assistantPrompt,
      deepgramAgentConfig,
      deepgramApiKey: this.config.get<string>('DEEPGRAM_API_KEY') ?? '',
    };
  }

  /** Mintea un token de corta duración para el SDK de navegador de Deepgram. */
  async getDeepgramToken(): Promise<string> {
    const apiKey = this.config.get<string>('DEEPGRAM_API_KEY');
    if (!apiKey) {
      throw new NotFoundException(
        'DEEPGRAM_API_KEY no está configurada en backend/.env',
      );
    }

    const res = await fetch('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: 60 }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const errBody = (await res.json()) as {
          err_msg?: string;
          message?: string;
        };
        detail = errBody.err_msg ?? errBody.message ?? '';
      } catch {
        /* cuerpo no JSON */
      }
      throw new NotFoundException(
        detail
          ? `Deepgram rechazó la API key: ${detail}. Verifica DEEPGRAM_API_KEY en backend/.env`
          : `No se pudo emitir un token de Deepgram (HTTP ${res.status})`,
      );
    }

    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token) {
      throw new NotFoundException('Deepgram no devolvió un access_token');
    }
    return body.access_token;
  }

  private async getAccountView(): Promise<AccountView> {
    const account = await this.prisma.account.findFirst();
    if (!account) {
      throw new NotFoundException(
        'No hay cuenta sembrada. Ejecuta: npm run db:seed',
      );
    }

    return {
      consumerName: account.consumerName,
      accountNumber: account.accountNumber,
      cardLastFour: account.cardLastFour,
      creditor: account.creditor,
      balanceOwed: formatUsd(account.balanceOwedCents),
      daysPastDue: account.daysPastDue,
      minimumPaymentDue: formatUsd(account.minimumPaymentCents),
      pastDueAmount: formatUsd(account.pastDueAmountCents),
      monthlyPayment: formatUsd(account.monthlyPaymentCents),
    };
  }
}
