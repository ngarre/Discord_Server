import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // En vez de ignorarlos, lanza error
      transform: true, // Permite que Nest use los DTO como clases y aplique transformación/pipes
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Discord Server API')
    .setDescription('Discord-inspired real-time communication backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
