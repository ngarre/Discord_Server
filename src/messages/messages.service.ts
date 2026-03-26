import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMessageDto, authorId: string) {
  return this.prisma.message.create({
    data: {
      content: dto.content,
      channelId: dto.channelId,
      authorId
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