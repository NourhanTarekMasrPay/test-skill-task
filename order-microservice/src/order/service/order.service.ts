import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../commons/sechma/order.schema';
import { ClientKafka } from '@nestjs/microservices';

import { CreateOrderDto } from '../commons/dto/create-order.dto';
import { KAFKA_CONFIG } from 'src/kafka/kafka.config';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly kafkaClient: ClientKafka,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = new this.orderModel(createOrderDto);
    const order = await createdOrder.save();

    this.kafkaClient.emit(KAFKA_CONFIG.TOPICS.ORDER_CREATED, {
      orderId: order._id,
      customerId: order.customerId,
      productId: order.productId, 
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
    });
    return order;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }
  
  async delete(id: string): Promise<any> {
    const result = await this.orderModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    this.kafkaClient.emit(KAFKA_CONFIG.TOPICS.ORDER_DELETED, {
      orderId: id,
    });
    return { message: 'Order deleted successfully' };
  }
}
