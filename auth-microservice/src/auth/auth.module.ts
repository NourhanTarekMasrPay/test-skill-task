import { Module } from '@nestjs/common';
import { KeycloakConfigService } from './service/keycloak-config.service'; // Configuration for Keycloak
import { AuthController } from './controller/auth.controller'; // Controller for authentication endpoints
import { AuthService } from './service/auth.service'; // Keep for user profile management, not auth logic
import { UserModule } from '../user/user.module'; // To interact with user data
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RoleGuard , KeycloakConnectModule } from 'nest-keycloak-connect';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [], // No imports needed for KeycloakConfigService since it's @Injectable()
    }),
    UserModule, // To allow AuthModule to interact with User data
  ],
  providers: [
    KeycloakConfigService,
    AuthService, // Your modified AuthService
    // This adds a global authentication guard, which means all routes are protected by default.
    // You can then use @Public() decorator to make specific routes public.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // This adds a global role guard, which enforces roles specified in @Roles() decorator.
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService] // If other modules need to use Auth Service (e.g. to create/update user profile)
})
export class AuthModule {}