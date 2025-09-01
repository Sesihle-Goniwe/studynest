// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Study Partner App API')
    .setDescription('API for matching study partners and managing group sessions.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Your docs will be at /api-docs

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow no-origin requests (mobile apps, curl, etc.)

      const allowedOrigins = [
        'http://localhost:4200', // Local dev
      ];

      // Match ANY pages.dev subdomain (e.g., Cloudflare preview or production)
      const pagesDevPattern = /\.pages\.dev$/;

      try {
        const hostname = new URL(origin).hostname;

        if (
          allowedOrigins.includes(origin) ||
          pagesDevPattern.test(hostname)
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch (err) {
        callback(new Error('Invalid origin'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

