import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { KafkaModule } from './kafka/kafka.module'; 
import { KafkaConsumerService } from './kafka/kafka-consumer.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './order/commons/guard/auth.guard';
import { RolesGuard } from './order/commons/guard/role.guard';

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
  providers: [
    KafkaConsumerService , AppService 
    // { provide: APP_GUARD, useClass: AuthGuard },
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AppController], 
})
export class AppModule {}
