import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Producer, Kafka } from 'kafkajs';
import { KAFKA_CONFIG } from './kafka.config'; // Adjust the import path as necessary

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID || 'default_client_id',
      brokers: KAFKA_CONFIG.BROKERS || ['localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendMessage(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}