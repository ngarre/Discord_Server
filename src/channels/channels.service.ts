import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateChannelDto) {
    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        guildId: dto.guildId,
        encryptionKey: 'TEMP_KEY',
      },
    });
  }

  findAll() {
    return this.prisma.channel.findMany();
  }

   async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }
  update(id: string, dto: UpdateChannelDto) {
    return this.prisma.channel.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.channel.delete({
      where: { id },
    });
  }
}
