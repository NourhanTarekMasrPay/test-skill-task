import { LoginDto } from '../commons/dto/login.dto';
import { RegisterDto } from '../commons/dto/register.dto';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { keycloakConfig, keycloakUrls } from '../../keycloak/keycloak.config';

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}

  async login(loginDto : LoginDto) {
    const { realm, clientId, clientSecret } = keycloakConfig;
    const { tokenUrl } = keycloakUrls(realm);

    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('username', loginDto.username);
    data.append('password', loginDto.password);

    try {
      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        refresh_expires_in: response.data.refresh_expires_in,
      };
    } catch (error) {
      throw new Error('Login failed: ' + error.response?.data?.error_description || error.message);
    }
  }

  async getUserInfo(accessToken: string) {
    const { realm } = keycloakConfig;
    const { userInfoUrl } = keycloakUrls(realm);

    try {
      const response = await firstValueFrom(
        this.httpService.get(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user info: ' + error.message);
    }
  }

  async refreshToken(refreshToken: string) {
    const { realm, clientId, clientSecret } = keycloakConfig;
    const { tokenUrl } = keycloakUrls(realm);

    const data = new URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('refresh_token', refreshToken);

    try {
      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        refresh_expires_in: response.data.refresh_expires_in,
      };
    } catch (error) {
      throw new Error('Token refresh failed: ' + error.response?.data?.error_description || error.message);
    }
  }
}