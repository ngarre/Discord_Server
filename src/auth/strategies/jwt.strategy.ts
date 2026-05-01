import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt'; // ESTRATEGIA JWT de Passport para validar tokens JWT
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';


// Al extender PassportStrategy(Strategy), usando Strategy de passport-jwt,
// Nest registra esta clase como la estrategia JWT de Passport.
// Por eso AuthGuard('jwt') sabe que tiene que usar esta estrategia.


@Injectable() // Hace que Nest pueda crear e inyectar esta estrategia como un proveedor
export class JwtStrategy extends PassportStrategy(Strategy) { // Extiende la estrategia JWT de Passport que se encarga de validar tokens
  constructor( // Nest inyecta dos dependencias:
    configService: ConfigService, // Para acceder a las variables de entorno
    private usersService: UsersService, // Para consultar la base de datos de usuarios
  ) {
    super({ 
      // Configura cómo se validarán los JWT cuando llegue una petición protegida.
      // Todavía no se valida ningún token aquí; solo se define la configuración
      // que Passport usará después en las rutas protegidas con JwtAuthGuard.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // El token JWT se extrae del header Authorization como Bearer token
      ignoreExpiration: false, // Si el token ha expirado, se considera inválido
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'), // Clave secreta usada para comprobar la firma del token.
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