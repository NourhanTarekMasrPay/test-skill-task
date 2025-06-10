import {  PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';

export const keycloakConfig = {
  
      realm: process.env.KEYCLOAK_REALM ||  "myrealm",
      clientId: process.env.AUTH_KEYCLOAK_CLIENT_ID ||  "auth-microservice",
      clientSecret: process.env.AUTH_KEYCLOAK_CLIENT_SECRET ||  "",
      authServerUrl: process.env.KEYCLOAK_SERVER_URL ||  "http://localhost:8080",
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE ||  "",
      tokenValidation: TokenValidation.ONLINE ||  "", 
      adminUsername: process.env.KEYCLOAK_ADMIN_USER || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
};


export const keycloakUrls = (realm: string) => ({
  tokenUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/token`,
  userInfoUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/userinfo`,
  adminUrl: `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${realm}/users`,
  publicKeyUrl: `${process.env.KEYCLOAK_SERVER_URL}/realms/${realm}/protocol/openid-connect/certs`,
});

//{keycloak_base_url}/admin/realms/{your_realm_name}/{resource_path}