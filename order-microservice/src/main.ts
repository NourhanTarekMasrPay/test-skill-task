import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from './config/kafka.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Swagger Setup ---
  const config = new DocumentBuilder()
    .setTitle('Order Management Microservice API')
    .setDescription('API documentation for the Order Management Microservice')
    .setVersion('1.0')
    .addTag('orders') // Optional: add tags to group endpoints
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Set up the HTTP listener (for REST API)
  await app.listen(3000);
  console.log('Order Management Service (HTTP) listening on port 3000');

  // Set up the Kafka microservice listener
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_CONFIG.CLIENT_ID,
        brokers: KAFKA_CONFIG.BROKERS,
      },
      consumer: {
        groupId: KAFKA_CONFIG.CONSUMER_GROUP_ID,
      },
    },
  });

  await microservice.listen();
  console.log('Order Management Service (Kafka) microservice listening');
}
bootstrap();
