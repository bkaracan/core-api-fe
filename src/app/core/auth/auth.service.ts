import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { TokenStorageService } from './token-storage.service';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce.utils';
import {
  ApiResponse,
  AuthTokenResponse,
  LoginRequest,
  OAuthTokenResponse,
  RegisterUserRequest,
  SetPasswordRequest,
  UserProfileResponse
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly currentUser = signal<UserProfileResponse | null>(null);
  readonly accessToken = this.tokenStorage.accessToken;
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly userRoles = computed(() => this.currentUser()?.roles ?? []);

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const current = this.userRoles();
    return roles.some((r) => current.includes(r));
  }

  loginLocal(credentials: LoginRequest): Observable<ApiResponse<AuthTokenResponse>> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>('/api/v1/auth/login', credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setSession(response.data.accessToken, response.data.user);
          }
        })
      );
  }

  register(request: RegisterUserRequest): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.post<ApiResponse<UserProfileResponse>>('/api/v1/auth/register', request);
  }

  async initiateSsoLogin(): Promise<void> {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    this.tokenStorage.savePkceState(verifier, state);

    const authUrl = new URL(`${environment.auth.issuer}/oauth2/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', environment.auth.clientId);
    authUrl.searchParams.set('redirect_uri', environment.auth.redirectUri);
    authUrl.searchParams.set('scope', environment.auth.scope);
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  }

  handleAuthCallback(code: string, state: string): Observable<OAuthTokenResponse> {
    const savedState = this.tokenStorage.getPkceState();
    const verifier = this.tokenStorage.getPkceVerifier();

    if (!savedState || savedState !== state) {
      this.tokenStorage.clearPkceState();
      throw new Error('PKCE State Mismatch! CSRF check failed.');
    }

    if (!verifier) {
      this.tokenStorage.clearPkceState();
      throw new Error('PKCE Code Verifier not found in session.');
    }

    const payload = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('client_id', environment.auth.clientId)
      .set('redirect_uri', environment.auth.redirectUri)
      .set('code', code)
      .set('code_verifier', verifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
      .post<OAuthTokenResponse>(`${environment.auth.issuer}/oauth2/token`, payload.toString(), { headers })
      .pipe(
        tap((res) => {
          this.tokenStorage.clearPkceState();
          this.tokenStorage.setAccessToken(res.access_token);
        })
      );
  }

  fetchCurrentUser(): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.get<ApiResponse<UserProfileResponse>>('/api/v1/users/me').pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.currentUser.set(response.data);
        }
      })
    );
  }

  setPassword(request: SetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/v1/users/me/set-password', request);
  }

  unlinkSocial(provider: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/v1/users/me/social/${provider}`);
  }

  setSession(token: string, user: UserProfileResponse): void {
    this.tokenStorage.setAccessToken(token);
    this.currentUser.set(user);
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
