import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb:27017/order-management'), // Use the MongoDB service name from docker-compose.yml
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
