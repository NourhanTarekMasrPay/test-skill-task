import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { OrderSchema } from './commons/sechma/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { RolesGuard } from './commons/guard/role.guard';
import { AuthGuard } from './commons/guard/auth.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    KafkaModule ,ConfigModule ],
  controllers: [OrderController],
  providers: [OrderService ,  AuthGuard,  RolesGuard ],
})
export class OrderModule {}