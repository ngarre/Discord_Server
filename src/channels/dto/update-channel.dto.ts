import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChannelDto {
     @IsOptional()
     @IsString()
     @MinLength(1)
     name?: string;
}