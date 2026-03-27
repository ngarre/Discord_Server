import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, EncryptionService],
})
export class ChannelsModule {}
