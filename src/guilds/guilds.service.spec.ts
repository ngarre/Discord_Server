import { Test, TestingModule } from '@nestjs/testing'; // Importa las herramientas de testing de NestJS
import { GuildsService } from './guilds.service'; // Importa el servicio que queremos probar
import { PrismaService } from '../prisma/prisma.service'; // Lo voy a mockear
import { MemberRole } from '@prisma/client'; // Importa el enum MemberRole que define los roles de los miembros en una guild

describe('GuildsService', () => { // Describe el bloque de pruebas para GuildsService
  let service: GuildsService; // Variable donde guardaremos la instancia del servicio real que uso en cada test

  const mockPrisma = {
    guild: {
      create: jest.fn(), // función falsa para la creación de una guild en la bbdd
    },
    user: {
      findUnique: jest.fn(), // función falsa para buscar un usuario por su ID en la bbdd
    },
    guildMember: { 
      findUnique: jest.fn(), // función falsa para buscar un miembro de una guild por su userId y guildId en la bbdd
      create: jest.fn(), // función falsa para crear un nuevo miembro en una guild en la bbdd
      update: jest.fn(), // función falsa para actualizar el rol de un miembro en una guild en la bbdd
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



  // TEST 1: Crea correctamente la guild, se asigna el owner 
  it('should create a guild and assign owner as member', async () => {
    mockPrisma.guild.create.mockResolvedValue({ // Simula el resultado que devolvería Prisma al crear la guild, el objeto que devuelve PRISMA
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

    const result = await service.create( // Ejecuta el método create REAL del GuildsService
      { name: 'Test Guild' }, // DTO con el nombre de la guild
      'user-1', // ID del usuario autenticado que actúa como owner
    );

    expect(mockPrisma.guild.create).toHaveBeenCalledWith({ // Comprueba que Prisma se llamó con la estructura correcta
      data: {
        name: 'Test Guild', // El nombre de la guild se pasa correctamente
        ownerId: 'user-1', // El ownerId se asigna correctamente
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
    mockPrisma.user.findUnique.mockResolvedValue({ // Simula que el usuario existe en la base de datos
      id: 'user-2', // ID del usuario que queremos añadir al guild
    });

    mockPrisma.guildMember.findUnique.mockResolvedValue(null); // Simula que el usuario todavía no es miembro del guild por lo que no se encuentra ningún registro en GuildMember

    mockPrisma.guildMember.create.mockResolvedValue({ // Simula el resultado que devolvería Prisma al crear un nuevo miembro en la guild
      userId: 'user-2',
      guildId: 'guild-1',
      role: MemberRole.MEMBER,
    });

    const result = await service.addMember( // Ejecuta el método addMember REAL del GuildsService
      'guild-1',
      'user-2',
      MemberRole.MEMBER,
    );

    expect(mockPrisma.guildMember.create).toHaveBeenCalledWith({ // Compruebo que se llama a Prisma con la estructura correcta
      data: {
        userId: 'user-2',
        guildId: 'guild-1',
        role: MemberRole.MEMBER,
      },
    });

    expect(result.role).toBe(MemberRole.MEMBER); // Comprueba que el rol del miembro añadido es el esperado (MEMBER)
  });


  // TEST 3: Lanza error si el usuario ya pertenece al servidor
  it('should throw BadRequestException if user already belongs to the guild', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ // Simula que el usuario existe en la base de datos
      id: 'user-2',
    });
 
    mockPrisma.guildMember.findUnique.mockResolvedValue({ // Simula que el usuario ya es miembro del guild, por lo que se encuentra un registro en GuildMember
      userId: 'user-2',
      guildId: 'guild-1',
    });

    await expect(
      service.addMember('guild-1', 'user-2', MemberRole.MEMBER), // Ejecuta el método addMember REAL del GuildsService y espera que lance un error
    ).rejects.toThrow(); // Comprueba que se lanza una excepción (BadRequestException) al intentar añadir un usuario que ya pertenece al guild
  });


  // TEST 4: No permite asignar rol OWNER
  it('should throw BadRequestException if trying to assign OWNER role', async () => {
    // No hace falta mockear nada porque si el rol que llega es OWNER, el método addMember lanza el error antes de hacer cualquier consulta a la base de datos
    await expect(
      service.addMember('guild-1', 'user-2', MemberRole.OWNER), // Ejecuta el método addMember REAL del GuildsService intentando asignar el rol OWNER a un miembro
    ).rejects.toThrow(); 
  });
});