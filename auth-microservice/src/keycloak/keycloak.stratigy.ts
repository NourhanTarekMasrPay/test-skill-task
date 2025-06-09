import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksClient from 'jwks-rsa'; // Import jwks-rsa
import { keycloakConfig } from './keycloak.config'; // Still use keycloakConfig for URLs

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger = new Logger(KeycloakStrategy.name);

  constructor() {
 
    const authServerUrl = process.env.KEYCLOAK_SERVER_URL || keycloakConfig.authServerUrl;
    const realm = process.env.KEYCLOAK_REALM || keycloakConfig.realm;

    if (!authServerUrl || !realm) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        audience: keycloakConfig.clientId,
        issuer: '', // Provide a dummy issuer to satisfy the super call
        algorithms: ['RS256'],
        secretOrKeyProvider: () => null,
      });
      this.logger.error('Keycloak configuration missing. Check KEYCLOAK_SERVER_URL and KEYCLOAK_REALM in .env');
      throw new Error('Keycloak configuration missing for JWT strategy.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Ensure token expiration is respected
      audience: keycloakConfig.clientId, // Audience should be your client ID configured in Keycloak for this service
      issuer: `${authServerUrl}/realms/${realm}`, // Issuer is the Keycloak realm URL
      algorithms: ['RS256'], // Keycloak typically uses RS256 for token signing
      secretOrKeyProvider: jwksClient.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authServerUrl}/realms/${realm}/protocol/openid-connect/certs`, // Keycloak's JWKS endpoint
      }),
    });

    this.logger.log(`KeycloakStrategy initialized for realm: ${realm}`);
  }

  async validate(payload: any) {
    // The payload is the decoded and validated JWT token.
    // You can add additional checks here if needed (e.g., check specific roles/permissions).
    if (!payload) {
      this.logger.warn('Keycloak JWT validation failed: no payload.');
      return false;
    }
    this.logger.debug(`Keycloak JWT Payload: ${JSON.stringify(payload)}`);

    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: payload.realm_access?.roles || [],
      // Do not return `accessToken` here unless it's explicitly part of the payload
      // or you're forwarding the original token, which is not standard practice for `validate`.
      // The `accessToken` is what's being *validated*, not part of the validated user object.
      // If you need the original token for subsequent requests, you'd store it elsewhere or
      // pass it through the request.
    };
  }
}