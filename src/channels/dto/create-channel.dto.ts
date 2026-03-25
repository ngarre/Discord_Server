import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';
import { ChannelType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelDto {
    @ApiProperty({ example: 'general' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ enum: ChannelType, example: ChannelType.TEXT })
    @IsEnum(ChannelType)
    type: ChannelType;

    @ApiProperty({ example: 'uuid-of-guild' })
    @IsUUID()
    guildId: string;
}
