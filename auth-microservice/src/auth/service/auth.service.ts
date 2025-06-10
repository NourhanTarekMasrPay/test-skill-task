import { LoginDto } from '../commons/dto/login.dto';
import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { keycloakConfig, keycloakUrls } from '../../keycloak/keycloak.config'; 

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}
  //==============================================================================================================================

  async login(loginDto: LoginDto) {
    const { realm, clientId, clientSecret } = keycloakConfig;
    const { tokenUrl } = keycloakUrls(realm);

    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('username', loginDto.username);
    data.append('password', loginDto.password);
    
console.log("for testint log \n" , {"rea":realm, "clien":clientId, "sec":clientSecret ,"token":tokenUrl} )
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
      // Log the full error response for debugging purposes
      console.error('Keycloak login error:', error.response?.data);

      if (error.response) {
        const keycloakError = error.response.data;
        switch (keycloakError.error) {
          case 'invalid_grant':
            // This usually means bad username/password or user disabled
            if (keycloakError.error_description?.includes('Invalid user credentials') ||
                keycloakError.error_description?.includes('User is disabled')) {
              throw new UnauthorizedException('Invalid username or password.');
            }
            // Add more specific checks if Keycloak provides them for other invalid_grant reasons
            throw new UnauthorizedException('Authentication failed. Please check your credentials.');

          case 'unauthorized_client':
            // This means your client_id or client_secret is wrong, or the client isn't allowed to use password grant
            throw new UnauthorizedException('Client authentication failed. Check client ID and secret.');

          case 'invalid_request':
            // General bad request, could be missing parameters
            throw new BadRequestException('Invalid login request. Please check your input.');

          default:
            // Catch any other errors from Keycloak not explicitly handled
            throw new InternalServerErrorException(`Keycloak error: ${keycloakError.error_description || keycloakError.error}`);
        }
      } else if (error.request) {
        // The request was made but no response was received (e.g., Keycloak is down or unreachable)
        console.error('No response received from Keycloak during login. Check Keycloak server status and URL.');
        throw new InternalServerErrorException('Authentication service unavailable. Please try again later.');
      } else {
        // Something else happened in setting up the request that triggered an Error
        console.error('Error setting up login request:', error.message);
        throw new InternalServerErrorException('An unexpected error occurred during login.');
      }
    }
  }
  //==============================================================================================================================

  async getUserInfo(accessToken: string) {
    const { realm } = keycloakConfig;
    const { userInfoUrl } = keycloakUrls(realm);

    console.log('[getUserInfo] Attempting to fetch user info from:', userInfoUrl);
    console.log('[getUserInfo] Using token (first 20 chars):', accessToken.substring(0, 20) + '...');

    try {
      const response = await firstValueFrom(
        this.httpService.get(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      console.log('[getUserInfo] Successfully fetched user info.');
      return response.data;
    } catch (error) {
      console.error('Keycloak getUserInfo error details:');
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data:`, error.response.data);
        console.error(`  Headers:`, error.response.headers);
      } else if (error.request) {
        console.error(`  No response received. Request details:`, error.request);
      } else {
        console.error(`  Error message:`, error.message);
      }

      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired access token.');
      }
      throw new InternalServerErrorException('Failed to get user info: ' + (error.response?.data?.error_description || error.message || 'Unknown error'));
    }
  }
  //==============================================================================================================================

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
      console.error('Keycloak refresh token error:', error.response?.data);
      if (error.response) {
        const keycloakError = error.response.data;
        if (keycloakError.error === 'invalid_grant' && keycloakError.error_description?.includes('Invalid refresh token')) {
          throw new UnauthorizedException('Invalid or expired refresh token. Please log in again.');
        }
        throw new UnauthorizedException('Token refresh failed: ' + (keycloakError.error_description || keycloakError.error));
      } else if (error.request) {
        throw new InternalServerErrorException('Authentication service unavailable during token refresh. Please try again later.');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred during token refresh.');
      }
    }
  }
  //==============================================================================================================================

}