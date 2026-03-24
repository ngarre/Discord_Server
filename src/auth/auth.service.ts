import {
    Injectable,
    ConflictException
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) throw new ConflictException('Email already in use');

         const existingUsername = await this.usersService.findByUsername(dto.username);
        if (existingUsername) {
            throw new ConflictException('Username already in use');
        }

        const user = await this.usersService.create({
            email: dto.email,
            username: dto.username,
            password: dto.password,
        });

        return {
        id: user.id,
        email: user.email,
        username: user.username,
    };
    }

}
