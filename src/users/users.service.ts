import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
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

        const existingEmail = await this.findByEmail(dto.email);
        if (existingEmail) {
            throw new ConflictException('Email already in use');
        }

        const existingUsername = await this.findByUsername(dto.username);
        if (existingUsername) {
            throw new ConflictException('Username already in use');
        }

        // No vuelvo a Hasehar porque ya viene Hasehada desde AuthService
       // const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Crea el usuario con la contraseña hasheada
        return this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: dto.password, // ya viene hasheada desde AuthService
            },
        });
    }


    // -- MÉTODO PARA BUSCAR TODOS LOS USUARIOS --
    async findAll() {
        return this.prisma.user.findMany();
    }


    // -- MÉTODO PARA ACTUALIZAR USUARIO --
    async update(id: string, dto: UpdateUserDto) {
        
        await this.findById(id);

        
        if (dto.username) {
            const existingUsername = await this.findByUsername(dto.username);

            if (existingUsername && existingUsername.id !== id) {
                throw new ConflictException('Username already in use');
            }
        }
       
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.username && { username: dto.username }),
                ...(dto.password && {
                    password: await bcrypt.hash(dto.password, 10), 
                }),
            },
        });
    }


    // Elimina un usuario por id
    async delete (id: string) {
            
            await this.findById(id);

            return this.prisma.user.delete({
                where: { id },
            });
        }

    }
