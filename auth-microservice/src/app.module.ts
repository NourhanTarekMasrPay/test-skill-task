import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Keep this
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/service/auth.service';
import { KeycloakConnectModule, PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule], 
      useFactory: (configService: ConfigService) => {
        const authServerUrl = configService.get<string>('KEYCLOAK_SERVER_URL');
        const realm = configService.get<string>('KEYCLOAK_REALM');
        const clientId = configService.get<string>('KEYCLOAK_CLIENT_ID');
        const secret = configService.get<string>('KEYCLOAK_CLIENT_SECRET');
        if (!authServerUrl || !realm || !clientId || !secret) {
          throw new Error('Missing Keycloak configuration environment variables');
        }
        return {
          authServerUrl,
          realm,
          clientId,
          secret,
          policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
          tokenValidation: TokenValidation.ONLINE,
        };
      },
      inject: [ConfigService], 
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), 
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    KafkaModule
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
