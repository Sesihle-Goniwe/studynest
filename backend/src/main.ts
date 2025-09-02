// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = ['http://localhost:4200'];
    const pagesDevPattern = /\.pages\.dev$/;

    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      if (allowedOrigins.includes(origin) || pagesDevPattern.test(hostname)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
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


