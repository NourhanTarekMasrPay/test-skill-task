import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config'; 

@Injectable()
export class AuthGuard implements CanActivate {
  private jwksClient: JwksClient;
  private keycloakIssuerUrl: string;

  constructor(
    private readonly configService: ConfigService, 
  ) {
    // Access environment variables via ConfigService
    const keycloakServerUrl = this.configService.get<string>('KEYCLOAK_SERVER_URL');
    const keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');

    // Ensure these are defined; otherwise, your app won't start or will fail
    if (!keycloakServerUrl || !keycloakRealm) {
      throw new Error('Keycloak configuration environment variables are missing!');
    }

    this.keycloakIssuerUrl = `${keycloakServerUrl}/realms/${keycloakRealm}`;
    const keycloakCertsUrl = `${this.keycloakIssuerUrl}/protocol/openid-connect/certs`;

    this.jwksClient = new JwksClient({
      jwksUri: keycloakCertsUrl,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  private getKey = (header, callback) => {
    this.jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        console.error('Error getting signing key:', err.message);
        // It's crucial to return an error here so jwt.verify knows the key could not be obtained
        return callback(new UnauthorizedException('Failed to retrieve signing key.'));
      }
      if (!key) {
        // This case should ideally not happen if getSigningKey returns no error, but good check
        return callback(new UnauthorizedException('Signing key is undefined.'));
      }
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded: any = await new Promise((resolve, reject) => {
        jwt.verify(token, this.getKey, { algorithms: ['RS256'], issuer: this.keycloakIssuerUrl }, (err, payload) => {
          if (err) {
            return reject(err); // Propagate verification errors
          }
          resolve(payload);
        });
      });

      request.user = decoded; // Attach decoded token payload to the request
      return true;
    } catch (error) {
      console.error('Authentication Error:', error.message); // Log the error for debugging
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      // If getKey returned an error, it might be an UnauthorizedException already
      if (error instanceof UnauthorizedException) {
          throw error;
      }
      throw new UnauthorizedException('Authentication failed'); // Generic fallback
    }
  }
}