import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGuildDto } from './dto/create-guild.dto.js';
import { UpdateGuildDto } from './dto/update-guild.dto.js';

@Injectable()
export class GuildsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGuildDto) {
    return this.prisma.guild.create({
      data: {
        name: dto.name,
        ownerId: dto.ownerId // Importante poner en el JSON el ID de un usuario que exista en la BBDD
      },
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
}