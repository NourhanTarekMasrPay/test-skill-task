import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controller/order.controller';
import { OrderService } from './service/order.service';
import { OrderSchema } from './commons/sechma/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]), KafkaModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
