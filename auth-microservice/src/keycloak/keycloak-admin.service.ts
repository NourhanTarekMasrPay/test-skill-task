import { Injectable,ConflictException,BadRequestException,InternalServerErrorException,  HttpException,HttpStatus, NotFoundException} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { keycloakConfig, keycloakUrls } from './keycloak.config';
import { RegisterDto } from 'src/auth/commons/dto/register.dto';

@Injectable()
export class KeycloakAdminService {
  private adminToken: string;
  private tokenExpiration: number;

  constructor(private readonly httpService: HttpService) {}
  //==============================================================================================================================

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

    console.log(`\n[KeycloakAdminService] Attempting to get admin token.`);
    console.log(`[KeycloakAdminService] Token URL: ${url}`);
    console.log(`[KeycloakAdminService] Admin Username: ${adminUsername}`);
    console.log(`[KeycloakAdminService] Request Data: ${data.toString()}`);

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
      console.error(`\n[KeycloakAdminService] Failed to get admin token. Error details:`);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data:`, error.response.data);
        console.error(`  Headers:`, error.response.headers);
        throw new InternalServerErrorException('Failed to get admin token from Keycloak: ' + (error.response.data?.error_description || error.response.data?.error || error.message));
      } else if (error.request) {
        console.error(`  No response received. Request details:`, error.request);
        throw new InternalServerErrorException('Failed to get admin token: No response from Keycloak. Check URL or Keycloak status.');
      } else {
        console.error(`  Error message:`, error.message);
        throw new InternalServerErrorException('An unexpected error occurred while obtaining admin token: ' + error.message);
      }
    }
  }
  //==============================================================================================================================

  public async createUser(registerDto: RegisterDto) {
    const token = await this.getAdminToken(); // This will throw an InternalServerErrorException if token fails
    const { adminUrl } = keycloakUrls(keycloakConfig.realm);

    const payload = {
      username: registerDto.userName, // Keycloak expects 'username', not 'userName'
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

    console.log('\n[KeycloakAdminService] Test Payload to token user: \n', token);
    console.log('\n[KeycloakAdminService] Test Payload to admin user URL:\n', adminUrl);
    console.log('\n[KeycloakAdminService] Test Payload to create user:\n', JSON.stringify(payload, null, 2));

    try {
      await firstValueFrom(
        this.httpService.post(adminUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return { success: true, message: 'User created successfully', userData: payload  , token :token};
    } catch (error) {
      console.error(`\n[KeycloakAdminService] Failed to create user. Error details:`);

      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data:`, error.response.data);
        console.error(`  Headers:`, error.response.headers);

        const keycloakErrorMsg = error.response.data?.errorMessage || error.response.data?.error || 'Unknown Keycloak error';

        switch (error.response.status) {
          case HttpStatus.CONFLICT: // 409 Conflict
            // This is typically for "User with username/email already exists"
            if (keycloakErrorMsg.includes('already exists')) {
              throw new ConflictException(`User creation failed: ${keycloakErrorMsg}`);
            }
            throw new HttpException(`Failed to create user: ${keycloakErrorMsg}`, HttpStatus.CONFLICT);

          case HttpStatus.BAD_REQUEST: // 400 Bad Request
            // This can be for invalid email format, missing required fields, etc.
            throw new BadRequestException(`Invalid user data: ${keycloakErrorMsg}`);

          case HttpStatus.FORBIDDEN: // 403 Forbidden
            // The admin token might not have sufficient permissions
            throw new HttpException(`Forbidden: Not enough permissions to create user. ${keycloakErrorMsg}`, HttpStatus.FORBIDDEN);

          default:
            // Catch any other unexpected HTTP errors from Keycloak
            throw new InternalServerErrorException(`Keycloak user creation failed with status ${error.response.status}: ${keycloakErrorMsg}`);
        }
      } else if (error.request) {
        // Request made, but no response (network error, Keycloak admin API unresponsive)
        console.error(`  No response received. Request details:`, error.request);
        throw new InternalServerErrorException('Failed to create user: No response from Keycloak Admin API.');
      } else {
        // Any other type of error (e.g., something in your code before the request)
        console.error(`  Error message:`, error.message);
        throw new InternalServerErrorException('An unexpected error occurred during user creation: ' + error.message);
      }
    }
  }
  //==============================================================================================================================

  public async getAllUsers() {
    const token = await this.getAdminToken();
    const { adminUrl } = keycloakUrls(keycloakConfig.realm); 

    const usersListUrl = adminUrl;

    console.log(`\n[KeycloakAdminService] Attempting to get all users from: ${usersListUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(usersListUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data;

    } catch (error) {
      console.error(`\n[KeycloakAdminService] Failed to get all users. Error details:`);

      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Data:`, error.response.data);
        console.error(`  Headers:`, error.response.headers);

        const keycloakErrorMsg = error.response.data?.errorMessage || error.response.data?.error || 'Unknown Keycloak error';

        switch (error.response.status) {
          case HttpStatus.NOT_FOUND:
            throw new NotFoundException('No users found or the user endpoint is incorrect.');
          case HttpStatus.FORBIDDEN:
            throw new HttpException(`Forbidden: Not enough permissions to list users. ${keycloakErrorMsg}`, HttpStatus.FORBIDDEN);
          default:
            throw new InternalServerErrorException(`Keycloak user listing failed with status ${error.response.status}: ${keycloakErrorMsg}`);
        }
      } else if (error.request) {
        console.error(`  No response received. Request details:`, error.request);
        throw new InternalServerErrorException('Failed to get users: No response from Keycloak Admin API.');
      } else {
        console.error(`  Error message:`, error.message);
        throw new InternalServerErrorException('An unexpected error occurred while listing users: ' + error.message);
      }
    }
  }
  //==============================================================================================================================

}