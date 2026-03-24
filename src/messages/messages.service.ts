import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMessageDto) {
  return this.prisma.message.create({
    data: {
      content: dto.content,
      channelId: dto.channelId,
      authorId: dto.authorId
    },
  });
}

  async findByChannel(channelId: string) {
    return this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
    });
  }
}