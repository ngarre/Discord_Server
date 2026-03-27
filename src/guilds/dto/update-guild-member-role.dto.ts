import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class UpdateGuildMemberRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsEnum(MemberRole)
  role: MemberRole;
}