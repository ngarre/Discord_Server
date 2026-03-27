import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class AddGuildMemberDto {
  @ApiProperty({ example: 'uuid-user'})
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'MEMBER'})
  @IsEnum(MemberRole)
  role: MemberRole;
}