import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;

  // Mock de Prisma: simulamos solo los métodos que usa realmente MessagesService
  const mockPrisma = {
    channel: {
      findUnique: jest.fn(),
    },
    guildMember: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  // Mock del servicio de cifrado
  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    // Creamos un módulo de pruebas de Nest
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService, // Servicio real que queremos probar
        {
          provide: PrismaService,
          useValue: mockPrisma, // Sustituimos Prisma real por el mock
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService, // Sustituimos EncryptionService real por el mock
        },
      ],
    }).compile();

    // Obtenemos la instancia del servicio desde el módulo de pruebas
    service = module.get<MessagesService>(MessagesService);

    // Limpiamos llamadas anteriores entre tests
    jest.clearAllMocks();
  });

  // TEST 1: crea un mensaje cifrando el contenido antes de guardarlo
  it('should encrypt message content before saving', async () => {
    // Simulamos que el canal existe y pertenece a un guild
    mockPrisma.channel.findUnique.mockResolvedValue({
      id: 'channel-1',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    // Simulamos que el usuario sí pertenece al guild del canal
    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      guildId: 'guild-1',
    });

    // Simulamos que encrypt devuelve el texto cifrado
    mockEncryptionService.encrypt.mockReturnValue('encrypted-text');

    // Simulamos el mensaje creado por Prisma
    mockPrisma.message.create.mockResolvedValue({
      id: 'msg-1',
      content: 'encrypted-text',
      channelId: 'channel-1',
      authorId: 'user-1',
    });

    // Ejecutamos el método real del servicio
    const result = await service.create(
      { content: 'hello', channelId: 'channel-1' },
      'user-1',
    );

    // Verificamos que se cifra el contenido con la clave del canal
    expect(mockEncryptionService.encrypt).toHaveBeenCalledWith( // Comprobamos que se llama a encrypt con el texto plano del mensaje y la clave de cifrado del canal
      'hello', // El texto plano que queremos cifrar
      'wrapped-key', // La clave de cifrado del canal que se obtiene de la base de datos
    );

    // Verificamos que se guarda el contenido cifrado y no el texto plano
    expect(mockPrisma.message.create).toHaveBeenCalledWith({ // Comprobamos que se llama a Prisma para crear el mensaje con el contenido cifrado
      data: {
        content: 'encrypted-text',
        channelId: 'channel-1',
        authorId: 'user-1',
      },
    });

    // Verificamos que el resultado devuelto es el esperado
    expect(result.content).toBe('encrypted-text'); // El resultado de llamar al método posee el contenido cifrado
  });

  // TEST 2: lanza error si el canal no existe
  it('should throw NotFoundException if channel does not exist', async () => {
    // Simulamos que el canal no existe
    mockPrisma.channel.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ content: 'hello', channelId: 'channel-1' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  // TEST 3: lanza error si el usuario no pertenece al servidor del canal
  it('should throw ForbiddenException if user does not belong to the guild', async () => {
    // Simulamos que el canal existe
    mockPrisma.channel.findUnique.mockResolvedValue({
      id: 'channel-1',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    // Simulamos que el usuario NO pertenece al guild
    mockPrisma.guildMember.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ content: 'hello', channelId: 'channel-1' }, 'user-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  // TEST 4: devuelve los mensajes descifrados al consultar un canal
  it('should return decrypted messages for a channel', async () => {
    // Simulamos que el canal existe
    mockPrisma.channel.findUnique.mockResolvedValue({
      id: 'channel-1',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    // Simulamos que el usuario pertenece al guild
    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      guildId: 'guild-1',
    });

    // Simulamos mensajes guardados cifrados en la BD
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        content: 'encrypted-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        content: 'encrypted-2',
        channelId: 'channel-1',
        authorId: 'user-2',
        createdAt: new Date(),
      },
    ]);

    // Simulamos el descifrado de cada mensaje
    mockEncryptionService.decrypt
      .mockReturnValueOnce('hola')
      .mockReturnValueOnce('qué tal');

    const result = await service.findByChannel('channel-1', 'user-1');

    // Verificamos que Prisma busca los mensajes del canal ordenados por fecha
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { channelId: 'channel-1' },
      orderBy: { createdAt: 'asc' },
    });

    // Verificamos que el contenido se devuelve descifrado
    expect(result[0].content).toBe('hola');
    expect(result[1].content).toBe('qué tal');
  });

  // TEST 5: si falla el descifrado de un mensaje, devuelve el texto fallback
  it('should return fallback text if a message cannot be decrypted', async () => {
    // Simulamos que el canal existe
    mockPrisma.channel.findUnique.mockResolvedValue({
      id: 'channel-1',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    // Simulamos que el usuario pertenece al guild
    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      guildId: 'guild-1',
    });

    // Simulamos un mensaje cifrado en la BD
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        content: 'broken-encrypted-content',
        channelId: 'channel-1',
        authorId: 'user-1',
        createdAt: new Date(),
      },
    ]);

    // Simulamos que decrypt lanza error
    mockEncryptionService.decrypt.mockImplementation(() => {
      throw new Error('Decrypt failed');
    });

    const result = await service.findByChannel('channel-1', 'user-1');

    // Verificamos que se devuelve el texto alternativo en vez de romper la respuesta
    expect(result[0].content).toBe('[Encrypted message could not be decrypted]');
  });
});