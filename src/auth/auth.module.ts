import { Module } from '@nestjs/common'; // Decorador para definir módulos
import { JwtModule } from '@nestjs/jwt'; // Soporte para JWT
import { PassportModule } from '@nestjs/passport'; // Infraestructura de autenticación
import { ConfigModule, ConfigService } from '@nestjs/config'; // Variables de entorno
import { AuthService } from './auth.service'; // Lógica de autenticación
import { AuthController } from './auth.controller'; // Endpoints de auth
import { JwtStrategy } from './strategies/jwt.strategy'; // Estrategia para validar JWT
import { UsersModule } from '../users/users.module'; // Necesario para consultar/crear usuarios

@Module({
  imports: [ 
    UsersModule, // Auth depende del módulo de usuarios
    PassportModule, // Integra Passport con Nest
    // Importo y configuro el módulo JWT.
    // Esto hace que JwtService esté disponible dentro de AuthModule.
    JwtModule.registerAsync({
      imports: [ConfigModule], // Módulo de configuración
      inject: [ConfigService], // Servicio que se inyecta en la factory
      useFactory: (configService: ConfigService) => ({ 
        secret: configService.getOrThrow<string>('JWT_SECRET'), // Secreto JWT desde .env
        signOptions: { expiresIn: '24h' }, // El token caduca en 24 horas
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy], // Servicios internos del módulo
  controllers: [AuthController], // Controlador con rutas de auth
  exports: [AuthService, JwtModule], // Lo que este módulo comparte con otros
})
export class AuthModule {}