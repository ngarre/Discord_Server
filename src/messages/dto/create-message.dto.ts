import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    content: string;

    @IsUUID()
    channelId: string;
    
    @IsUUID()
    authorId: string;
}
