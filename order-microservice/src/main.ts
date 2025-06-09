// order-microservice/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from './kafka/kafka.config'; // Ensure this path is correct
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // ================================= Read the port from environment variables  =============================================================== 
  const HTTP_PORT = parseInt(process.env.ORDER_SERVICE_PORT || '5000', 10);
  const MONGODB_URI = process.env.ORDER_MONGODB_URI; 

  const app = await NestFactory.create(AppModule);

  // ========================================== Swagger Setu  ==================================================================================== 
  const config = new DocumentBuilder()
    .setTitle('Order Management Microservice API')
    .setDescription('API documentation for the Order Management Microservice')
    .setVersion('1.0')
    .addTag('orders') 
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  //==============================================================================================================================
  app.enableCors();
  // ==========================================Set up the Kafka microservice listener ==========================================
  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_CONFIG.CLIENT_ID,
        brokers: KAFKA_CONFIG.BROKERS,
      },
      consumer: {
        groupId: KAFKA_CONFIG.CONSUMER_GROUP_ID,
      },
      producer: {
        allowAutoTopicCreation: true, 
      },
    },
  });
  await app.startAllMicroservices();
  console.log('Order microservice is listening for messages...');
//==============================================================================================================================

  await app.listen(HTTP_PORT , () => {
    console.log(`Order Management Service is running on: http://localhost:${HTTP_PORT}`); 
  })
}
bootstrap();