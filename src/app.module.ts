import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module';
import { GuildsModule } from './guilds/guilds.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, GuildsModule, ChannelsModule]
})
export class AppModule {}
