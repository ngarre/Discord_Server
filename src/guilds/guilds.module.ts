import { Module } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller.js';

@Module({
  providers: [GuildsService],
  controllers: [GuildsController]
})
export class GuildsModule {}
