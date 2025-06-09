import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../commons/sechma/order.schema'; // Corrected path
import { CreateOrderDto } from '../commons/dto/create-order.dto';
import { KafkaProducerService } from '../../kafka/kafka-producer.service'; // Corrected path
import { KAFKA_CONFIG } from 'src/kafka/kafka.config';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>, 
    private readonly kafkaProducerService: KafkaProducerService, 
  ) {}
//======================================================================================================================

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const totalAmount = createOrderDto.price * createOrderDto.quantity;
    const createdOrder = new this.orderModel({ ...createOrderDto, totalAmount });
    const savedOrder = await createdOrder.save();

    await this.kafkaProducerService.sendMessage(
      KAFKA_CONFIG.TOPICS.ORDER_CREATED , 
      {
        orderId: savedOrder.id.toString(),
        customerId: savedOrder.customerId,
        productId: savedOrder.productId,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        timestamp: new Date().toISOString(),
      },
    );
    this.logger.log(`Order created and message sent to Kafka: ${savedOrder._id}`);
    return savedOrder;
  }
//======================================================================================================================

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      this.logger.warn(`Order with ID ${id} not found.`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }
//======================================================================================================================

  async deleteOrder(id: string): Promise<Order> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
    if (!deletedOrder) {
      this.logger.warn(`Order with ID ${id} not found for deletion.`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    await this.kafkaProducerService.sendMessage(
      KAFKA_CONFIG.TOPICS.ORDER_DELETED, // Use topic from getter
      {
        orderId: deletedOrder.id.toString(),
        customerId: deletedOrder.customerId,
        timestamp: new Date().toISOString(),
      },
    );
    this.logger.log(`Order deleted and message sent to Kafka: ${deletedOrder._id}`);
    return deletedOrder;
  }
//======================================================================================================================


  async getAllOrders(): Promise<any> {
    const order = await this.orderModel.find().exec();
    if (!order) {
      this.logger.warn(`Order Database is empty.`);
      throw new NotFoundException(`Order Database is empty.`);
    }
    return order;
  }
}

