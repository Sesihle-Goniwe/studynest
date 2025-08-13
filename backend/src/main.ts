// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow mobile apps/curl/no-origin

      const allowedOrigins = [
        'https://studynester.pages.dev', // production Cloudflare
        'http://localhost:4200',         // local dev
      ];

      // Allow any Cloudflare preview subdomain
      const cloudflarePreviewPattern = /\.pages\.dev$/;

      if (
        allowedOrigins.includes(origin) ||
        cloudflarePreviewPattern.test(new URL(origin).hostname)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
