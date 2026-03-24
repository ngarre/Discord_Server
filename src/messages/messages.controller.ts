import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }

  @Get('channel/:channelId')
  findByChannel(@Param('channelId') channelId: string) {
    return this.messagesService.findByChannel(channelId);
  }
}