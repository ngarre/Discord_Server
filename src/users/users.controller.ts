import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    Body
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

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
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        const { password, ...result } = user;
        return result;
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ) {
        const updated = await this.usersService.update(id, dto);
        const { password, ...result } = updated;
        return result;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string): Promise<void> {
        await this.usersService.delete(id);
    }
}
