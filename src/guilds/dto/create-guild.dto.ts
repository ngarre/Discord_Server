import { IsString, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreateGuildDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsUUID()
  ownerId: string;
}