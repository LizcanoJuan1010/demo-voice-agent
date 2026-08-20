import { existsSync } from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  configureApp(app);

  // En producción el backend sirve también el frontend compilado (un solo
  // servicio). En dev no existe `frontend/dist`, así que se omite y Vite
  // sigue haciendo el proxy de /api.
  const frontendDist = process.env.FRONTEND_DIST_PATH
    ? path.resolve(process.cwd(), process.env.FRONTEND_DIST_PATH)
    : path.resolve(process.cwd(), '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist, { index: 'index.html' });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
