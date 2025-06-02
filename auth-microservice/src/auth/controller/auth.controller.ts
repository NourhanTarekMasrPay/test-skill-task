import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // From NestJS, not Keycloak
import { Public, Roles } from 'nest-keycloak-connect';
import { Request, Response } from 'express';
import { User } from 'src/user/user.schema';
import { AuthService } from '../service/auth.service';

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

}