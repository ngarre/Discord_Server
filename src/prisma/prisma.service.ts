import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable() // Indica a Nest que esta clase puede inyectarse en otros servicios
export class PrismaService
  extends PrismaClient // Clase de la que hereda PrismaService (proporciona métodos de consulta de BBDD como "findMany")
  implements OnModuleInit, OnModuleDestroy // Métodos de la clase: uno para cuando el módulo arranca y otro para cuando se cierra
{
  async onModuleInit() {
    await this.$connect(); // Cuando Nest inicializa este servicio, Prisma se conecta a la BBDD
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Cuando aplicación o módulo se destruye, Prisma cierra la conexión
  }
}