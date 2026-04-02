import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

// Librería bycript para hashear las contraseñas antes de guardarlas
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // -- MÉTODO PARA BUSCAR USUARIO POR ID --
    async findById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    // -- MÉTODO PARA BUSCAR USUARIO POR EMAIL --
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }

    // -- MÉTODO PARA BUSCAR USUARIO POR USERNAME --
    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }


    // -- MÉTODO PARA CREAR USUARIO --
    async create(dto: CreateUserDto) {
        // Comprueba que no exista ya otro usuario con el mismo email
        const existingEmail = await this.findByEmail(dto.email);
        if (existingEmail) {
            throw new ConflictException('Email already in use');
        }

        // Comprueba que no exista ya otro usuario con el mismo username
        const existingUsername = await this.findByUsername(dto.username);
        if (existingUsername) {
            throw new ConflictException('Username already in use');
        }

        // Hashea la contraseña antes de guardarla en la base de datos --> Sobra porque la contraseña ya viene hasheada desde AuthService, pero lo dejo por si se quiere usar este método para crear usuarios desde otro sitio que no sea AuthService.
        // const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Crea el usuario con la contraseña hasheada
        return this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: dto.password, // ya viene hasheada desde AuthService, así que se guarda directamente. Si se quisiera hashear aquí, sería: password: hashedPassword
            },
        });
    }


    // -- MÉTODO PARA BUSCAR TODOS LOS USUARIOS --
    async findAll() {
        return this.prisma.user.findMany();
    }


    // -- MÉTODO PARA ACTUALIZAR USUARIO --
    async update(id: string, dto: UpdateUserDto) {
        // Comprueba antes que el usuario exista
        await this.findById(id);

        // Si se quiere cambiar el username, comprueba que no lo tenga ya otro usuario
        if (dto.username) {
            const existingUsername = await this.findByUsername(dto.username);

            // Si existe otro usuario con ese username y no es el mismo id, lanza conflicto
            if (existingUsername && existingUsername.id !== id) {
                throw new ConflictException('Username already in use');
            }

            // Construye el objeto final que se enviará a Prisma.
            // Solo añade los campos presentes en el DTO.
            // Si llega password, se hashea antes de guardarla.
            return this.prisma.user.update({
                where: { id },
                data: {
                    // Si el DTO incluye username, se añade al objeto data. Si no, no se añade (gracias a los tres puntos).
                    ...(dto.username && { username: dto.username }),
                    ...(dto.password && {
                        password: await bcrypt.hash(dto.password, 10), // Si se quiere actualizar la contraseña, se hashea antes de guardarla
                    }),
                },
            });
        }

    }

    // Elimina un usuario por id
    async delete(id: string) {
        // Comprueba antes que el usuario exista
        await this.findById(id);
        
        return this.prisma.user.delete({
            where: { id },
        });
    }

}

