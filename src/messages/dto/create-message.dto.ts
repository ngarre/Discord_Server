import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    content: string;

    @IsUUID()
    channelId: string;
    
    @IsUUID()
    authorId: string;
}
