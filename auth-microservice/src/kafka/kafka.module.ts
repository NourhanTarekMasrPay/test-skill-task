import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaAdminService } from './kafka-admin.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KAFKA_CONFIG } from './kafka.config';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'USER_KAFKA_SERVICE',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId:KAFKA_CONFIG.CLIENT_ID,
          brokers: KAFKA_CONFIG.BROKERS , 
          retry: {
            initialRetryTime: 100,
            retries: 8, 
          },
        },
        consumer: {
          groupId: KAFKA_CONFIG.CONSUMER_GROUP_ID,
          allowAutoTopicCreation: true,
        },
        producer: {
          allowAutoTopicCreation: true,
          createPartitioner: Partitioners.LegacyPartitioner,
        },
        
      },    
    }])
  ],
  providers: [
    KafkaProducerService, 
    KafkaAdminService,    
  KafkaConsumerService
  ],
  exports: [
    ClientsModule,        
    KafkaProducerService, 
    KafkaAdminService,   
   KafkaConsumerService 
  ],
})
export class KafkaModule {}