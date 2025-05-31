export const KAFKA_CONFIG = {
  CLIENT_ID: 'auth_microservice',
  BROKERS: ['kafka:9092'], // Use the Kafka service name from docker-compose.yml
  CONSUMER_GROUP_ID: 'user-management-group',
  TOPICS: {
    USER_CREATED: 'user.created',
    USER_DELETED: 'user.deleted',
    USER_UPDATED: 'user.updated',
  },
};
