import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { KafkaModule } from './kafka/kafka.module';
import { JwtModule } from '@nestjs/jwt'; 
import { keycloakConfig } from './keycloak/keycloak.config';

@Module({
  imports: [
    AuthModule,
    KafkaModule,
   ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    JwtModule.registerAsync({ // Use registerAsync to load secret from ConfigService
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AUTH_KEYCLOAK_CLIENT_SECRET') || 'fallback_secret', // Use a proper secret for internal JWTs
        signOptions: { expiresIn: '100h' },
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}