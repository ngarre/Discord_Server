import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChannelDto {
     @ApiPropertyOptional({ example: 'renamed-channel' })
     @IsOptional()
     @IsString()
     @MinLength(1)
     name?: string;
}