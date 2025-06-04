import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { OrderSchema } from './commons/sechma/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { APP_GUARD  } from '@nestjs/core';
import { AuthGuard, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    KafkaModule,
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