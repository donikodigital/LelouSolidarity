//backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const logger = new Logger('Bootstrap');

  // Render (et la plupart des hebergeurs) placent l'app derriere un proxy
  // inverse : sans ce reglage, toutes les requetes semblent venir de la
  // meme IP et la limitation de debit par IP (ThrottlerGuard) devient
  // inefficace.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // On récupère les origines depuis .env (Render) ou on met des valeurs par défaut
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Liste globale des origines autorisées (celles de Render + celles codées en dur par sécurité)
  const allowedOrigins = [
    'https://lelousolidarity.win',
    'https://www.lelousolidarity.win',
    'http://localhost:3000',
    ...envOrigins,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans origin (Serveur, Postman) ou celles présentes dans la liste
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non autorisée par CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port);
  logger.log(`API demarree sur le port ${port} (prefixe /api)`);
}

bootstrap();