import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const host = process.env.HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? 3000);
  const trustProxy = (process.env.TRUST_PROXY ?? 'true') === 'true';
  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (trustProxy) {
    const expressApp = app.getHttpAdapter().getInstance() as {
      set: (key: string, value: number) => void;
    };
    expressApp.set('trust proxy', 1);
  }

  app.enableCors(
    corsOrigins.length > 0
      ? {
          origin: corsOrigins,
          credentials: true,
        }
      : true,
  );

  await app.listen(port, host);
}

void bootstrap();
