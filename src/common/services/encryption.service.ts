import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
    private masterKey: Buffer;

    constructor(private configService: ConfigService) {
        this.masterKey = Buffer.from(
            this.configService.getOrThrow<string>('MASTER_KEY'),
            'hex',
        );
    }

    // Genera una clave aleatoria para un canal
    generateKey(): string {
        return randomBytes(32).toString('hex');
    }

    // Cifra un mensaje con la clave del canal
    encrypt(plaintext: string, keyHex: string): string {
        const key = this.unwrapKey(keyHex);
        const iv = randomBytes(16);

        const cipher = createCipheriv('aes-256-cbc', key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    // Descifra un mensaje con la clave del canal
    decrypt(payload: string, keyHex: string): string {
        const key = this.unwrapKey(keyHex);
        const [ivHex, encryptedHex] = payload.split(':');

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');

        const decipher = createDecipheriv('aes-256-cbc', key, iv);

        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }

    // Cifra la clave del canal con la MASTER_KEY
    wrapKey(rawKeyHex: string): string {
        const iv = randomBytes(16);

        const cipher = createCipheriv('aes-256-cbc', this.masterKey, iv);

        const encrypted = Buffer.concat([
            cipher.update(rawKeyHex, 'utf8'),
            cipher.final(),
        ]);

        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    // Descifra la clave del canal usando la MASTER_KEY
    unwrapKey(wrappedKey: string): Buffer {
        const [ivHex, encryptedHex] = wrappedKey.split(':');

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');

        const decipher = createDecipheriv('aes-256-cbc', this.masterKey, iv);

        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final(),
        ]);

        return Buffer.from(decrypted.toString('utf8'), 'hex');
    }
}