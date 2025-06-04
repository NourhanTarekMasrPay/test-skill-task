export const KAFKA_CONFIG = {
  CLIENT_ID: process.env.ORDER_KAFKA_CLIENT_ID || 'order_microservice_default',
  BROKERS: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  CONSUMER_GROUP_ID: process.env.ORDER_KAFKA_CONSUMER_GROUP_ID || 'order-management-group_default',
  TOPICS: {
    ORDER_CREATED: process.env.ORDER_KAFKA_TOPIC_ORDER_CREATED || 'order.created',
    ORDER_DELETED: process.env.ORDER_KAFKA_TOPIC_ORDER_DELETED || 'order.deleted',
  },
};