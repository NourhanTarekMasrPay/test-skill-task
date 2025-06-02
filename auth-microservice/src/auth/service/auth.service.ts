import { Injectable, UnauthorizedException ,BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/user.schema'; // Ensure this path is correct
import { KafkaProducerService } from 'src/kafka/kafka-producer.service'; // Ensure this path is correct
import axios from 'axios';
import { KeycloakConfigService } from '../../keycloak/keycloak-config.service';
import { LoginDto } from '../commons/dto/login.dto';
import { RegisterDto } from '../commons/dto/register.dto';

@Injectable()
export class AuthService {

    private readonly keycloakAuthUrl: string;
  private readonly keycloakRealm: string;
  private readonly keycloakClientId: string;
  private readonly keycloakClientSecret: string;

  constructor(
    private keycloakConfigService: KeycloakConfigService ,   
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {
    this.keycloakAuthUrl = this.keycloakConfigService.getAuthServerUrl();
    this.keycloakRealm = this.keycloakConfigService.getRealm();
    this.keycloakClientId = this.keycloakConfigService.getClientId();
    this.keycloakClientSecret = this.keycloakConfigService.getClientSecret();
  }

  /**
   * Authenticates a user with Keycloak using the Password Grant Type.
   * @param loginDto - User's username and password.
   * @returns Keycloak token response (access_token, refresh_token, etc.).
   */
  async login(loginDto: LoginDto): Promise<any> {
    const tokenUrl = `${this.keycloakAuthUrl}/protocol/openid-connect/token`;

    try {
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.keycloakClientId,
          client_secret: this.keycloakClientSecret, // Required for confidential clients
          username: loginDto.username,
          password: loginDto.password,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data; // Contains access_token, refresh_token, expires_in, etc.
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          throw new UnauthorizedException('Invalid credentials');
        }
        throw new UnauthorizedException(error.response.data.error_description || 'Login failed');
      }
      throw new InternalServerErrorException('Failed to connect to authentication server');
    }
  }

  /**
   * Registers a new user in Keycloak using the Admin REST API.
   * Requires an admin token to perform this operation.
   * @param registerDto - User details for registration.
   * @returns Keycloak user ID or success indicator.
   */
  async signup(registerDto: RegisterDto): Promise<any> {
    // Step 1: Get an Admin Token for your client (using client credentials grant)
    // This token is used to authenticate your backend with Keycloak's Admin API.
    let adminAccessToken: string;
    try {
      const adminTokenResponse = await axios.post(
        `${this.keycloakAuthUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.keycloakClientId,
          client_secret: this.keycloakClientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      adminAccessToken = adminTokenResponse.data.access_token;
    } catch (error) {
      console.error('Failed to get admin token for registration:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to authenticate as admin for registration');
    }

    // Step 2: Use the Admin Token to create the user via Keycloak Admin API
    const usersAdminUrl = `<span class="math-inline">\{this\.keycloakAuthUrl\}/admin/realms/</span>{this.keycloakRealm}/users`;

    try {
      const response = await axios.post(
        usersAdminUrl,
        {
          username: registerDto.username,
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          enabled: true, // New users are enabled by default
          credentials: [
            {
              type: 'password',
              value: registerDto.password,
              temporary: false, // Set to true if you want the user to change password on first login
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Keycloak usually returns 201 Created on success, with Location header indicating the user's ID
      // You might parse the Location header or simply return success.
      console.log('User registered successfully in Keycloak:', response.headers.location);
      return { message: 'User registered successfully', userId: response.headers.location?.split('/').pop() };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) { // Conflict - User already exists
          throw new BadRequestException('User with this username or email already exists.');
        }
        throw new BadRequestException(error.response.data.errorMessage || 'User registration failed');
      }
      throw new InternalServerErrorException('Failed to register user in Keycloak');
    }
  }

  // You can add other functions here, e.g., to verify token, get user info, etc.
  async refreshToken(refreshToken: string): Promise<any> {
    const tokenUrl = `${this.keycloakAuthUrl}/protocol/openid-connect/token`;

    try {
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.keycloakClientId,
          client_secret: this.keycloakClientSecret, // Required for confidential clients
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new UnauthorizedException(error.response.data.error_description || 'Refresh token failed');
      }
      throw new InternalServerErrorException('Failed to refresh token');
    }
  }

  /**
   * Synchronizes user data from Keycloak into the local MongoDB database.
   *
   * This method performs the following actions:
   * 1. Extracts the unique Keycloak user ID (`sub`) from the provided payload.
   * 2. Checks if a local user profile already exists for this `keycloakId`.
   * 3. If no local profile exists:
   * a. Creates a new `User` document in MongoDB using data from the Keycloak payload.
   * b. Assigns default values for `roles` (empty array) and `isActive` (true).
   * c. Publishes a `user_created` event to Kafka with essential user details.
   * d. Handles potential MongoDB duplicate key errors during creation.
   * 4. If a local profile exists:
   * a. Updates the `firstName`, `lastName`, and `email` fields of the existing user
   * with the latest information from the Keycloak payload to keep profiles in sync.
   * 5. Returns the synchronized local `User` document.
   *
   * @param keycloakPayload - An object containing user information from a Keycloak JWT token.
   * Expected to have at least `sub`, `given_name`, `family_name`,
   * `preferred_username`, and `email` properties.
   * @returns A Promise that resolves to the synchronized `User` document from MongoDB,
   * or `null` if the operation fails (though an exception is typically thrown).
   * @throws {UnauthorizedException} If the `keycloakPayload` is missing the `sub` (subject ID)
   * or if a duplicate user with the same email/username is found
   * during creation (indicating a potential conflict or misconfiguration).
   * @throws {Error} For other unexpected database or Kafka-related errors.
   */
  public async findOrCreateUserFromKeycloak(keycloakPayload: any): Promise<User | null> {
    const keycloakId = keycloakPayload.sub;

    if (!keycloakId) {
      throw new UnauthorizedException('Keycloak payload missing subject ID.');
    }

    let user = await this.userModel.findOne({ keycloakId }).exec();

    if (!user) {
      try {
        user = new this.userModel({
          keycloakId: keycloakId,
          firstName: keycloakPayload.given_name || 'N/A',
          lastName: keycloakPayload.family_name || 'N/A',
          userName: keycloakPayload.preferred_username || keycloakPayload.email,
          email: keycloakPayload.email,
          roles: keycloakPayload.roles || [], 
          isActive: true, 
          createdAt: new Date(), 
        });
        await user.save();

        await this.kafkaProducerService.sendMessage('user_created', {
          userId: user.id.toString(), // Use _id from Mongoose document
          keycloakId: user.keycloakId,
          email: user.email,
          userName: user.userName,
        });

        console.log(`Successfully created local user profile for Keycloak ID: ${keycloakId}.`);
      } catch (error) {
        console.error(`Error creating local user for Keycloak ID ${keycloakId}:`, error);

        if (error.code === 11000) {
          throw new UnauthorizedException(
            'A local user with this email or username already exists. Please contact support.',
          );
        }
        throw error; 
      }

    } else {
      console.log(`Local profile found for Keycloak ID: ${keycloakId}. Updating existing user data.`);

      user.firstName = keycloakPayload.given_name || user.firstName;
      user.lastName = keycloakPayload.family_name || user.lastName;
      user.email = keycloakPayload.email || user.email; 
      user.userName = keycloakPayload.preferred_username || keycloakPayload.email || user.userName; 

      await user.save();
      console.log(`Successfully updated local user profile for Keycloak ID: ${keycloakId}.`);
    }

    return user;
  }

  /**
   * Retrieves a user's profile from the local MongoDB database using their Keycloak ID.
   *
   * @param keycloakId - The unique ID of the user as stored in Keycloak (and linked in your local database).
   * @returns A Promise that resolves to the `User` document if found, otherwise `null`.
   */
  public async getUserProfile(keycloakId: string): Promise<User | null> {
    return this.userModel.findOne({ keycloakId }).exec();
  }
}
