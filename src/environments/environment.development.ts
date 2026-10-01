export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  auth: {
    issuer: 'http://localhost:8080',
    clientId: 'web-portal-client',
    redirectUri: 'http://localhost:4200/auth/callback',
    scope: 'openid profile email'
  }
};
