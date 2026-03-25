import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { GuildsService } from './guilds.service.js';
import { CreateGuildDto } from './dto/create-guild.dto.js';
import { UpdateGuildDto } from './dto/update-guild.dto.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Guilds')
@ApiBearerAuth()
@Controller('guilds')
export class GuildsController {
  constructor(private guildsService: GuildsService) { }

  @Post()
  create(@Body() dto: CreateGuildDto) {
    return this.guildsService.create(dto);
  }

  @Get()
  findAll() {
    return this.guildsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGuildDto) {
    return this.guildsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.remove(id);
  }
}