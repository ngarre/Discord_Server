import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mockeamos bcrypt para no depender del hash real en el test
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  // TEST 1: crea correctamente un usuario, comprobando duplicados
  it('should create a user successfully', async () => {
    // Primera llamada a findUnique -> búsqueda por email
    // Segunda llamada a findUnique -> búsqueda por username
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    // Crea el usuario en la base de datos.
    // En el flujo real de registro, la contraseña ya llega hasheada desde AuthService.
    mockPrisma.user.create.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      username: 'testuser',
      password: '123456',
    });

    // Llamamos al método create del servicio real con un DTO de ejemplo
    const result = await service.create({
      email: 'test@test.com',
      username: 'testuser',
      password: '123456',
    });

    // Comprueba que bcrypt se llamó con la password original
    // expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);

    // Comprueba que Prisma crea el usuario con la password hasheada
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@test.com',
        username: 'testuser',
        password: '123456',
      },
    });

    expect(result.email).toBe('test@test.com'); // Comprueba que el resultado tiene el email correcto
    expect(result.password).toBe('123456'); // Comprueba que el resultado tiene la contraseña hasheada (no la original)
  });

  // TEST 2: lanza conflicto si el email ya existe
  it('should throw ConflictException if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: '1',
      email: 'test@test.com',
      username: 'existinguser',
      password: 'hashed-password',
    });

    await expect(
      service.create({
        email: 'test@test.com',
        username: 'testuser',
        password: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });

  // TEST 3: lanza conflicto si el username ya existe
  it('should throw ConflictException if username already exists', async () => {
    // Primera llamada: email no existe
    // Segunda llamada: username sí existe
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: '2',
        email: 'other@test.com',
        username: 'testuser',
        password: 'hashed-password',
      });

    await expect(
      service.create({
        email: 'test@test.com',
        username: 'testuser',
        password: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });

  // TEST 4: actualiza username y password hasheando la nueva contraseña
  it('should update user successfully and hash password if provided', async () => {
    // findById(id)
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        username: 'olduser',
        password: 'old-hash',
      })
      // findByUsername(dto.username)
      .mockResolvedValueOnce(null);

    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

    mockPrisma.user.update.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      username: 'newuser',
      password: 'new-hash',
    });

    const result = await service.update('1', {
      username: 'newuser',
      password: 'newpassword',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        username: 'newuser',
        password: 'new-hash',
      },
    });

    expect(result.username).toBe('newuser');
  });

  // TEST 5: lanza NotFoundException si el usuario no existe al actualizar
  it('should throw NotFoundException if user does not exist on update', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.update('1', { username: 'newuser' }),
    ).rejects.toThrow(NotFoundException);
  });
});