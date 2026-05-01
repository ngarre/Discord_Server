import { IsEmail, IsString, MinLength } from 'class-validator'; // Necesita de ValidationPipe en main.ts, para que estas reglas se apliquen a las peticiones entrantes
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}