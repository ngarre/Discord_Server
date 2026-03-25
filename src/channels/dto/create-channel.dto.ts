import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';
import { ChannelType } from '@prisma/client';
export class CreateChannelDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsEnum(ChannelType)
    type: ChannelType;

    @IsUUID()
    guildId: string;
}
