export const environment = {
  production: true,
  apiUrl: 'https://api.enterprise.com',
  auth: {
    issuer: 'https://auth.enterprise.com',
    clientId: 'web-portal-client',
    redirectUri: 'https://portal.enterprise.com/auth/callback',
    scope: 'openid profile email'
  }
};
