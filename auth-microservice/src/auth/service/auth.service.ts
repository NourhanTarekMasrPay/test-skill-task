import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User   } from '../../user/user.schema'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  // This method is crucial: It handles synchronization between Keycloak and your local DB.
  public async findOrCreateUserFromKeycloak(keycloakPayload: any): Promise<User | null> {
    const keycloakId = keycloakPayload.sub; // 'sub' is the unique ID of the user in Keycloak

    if (!keycloakId) {
        throw new UnauthorizedException('Keycloak payload missing subject ID.');
    }

    let user = await this.userModel.findOne({ keycloakId });

    if (!user) {
      // If user doesn't exist locally, create a new entry
      console.log(`Creating new local user for Keycloak ID: ${keycloakId}`);
      try {
        user = new this.userModel({
          keycloakId: keycloakId,
          firstName: keycloakPayload.given_name || 'N/A', // Get from Keycloak token
          lastName: keycloakPayload.family_name || 'N/A', // Get from Keycloak token
          userName: keycloakPayload.preferred_username || keycloakPayload.email, // Best available unique identifier
          email: keycloakPayload.email,
        });
        await user.save();
      } catch (error) {
        console.error('Error creating local user from Keycloak payload:', error);
        // Handle duplicate username/email if Keycloak allows it and your DB enforces uniqueness
        if (error.code === 11000) { 
          throw new UnauthorizedException('A local user with this email or username already exists. Please contact support.');
        }
        throw error;
      }
    } else {
        console.log(`Found existing local user for Keycloak ID: ${keycloakId}`);

        user.firstName = keycloakPayload.given_name;
        user.lastName = keycloakPayload.family_name;
        user.email = keycloakPayload.email;
        await user.save();
    }

    return user;
  }

  public async getUserProfile(keycloakId: string): Promise<User | null> {
    return this.userModel.findOne({ keycloakId }).exec();
  }

  // No more signUp, login, comparePassword methods here
}