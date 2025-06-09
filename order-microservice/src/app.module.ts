import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { KafkaModule } from './kafka/kafka.module'; 
import { KafkaConsumerService } from './kafka/kafka-consumer.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    MongooseModule.forRootAsync({ 
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('ORDER_MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    KafkaModule, 
    OrderModule,
  ],
  // providers: [
  //   { provide: APP_GUARD, useClass: AuthGuard },
  //   { provide: APP_GUARD, useClass: RoleGuard },
  // ],
  providers: [KafkaConsumerService , AppService],
  controllers: [AppController], 
})
export class AppModule {}
