import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class GuildsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateGuildDto, ownerId: string) {
    return this.prisma.guild.create({
      data: {
        name: dto.name,
        ownerId,
        members: {
          create: { userId: ownerId, role: MemberRole.OWNER },
        },
      },
      include: { members: true },
    });
  }

  async findAll() {
    return this.prisma.guild.findMany();
  }

  async findOne(id: string) {
    const guild = await this.prisma.guild.findUnique({
      where: { id },
    });

    if (!guild) throw new NotFoundException('Guild not found');

    return guild;
  }

  async update(id: string, dto: UpdateGuildDto) {
    await this.findOne(id);

    return this.prisma.guild.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.guild.delete({
      where: { id },
    });
  }


  // Método para que owner añada nuevo miembro a su servidor
  async addMember(guildId: string, userId: string, role: MemberRole) {
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role');
    }
    // 1. comprobar que el usuario existe
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
    return this.prisma.guildMember.create({
      data: {
        userId,
        guildId,
        role,
      },
    });
  }

  // Método para actualizar el rol de un usuario dentro del guild
  async updateMemberRole(guildId: string, userId: string, role: MemberRole) {
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role');
    }

    const membership = await this.prisma.guildMember.findUnique({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('The user is not registered on this server');
    }

    if (membership.role === MemberRole.OWNER) {
      throw new BadRequestException('Owner role cannot be modified');
    }

    return this.prisma.guildMember.update({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
      data: {
        role,
      },
    });
  }
}