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
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Unauthenticated user');
        }

        let guildId: string;
        const originalUrl = request.originalUrl as string;

        if (originalUrl.includes('/channels/')) {
            const channelId = request.params.id;

            const channel = await this.prisma.channel.findUnique({
                where: { id: channelId },
            });

            if (!channel) {
                throw new ForbiddenException('Channel not found');
            }

            guildId = channel.guildId;
        } else if (originalUrl.includes('/guilds/')) {
            guildId = request.params.id;
        } else {
            throw new ForbiddenException('The server could not be identified');
        }

        const membership = await this.prisma.guildMember.findUnique({
            where: {
                userId_guildId: {
                    userId: user.id,
                    guildId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not authorised to access this server');
        }

        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException('You do not have sufficient permissions');
        }

        return true;
    }
}