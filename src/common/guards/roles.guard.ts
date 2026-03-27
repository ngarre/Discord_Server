import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MemberRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles definidos → deja pasar
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // aquí aún no sabemos el guildId → lo resolvemos ahora
    const channelId = request.params.id;

    // buscamos el canal para saber a qué guild pertenece
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ForbiddenException('Canal no encontrado');
    }

    // buscamos el rol del usuario en ese guild
    const membership = await this.prisma.guildMember.findUnique({
      where: {
        userId_guildId: {
          userId: user.id,
          guildId: channel.guildId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a este servidor');
    }

    // comprobamos si tiene alguno de los roles requeridos
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    return true;
  }
}