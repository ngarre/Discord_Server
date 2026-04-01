import { Injectable } from '@nestjs/common'; // Decorador de NestJS para marcar esta clase como un servicio inyectable en el sistema de dependencias de NestJS
import { ConfigService } from '@nestjs/config'; // Servicio de NestJS para acceder a las variables de entorno
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'; // Funciones nativas de Node para: generar bytes aleatorios, cifrar y descifrar datos

@Injectable()
export class EncryptionService {
    // Buffer que almacenará la clave maestra para cifrar y descifrar las claves de los canales
    // Se guarda como Buffer porque las funciones criptográficas trabajan con bytes, no con strings directamente
    private masterKey: Buffer; 

    // El constructor recibe el ConfigService para acceder a las variables de entorno, específicamente para obtener la MASTER_KEY
    // Convierte la MASTER_KEY de su representación hexadecimal a un Buffer para su uso en las operaciones criptográficas
    constructor(private configService: ConfigService) {
        this.masterKey = Buffer.from(
            this.configService.getOrThrow<string>('MASTER_KEY'),
            'hex',
        );
    }

    // MÉTODO PARA GENERAR UNA NUEVA CLAVE DE CANAL: genera una clave de 256 bits (32 bytes) y la devuelve en formato hexadecimal
    generateKey(): string {
        return randomBytes(32).toString('hex');
    }

    
    // MÉTODO PARA CIFRAR UN MENSAJE: recibe texto plano del mensaje y la clave del canal en formato hexadecimal, devuelve mensaje cifrado
    encrypt(plaintext: string, keyHex: string): string {
        const key = this.unwrapKey(keyHex); // Descifro la clave del canal

        
        const iv = randomBytes(16); // Genera un vector de inicialización (IV) aleatorio de 16 bytes para el cifrado
        const cipher = createCipheriv('aes-256-cbc', key, iv); // Crea el cifrador AES-256-CBC con la clave del canal y el IV
        const encrypted = Buffer.concat([ // Cifra el texto plano
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        // Devuelve el IV y el mensaje cifrado concatenados en formato hexadecimal, separados por dos puntos
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`; 
    }

    // MÉTODO PARA DESCIFRAR UN MENSAJE: recibe el mensaje cifrado y la clave en formato hexadecimal, devuelve texto plano
    decrypt(payload: string, keyHex: string): string {
        const key = this.unwrapKey(keyHex); // Descifro la clave del canal
        
        const [ivHex, encryptedHex] = payload.split(':'); // Separa el IV y el mensaje cifrado del payload usando el separador ':'
        const iv = Buffer.from(ivHex, 'hex'); // Convierte el IV de su representación hexadecimal a un Buffer
        const encryptedText = Buffer.from(encryptedHex, 'hex'); // Convierte el mensaje cifrado de su representación hexadecimal a un Buffer
        const decipher = createDecipheriv('aes-256-cbc', key, iv); // Crea el descifrador AES-256-CBC con la clave del canal y el IV

        const decrypted = Buffer.concat([ // Descifra el mensaje cifrado
            decipher.update(encryptedText),
            decipher.final(),
        ]);

        // Devuelve el mensaje descifrado como una cadena de texto UTF-8
        return decrypted.toString('utf8');
    }


    // MÉTODO PARA CIFRAR LA CLAVE DEL CANAL USANDO LA MASTER_KEY
    wrapKey(rawKeyHex: string): string {
        const iv = randomBytes(16); // Genera un vector de inicialización (IV) aleatorio de 16 bytes para el cifrado de la clave del canal

        const cipher = createCipheriv('aes-256-cbc', this.masterKey, iv); // Crea el cifrador AES-256-CBC con la masterKey y el IV para cifrar la clave del canal

        const encrypted = Buffer.concat([ // Cifra la clave del canal (rawKeyHex) usando el cifrador creado
            cipher.update(rawKeyHex, 'utf8'),
            cipher.final(),
        ]);

        return `${iv.toString('hex')}:${encrypted.toString('hex')}`; // Devuelve el IV y la clave del canal cifrada concatenados en formato hexadecimal, separados por dos puntos
    }


    // MÉTODO PARA DESCIFRAR LA CLAVE DEL CANAL USANDO LA MASTER_KEY
    unwrapKey(wrappedKey: string): Buffer {
        const [ivHex, encryptedHex] = wrappedKey.split(':'); // Separa el IV y la clave del canal cifrada del wrappedKey usando el separador ':'

        const iv = Buffer.from(ivHex, 'hex'); // Convierte el IV de su representación hexadecimal a un Buffer para su uso en el descifrado
        const encryptedText = Buffer.from(encryptedHex, 'hex'); // Convierte la clave del canal cifrada de su representación hexadecimal a un Buffer para su uso en el descifrado

        const decipher = createDecipheriv('aes-256-cbc', this.masterKey, iv); // Crea el descifrador AES-256-CBC con la masterKey y el IV para descifrar la clave del canal

        const decrypted = Buffer.concat([ // Descifra la clave del canal cifrada usando el descifrador creado
            decipher.update(encryptedText),
            decipher.final(),
        ]);

        return Buffer.from(decrypted.toString('utf8'), 'hex'); // Devuelve la clave del canal descifrada como un Buffer, convirtiendo primero el resultado a una cadena UTF-8 y luego a un Buffer desde su representación hexadecimal
    }
}