import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable() // Hace que Nest pueda crear e inyectar esta estrategia como un proveedor
export class JwtStrategy extends PassportStrategy(Strategy) { // Extiende la estrategia JWT de Passport que se encarga de validar tokens
  constructor( // Nest inyecta dos dependencias:
    configService: ConfigService, // Para acceder a las variables de entorno
    private usersService: UsersService, // Para consultar la base de datos de usuarios
  ) {
    super({ // Configuración de la estrategia JWT de Passport --> En este punto ya se comprueba que se pueda extraer un token JWT válido de la petición, y que el token no haya expirado. Si alguna de estas condiciones falla, se lanza una excepción automáticamente.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // El token JWT se extrae del header Authorization como Bearer token
      ignoreExpiration: false, // Si el token ha expirado, se considera inválido
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'), // El secreto para validar el token se obtiene de las variables de entorno, y si no está definido, se lanza un error
    });
  }

  // Si la comprobación del token JWT es exitosa, Passport llama a este método validate() con el payload decodificado del token. 
  // Aquí es donde se implementa la lógica para validar que el usuario existe en la base de datos y que el token es válido para ese usuario.
  async validate(payload: JwtPayload) { 
    const user = await this.usersService.findById(payload.sub); // Se busca el usuario en la base de datos usando el ID que viene en el payload del token (payload.sub)
    if (!user) throw new UnauthorizedException(); // Si no se encuentra el usuario, se lanza una excepción de Unauthorized
    return { id: user.id, email: user.email, username: user.username }; 
    // Si el usuario es válido, se retorna un objeto con la información del usuario que se adjuntará 
    // a la solicitud (req.user) para que esté disponible en los controladores protegidos por esta estrategia.
  }
}