import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { HttpModule } from '@nestjs/axios';
import { KeycloakAdminService ,KeycloakStrategy } from 'src/keycloak'
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'keycloak' }),
    HttpModule,
    KafkaModule
  ],
  providers: [KeycloakStrategy, AuthService, KeycloakAdminService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}