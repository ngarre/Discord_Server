import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // Servicio que se necesita en la función signToken() para generar el token JWT
import * as bcrypt from 'bcrypt'; // Biblioteca para hashear y comparar contraseñas
import { UsersService } from '../users/users.service'; 
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface'; // Sirve para tipar la forma del payload que se incluye en el token JWT 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Servicio para interactuar con la base de datos de usuarios
    private jwtService: JwtService, // Servicio para generar tokens JWT, se inyecta automáticamente gracias a la configuración del AuthModule
  ) { }

  // MÉTODO DE REGISTRO DE USUARIOS
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email); // Se verifica si ya existe un usuario con el mismo email
    if (existing) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(dto.username); // Se verifica si ya existe un usuario con el mismo username
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10); // Se hashea la contraseña del usuario con un salt de 10 rondas para mayor seguridad
    const user = await this.usersService.create({ // Se crea el usuario en la base de datos con el email, username y la contraseña hasheada
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
    });

    const token = this.signToken(user); // Genero token para usuario recién registrado
    return { access_token: token }; // Retorno el token JWT al cliente para que pueda autenticarse inmediatamente después de registrarse, sin necesidad de hacer login por separado
  }

  // MÉTODO DE LOGIN DE USUARIOS
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email); // Se busca usuario con ese email
    if (!user) throw new UnauthorizedException('Invalid credentials'); // Si no se encuentra el usuario, se lanza una excepción de Unauthorized (401)

    // Se compara la contraseña proporcionada en el login con la contraseña hasheada almacenada en la base de datos usando bcrypt.compare():
    const isValid = await bcrypt.compare(dto.password, user.password); 
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user); // Si credenciales son válidas, se genera un token JWT para el usuario
    return { access_token: token };
  }


  // MÉTODO PRIVADO PARA GENERAR EL TOKEN
  private signToken(user: { id: string; email: string; username: string }) {
    const payload: JwtPayload = { // Se construye el payload que se incluirá en el token JWT, siguiendo la estructura definida en la interfaz JwtPayload
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // El método sign() del JwtService de NestJS se encarga de generar el token JWT 
    // a partir del payload proporcionado, utilizando la configuración definida en el AuthModule 
    // (secreto y opciones de expiración). 
    // El token generado se retorna al cliente para que pueda usarlo en futuras solicitudes autenticadas.
    return this.jwtService.sign(payload); 
  }
}
