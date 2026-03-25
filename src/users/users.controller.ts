import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    Body,
    ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }


    // Este POST lo pongo sólo por tener el CRUD completo, pero con lo de auth realmente ya estaría cubierto.
    @Post()
    async create(@Body() dto: CreateUserDto) {
        const user = await this.usersService.create(dto);
        const { password, ...result } = user;
        return result;
    }

    @Get()
    async findAll() {
        const users = await this.usersService.findAll();
        return users.map(({ password, ...user }) => user);
    }

    @Get(':id')
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        const user = await this.usersService.findById(id);
        const { password, ...result } = user;
        return result;
    }

    @Patch(':id')
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateUserDto,
    ) {
        const updated = await this.usersService.update(id, dto);
        const { password, ...result } = updated;
        return result;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
        await this.usersService.delete(id);
    }
}
