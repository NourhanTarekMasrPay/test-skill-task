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
import { KeycloakConfigModule } from './keycloak/keycloak-config.module';
import { KeycloakConfigService } from './keycloak/keycloak-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService, // Change to useExisting
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
    KeycloakConfigModule,
    KafkaModule
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
