// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6) // Adjust min length as per Keycloak password policy
  password: string;
}