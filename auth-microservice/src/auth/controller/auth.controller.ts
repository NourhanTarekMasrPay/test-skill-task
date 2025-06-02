import { Public, Roles } from 'nest-keycloak-connect';
import { Request, Response } from 'express';
import { User } from 'src/user/user.schema';
import { AuthService } from '../service/auth.service';
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe ,Get, Req, UseGuards, Res} from '@nestjs/common';
import { LoginDto } from '../commons/dto/login.dto';
import { RegisterDto } from '../commons/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @Roles({ roles: ['user'] })
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const keycloakUser = (req as any).user; 

    if (!keycloakUser || !keycloakUser.sub) {
      return res.status(401).json({ message: 'No Keycloak user information found.' });
    }

    let localUser: User | null = await this.authService.findOrCreateUserFromKeycloak(keycloakUser);

    if (!localUser) {
        return res.status(500).json({ message: 'Could not synchronize user profile.' });
    }

    return res.json({
        message: 'Protected profile data',
        keycloakUser: keycloakUser, 
        localUserProfile: localUser.toObject() 
    });
  }

  @Public() // Mark as public so it bypasses the global KeycloakGuard
  @Post('login')
  @HttpCode(HttpStatus.OK) // Return 200 OK for successful login
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public() // Mark as public so it bypasses the global KeycloakGuard
  @Post('signup')
  @HttpCode(HttpStatus.CREATED) // Return 201 Created for successful registration
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.signup(registerDto);
  }

}