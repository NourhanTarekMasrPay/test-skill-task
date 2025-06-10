import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from './kafka/kafka.config';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const HTTP_PORT = parseInt(process.env.AUTH_SERVICE_PORT || '3000', 10);

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
    },
  });
  await app.startAllMicroservices();
  console.log('Auth microservice (Kafka) listener started');
//==============================================================================================================================
    await app.listen(HTTP_PORT , () => {
    console.log(`Auth Management Service is running on: http://localhost:${HTTP_PORT}`);
  });
//==============================================================================================================================  
}
bootstrap();