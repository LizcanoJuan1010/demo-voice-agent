import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Get()
  getConfig() {
    return this.service.getConfig();
  }

  @Get('deepgram-token')
  async getDeepgramToken(@Res() res: Response): Promise<void> {
    const token = await this.service.getDeepgramToken();
    res.type('text/plain').send(token);
  }
}
