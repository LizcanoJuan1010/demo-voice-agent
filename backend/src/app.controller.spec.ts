import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('identifica el demo como "Demo Voice Agent"', () => {
      expect(appController.getRoot().name).toBe('Demo Voice Agent');
    });
  });

  describe('health', () => {
    it('responde ok', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
