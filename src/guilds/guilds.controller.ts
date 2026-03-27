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
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AddGuildMemberDto } from './dto/add-guild-member.dto';
import { MemberRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@ApiTags('Guilds')
@ApiBearerAuth()
@Controller('guilds')
export class GuildsController {
  constructor(private guildsService: GuildsService) { }

  @Post()
  create(@Body() dto: CreateGuildDto, @CurrentUser() user: { id: string }) {
    return this.guildsService.create(dto, user.id);
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

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  addMember(
    @Param('id', new ParseUUIDPipe()) guildId: string,
    @Body() dto: AddGuildMemberDto,
  ) {
    return this.guildsService.addMember(guildId, dto.userId, dto.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.remove(id);
  }
}