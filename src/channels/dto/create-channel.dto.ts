import { ChannelType } from '@prisma/client';
export class CreateChannelDto {
    name: string;
    type: ChannelType;
    guildId: string;
}
