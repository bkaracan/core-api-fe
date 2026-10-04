import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  ApiResponse,
  CreateHabitRequest,
  CreateIdentityRequest,
  DashboardSummaryResponse,
  HabitResponse,
  IdentityResponse,
  KaizenReflectionRequest,
  KaizenReflectionResponse,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private readonly http = inject(HttpClient);

  readonly summary = signal<DashboardSummaryResponse | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly habits = computed(() => this.summary()?.habits ?? []);
  readonly identities = computed(() => this.summary()?.identities ?? []);
  readonly currentStreak = computed(() => this.summary()?.currentStreak ?? 0);
  readonly completionRate = computed(() => this.summary()?.completionRate ?? 0);
  readonly totalEarnedXp = computed(() => this.summary()?.totalEarnedXp ?? 0);
  readonly totalIdentityVotes = computed(() => this.summary()?.totalIdentityVotes ?? 0);

  loadDashboardSummary(): Observable<ApiResponse<DashboardSummaryResponse>> {
    this.isLoading.set(true);
    return this.http.get<ApiResponse<DashboardSummaryResponse>>('/api/v1/habits/dashboard').pipe(
      tap({
        next: (res) => {
          if (res.success && res.data) {
            this.summary.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      }),
    );
  }

  toggleHabit(publicId: string, usedTwoMinuteRule = false): Observable<ApiResponse<HabitResponse>> {
    const params = new HttpParams().set('usedTwoMinuteRule', usedTwoMinuteRule);
    return this.http
      .post<ApiResponse<HabitResponse>>(`/api/v1/habits/${publicId}/toggle`, null, { params })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const updatedHabit = res.data;
            this.summary.update((current) => {
              if (!current) return current;
              const updatedHabits = current.habits.map((h) =>
                h.publicId === updatedHabit.publicId ? updatedHabit : h,
              );
              const completedCount = updatedHabits.filter((h) => h.completedToday).length;
              const rate =
                updatedHabits.length > 0
                  ? Math.round((completedCount / updatedHabits.length) * 100)
                  : 0;
              const earnedXp = updatedHabits.reduce(
                (acc, h) => (h.completedToday ? acc + h.rewardXp : acc),
                0,
              );
              return {
                ...current,
                habits: updatedHabits,
                completedHabits: completedCount,
                completionRate: rate,
                totalEarnedXp: earnedXp,
              };
            });
          }
        }),
      );
  }

  createHabit(request: CreateHabitRequest): Observable<ApiResponse<HabitResponse>> {
    return this.http.post<ApiResponse<HabitResponse>>('/api/v1/habits', request).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const newHabit = res.data;
          this.summary.update((current) => {
            if (!current) return current;
            const updated = [...current.habits, newHabit];
            return {
              ...current,
              habits: updated,
              totalHabits: updated.length,
            };
          });
        }
      }),
    );
  }

  castVote(identityPublicId: string): Observable<ApiResponse<IdentityResponse>> {
    return this.http
      .post<ApiResponse<IdentityResponse>>(
        `/api/v1/habits/identities/${identityPublicId}/vote`,
        null,
      )
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const updatedIdentity = res.data;
            this.summary.update((current) => {
              if (!current) return current;
              const updatedIdentities = current.identities.map((i) =>
                i.publicId === updatedIdentity.publicId ? updatedIdentity : i,
              );
              return {
                ...current,
                identities: updatedIdentities,
                totalIdentityVotes: updatedIdentities.reduce((acc, i) => acc + i.totalVotes, 0),
              };
            });
          }
        }),
      );
  }

  createIdentity(request: CreateIdentityRequest): Observable<ApiResponse<IdentityResponse>> {
    return this.http.post<ApiResponse<IdentityResponse>>('/api/v1/habits/identities', request).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const newIdentity = res.data;
          this.summary.update((current) => {
            if (!current) return current;
            return {
              ...current,
              identities: [...current.identities, newIdentity],
            };
          });
        }
      }),
    );
  }

  saveReflection(
    request: KaizenReflectionRequest,
  ): Observable<ApiResponse<KaizenReflectionResponse>> {
    return this.http
      .post<ApiResponse<KaizenReflectionResponse>>('/api/v1/habits/reflections', request)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const newReflection = res.data;
            this.summary.update((current) => {
              if (!current) return current;
              return {
                ...current,
                todayReflection: newReflection,
              };
            });
          }
        }),
      );
  }

  deleteHabit(publicId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/v1/habits/${publicId}`).pipe(
      tap((res) => {
        if (res.success) {
          this.summary.update((current) => {
            if (!current) return current;
            const updated = current.habits.filter((h) => h.publicId !== publicId);
            return {
              ...current,
              habits: updated,
              totalHabits: updated.length,
            };
          });
        }
      }),
    );
  }
}
