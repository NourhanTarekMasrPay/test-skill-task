import { AuthService } from '../service/auth.service';
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe ,Get, Req, UseGuards, Res, Request} from '@nestjs/common';
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
    return this.authService.getUserInfo(req.user.accessToken);
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