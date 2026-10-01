export interface SocialAccountResponse {
  publicId: string;
  provider: string;
  providerEmail: string;
  createdAt: string;
}

export interface UserProfileResponse {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  hasLocalPassword: boolean;
  status: string;
  roles: string[];
  socialAccounts: SocialAccountResponse[];
  createdAt: string;
}
