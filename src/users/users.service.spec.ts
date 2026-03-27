import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // TEST 1: Creación correcta de un usuario
  it('should create a user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null); // no existe
    mockPrisma.user.create.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      username: 'testuser',
      password: 'hashed',
    });

    const result = await service.create({
      email: 'test@test.com',
      username: 'testuser',
      password: '123456',
    });

    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(result.email).toBe('test@test.com');
  });


  // TEST 2: Salta excepción porque el usuario ya existe
  it('should throw ConflictException if user already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      username: 'testuser',
      password: 'hashed',
    });

    await expect(
      service.create({
        email: 'test@test.com',
        username: 'testuser',
        password: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });
});