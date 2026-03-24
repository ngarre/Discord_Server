import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // En vez de ignorarlos, lanza error
      transform: true, // Permite que Nest use los DTO como clases y aplique transformación/pipes
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
