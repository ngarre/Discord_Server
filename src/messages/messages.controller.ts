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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@UseGuards(JwtAuthGuard)
@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  create(@Body() dto: CreateMessageDto, @CurrentUser() user: { id: string }) {
    return this.messagesService.create(dto, user.id);
  }


  @Get('channel/:channelId')
  findByChannel(@Param('channelId', new ParseUUIDPipe()) channelId: string) {
    return this.messagesService.findByChannel(channelId);
  }
}