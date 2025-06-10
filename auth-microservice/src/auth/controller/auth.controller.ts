import { AuthService } from '../service/auth.service';
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe ,Get, Req, UseGuards, Res, Request, UnauthorizedException} from '@nestjs/common';
import { LoginDto } from '../commons/dto/login.dto';
import { RegisterDto } from '../commons/dto/register.dto';
import { KeycloakAdminService } from 'src/keycloak/keycloak-admin.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}
  //==============================================================================================================================

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  //==============================================================================================================================

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.keycloakAdminService.createUser(registerDto);
  }
  //==============================================================================================================================

  @Get('profile')
  @UseGuards(AuthGuard('keycloak'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Request() req) {
  console.log('[getProfile] Request received.');
  if (!req.user) {
    console.error('[getProfile] req.user is undefined after AuthGuard. Check KeycloakStrategy.');
    throw new UnauthorizedException('Authentication failed: user not found.');
  }
  console.log('[getProfile] req.user:', JSON.stringify(req.user, null, 2));
  if (!req.user.accessToken) {
    console.error('[getProfile] req.user.accessToken is missing. Check KeycloakStrategy validate method.');
    throw new UnauthorizedException('Access token not available in user object.');
  }
  console.log('[getProfile] Access Token (first 20 chars):', req.user.accessToken.substring(0, 20) + '...');

  try {
    const userInfo = await this.authService.getUserInfo(req.user.accessToken);
    console.log('[getProfile] User Info fetched successfully:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('[getProfile] Error fetching user info:', error.message);
    throw error;
  }
  }

  //==============================================================================================================================

    @Get('all-users')
  @UseGuards(AuthGuard('keycloak'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users profile' })
  async getAllUsers() {
    return this.keycloakAdminService.getAllUsers();
  }
}