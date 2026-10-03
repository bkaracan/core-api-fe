import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private static readonly TOKEN_KEY = 'core_api_access_token';

  private readonly _accessToken = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('core_api_access_token') : null
  );
  readonly accessToken = this._accessToken.asReadonly();

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(TokenStorageService.TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TokenStorageService.TOKEN_KEY);
      }
    }
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  clearToken(): void {
    this._accessToken.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TokenStorageService.TOKEN_KEY);
    }
  }

  // PKCE temporary handshake state
  savePkceState(verifier: string, state: string): void {
    sessionStorage.setItem('pkce_code_verifier', verifier);
    sessionStorage.setItem('pkce_state', state);
  }

  getPkceVerifier(): string | null {
    return sessionStorage.getItem('pkce_code_verifier');
  }

  getPkceState(): string | null {
    return sessionStorage.getItem('pkce_state');
  }

  clearPkceState(): void {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
  }
}
