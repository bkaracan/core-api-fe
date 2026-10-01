import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PageResponse,
  SetPasswordRequest,
  UserProfileResponse
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.get<ApiResponse<UserProfileResponse>>('/api/v1/users/me');
  }

  setPassword(request: SetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/v1/users/me/set-password', request);
  }

  unlinkSocialAccount(provider: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/v1/users/me/social/${provider}`);
  }

  getUsers(page = 0, size = 10, query = ''): Observable<ApiResponse<PageResponse<UserProfileResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<ApiResponse<PageResponse<UserProfileResponse>>>('/api/v1/users', { params });
  }
}
