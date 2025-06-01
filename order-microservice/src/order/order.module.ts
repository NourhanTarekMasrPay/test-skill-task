import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { OrderSchema } from './commons/sechma/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { KeycloakConfigService } from 'src/keycloak/keycloak-config.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, KeycloakConnectModule, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]), KafkaModule ,  
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
    }),],
  controllers: [OrderController],
 providers: [
    OrderService,
    KeycloakConfigService, // Provide KeycloakConfigService here
    // These global guards apply to all routes by default.
    // You can then use @Public() to exempt specific routes.
    {
      provide: APP_GUARD, // This is a global authentication guard for JWTs
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD, // This is a global resource guard (for Keycloak's resource-based policies)
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD, // This is a global role guard (for Keycloak roles)
      useClass: RoleGuard,
    },
  ],
})
export class OrderModule {}
