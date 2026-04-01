import {
    CanActivate, // Es la interfaz que debe implementar el guard para definir la lógica de autorización.
    ExecutionContext, // Proporciona información sobre el contexto de ejecución actual, como la solicitud HTTP, el usuario autenticado, etc.
    Injectable, // Es un decorador que marca la clase como un proveedor inyectable, lo que permite que NestJS gestione su ciclo de vida y dependencias.
    ForbiddenException, // Es una excepción que se lanza cuando el usuario no tiene los permisos necesarios para acceder a un recurso.
} from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // Sirve para leer metadata de los decoradores, como los roles definidos en el decorador @Roles.
import { ROLES_KEY } from '../decorators/roles.decorator'; // Es la clave que se utiliza para almacenar y recuperar los roles definidos en el decorador @Roles. 
import { MemberRole } from '@prisma/client'; // Es el enum que define los posibles roles de un miembro en un guild (OWNER, ADMIN, MEMBER). Lo uso para comparar con los roles requeridos por el endpoint.
import { PrismaService } from 'src/prisma/prisma.service'; // Lo uso para consultar el canal y la membresía del usuario en el guild

@Injectable() // Necesario para que NestJS pueda inyectar dependencias en esta clase, como el Reflector y el PrismaService.
export class RolesGuard implements CanActivate {
    constructor( // Inyecto dos dependencias
        private reflector: Reflector, // Para leer la metadata de los roles
        private prisma: PrismaService, // Para consultar la base de datos
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> { // Es el método que define lógica de la autorización. Devuelve true si el usuario tiene acceso, o lanza una excepción si no lo tiene.
        const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>( // Leemos roles requeridos 
            ROLES_KEY, 
            [context.getHandler(), context.getClass()], // Buscamos la metadata de roles tanto en el método (handler) como en la clase (controller). --> Primero busca en el método, si no encuentra nada, busca en la clase. 
        );

        if (!requiredRoles) { // Si no se han definido roles para el endpoint, permitimos el acceso sin restricciones.
            return true;
        }

        const request = context.switchToHttp().getRequest(); // Obtenemos la solicitud HTTP para acceder al usuario autenticado y a los parámetros de la ruta.
        const user = request.user; // El usuario autenticado tras la actuación de JwtAuthGuard, que se encarga de validar el token JWT y adjuntar la información del usuario a la solicitud.

        if (!user) { // Si no hay un usuario autenticado, lanzamos una excepción de acceso denegado porque no puedo verificar roles sin un usuario.
            throw new ForbiddenException('Unauthenticated user');
        }

        let guildId: string; // Averiguamos a qué guild pertenece el recurso al que se intenta acceder (guild o canal)
        const originalUrl = request.originalUrl as string; // URL original de la solicitud

        if (originalUrl.includes('/channels/')) { // Si la URL contiene '/channels/', significa que se está accediendo a un recurso relacionado con canales, por lo que necesitamos obtener el guildId a través del canal.
            const channelId = request.params.id; // El id del canal se encuentra en los parámetros de la ruta, ya que las rutas de canales tienen el formato '/channels/:id'.

            const channel = await this.prisma.channel.findUnique({ // Consultamos el canal en la base de datos para obtener su guildId.
                where: { id: channelId }, // Buscamos el canal por su id
            });

            if (!channel) { // Si el canal no existe, lanzamos una excepción de acceso denegado porque no podemos identificar el guild al que pertenece el canal.
                throw new ForbiddenException('Channel not found');
            }

            guildId = channel.guildId; // Si el canal existe, obtenemos su guildId para luego verificar la membresía y el rol del usuario en ese guild.
        } else if (originalUrl.includes('/guilds/')) { // Si la URL contiene '/guilds/', significa que se está accediendo a un recurso relacionado con guilds, por lo que el guildId se puede obtener directamente de los parámetros de la ruta.
            guildId = request.params.guildId || request.params.id; // Dependiendo de la ruta, el id del guild puede estar en params.id (por ejemplo, en rutas como '/guilds/:id') o en params.guildId (por ejemplo, en rutas como '/guilds/:guildId/members'). Intentamos obtenerlo de ambos lugares para cubrir ambos casos.
        } else {
            throw new ForbiddenException('The server could not be identified'); // Si la URL no contiene ni '/channels/' ni '/guilds/', no podemos identificar a qué guild pertenece el recurso, por lo que lanzamos una excepción de acceso denegado.
        }

        const membership = await this.prisma.guildMember.findUnique({ // Consultamos la membresía del usuario en el guild para verificar su rol.
            where: {
                userId_guildId: { // La membresía se identifica por la combinación de userId y guildId, ya que un usuario puede ser miembro de varios guilds con diferentes roles.
                    userId: user.id,
                    guildId,
                },
            },
        });

        if (!membership) { // Si el usuario no es miembro del guild, lanzamos una excepción de acceso denegado porque no tiene ningún rol en ese guild.
            throw new ForbiddenException('You are not authorised to access this server');
        }

        if (!requiredRoles.includes(membership.role)) { // Si el rol del usuario en el guild no está incluido en los roles requeridos por el endpoint, lanzamos una excepción de acceso denegado porque no tiene los permisos necesarios.
            throw new ForbiddenException('You do not have sufficient permissions');
        }

        return true; // Si el usuario tiene un rol en el guild y ese rol está incluido en los roles requeridos por el endpoint, permitimos el acceso devolviendo true.
    }
}