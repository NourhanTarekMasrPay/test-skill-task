import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { OrderSchema } from './commons/sechma/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { KeycloakConfigModule } from 'src/keycloak/keycloak-config.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, KeycloakConnectModule, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';
import { KeycloakConfigService } from 'src/keycloak/keycloak-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    KafkaModule,
    KeycloakConfigModule, //  Import the config module here
    KeycloakConnectModule.registerAsync({
      imports: [KeycloakConfigModule], //  Also include in registerAsync
      useClass: KeycloakConfigService,
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class OrderModule {}