import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service'; // Adjust the import path as necessary
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({

  providers: [KafkaProducerService , KafkaConsumerService],
  exports: [KafkaProducerService , KafkaConsumerService], 
})
export class KafkaModule {}


