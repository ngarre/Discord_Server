import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty({ example: 'Hello, world!' })
    @IsString()
    content: string;

    @ApiProperty({ example: 'uuid-of-channel' })
    @IsUUID()
    channelId: string;
}
