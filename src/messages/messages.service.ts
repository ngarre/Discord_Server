import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EncryptionService } from '../common/services/encryption.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, // Para consultar y guardar en BBDD
    private encryptionService: EncryptionService, // Para cifrar y descifrar mensajes usando la clave de cifrado del canal
  ) { }

  // -- MÉTODO PARA CREAR UN MENSAJE --
  async create(dto: CreateMessageDto, authorId: string) {
    const channel = await this.prisma.channel.findUnique({ // Buscamos canal al que se quiere enviar mensaje
      where: { id: dto.channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found'); // Si no existe canal --> lanzamos excepción de no encontrado
    }

    const membership = await this.prisma.guildMember.findUnique({ // Verificamos que el autor pertenece al servidor del canal al que queremos enviar mensaje
      where: {
        userId_guildId: {
          userId: authorId, 
          guildId: channel.guildId, 
        },
      },
    });

    if (!membership) { // Si no se recupera ninguna membresía, significa que el usuario no pertenece al servidor, por lo que lanzamos una excepción de acceso denegado.
      throw new ForbiddenException('You do not belong to this server');
    }

    // Si el canal existe y el usuario pertenece al servidor, encriptamos el contenido del mensaje usando clave de cifrado del canal
    const encryptedContent = this.encryptionService.encrypt(
      dto.content,
      channel.encryptionKey,
    );

    return this.prisma.message.create({ // Guardamos el mensaje en la base de datos con el contenido cifrado
      data: {
        content: encryptedContent,
        channelId: dto.channelId,
        authorId,
      },
    });
  }

  // -- MÉTODO PARA OBTENER MENSAJES POR CANAL --
  async findByChannel(channelId: string, userId: string) { 
    const channel = await this.prisma.channel.findUnique({ // Comprobamos si el canal existe
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.prisma.guildMember.findUnique({ // Verificamos si e usuario pertenece al servidor del canal para permitirle ver los mensajes
      where: {
        userId_guildId: {
          userId,
          guildId: channel.guildId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not belong to this server');
    }

    const messages = await this.prisma.message.findMany({ // Recuperamos mensajes del canal ordenados por fecha de creación ascendente (de más antiguos a más recientes)
      where: { channelId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => { // Para cada mensaje intentamos descifrar su contenido
      try {
        return {
          ...message, // Los tres puntos crean copia de mensaje con todas sus propiedades y luego sobreescribimos propiedad content con el resultado del descifrado.
          content: this.encryptionService.decrypt(
            message.content,
            channel.encryptionKey,
          ),
        };
      } catch {
        return { // Si el descifrado falla devolvemos mensaje con mensaje de error en el contenido, pero sin lanzar excepción para no impedir que se muestren los demás mensajes.
          ...message,
          content: '[Encrypted message could not be decrypted]',
        };
      }
    });
  }
}