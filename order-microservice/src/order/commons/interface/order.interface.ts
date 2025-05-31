import { Document } from 'mongoose';

export interface Order extends Document {

customerId: number;
productId: number;
quantity: number;
price: number;
totalAmount: number;
status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
createdAt: Date;
updatedAt: Date;
}
