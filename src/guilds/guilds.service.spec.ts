import { Test, TestingModule } from '@nestjs/testing';
import { GuildsService } from './guilds.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

describe('GuildsService', () => {
  let service: GuildsService; // Variable donde guardaremos la instancia del servicio a probar

  const mockPrisma = {
    guild: {
      create: jest.fn(), // función falsa para la creación de una guild en la bbdd
    },
    user: {
      findUnique: jest.fn(),
    },
    guildMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => { // Se ejecuta antes de cada test para preparar un entorno limpio
    const module: TestingModule = await Test.createTestingModule({ // Crea un módulo de pruebas de Nest
      providers: [
        GuildsService, // Servicio real que queremos probar
        {
          provide: PrismaService, // Cuando GuildsService pida PrismaService...
          useValue: mockPrisma, // ...se inyectará este mock en lugar del servicio real
        },
      ],
    }).compile(); // Compila el módulo para dejarlo listo para los tests

    service = module.get<GuildsService>(GuildsService); // Obtiene la instancia de GuildsService desde el módulo de pruebas
    jest.clearAllMocks(); // Limpia llamadas anteriores de los mocks antes de cada test
  });

  // TEST 1: Crea correctamente la guild, se asigna el owner y el member se crea automáticamente
  it('should create a guild and assign owner as member', async () => {
    mockPrisma.guild.create.mockResolvedValue({ // Simula el resultado que devolvería Prisma al crear la guild
      id: 'guild-1', // ID ficticio de la guild creada
      name: 'Test Guild', // Nombre de la guild creada
      ownerId: 'user-1', // Usuario que queda registrado como owner de la guild
      members: [ // Lista de miembros devuelta al incluir la relación members
        {
          userId: 'user-1', // El miembro creado corresponde al owner
          role: MemberRole.OWNER, // El rol asignado es OWNER
        },
      ],
    });

    const result = await service.create( // Ejecuta el método create del GuildsService
      { name: 'Test Guild' }, // DTO con el nombre de la guild
      'user-1', // ID del usuario autenticado que actúa como owner
    );

    expect(mockPrisma.guild.create).toHaveBeenCalledWith({ // Comprueba que Prisma se llamó con la estructura correcta
      data: {
        name: 'Test Guild', // Se guarda el nombre de la guild
        ownerId: 'user-1', // Se asigna correctamente el ownerId
        members: {
          create: {
            userId: 'user-1', // Se crea automáticamente un member con el mismo usuario
            role: MemberRole.OWNER, // Ese member recibe el rol OWNER
          },
        },
      },
      include: { members: true }, // Se solicita que Prisma devuelva también la relación members
    });

    expect(result.ownerId).toBe('user-1'); // Comprueba que el ownerId del resultado es el esperado
    expect(result.members[0].role).toBe(MemberRole.OWNER); // Comprueba que el primer miembro devuelto tiene rol OWNER
  });

  
  // TEST 2: Añade correctamente un miembro al guild
  it('should add a member successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
    });

    mockPrisma.guildMember.findUnique.mockResolvedValue(null);

    mockPrisma.guildMember.create.mockResolvedValue({
      userId: 'user-2',
      guildId: 'guild-1',
      role: MemberRole.MEMBER,
    });

    const result = await service.addMember(
      'guild-1',
      'user-2',
      MemberRole.MEMBER,
    );

    expect(mockPrisma.guildMember.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        guildId: 'guild-1',
        role: MemberRole.MEMBER,
      },
    });

    expect(result.role).toBe(MemberRole.MEMBER);
  });


  // TEST 3: Lanza error si el usuario ya pertenece al servidor
  it('should throw BadRequestException if user already belongs to the guild', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
    });

    mockPrisma.guildMember.findUnique.mockResolvedValue({
      userId: 'user-2',
      guildId: 'guild-1',
    });

    await expect(
      service.addMember('guild-1', 'user-2', MemberRole.MEMBER),
    ).rejects.toThrow();
  });


  // TEST 4: No permite asignar rol OWNER
  it('should throw BadRequestException if trying to assign OWNER role', async () => {
    await expect(
      service.addMember('guild-1', 'user-2', MemberRole.OWNER),
    ).rejects.toThrow();
  });
});