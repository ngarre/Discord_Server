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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AddGuildMemberDto } from './dto/add-guild-member.dto';
import { MemberRole } from '@prisma/client';
import { UpdateGuildMemberRoleDto } from './dto/update-guild-member-role.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Guilds')
@ApiBearerAuth()
@Controller('guilds')
export class GuildsController {
  constructor(private guildsService: GuildsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new guild (user becomes OWNER)' })
  create(@Body() dto: CreateGuildDto, @CurrentUser() user: { id: string }) {
    return this.guildsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all guilds' })
  findAll() {
    return this.guildsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a guild by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Update a guild by id (OWNER only)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGuildDto,
  ) {
    return this.guildsService.update(id, dto);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Add a member to a guild (OWNER only)' })
  addMember(
    @Param('id', new ParseUUIDPipe()) guildId: string,
    @Body() dto: AddGuildMemberDto,
  ) {
    return this.guildsService.addMember(guildId, dto.userId, dto.role);
  }

  @Patch(':guildId/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Update a member role in a guild (OWNER only)' })
  updateMemberRole(
    @Param('guildId', new ParseUUIDPipe()) guildId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateGuildMemberRoleDto,
  ) {
    return this.guildsService.updateMemberRole(guildId, userId, dto.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a guild by id (OWNER only)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.remove(id);
  }
}