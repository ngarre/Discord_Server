import { NestFactory } from '@nestjs/core'; // Sirve para crear la aplicación Nest
import { ValidationPipe } from '@nestjs/common'; // Sirve para validar y transformar datos de entrada
import { AppModule } from './app.module'; // Módulo raíz de la aplicación
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Sirven para generar documentación interactiva de la API

async function bootstrap() { // Función principal de arranque de la aplicación
  const app = await NestFactory.create(AppModule); // Nest crea aplicación usando AppModule como módulo raíz

  app.useGlobalPipes( // Activa validación global
    new ValidationPipe({ // Valida datos de entrada
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // En vez de ignorarlos, lanza error
      transform: true, // Permite que Nest transforme los datos entrantes al tipo esperado por el DTO.
    }),
  );

  const config = new DocumentBuilder() // Configuración de Swagger
    .setTitle('Discord Server API')
    .setDescription('Discord-inspired real-time communication backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Monta interfaz de Swagger en esa ruta

  await app.listen(process.env.PORT ?? 3000); // Aplicación escucha en puerto definido en variable de entorno y, si no existe, usa puerto 3000 por defecto
}
bootstrap(); // Ejecuta función de arranque
