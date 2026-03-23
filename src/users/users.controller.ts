import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async findAll() {
        return this.usersService.findAll();
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
    async delete(@Param('id') id: string) {
        await this.usersService.delete(id);
        return { message: 'User deleted' };
    }
}
