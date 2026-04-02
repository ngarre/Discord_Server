import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';


describe('AuthService', () => { // Agrupa todos los tests relacionados con AuthService
    let service: AuthService; // declaramos una variable de tipo AuthService y su valor se asignará en el beforeEach

    const mockUsersService = { // Objeto mock que sustituye al UsersService real
        findByEmail: jest.fn(), // Función falsa para simular la búsqueda de usuario por email
        findByUsername: jest.fn(), // Función falsa para simular la búsqueda de usuario por username
        create: jest.fn(), // Función falsa para simular la creación de usuario
    };

    const mockJwtService = { // Objeto mock que sustituye al JwtService real
        sign: jest.fn(), // Función falsa para simular la generación del token JWT
    };

    beforeEach(async () => {  // Se ejecuta antes de cada test para preparar un entorno limpio
        const module: TestingModule = await Test.createTestingModule({ // Crea un módulo de pruebas de Nest
            providers: [ // Lista de servicios que estarán disponibles dentro del módulo de test
                AuthService, // Servicio real que queremos probar
                {
                    provide: UsersService, // Cuando AuthService pida UsersService...
                    useValue: mockUsersService, // ...se inyectará este mock en lugar del servicio real
                },

                {
                    provide: JwtService, // Cuando AuthService pida JwtService...
                    useValue: mockJwtService, // ...se inyectará este mock en lugar del servicio real
                },
            ],
        }).compile(); // Compila el módulo para dejarlo listo para usarse en los tests

        service = module.get<AuthService>(AuthService); // Obtiene la instancia de AuthService del módulo de pruebas, <AuthService> sirve para que TypeScript sepa de qué tipo es la instancia que estamos obteniendo

        jest.clearAllMocks(); // Limpia llamadas y valores anteriores de los mocks antes de cada test
    });


    // TEST 1: Email duplicado
    it('should throw ConflictException if email is already in use', async () => {  // Define el test: comprueba que falla si el email ya existe
        mockUsersService.findByEmail.mockResolvedValue({ // Simula que al buscar por email ya existe un usuario
            id: '1', // ID ficticio del usuario encontrado
            email: 'test@test.com', // Email que coincide con el que intentamos registrar
            username: 'testuser', // Username existente
            password: 'hashed',  // Password simulada (no importa su valor aquí)
        });

        await expect( // Ejecutamos la función que queremos testear
            service.register({ // Llamamos al método register del AuthService
                email: 'test@test.com', // Email duplicado (ya existe según el mock)
                username: 'otro', // Username distinto (no importa en este caso)
                password: '123456', // Password cualquiera
            }),
        ).rejects.toThrow(ConflictException); // Esperamos que la promesa falle lanzando ConflictException
    });


    // TEST 2: Username duplicado
    it('should throw ConflictException if username is already in use', async () => {
        mockUsersService.findByEmail.mockResolvedValue(null);
        mockUsersService.findByUsername.mockResolvedValue({
            id: '2',
            email: 'other@test.com',
            username: 'testuser',
            password: 'hashed',
        });

        await expect(
            service.register({
                email: 'new@test.com',
                username: 'testuser',
                password: '123456',
            }),
        ).rejects.toThrow(ConflictException);
    });


    // TEST 3: Register correcto
    it('should register a user and return an access token', async () => {
        mockUsersService.findByEmail.mockResolvedValue(null); // Simula que no existe ningún usuario con ese email
        mockUsersService.findByUsername.mockResolvedValue(null); // Simula que no existe ningún usuario con ese username
        mockUsersService.create.mockResolvedValue({ // Simula la creación correcta del usuario en la base de datos
            id: '123', // ID ficticio del usuario creado
            email: 'new@test.com', // Email del usuario creado
            username: 'newuser', // Username del usuario creado
            password: 'hashedPassword', // Password ya cifrada simulada
        });
        mockJwtService.sign.mockReturnValue('fake-jwt-token'); // Simula que JwtService genera este token al firmar el payload

        const result = await service.register({ // Ejecuta el método register del AuthService
            email: 'new@test.com', // Email con el que intentamos registrar al usuario
            username: 'newuser', // Username con el que intentamos registrar al usuario
            password: '123456',  // Password en texto plano que el servicio cifrará antes de crear el usuario
        });

        expect(mockUsersService.create).toHaveBeenCalled(); // Comprueba que efectivamente se llamó al método create de UsersService
        expect(mockJwtService.sign).toHaveBeenCalledWith({ // Comprueba que el token se genera con el payload correcto
            sub: '123', // El campo sub del JWT debe contener el id del usuario
            email: 'new@test.com', // El payload debe incluir el email del usuario
            username: 'newuser', // El payload debe incluir el username del usuario
        });
        expect(result).toEqual({ // Comprueba que el resultado final del método register es el esperado
            access_token: 'fake-jwt-token', // Debe devolver un objeto con el token generado
        });
    });


    // TEST 4: login correcto
    it('should login successfully and return an access token', async () => {
        mockUsersService.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@test.com',
            username: 'testuser',
            password: await bcrypt.hash('123456', 10), // Contraseña hasheada simulada para que coincida con la contraseña que se le pasará al login (123456)
        });

        mockJwtService.sign.mockReturnValue('fake-jwt-token');

        const result = await service.login({
            email: 'test@test.com',
            password: '123456', // Contraseña en texto plano que se le pasa al login, el servicio la comparará con la contraseña hasheada del mockUsersService
        });

        expect(mockJwtService.sign).toHaveBeenCalledWith({ // Comprueba que el token se genera con el payload correcto al hacer login
            sub: '123',
            email: 'test@test.com',
            username: 'testuser',
        });

        expect(result).toEqual({ // Comprueba que el resultado del login es el esperado, es decir, que devuelve el token generado
            access_token: 'fake-jwt-token',
        });
    });


    // TEST 5: Usuario no existe
    it('should throw UnauthorizedException if user does not exist', async () => {
        mockUsersService.findByEmail.mockResolvedValue(null);

        await expect(
            service.login({
                email: 'noexiste@test.com',
                password: '123456',
            }),
        ).rejects.toThrow(UnauthorizedException);
    });


    // TEST 6: Password incorrecta
    it('should throw UnauthorizedException if password is incorrect', async () => {
        mockUsersService.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@test.com',
            username: 'testuser',
            password: await bcrypt.hash('correct-password', 10),
        });

        await expect(
            service.login({
                email: 'test@test.com',
                password: 'wrong-password',
            }),
        ).rejects.toThrow(UnauthorizedException);
    });
});