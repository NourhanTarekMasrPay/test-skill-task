import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { keycloakConfig, keycloakUrls } from './keycloak.config';
import { RegisterDto } from 'src/auth/commons/dto/register.dto';

@Injectable()
export class KeycloakAdminService {
  private adminToken: string;
  private tokenExpiration: number;

  constructor(private readonly httpService: HttpService) {}

  private async getAdminToken() {
    if (this.adminToken && Date.now() < this.tokenExpiration) {
      return this.adminToken;
    }

    const { realm, authServerUrl, adminUsername, adminPassword, clientId } = keycloakConfig;
    const url = `${authServerUrl}/realms/master/protocol/openid-connect/token`;

    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('client_id', 'admin-cli');
    data.append('username', adminUsername);
    data.append('password', adminPassword);

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.adminToken = response.data.access_token;
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;
      return this.adminToken;
    } catch (error) {
      throw new Error('Failed to get admin token: ' + error.message);
    }
  }

  async createUser(registerDto : RegisterDto) {
    const token = await this.getAdminToken();
    const { adminUrl } = keycloakUrls(keycloakConfig.realm);

    const payload = {
      username: registerDto.username,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: registerDto.password,
          temporary: false,
        },
      ],
    };

    try {
      await firstValueFrom(
        this.httpService.post(adminUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      throw new Error('Failed to create user: ' + error.response?.data?.errorMessage || error.message);
    }
  }
}