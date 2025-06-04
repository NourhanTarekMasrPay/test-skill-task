import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID'),
      brokers: [this.configService.get<string>('KAFKA_BROKER_HOST')||"localhost:9092"],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer disconnected');
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    const record: ProducerRecord = {
      topic,
      messages: [{ value: JSON.stringify(message) }],
    };
    await this.producer.send(record);
    this.logger.log(`Message sent to topic ${topic}: ${JSON.stringify(message)}`);
  }
}