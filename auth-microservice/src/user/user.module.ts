import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';// to connect to MongoDB As soon as the module is imported, it will connect to MongoDB
import { userSchema } from './user.schema'; // Import the schema

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: userSchema }]),
  ],
  exports: [
    MongooseModule.forFeature([{ name: 'User', schema: userSchema }]),
  ],
})
export class UserModule {}