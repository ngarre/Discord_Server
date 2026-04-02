import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { ChannelsService } from './channels.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

describe('ChannelsService', () => {
  let service: ChannelsService;

  // Mock de Prisma: simulamos solo los métodos que usa ChannelsService
  const mockPrisma = {
    guildMember: {
      findUnique: jest.fn(),
    },
    channel: {
      create: jest.fn(),
      findMany: jest.fn(), // no se usa en los tests actuales pero lo dejamos por si se necesita
      findUnique: jest.fn(),
      update: jest.fn(), // no se usa en los tests actuales pero lo dejamos por si se necesita
      delete: jest.fn(), // no se usa en los tests actuales pero lo dejamos por si se necesita
    },
  };

  // Mock del servicio de cifrado
  const mockEncryptionService = {
    generateKey: jest.fn(),
    wrapKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService, // Servicio real que queremos probar
        {
          provide: PrismaService,
          useValue: mockPrisma, // Prisma real sustituido por mock
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService, // Servicio de cifrado sustituido por mock
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    jest.clearAllMocks();
  });

  // TEST 1: crea correctamente un canal si el usuario pertenece al guild y es OWNER
  it('should create a channel successfully when user is owner of the guild', async () => {
    // Simulamos la generación y envoltura de la clave del canal
    mockEncryptionService.generateKey.mockReturnValue('raw-key');
    mockEncryptionService.wrapKey.mockReturnValue('wrapped-key');

    // Simulamos que el usuario sí pertenece al guild y además es OWNER
    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      guildId: 'guild-1',
      role: MemberRole.OWNER,
    });

    // Simulamos el canal creado en Prisma
    mockPrisma.channel.create.mockResolvedValue({
      id: 'channel-1',
      name: 'general',
      type: 'TEXT',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    const result = await service.create(
      {
        name: 'general',
        type: 'TEXT',
        guildId: 'guild-1',
      },
      'user-1',
    );

    // Comprueba que se genera la clave del canal
    expect(mockEncryptionService.generateKey).toHaveBeenCalled();

    // Comprueba que la clave se envuelve antes de guardarse
    expect(mockEncryptionService.wrapKey).toHaveBeenCalledWith('raw-key');

    // Comprueba que Prisma crea el canal con la clave envuelta
    expect(mockPrisma.channel.create).toHaveBeenCalledWith({
      data: {
        name: 'general',
        type: 'TEXT',
        guildId: 'guild-1',
        encryptionKey: 'wrapped-key',
      },
    });

    // Comprueba el resultado
    expect(result.id).toBe('channel-1');
    expect(result.encryptionKey).toBe('wrapped-key');
  });

  // TEST 2: lanza error si el usuario no pertenece al guild
  it('should throw ForbiddenException if user does not belong to the guild', async () => {
    mockEncryptionService.generateKey.mockReturnValue('raw-key');
    mockEncryptionService.wrapKey.mockReturnValue('wrapped-key');

    // Simulamos que no existe membresía para ese usuario en ese guild
    mockPrisma.guildMember.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        {
          name: 'general',
          type: 'TEXT',
          guildId: 'guild-1',
        },
        'user-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // TEST 3: lanza error si el usuario pertenece al guild pero no es OWNER
  it('should throw ForbiddenException if user is not owner', async () => {
    mockEncryptionService.generateKey.mockReturnValue('raw-key');
    mockEncryptionService.wrapKey.mockReturnValue('wrapped-key');

    // Simulamos que el usuario pertenece al guild pero tiene rol MEMBER
    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      guildId: 'guild-1',
      role: MemberRole.MEMBER,
    });

    await expect(
      service.create(
        {
          name: 'general',
          type: 'TEXT',
          guildId: 'guild-1',
        },
        'user-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // TEST 4: findOne devuelve el canal si existe
  it('should return a channel by id', async () => {
    mockPrisma.channel.findUnique.mockResolvedValue({
      id: 'channel-1',
      name: 'general',
      type: 'TEXT',
      guildId: 'guild-1',
      encryptionKey: 'wrapped-key',
    });

    const result = await service.findOne('channel-1');

    expect(mockPrisma.channel.findUnique).toHaveBeenCalledWith({
      where: { id: 'channel-1' },
    });

    expect(result.id).toBe('channel-1');
    expect(result.name).toBe('general');
  });

  // TEST 5: findOne lanza NotFoundException si el canal no existe
  it('should throw NotFoundException if channel does not exist', async () => {
    mockPrisma.channel.findUnique.mockResolvedValue(null);

    await expect(service.findOne('channel-1')).rejects.toThrow(NotFoundException);
  });
});