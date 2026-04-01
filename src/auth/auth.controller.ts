import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Guard que protege rutas con JWT
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@ApiTags('Auth') // Hace que estos endpoints salgan agrupados en Swagger bajo la sección Auth
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user and return a JWT access token' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login and get a JWT access token' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get the authenticated user profile data (ID, email and username)' })
    me(@Req() req: any) {
        return req.user;
    }
}
