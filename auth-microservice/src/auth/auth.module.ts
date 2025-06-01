import { Module } from '@nestjs/common';
import { KeycloakConfigService } from './service/keycloak-config.service'; // Configuration for Keycloak
import { AuthController } from './controller/auth.controller'; // Controller for authentication endpoints
import { AuthService } from './service/auth.service'; // Keep for user profile management, not auth logic
import { UserModule } from '../user/user.module'; // To interact with user data
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RoleGuard , KeycloakConnectModule } from 'nest-keycloak-connect';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
    }),
    UserModule,
    KafkaModule, 
  ],
  providers: [
    KeycloakConfigService,
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
