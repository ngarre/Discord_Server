import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        const data: Record<string, string> = {};

        
        if (dto.username) data.username = dto.username;
        if (dto.password) data.password = dto.password;

        return this.prisma.user.update({ where: { id }, data });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async create(dto: CreateUserDto) {
    const existingEmail = await this.findByEmail(dto.email);
    if (existingEmail) {
        throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.findByUsername(dto.username);
    if (existingUsername) {
        throw new ConflictException('Username already in use');
    }

    return this.prisma.user.create({
        data: dto,
    });
}

    async findAll() {
        return this.prisma.user.findMany();
    }

    async delete(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }

}

