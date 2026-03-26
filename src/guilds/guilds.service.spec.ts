import { Test, TestingModule } from '@nestjs/testing';
import { GuildsService } from './guilds.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

describe('GuildsService', () => {
  let service: GuildsService;

  const mockPrisma = {
    guild: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuildsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GuildsService>(GuildsService);
    jest.clearAllMocks();
  });

  // TEST 1: Crea correctamente la guild, se asigna el owner y el member se crea automáticamente
  it('should create a guild and assign owner as member', async () => {
    mockPrisma.guild.create.mockResolvedValue({
      id: 'guild-1',
      name: 'Test Guild',
      ownerId: 'user-1',
      members: [
        {
          userId: 'user-1',
          role: MemberRole.OWNER,
        },
      ],
    });

    const result = await service.create(
      { name: 'Test Guild' },
      'user-1',
    );

    expect(mockPrisma.guild.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Guild',
        ownerId: 'user-1',
        members: {
          create: {
            userId: 'user-1',
            role: MemberRole.OWNER,
          },
        },
      },
      include: { members: true },
    });

    expect(result.ownerId).toBe('user-1');
    expect(result.members[0].role).toBe(MemberRole.OWNER);
  });
});