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
    // 1. comprobar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
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
      throw new BadRequestException('El usuario ya pertenece a este servidor');
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
}