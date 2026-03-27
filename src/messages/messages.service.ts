import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EncryptionService } from '../common/services/encryption.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) { }

  async create(dto: CreateMessageDto, authorId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: dto.channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const encryptedContent = this.encryptionService.encrypt(
      dto.content,
      channel.encryptionKey,
    );

    return this.prisma.message.create({
      data: {
        content: encryptedContent,
        channelId: dto.channelId,
        authorId,
      },
    });
  }

  async findByChannel(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => {
      try {
        return {
          ...message,
          content: this.encryptionService.decrypt(
            message.content,
            channel.encryptionKey,
          ),
        };
      } catch {
        return {
          ...message,
          content: '[Encrypted message could not be decrypted]',
        };
      }
    });
  }
}