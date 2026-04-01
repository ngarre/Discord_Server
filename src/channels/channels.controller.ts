import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@UseGuards(JwtAuthGuard)
@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { } // readonly es opcional, pero es una buena práctica para indicar que no se reasignará la propiedad

  @Post()
  @ApiOperation({ summary: 'Create a new channel in a guild (OWNER only)' })
  create(
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.channelsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all channels' })
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a channel by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) { // Valida que el id sea un UUID válido antes de llamar al servicio
    return this.channelsService.findOne(id);
  }

  // Solo el OWNER de la guild a la que pertenece el canal puede actualizarlo
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Update a channel by id (OWNER only)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, dto);
  }

  // Solo el OWNER de la guild a la que pertenece el canal puede eliminarlo
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a channel by id (OWNER only)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.channelsService.remove(id);
  }
}
