// src/auth/dto/register.dto.ts
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6) // Adjust min length as per Keycloak password policy
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  firstName?: string; // Optional

  @IsString()
  lastName?: string;  // Optional
}