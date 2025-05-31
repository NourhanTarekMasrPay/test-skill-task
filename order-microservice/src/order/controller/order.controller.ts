import { Controller, Get, Post, Delete, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../commons/dto/create-order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_CONFIG } from '../../kafka/kafka.config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Order } from '../commons/sechma/order.schema';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto, description: 'Details of the order to create' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The order has been successfully created.',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an order by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the order to retrieve',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The order details.',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the order to delete',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The order has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
  async Delete(@Param('id') id: string) {
    return this.orderService.delete(id);
  }


  @MessagePattern(KAFKA_CONFIG.TOPICS.ORDER_CREATED)
  async handleOrderCreated(@Payload() message: any) {
    console.log('Received ORDER_CREATED event:', message.value);
  }


  @MessagePattern(KAFKA_CONFIG.TOPICS.ORDER_DELETED)
  async handleOrderDeleted(@Payload() message: any) {
    console.log('Received ORDER_DELETED event:', message.value);
  }
}
