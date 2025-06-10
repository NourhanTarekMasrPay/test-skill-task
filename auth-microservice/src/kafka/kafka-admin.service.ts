// src/kafka/kafka-admin.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Admin, ITopicConfig } from 'kafkajs';
import { KAFKA_CONFIG } from './kafka.config'; 

@Injectable()
export class KafkaAdminService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly admin: Admin;
  private readonly logger = new Logger(KafkaAdminService.name);

  private readonly topicsToCreate: ITopicConfig[] = [
    { topic: KAFKA_CONFIG.TOPICS.USER_CREATED, numPartitions: 1, replicationFactor: 1 },
    { topic: KAFKA_CONFIG.TOPICS.USER_DELETED, numPartitions: 1, replicationFactor: 1 },
  ];

  constructor() {
    this.kafka = new Kafka({
      clientId: `${KAFKA_CONFIG.CLIENT_ID}-admin`, 
      brokers: KAFKA_CONFIG.BROKERS,            
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    this.admin = this.kafka.admin(); 
  }

  async onModuleInit() {
    this.logger.log('Connecting Kafka Admin client for topic management...');
    try {
      await this.admin.connect(); 
      this.logger.log('Kafka Admin client connected.');

      // Fetch existing topics to avoid trying to create topics that already exist.
      const existingTopicsMetadata = await this.admin.fetchTopicMetadata();
      const existingTopicNames = new Set(existingTopicsMetadata.topics.map(t => t.name));

      const topicsPendingCreation: ITopicConfig[] = [];
      for (const topicConfig of this.topicsToCreate) {
        if (!existingTopicNames.has(topicConfig.topic)) {
          topicsPendingCreation.push(topicConfig);
          this.logger.log(`Topic '${topicConfig.topic}' does not exist. Adding to creation list.`);
        } else {
          this.logger.log(`Topic '${topicConfig.topic}' already exists.`);
          // In a production environment, you might add logic here to check
          // if partition/replication factor matches and log a warning or alter the topic.
        }
      }

      // Create only the topics that don't already exist.
      if (topicsPendingCreation.length > 0) {
        this.logger.log(`Attempting to create ${topicsPendingCreation.length} topics...`);
        await this.admin.createTopics({
          topics: topicsPendingCreation,
          waitForLeaders: true, // Wait for topic leaders to be elected before returning
          timeout: 10000, // Timeout for the topic creation operation
        });
        this.logger.log('Required topics created successfully (or confirmed existing).');
      } else {
        this.logger.log('All required topics already exist.');
      }

    } catch (error) {
      this.logger.error(`Failed to connect Kafka Admin client or create topics: ${error.message}`, error.stack);
    }
  }

  // This method runs automatically when the NestJS application is shutting down.
  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka Admin client...');
    await this.admin.disconnect(); // Disconnect from the Kafka cluster gracefully
    this.logger.log('Kafka Admin client disconnected.');
  }
}
