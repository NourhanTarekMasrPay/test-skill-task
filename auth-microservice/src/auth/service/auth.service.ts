import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/user.schema'; // Ensure this path is correct
import { KafkaProducerService } from 'src/kafka/kafka-producer.service'; // Ensure this path is correct

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

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
      console.log(`No local profile found for Keycloak ID: ${keycloakId}. Creating a new one.`);
      try {
        user = new this.userModel({
          keycloakId: keycloakId,
          firstName: keycloakPayload.given_name || 'N/A',
          lastName: keycloakPayload.family_name || 'N/A',
          userName: keycloakPayload.preferred_username || keycloakPayload.email,
          email: keycloakPayload.email,
          roles: keycloakPayload.roles || [], // Default to empty array if not present
          isActive: true, // New users are active by default
          createdAt: new Date(), // Set creation timestamp
          // dateOfBirth and age are omitted here if not consistently provided by Keycloak or not critical for initial sync
        });
        await user.save();

        // Publish user creation event to Kafka
        await this.kafkaProducerService.sendMessage('user_created', {
          userId: user.id.toString(), // Use _id from Mongoose document
          keycloakId: user.keycloakId,
          email: user.email,
          userName: user.userName,
          // Include other relevant initial user data for downstream services
        });

        console.log(`Successfully created local user profile for Keycloak ID: ${keycloakId}.`);
      } catch (error) {
        console.error(`Error creating local user for Keycloak ID ${keycloakId}:`, error);
        // Handle MongoDB duplicate key error specifically
        if (error.code === 11000) {
          throw new UnauthorizedException(
            'A local user with this email or username already exists. Please contact support.',
          );
        }
        throw error; // Re-throw other unexpected errors
      }
    } else {
      console.log(`Local profile found for Keycloak ID: ${keycloakId}. Updating existing user data.`);
      // Update fields that might change in Keycloak
      user.firstName = keycloakPayload.given_name || user.firstName;
      user.lastName = keycloakPayload.family_name || user.lastName;
      user.email = keycloakPayload.email || user.email; // Update email if it changes in Keycloak
      user.userName = keycloakPayload.preferred_username || keycloakPayload.email || user.userName; // Update username
      // You might also update roles or other dynamic fields here if needed
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