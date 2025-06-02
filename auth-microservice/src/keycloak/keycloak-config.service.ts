// src/keycloak/keycloak-config.service.ts
import { Injectable } from '@nestjs/common';
import { KeycloakConnectOptions, KeycloakConnectOptionsFactory, PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
  private readonly authServerUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    this.authServerUrl = this.configService.get<string>('KEYCLOAK_AUTH_URL') || "";
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || "";
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || "";
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || "mysecret";
  }

  createKeycloakConnectOptions(): KeycloakConnectOptions {
    return {
      authServerUrl: this.authServerUrl,
      realm: this.realm,
      clientId: this.clientId,
      secret: this.clientSecret,
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE, 
      tokenValidation: TokenValidation.ONLINE,
      'bearer-only': true, // Typically true for API backends
    };
  }

  // Add getters for direct access to config values if needed by other services
  getAuthServerUrl(): string {
    return this.authServerUrl;
  }

  getRealm(): string {
    return this.realm;
  }

  getClientId(): string {
    return this.clientId;
  }

  getClientSecret(): string {
    return this.clientSecret;
  }


  getPublicKeyUrl(): string {
    return `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`;
  }
  
  getTokenUrl(): string {
    return `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  getUserInfoUrl(): string {
    return `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
  }

}