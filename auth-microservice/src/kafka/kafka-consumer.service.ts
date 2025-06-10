import { Injectable } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import { KAFKA_CONFIG} from './kafka.config'
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class KafkaConsumerService  {
 
  @EventPattern(KAFKA_CONFIG.TOPICS.USER_CREATED)
  async handleUserCreated(@Payload() message: EachMessagePayload) {
    const payload: KafkaMessagePayload = {
      topic: message.topic,
      partition: message.partition,
      offset: message.message.offset,
      key: message.message.key ? message.message.key.toString() : null,
      value: message.message.value ? message.message.value.toString() : null,
      timestamp: message.message.timestamp,
    };

    console.log('user Created Event:', payload);
  }

  @EventPattern(KAFKA_CONFIG.TOPICS.USER_DELETED)
  async handleUserDeleted(@Payload() message: EachMessagePayload) {
    const payload: KafkaMessagePayload = {
      topic: message.topic,
      partition: message.partition,
      offset: message.message.offset,
      key: message.message.key ? message.message.key.toString() : null,
      value: message.message.value ? message.message.value.toString() : null,
      timestamp: message.message.timestamp,
    };

    console.log('User Deleted Event:', payload);
  }
}


export interface KafkaMessagePayload {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string | null;
  headers?: { [key: string]: Buffer };
  timestamp: string;
}