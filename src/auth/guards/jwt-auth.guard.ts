// Importa el decorador Injectable para que Nest pueda gestionar esta clase
import { Injectable } from '@nestjs/common';
// Importa la clase base AuthGuard integrada con Passport
import { AuthGuard } from '@nestjs/passport';

@Injectable() // Hace que Nest pueda crear e inyectar esta clase como un proveedor
export class JwtAuthGuard extends AuthGuard('jwt') {} // Extiende la clase AuthGuard de Passport, especificando 'jwt' como la estrategia que se va a usar para proteger las rutas.