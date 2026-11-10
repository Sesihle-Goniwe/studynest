import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guard";
import { SupabaseService } from "./supabase/supabase.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global authentication guard (all routes protected by default except @Public())
  const supabaseService = app.get(SupabaseService);
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new SupabaseAuthGuard(supabaseService, reflector));

  // Global DTO input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Study Nest API")
    .setDescription(
      "API's for matching study partner and managing group sessions",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = ["http://localhost:4200"];
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
        callback(new Error("Invalid origin"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Accept, Authorization",
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
