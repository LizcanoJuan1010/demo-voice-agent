import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCallDto, QueryCallsDto, UpdateCallDto } from './calls.dto';
import { CallsService } from './calls.service';

@Controller('calls')
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Post()
  create(@Body() dto: CreateCallDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryCallsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCallDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
