import {  PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';

export const keycloakConfig = {
  
      realm: process.env.KEYCLOAK_REALM ||  "",
      clientId: process.env.KEYCLOAK_CLIENT_ID ||  "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ||  "",
      authServerUrl: process.env.KEYCLOAK_SERVER_URL ||  "",
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE ||  "",
      tokenValidation: TokenValidation.ONLINE ||  "", 
      adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
};


export const keycloakUrls = (realm: string) => ({
  tokenUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/token`,
  userInfoUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/userinfo`,
  adminUrl: `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${realm}/users`,
  publicKeyUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/certs`,
});