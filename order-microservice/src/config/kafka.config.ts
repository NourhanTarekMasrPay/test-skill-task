export const KAFKA_CONFIG = {
  CLIENT_ID: 'order_microservice',
  BROKERS: ['kafka:9092'], // Use the Kafka service name from docker-compose.yml
  CONSUMER_GROUP_ID: 'order-management-group',
  TOPICS: {
    ORDER_CREATED: 'order.created',
    ORDER_DELETED: 'order.deleted',
  },
};
