import { execSync } from 'node:child_process';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { PrismaService } from './../src/prisma/prisma.service';

const E2E_URL = 'file:./prisma/e2e.db';

describe('Demo Voice Agent (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.DATABASE_URL = E2E_URL;
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: E2E_URL },
      stdio: 'pipe',
    });
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    await app.get(PrismaService).account.upsert({
      where: { accountNumber: 'CH-7723849' },
      update: {},
      create: {
        consumerName: 'James Carter',
        accountNumber: 'CH-7723849',
        cardLastFour: '3849',
        creditor: 'Chase Card Services',
        balanceOwedCents: 384722,
        daysPastDue: 60,
        minimumPaymentCents: 9450,
        pastDueAmountCents: 18900,
        monthlyPaymentCents: 9450,
      },
    });
  });

  it('GET /api/v1 identifica el demo', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res) => {
        expect((res.body as { name: string }).name).toBe('Demo Voice Agent');
      });
  });

  it('GET /api/v1/health responde ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/v1/agent entrega cuenta (de DB), persona y prompt FDCPA', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agent')
      .expect(200);
    const body = res.body as {
      account: { consumerName: string; balanceOwed: string };
      persona: { name: string };
      assistantPrompt: string;
      deepgramAgentConfig: {
        think: { prompt: string };
        speak: { provider: { model: string } };
      };
    };
    expect(body.account.consumerName).toBe('James Carter');
    expect(body.account.balanceOwed).toBe('$3,847.22');
    expect(body.persona.name).toBe('Riley Morgan');
    expect(body.assistantPrompt).toContain('attempt to collect a debt');
    expect(body.deepgramAgentConfig.think.prompt).toBe(body.assistantPrompt);
    expect(body.deepgramAgentConfig.speak.provider.model).toBe('flux-kit-en');
  });

  it('rechaza payloads inválidos de llamadas antes de tocar la base', () => {
    return request(app.getHttpServer())
      .post('/api/v1/calls')
      .send({ status: 'no-existe' })
      .expect(400);
  });

  it('rechaza un chat sin mensajes', () => {
    return request(app.getHttpServer())
      .post('/api/v1/chat')
      .send({})
      .expect(400);
  });

  it('persiste y lista llamadas (CRUD mínimo)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/calls')
      .send({ status: 'in_progress', summary: 'e2e' })
      .expect(201);
    const id = (created.body as { id: string }).id;

    const found = await request(app.getHttpServer())
      .get(`/api/v1/calls/${id}`)
      .expect(200);
    expect((found.body as { summary: string }).summary).toBe('e2e');

    const list = await request(app.getHttpServer())
      .get('/api/v1/calls')
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/api/v1/calls/${id}`)
      .expect(204);
  });

  afterEach(async () => {
    await app.close();
  });
});
