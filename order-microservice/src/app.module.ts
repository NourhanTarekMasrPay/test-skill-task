import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { KafkaModule } from './kafka/kafka.module';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://root:example@mongodb:27017/order_db?authSource=admin'),     
    KafkaModule, 
    OrderModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    AppService
  ],
  controllers: [AppController],
})
export class AppModule {}
