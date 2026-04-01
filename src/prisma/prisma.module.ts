import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // PrismaModule es un módulo global dentro de Nest: no tengo que importarlo repetidamente en otros módulos del proyecto
@Module({ // Configuración del módoulo
  providers: [PrismaService], // Registra a PrismaService servicio inyectable.
  exports: [PrismaService], // Permite que otros módulos puedan usar el proveedor.
})
export class PrismaModule {}