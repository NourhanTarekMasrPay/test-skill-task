import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    JwtModule.register({
      secret: keycloakConfig.clientSecret,
      signOptions: { expiresIn: '100h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => keycloakConfig],
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}