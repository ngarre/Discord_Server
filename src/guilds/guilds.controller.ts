import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { GuildsService } from './guilds.service.js';
import { CreateGuildDto } from './dto/create-guild.dto.js';
import { UpdateGuildDto } from './dto/update-guild.dto.js';

@Controller('guilds')
export class GuildsController {
  constructor(private guildsService: GuildsService) {}

  @Post()
  create(@Body() dto: CreateGuildDto) {
    return this.guildsService.create(dto);
  }

  @Get()
  findAll() {
    return this.guildsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guildsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuildDto) {
    return this.guildsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guildsService.remove(id);
  }
}