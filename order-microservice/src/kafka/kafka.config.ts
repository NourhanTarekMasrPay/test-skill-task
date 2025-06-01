export const KAFKA_CONFIG = {
  CLIENT_ID: 'order_microservice',
  BROKERS: ['kafka:9092'],
  CONSUMER_GROUP_ID: 'order-management-group',
  TOPICS: {
    ORDER_CREATED: 'order.created',
    ORDER_DELETED: 'order.deleted',
  },
};
