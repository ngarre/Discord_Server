import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@UseGuards(JwtAuthGuard)
@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @ApiOperation({ summary: 'Send an encrypted message to a channel (guild member only)' })
  create(@Body() dto: CreateMessageDto, @CurrentUser() user: { id: string }) {
    return this.messagesService.create(dto, user.id);
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get decrypted messages from a channel (guild member only)' })
  findByChannel(
    @Param('channelId', new ParseUUIDPipe()) channelId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.messagesService.findByChannel(channelId, user.id);
  }
}