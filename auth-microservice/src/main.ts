import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  dotenv.config(); 

  const HTTP_PORT = parseInt(process.env.AUTH_SERVICE_PORT || '3000', 10);

  await app.listen(HTTP_PORT);
  console.log(`Auth microservice (HTTP) is running on port ${HTTP_PORT}`);

  /*
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
  console.log('Auth microservice (Kafka) listener started');
  */
}
bootstrap();