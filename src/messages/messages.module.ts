import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, EncryptionService],
})
export class MessagesModule {}
