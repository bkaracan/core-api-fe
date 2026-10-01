import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly _accessToken = signal<string | null>(null);
  readonly accessToken = this._accessToken.asReadonly();

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  clearToken(): void {
    this._accessToken.set(null);
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
