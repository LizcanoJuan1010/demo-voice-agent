import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatDto } from './chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatDto, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      await this.service.stream(dto, (token) => {
        res.write(`event: token\ndata: ${JSON.stringify({ text: token })}\n\n`);
      });
      res.write('event: done\ndata: {}\n\n');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error en el asistente';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    }
    res.end();
  }
}
