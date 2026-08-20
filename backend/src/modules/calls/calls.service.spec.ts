import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CallsService } from './calls.service';

describe('CallsService', () => {
  let service: CallsService;
  const prisma = {
    call: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CallsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CallsService>(CallsService);
  });

  it('crea una llamada convirtiendo fechas ISO a Date', async () => {
    const startedAt = '2026-08-19T14:00:00.000Z';
    prisma.call.create.mockResolvedValue({ id: 'c1' });
    await service.create({ startedAt, status: 'in_progress' });
    expect(prisma.call.create).toHaveBeenCalledWith({
      data: {
        status: 'in_progress',
        startedAt: new Date(startedAt),
      },
    });
  });

  it('lista llamadas filtrando por estado', async () => {
    prisma.call.findMany.mockResolvedValue([]);
    await service.findAll({ status: 'completed' });
    expect(prisma.call.findMany).toHaveBeenCalledWith({
      where: { status: 'completed' },
      orderBy: { startedAt: 'desc' },
    });
  });

  it('borra una llamada por id', async () => {
    prisma.call.delete.mockResolvedValue({});
    await service.remove('c1');
    expect(prisma.call.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
