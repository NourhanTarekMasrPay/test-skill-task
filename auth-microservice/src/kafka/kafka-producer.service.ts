import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices'; // This is the client from ClientsModule

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('USER_KAFKA_SERVICE') private readonly clientKafka: ClientKafka  ) {}

  async onModuleInit() {
    await this.clientKafka.connect(); 
    this.logger.log('Kafka Producer client connected.');
  }

  async onModuleDestroy() {
    await this.clientKafka.close();
    this.logger.log('Kafka Producer client disconnected.');
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    try {

      await this.clientKafka.emit(topic, message);
      this.logger.log(`Message sent to topic ${topic}: ${JSON.stringify(message)}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}: ${error.message}`, error.stack);
      throw error; 
    }
  }
}