import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

describe('MessagesService', () => {
    let service: MessagesService;

    const mockPrisma = {
        channel: {
            findUnique: jest.fn(),
        },
        message: {
            create: jest.fn(),
        },
    };

    const mockEncryptionService = {
        encrypt: jest.fn().mockReturnValue('encrypted-text'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagesService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: EncryptionService,
                    useValue: mockEncryptionService,
                },
            ],
        }).compile();

        service = module.get<MessagesService>(MessagesService);
        jest.clearAllMocks();
    });

    it('should encrypt message content before saving', async () => {
        mockPrisma.channel.findUnique.mockResolvedValue({
            id: 'channel-1',
            encryptionKey: 'wrapped-key',
        });

        mockPrisma.message.create.mockResolvedValue({
            id: 'msg-1',
            content: 'encrypted-text',
        });

        await service.create(
            { content: 'hello', channelId: 'channel-1' },
            'user-1',
        );

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
            'hello',
            'wrapped-key',
        );

        expect(mockPrisma.message.create).toHaveBeenCalledWith({
            data: {
                content: 'encrypted-text',
                channelId: 'channel-1',
                authorId: 'user-1',
            },
        });
    });
});