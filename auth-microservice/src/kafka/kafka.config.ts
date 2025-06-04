export const KAFKA_CONFIG = {
  CLIENT_ID: process.env.AUTH_KAFKA_CLIENT_ID || 'auth_microservice_default',
  BROKERS: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  CONSUMER_GROUP_ID: process.env.AUTH_KAFKA_CONSUMER_GROUP_ID || 'user-management-group_default',
  TOPICS: {
    USER_CREATED: process.env.AUTH_KAFKA_TOPIC_USER_CREATED || 'user.created',
    USER_DELETED: process.env.AUTH_KAFKA_TOPIC_USER_DELETED || 'user.deleted',
    USER_UPDATED: process.env.AUTH_KAFKA_TOPIC_USER_UPDATED || 'user.updated',
  },
};