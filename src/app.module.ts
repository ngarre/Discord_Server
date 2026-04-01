import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GuildsModule } from './guilds/guilds.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { ConfigModule } from '@nestjs/config'; // Módulo para trabajar con variables de entorno
import { LoggingMiddleware } from './common/middleware/logging.middleware'; // Middleware para registro de actividad
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

@Module({ // Decorador para definir un módulo, en este caso definimos módulo raíz
  imports: [ // Digo a Nest qué módulos forman parte de mi aplicación
    ConfigModule.forRoot({ isGlobal: true }),  // Damos acceso a toda la aplicación a las variables de entorno 
    UsersModule, // CRUD usuarios
    PrismaModule, // Registro del acceso a la BBDD
    AuthModule, // Autenticación y autorización
    GuildsModule, // CRUD servidores
    ChannelsModule, // CRUD canales
    MessagesModule] // POST y GET mensajes
})


export class AppModule implements NestModule { // App Module implementa NestModule para poder aplicar Middlewares
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Se aplica middleware a todas las rutas y endpoints de la aplicación
  }
}