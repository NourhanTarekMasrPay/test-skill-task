import { Controller, Get, Post, Delete, Body, Param, HttpStatus, HttpCode, Req } from '@nestjs/common';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../commons/dto/create-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger'; // Import ApiBearerAuth
import { Order } from '../commons/sechma/order.schema';
import { Roles, AuthenticatedUser } from 'nest-keycloak-connect'; // Import Keycloak decorators

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
//======================================================================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order (Requires authentication)' })
  @ApiBody({ type: CreateOrderDto, description: 'Details of the order to create' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The order has been successfully created.',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  // @ApiBearerAuth() 
  async create(@Body() createOrderDto: CreateOrderDto, @AuthenticatedUser() user: any) {

    return this.orderService.createOrder(createOrderDto);
  }

//======================================================================================================================
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific order by ID (Accessible by any authenticated user)' })
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
  // @ApiBearerAuth()
  // @Roles({ roles: ['user', 'admin'] }) 
  async findOne(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

//======================================================================================================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order by ID (Admin only)' })
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
  // @ApiBearerAuth()
  // @Roles({ roles: ['admin'] }) // Only users with the 'admin' role can delete
  async Delete(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }

  //======================================================================================================================
  @Get('')
  @ApiOperation({ summary: 'Retrieve a specific order by ID (Accessible by any authenticated user)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The orders details.',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
  // @ApiBearerAuth()
  // @Roles({ roles: ['user', 'admin'] }) 
  async findAll() {
    return this.orderService.getAllOrders();
  }

}