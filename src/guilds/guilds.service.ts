import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class GuildsService {
  constructor(private prisma: PrismaService) { } // Inyectamos el servicio de Prisma para interactuar con la base de datos

  // -- Crea NUEVA GUILD y asigna al usuario autenticado como OWNER --
  async create(dto: CreateGuildDto, ownerId: string) {
    return this.prisma.guild.create({
      data: {
        name: dto.name, // El nombre de la guild se toma del DTO enviado por el cliente
        ownerId, // El usuario autenticado se convierte en el OWNER de la guild creada
        members: { // Al crear la guild, también creamos la relación en GuildMember para asignar el rol de OWNER al usuario que creó la guild
          create: { userId: ownerId, role: MemberRole.OWNER }, // el guildId se obtiene automáticamente del padre
        },
      },
      include: { members: true }, // Incluimos los miembros en la respuesta para que el cliente tenga toda la información de la guild creada
    });
  }

  // -- OBTIENE TODAS LAS GUILDS --
  async findAll() {
    return this.prisma.guild.findMany();
  }

  // -- OBTIENE UNA GUILD POR ID --
  async findOne(id: string) {
    const guild = await this.prisma.guild.findUnique({
      where: { id },
    });

    if (!guild) throw new NotFoundException('Guild not found');

    return guild;
  }

  // -- ACTUALIZA UNA GUILD (SOLO OWNER) --
  async update(id: string, dto: UpdateGuildDto) {
    await this.findOne(id);

    return this.prisma.guild.update({
      where: { id },
      data: dto,
    });
  }

    // -- ELIMINA UNA GUILD (SOLO OWNER) --
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.guild.delete({
      where: { id },
    });
  }


  // -- AÑADE UN MIEMBRO A UNA GUILD (SOLO OWNER) --
  async addMember(guildId: string, userId: string, role: MemberRole) {
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role'); // El rol OWNER no se puede asignar manualmente a otros usuarios
    }
    // 1. comprobar que el usuario que se quiere añadir existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. comprobar que no está ya en el guild
    const existingMembership = await this.prisma.guildMember.findUnique({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('The user is already registered on this server');
    }

    // 3. crear membership
    return this.prisma.guildMember.create({ // Añadimos registro en tabla GuildMember
      data: {
        userId,
        guildId,
        role,
      },
    });
  }

  // -- ACTUALIZA EL ROL DE UN MIEMBRO EN UNA GUILD (SOLO OWNER) --
  async updateMemberRole(guildId: string, userId: string, role: MemberRole) {
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role'); // No puedo asignarle el rol de OWNER
    }

    const membership = await this.prisma.guildMember.findUnique({ // Buscamos la relación del miembro con la guild para comprobar que existe y obtener su rol actual
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
    });

    if (!membership) { // Si no existe esa relación, significa que el usuario no es miembro de la guild
      throw new NotFoundException('The user is not registered on this server');
    }

    if (membership.role === MemberRole.OWNER) { // Si el miembro es el OWNER, no se le puede cambiar el rol
      throw new BadRequestException('Owner role cannot be modified');
    }

    return this.prisma.guildMember.update({ // Actualizamos el rol del miembro en la guild
      where: {
        userId_guildId: { // La clave compuesta userId_guildId nos permite identificar de forma única la relación del miembro con la guild
          userId, 
          guildId,
        },
      },
      data: {
        role, // Actualizamos el rol del miembro al nuevo valor enviado por el cliente
      },
    });
  }
}