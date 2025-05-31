import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';


export class CreateOrderDto {
  @IsNotEmpty()
  customerId: number; // i will get it form guard after auth guard

  @IsNotEmpty()
  productId:number;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}
