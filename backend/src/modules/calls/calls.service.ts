import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCallDto, QueryCallsDto, UpdateCallDto } from './calls.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCallDto) {
    return this.prisma.call.create({ data: this.toData(dto) });
  }

  findAll(query: QueryCallsDto) {
    const where = {
      ...(query.status && { status: query.status }),
      ...(query.outcome && { outcome: query.outcome }),
    };
    return this.prisma.call.findMany({
      where,
      orderBy: { startedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.call.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, dto: UpdateCallDto) {
    return this.prisma.call.update({
      where: { id },
      data: this.toData(dto),
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.call.delete({ where: { id } });
  }

  private toData(dto: CreateCallDto): Prisma.CallUncheckedCreateInput;
  private toData(dto: UpdateCallDto): Prisma.CallUncheckedUpdateInput;
  private toData(dto: CreateCallDto | UpdateCallDto): unknown {
    const { startedAt, endedAt, transcript, metadata, ...rest } = dto;
    return {
      ...rest,
      ...(startedAt !== undefined && { startedAt: new Date(startedAt) }),
      ...(endedAt !== undefined && { endedAt: new Date(endedAt) }),
      ...(transcript !== undefined && {
        transcript: transcript as Prisma.InputJsonValue,
      }),
      ...(metadata !== undefined && {
        metadata: metadata as Prisma.InputJsonValue,
      }),
    };
  }
}
