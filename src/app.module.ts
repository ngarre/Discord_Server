import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module';
import { GuildsController } from './guilds/guilds.controller';
import { GuildsModule } from './guilds/guilds.module';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, GuildsModule]
})
export class AppModule {}
