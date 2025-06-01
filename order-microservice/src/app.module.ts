import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { KafkaModule } from './kafka/kafka.module';
@Module({
  imports: [

    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://root:example@mongodb:27017/order_db?authSource=admin'), // Use the MongoDB service name from docker-compose.yml
    OrderModule,
    KafkaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
