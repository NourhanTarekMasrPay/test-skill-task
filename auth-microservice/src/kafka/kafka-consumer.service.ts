import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { KAFKA_CONFIG} from './kafka.config'
// Define an interface for the messages you expect to consume
export interface KafkaMessagePayload {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string | null;
  headers?: { [key: string]: Buffer };
  timestamp: string;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumers: Consumer[] =[] 

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID ,
      brokers: KAFKA_CONFIG.BROKERS, 
    });
  }

  /**
   * Initializes the Kafka consumer and connects to the broker.
   * This method is part of the NestJS lifecycle hook.
   */
  async onModuleInit() {
    console.log('Kafka Consumer Service Initialized');
  }

  /**
   * Disconnects all initialized Kafka consumers when the module is destroyed.
   * This method is part of the NestJS lifecycle hook.
   */
  async onModuleDestroy() {
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
      console.log(`Kafka Consumer disconnected `);
    }
    console.log('All Kafka Consumers Disconnected');
  }

  /**
   * Subscribes a consumer to a specific Kafka topic and registers a message handler.
   *
   * @param topic - The Kafka topic to subscribe to.
   * @param groupId - The consumer group ID. Important for distributing messages among consumers.
   * @param handler - An asynchronous function that will be called for each message consumed.
   * It receives the `EachMessagePayload` from `kafkajs`.
   * @throws {Error} If the consumer fails to connect or subscribe.
   */
  async subscribeToTopic(
    topic: string,
    groupId: string,
    handler: (payload: EachMessagePayload) => Promise<void>,
  ) {

    const consumer = this.kafka.consumer({ groupId });

    try {
      await consumer.connect();
      console.log(`Kafka Consumer for group '${groupId}' connected.`);

      await consumer.subscribe({ topic}); 

      await consumer.run({
        eachMessage: async (payload) => {
          try {
            console.log(`Received message from topic ${payload.topic}, partition ${payload.partition}, offset ${payload.message.offset}`);
            await handler(payload);
          } catch (error) {
            console.error(`Error processing Kafka message from topic ${payload.topic}:`, error);
          }
        },
      });
      console.log(`Kafka Consumer for group '${groupId}' subscribed to topic '${topic}'.`);
    } catch (error) {
        
      console.error(`Failed to subscribe consumer group '${groupId}' to topic '${topic}':`, error);
      if (this.consumers.some(c => (c as any).groupId === groupId)) {
        await consumer.disconnect();
      }
      throw error; 
    }
  }
}