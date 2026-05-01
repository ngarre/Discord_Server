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

@UseGuards(JwtAuthGuard) // Protege todo el controller con JWT
@ApiTags('Guilds') // Etiqueta para Swagger
@ApiBearerAuth() // Indica que se usa autenticación Bearer para Swagger
@Controller('guilds') // Ruta base para este controller
export class GuildsController {
  constructor(private guildsService: GuildsService) { }

  // - CREAR UNA GUILD -
  @Post()
  @ApiOperation({ summary: 'Create a new guild (user becomes OWNER)' })
  create(@Body() dto: CreateGuildDto, @CurrentUser() user: { id: string }) { 
    return this.guildsService.create(dto, user.id); // El usuario autenticado se convierte en el OWNER de la guild creada
  }

  // - OBTENER TODAS LAS GUILDS -
  @Get()
  @ApiOperation({ summary: 'Get all guilds' })
  findAll() {
    return this.guildsService.findAll();
  }

  // - OBTENER UNA GUILD POR ID -
  @Get(':id')
  @ApiOperation({ summary: 'Get a guild by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) { // Valida que el id sea un UUID válido antes de llamar al servicio
    return this.guildsService.findOne(id);
  }

  // - ACTUALIZAR UNA GUILD (SOLO OWNER) -
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

  // - AÑADIR UN MIEMBRO A UNA GUILD (SOLO OWNER) -
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

  // ACTUALIZAR EL ROL DE UN MIEMBRO EN UNA GUILD (SOLO OWNER)
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

  // - ELIMINAR UNA GUILD (SOLO OWNER) -
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a guild by id (OWNER only)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.guildsService.remove(id);
  }
}