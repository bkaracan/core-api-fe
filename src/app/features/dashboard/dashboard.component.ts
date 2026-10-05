import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { HabitService } from '@core/services/habit.service';
import { GlassMarbleJarComponent } from '@shared/components/glass-marble-jar/glass-marble-jar.component';

export type HabitTimerStatus = 'HAZIR' | 'DEVAM_EDIYOR' | 'DURAKLATILDI' | 'TAMAMLANDI';

export interface UserHabit {
  id: string;
  title: string;
  category:
    'zihin' | 'beden' | 'kariyer' | 'odak' | 'sosyal' | 'hobi' | 'sinema_kultur' | 'eglence_oyun';
  categoryLabel: string;
  identityId: string;
  // 4 Yasa Alanları (homepage.md)
  cue: string; // 1. Yasa: Görünür Kıl (İşaret & Alışkanlık Demeti)
  targetLocation: string; // 1. Yasa: Çevre Tasarımı (Uygulama Niyeti Mekanı)
  craving: string; // 2. Yasa: Çekici Kıl (İstek & Neden)
  twoMinuteMicroStep: string; // 3. Yasa: Kolaylaştır (2 Dakika Kuralı)
  rewardXp: number; // 4. Yasa: Doyurucu Kıl (Ödül & XP)
  timeEstimate: string;
  targetMinutes: number; // Hedef Odak Süresi (dk)
  completed: boolean;
  twoMinuteModeActive?: boolean;
  microStepDone?: boolean; // 3. Yasa: 2-Dakika Kuralı Mikro Adımı Tamamlandı mı?
  // Pomodoro Sayacı Alanları
  timerStatus: HabitTimerStatus;
  remainingSeconds: number;
  initialSeconds: number;
  timerIntervalId?: any;
}

export interface UserIdentity {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  level: number;
  totalVotes: number;
  votesThreshold: number;
  color: string;
}

export interface DayStreakItem {
  dayName: string;
  dayShort: string;
  completed: boolean;
  isToday: boolean;
  score: number;
}

export interface CategoryTierItem {
  category: string;
  categoryDisplayName: string;
  icon: string;
  currentTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  currentTierName: string;
  currentTierIcon: string;
  currentTierBadgeCount: number;
  nextTierRequiredCount: number;
  totalBadgesEarned: number;
  progressPercentage: number;
  nextTierName: string;
  maxTierReached: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GlassMarbleJarComponent],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto pb-12">
      <!-- 1. HERO COMPOUND HORIZON & GÜNLÜK KAIZEN KARŞILAMA -->
      <section
        class="p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs relative overflow-hidden"
      >
        <!-- Arka Plan Ambient Glow -->
        <div
          class="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none"
        ></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Günün Kaizen Çevrimi Devrede
              </span>
              <span class="text-xs text-[var(--color-text-muted)] font-medium">
                {{ formattedDate }}
              </span>
              <span
                class="text-xs px-2 py-0.5 rounded-md font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              >
                (1.01)³⁶⁵ ≈ 37.78×
              </span>
            </div>

            <h1
              class="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text-main)]"
            >
              Hoş Geldin, {{ userDisplayName() }} 👋
            </h1>

            <p class="text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              "Devasa sıçramalar değil, atomik adımlar." Bugün küçük bir iyileşme yaparak
              gelecekteki kimliğine
              <strong class="text-indigo-600 dark:text-indigo-400">güçlü bir oy</strong> ver.
            </p>
          </div>

          <!-- Haftalık 7 Günlük Zinciri Kırma Çetelesi -->
          <div
            class="bg-[var(--color-bg-subtle)] p-4 rounded-2xl border border-[var(--color-border-subtle)] space-y-2 shrink-0"
          >
            <div class="flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="text-base">🔥</span>
                <span class="font-extrabold text-[var(--color-text-main)]"
                  >{{ currentStreak() }} Günlük Zincir</span
                >
              </div>
              <span
                class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded"
              >
                Zinciri Kırma!
              </span>
            </div>

            <!-- 7 Günlük Çetele Göstergesi -->
            <div class="flex items-center gap-1.5 pt-1">
              @for (day of weekStreak(); track day.dayShort) {
                <div
                  class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl border transition-all text-center"
                  [class.border-emerald-500/40]="day.completed"
                  [class.bg-emerald-500/15]="day.completed"
                  [class.border-indigo-500]="day.isToday && !day.completed"
                  [class.bg-indigo-500/10]="day.isToday && !day.completed"
                  [class.border-[var(--color-border-subtle)]]="!day.completed && !day.isToday"
                  [class.bg-[var(--color-bg-card)]]="!day.completed && !day.isToday"
                >
                  <span class="text-[10px] font-bold text-[var(--color-text-muted)]">{{
                    day.dayShort
                  }}</span>
                  <div
                    class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    [class.bg-emerald-500]="day.completed"
                    [class.text-white]="day.completed"
                    [class.bg-[var(--color-bg-subtle)]]="!day.completed"
                    [class.text-[var(--color-text-muted)]]="!day.completed"
                  >
                    {{ day.completed ? '✓' : day.isToday ? '•' : '○' }}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- 🎓 İNTERAKTİF UYUM VE UZMANLAŞMA MERKEZİ (ONBOARDING & MASTERY GUIDE) -->
      <section
        class="p-6 md:p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-[var(--color-bg-card)] to-purple-500/10 shadow-sm space-y-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
              >
                🎓 Ustalık Rehberi
              </span>
              <span class="text-xs text-[var(--color-text-muted)] font-medium">
                4 Adımda Atomik Alışkanlıklar & Kaizen Metodolojisine Uyum Sağlayın
              </span>
            </div>
            <h2 class="text-xl font-bold tracking-tight text-[var(--color-text-main)]">
              Nasıl Başlamalıyım? Adım Adım Uyum Rehberiniz
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {{ masteryCompletedCount() }} / 4 Görev Tamamlandı
              </div>
              <div class="text-[10px] text-[var(--color-text-muted)]">
                %{{ (masteryCompletedCount() / 4) * 100 }} İlerleme
              </div>
            </div>
            <button
              type="button"
              (click)="toggleMasteryGuide()"
              class="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-xs text-[var(--color-text-muted)] transition-colors cursor-pointer"
              [title]="isMasteryGuideCollapsed() ? 'Rehberi Genişlet' : 'Rehberi Küçült'"
            >
              {{ isMasteryGuideCollapsed() ? '▼ Genişlet' : '▲ Daralt' }}
            </button>
          </div>
        </div>

        @if (!isMasteryGuideCollapsed()) {
          <!-- 4 İnteraktif Adım Kartı -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Adım 1: Kimliğini Keşfet -->
            <div
              class="p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between"
              [class.border-emerald-500/40]="masteryStep1Done()"
              [class.bg-emerald-500/5]="masteryStep1Done()"
              [class.border-[var(--color-border-subtle)]]="!masteryStep1Done()"
              [class.bg-[var(--color-bg-card)]]="!masteryStep1Done()"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-lg">🎯 1. Adım</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-500/20]="masteryStep1Done()"
                    [class.text-emerald-600]="masteryStep1Done()"
                    [class.bg-slate-500/10]="!masteryStep1Done()"
                    [class.text-slate-500]="!masteryStep1Done()"
                  >
                    {{ masteryStep1Done() ? '✓ Tamam' : 'Başla' }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[var(--color-text-main)]">Hedef Kimliğini Seç</h4>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  "Ne yapmak istiyorsun?" yerine "Kime dönüşmek istiyorsun?" diye sor. Her eylem bu
                  kimliğe verilen bir oydur.
                </p>
              </div>

              <button
                type="button"
                (click)="scrollToIdentities()"
                class="w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center"
                [class.border-emerald-500/40]="masteryStep1Done()"
                [class.bg-emerald-500/10]="masteryStep1Done()"
                [class.text-emerald-600]="masteryStep1Done()"
                [class.border-indigo-500/30]="!masteryStep1Done()"
                [class.bg-indigo-50]="!masteryStep1Done()"
                [class.text-indigo-600]="!masteryStep1Done()"
              >
                {{ masteryStep1Done() ? '✓ Kimlikler Aktif' : 'Kimlikleri İncele 👇' }}
              </button>
            </div>

            <!-- Adım 2: 1. Yasa - İşaret & Demetleme -->
            <div
              class="p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between"
              [class.border-emerald-500/40]="masteryStep2Done()"
              [class.bg-emerald-500/5]="masteryStep2Done()"
              [class.border-[var(--color-border-subtle)]]="!masteryStep2Done()"
              [class.bg-[var(--color-bg-card)]]="!masteryStep2Done()"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-lg">📍 2. Adım</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-500/20]="masteryStep2Done()"
                    [class.text-emerald-600]="masteryStep2Done()"
                    [class.bg-slate-500/10]="!masteryStep2Done()"
                    [class.text-slate-500]="!masteryStep2Done()"
                  >
                    {{ masteryStep2Done() ? '✓ Tamam' : 'Keşfet' }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[var(--color-text-main)]">
                  Görünür Kıl (İşaret & Mekan)
                </h4>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  Alışkanlığı günün bir ritüeline ve belirli bir mekana demetle:
                  <em>"Kahvemi içtikten sonra çalışma masamda 15 dk kod yazacağım."</em>
                </p>
              </div>

              <button
                type="button"
                (click)="scrollToHabits()"
                class="w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center"
                [class.border-emerald-500/40]="masteryStep2Done()"
                [class.bg-emerald-500/10]="masteryStep2Done()"
                [class.text-emerald-600]="masteryStep2Done()"
                [class.border-indigo-500/30]="!masteryStep2Done()"
                [class.bg-indigo-50]="!masteryStep2Done()"
                [class.text-indigo-600]="!masteryStep2Done()"
              >
                {{ masteryStep2Done() ? '✓ İşaretler Hazır' : 'Demetleri Gör 👇' }}
              </button>
            </div>

            <!-- Adım 3: 3. Yasa - 2 Dakika Kuralı -->
            <div
              class="p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between"
              [class.border-emerald-500/40]="masteryStep3Done()"
              [class.bg-emerald-500/5]="masteryStep3Done()"
              [class.border-[var(--color-border-subtle)]]="!masteryStep3Done()"
              [class.bg-[var(--color-bg-card)]]="!masteryStep3Done()"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-lg">⚡ 3. Adım</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-500/20]="masteryStep3Done()"
                    [class.text-emerald-600]="masteryStep3Done()"
                    [class.bg-purple-500/10]="!masteryStep3Done()"
                    [class.text-purple-600]="!masteryStep3Done()"
                  >
                    {{ masteryStep3Done() ? '✓ Yapıldı' : 'Dene' }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[var(--color-text-main)]">
                  2-Dakika Kuralını Dene
                </h4>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  Büyük hedefler ertelemeyi doğurur. Sürtünmeyi sıfırla ve sadece ilk 2 dakikalık
                  mikro eylemi tamamla!
                </p>
              </div>

              <button
                type="button"
                (click)="triggerMasteryTwoMinuteQuickAction()"
                [disabled]="masteryStep3Done()"
                class="w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center disabled:opacity-50"
                [class.border-emerald-500/40]="masteryStep3Done()"
                [class.bg-emerald-500/10]="masteryStep3Done()"
                [class.text-emerald-600]="masteryStep3Done()"
                [class.border-purple-500/40]="!masteryStep3Done()"
                [class.bg-purple-600]="!masteryStep3Done()"
                [class.text-white]="!masteryStep3Done()"
              >
                {{ masteryStep3Done() ? '✓ Sürtünme Yenildi' : '⚡ 2 Dk Modunu Dene' }}
              </button>
            </div>

            <!-- Adım 4: Kaizen PDCA - Günü Mühürle -->
            <div
              class="p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between"
              [class.border-emerald-500/40]="masteryStep4Done()"
              [class.bg-emerald-500/5]="masteryStep4Done()"
              [class.border-[var(--color-border-subtle)]]="!masteryStep4Done()"
              [class.bg-[var(--color-bg-card)]]="!masteryStep4Done()"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-lg">🔄 4. Adım</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [class.bg-emerald-500/20]="masteryStep4Done()"
                    [class.text-emerald-600]="masteryStep4Done()"
                    [class.bg-slate-500/10]="!masteryStep4Done()"
                    [class.text-slate-500]="!masteryStep4Done()"
                  >
                    {{ masteryStep4Done() ? '✓ Mühürlendi' : 'Mühürle' }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[var(--color-text-main)]">
                  Kaizen ile Günü Kapat
                </h4>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  Günü kapatırken: "Bugün neyi %1 iyileştirdim?" ve "Hangi israfı (Muda) fark
                  ettim?" diyerek günü mühürle.
                </p>
              </div>

              <button
                type="button"
                (click)="scrollToPdca()"
                class="w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center"
                [class.border-emerald-500/40]="masteryStep4Done()"
                [class.bg-emerald-500/10]="masteryStep4Done()"
                [class.text-emerald-600]="masteryStep4Done()"
                [class.border-emerald-500/30]="!masteryStep4Done()"
                [class.bg-emerald-50]="!masteryStep4Done()"
                [class.text-emerald-600]="!masteryStep4Done()"
              >
                {{ masteryStep4Done() ? '✓ Mühür Kaydedildi' : 'Günü Mühürle 👉' }}
              </button>
            </div>
          </div>
        }
      </section>

      <!-- 💡 DİNAMİK "ŞİMDİ NE YAPMALIYIM?" YÖNLENDİRME ŞERİDİ -->
      <section
        class="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-3">
          <span class="text-xl">💡</span>
          <div>
            <span class="font-bold text-[var(--color-text-main)]">Şimdi Ne Yapmalıyım? </span>
            <span class="text-[var(--color-text-muted)]">
              @if (completionRate() === 0) {
                Günün henüz hiçbir alışkanlığını tamamlamadın. Aşağıdaki görevlerden birine tıkla
                veya "2-Dakika Kuralı" butonunu kullanarak sürtünmesiz ilk adımını at!
              } @else if (completionRate() < 100) {
                Harika ilerliyorsun (%{{ completionRate() }} tamamlandı). Hedefin zinciri kırmamak!
                Kalan alışkanlıkları tamamlayıp günün %1 gelişimini garantile.
              } @else {
                Tebrikler! Günün tüm atomik alışkanlıklarını tamamladın. Şimdi sağ alandaki "Kaizen
                PDCA Döngüsü" kutusuna bugünkü kazanımını yazarak günü mühürle.
              }
            </span>
          </div>
        </div>

        @if (completionRate() < 100) {
          <button
            type="button"
            (click)="scrollToHabits()"
            class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
          >
            Görevlere Git 👇
          </button>
        }
      </section>

      <!-- 2. TEMEL METRİK VE İLERLEME KARTLARI -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Günlük Tamamlama Oranı -->
        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs transition-all hover:border-indigo-500/30"
        >
          <div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span class="font-medium">Günlük Tamamlama</span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400 font-mono"
              >{{ completionRate() }}%</span
            >
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">
            {{ completedHabitsCount() }} / {{ totalHabitsCount() }}
          </div>
          <div class="w-full bg-[var(--color-bg-subtle)] h-2 rounded-full mt-3 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
              [style.width.%]="completionRate()"
            ></div>
          </div>
        </div>

        <!-- Haftalık Kaizen Tutarlılığı -->
        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs transition-all hover:border-emerald-500/30"
        >
          <div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span class="font-medium">Kaizen Tutarlılığı</span>
            <span class="text-emerald-500 font-semibold font-mono">Hedef: %90+</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">
            {{ completionRate() }}%
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-2">
            @if (totalHabitsCount() > 0) {
              Bugün {{ completedHabitsCount() }}/{{ totalHabitsCount() }} görev yapıldı
            } @else {
              Henüz tanımlı görev yok
            }
          </div>
        </div>

        <!-- Kurtarılan Odak Süresi (Muda Önleme) -->
        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs transition-all hover:border-purple-500/30"
        >
          <div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span class="font-medium">Derin Çalışma (Focus)</span>
            <span class="text-purple-500 font-semibold font-mono">Muda -0</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">
            {{ totalFocusMinutes() }} Dk
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-2">
            @if (totalFocusMinutes() > 0) {
              Bugün kazanılan dikkat süresi
            } @else {
              Görev tamamlandıkça artar
            }
          </div>
        </div>

        <!-- Toplam Kaizen XP ve Kimlik Puanı -->
        <div
          class="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs transition-all hover:border-amber-500/30"
        >
          <div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span class="font-medium">Toplam Deneyim</span>
            <span class="text-amber-500 font-semibold font-mono">Kaizen XP</span>
          </div>
          <div class="text-2xl font-bold mt-2 text-[var(--color-text-main)]">
            +{{ totalEarnedPoints() }} XP
          </div>
          <div class="text-xs text-[var(--color-text-muted)] mt-2">
            {{
              totalEarnedPoints() >= 100
                ? 'Kimlik Seviyesi: Lv. 2 (Çırak)'
                : 'Kimlik Seviyesi: Lv. 1 (Başlangıç)'
            }}
          </div>
        </div>
      </section>

      <!-- 3. KİMLİK MATRİSİ: "KİME DÖNÜŞMEK İSTİYORSUN?" (James Clear) -->
      <section
        id="identity-matrix-section"
        class="p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-5"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">🧬</span>
              <h2 class="text-lg font-bold text-[var(--color-text-main)]">
                Kimlik Matrisi (Identity Matrix)
              </h2>
              <span
                class="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                James Clear İlkesi
              </span>
              <button
                type="button"
                (click)="toggleExplainer('identity')"
                class="text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                title="Kimlik matrisi nasıl çalışır?"
              >
                ⓘ Bu Nedir?
              </button>
            </div>
            <p class="text-xs text-[var(--color-text-muted)] mt-1">
              "Her eylem, olmak istediğin insana verilmiş bir oydur." Alışkanlıklarını tamamladıkça
              ilgili kimliğin oy sayısı ve seviyesi yükselir.
            </p>
          </div>
          <div class="text-xs text-[var(--color-text-muted)] font-mono">
            Toplam Verilen Oy:
            <strong class="text-indigo-600 dark:text-indigo-400">{{ totalIdentityVotes() }}</strong>
          </div>
        </div>

        @if (activeExplainer() === 'identity') {
          <div
            class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2 text-[var(--color-text-main)] animate-fade-in"
          >
            <div
              class="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between"
            >
              <span>💡 Kimlik Odaklı Alışkanlık Felsefesi (James Clear)</span>
              <button
                (click)="toggleExplainer('identity')"
                class="text-[var(--color-text-muted)] hover:text-rose-500 cursor-pointer"
              >
                ✕ Kapat
              </button>
            </div>
            <p class="leading-relaxed">
              Çoğu insan hedeflere odaklanır: <em>"50 kitap bitireceğim"</em> ya da
              <em>"10 kilo vereceğim"</em>. Ancak kalıcı değişim kimlikten başlar:
              <em>"Ben her gün okuyan biriyim"</em> veya <em>"Ben sağlıklı yaşayan biriyim"</em>.
              Burada yaptığınız her küçük eylem, o kimliğe verilen somut bir
              <strong>oy</strong> niteliğindedir. Oylar biriktikçe kimlik seviyeniz artar.
            </p>
          </div>
        }

        <!-- Kimlik Kartları Grid (8 Dengeli Yaşam Kimliği) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (identity of identities(); track identity.id) {
            <div
              class="p-4 rounded-2xl border transition-all space-y-3"
              [class.border-indigo-500/30]="selectedIdentityFilter() === identity.id"
              [class.bg-indigo-500/5]="selectedIdentityFilter() === identity.id"
              [class.border-[var(--color-border-subtle)]]="selectedIdentityFilter() !== identity.id"
              [class.bg-[var(--color-bg-subtle)]]="selectedIdentityFilter() !== identity.id"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span
                    class="text-2xl p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]"
                  >
                    {{ identity.icon }}
                  </span>
                  <div>
                    <h3 class="text-xs font-bold text-[var(--color-text-main)]">
                      {{ identity.name }}
                    </h3>
                    <span class="text-[10px] text-[var(--color-text-muted)]"
                      >Seviye {{ identity.level }}</span
                    >
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400"
                  >
                    {{ identity.totalVotes }} Oy
                  </div>
                  <div class="text-[9px] text-[var(--color-text-muted)]">
                    Hedef: {{ identity.votesThreshold }}
                  </div>
                </div>
              </div>

              <p
                class="text-[11px] text-[var(--color-text-muted)] italic text-center px-1 min-h-[32px] flex items-center justify-center"
              >
                "{{ identity.tagline }}"
              </p>

              <!-- Cam Fanus ve 3D Bilye (Misket) Oy Sandığı -->
              <app-glass-marble-jar
                [votes]="identity.totalVotes"
                [threshold]="identity.votesThreshold"
                [color]="identity.color"
                [identityName]="identity.name"
              />
            </div>
          }
        </div>
      </section>

      <!-- 4. YASA DOYURUCU KIL: KATEGORİ ROZETLERİ VE KÜME TERFİ SİSTEMİ -->
      <section
        id="category-tiers-section"
        class="p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base">🏆</span>
              <h2 class="text-lg font-bold text-[var(--color-text-main)]">
                4. Yasa Doyurucu Kıl: Kategori Rozetleri & Küme Terfi Sistemi
              </h2>
              <span
                class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
              >
                Sürdürülebilir Ödül Motoru
              </span>
              <button
                type="button"
                (click)="toggleExplainer('tiers')"
                class="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                title="Küme terfi sistemi nasıl çalışır?"
              >
                ⓘ Küme Sistemi Nedir?
              </button>
            </div>
            <p class="text-xs text-[var(--color-text-muted)] mt-1">
              Görevlerinizi tamamladıkça ilgili kategoride rozet kazanırsınız. Rozetler biriktikçe
              küme atlarsınız:
              <strong class="text-amber-600 dark:text-amber-400">10 Bronz</strong> ➔
              <strong class="text-slate-500 dark:text-slate-300">25 Gümüş</strong> ➔
              <strong class="text-amber-500 dark:text-amber-300">50 Altın</strong> ➔
              <strong class="text-teal-600 dark:text-teal-400">100 Platin</strong> ➔
              <strong class="text-cyan-600 dark:text-cyan-400">💎 Elmas</strong>!
            </p>
          </div>

          <!-- Toplam Rozet Sayacı Rozeti -->
          <div
            class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-xs font-mono shrink-0 shadow-2xs"
          >
            <span class="text-base">🎖️</span>
            <span class="text-[var(--color-text-muted)]">Toplam Rozet:</span>
            <strong class="text-emerald-600 dark:text-emerald-400 text-sm font-black">{{
              totalBadgesEarnedAllCategories()
            }}</strong>
          </div>
        </div>

        @if (activeExplainer() === 'tiers') {
          <div
            class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 text-[var(--color-text-main)]"
          >
            <div
              class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
            >
              <span>💡 4. Yasa (Doyurucu Kıl) Rozet & Küme Kademeleri</span>
              <button
                (click)="toggleExplainer('tiers')"
                class="text-[var(--color-text-muted)] hover:text-rose-500 cursor-pointer"
              >
                ✕ Kapat
              </button>
            </div>
            <p class="leading-relaxed">
              Bir alışkanlığı sürdürmenin en kesin yolu, her eylemin ardından anında tatmin edici
              bir zafer hissi yaşamaktır. Her tamamlanan görev, o kategoride 1 rozet kazandırır ve
              küme ilerleme çubuğunuzu doldurur:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
              <div
                class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-amber-600/30 space-y-1"
              >
                <div class="font-bold text-amber-600 flex items-center gap-1">
                  <span>🥉</span> Bronz Küme
                </div>
                <div class="text-[var(--color-text-muted)]">
                  Başlangıç kademesi. <strong>10 bronz rozet</strong> toplayınca Gümüş'e terfi
                  edersiniz.
                </div>
              </div>
              <div
                class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-slate-400/30 space-y-1"
              >
                <div class="font-bold text-slate-400 flex items-center gap-1">
                  <span>🥈</span> Gümüş Küme
                </div>
                <div class="text-[var(--color-text-muted)]">
                  Gelişim kademesi. Bu kümede <strong>25 gümüş rozet</strong> toplayınca Altın'a
                  terfi edersiniz.
                </div>
              </div>
              <div
                class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-amber-400/30 space-y-1"
              >
                <div class="font-bold text-amber-400 flex items-center gap-1">
                  <span>🥇</span> Altın Küme
                </div>
                <div class="text-[var(--color-text-muted)]">
                  Ustalık kademesi. Bu kümede <strong>50 altın rozet</strong> toplayınca Platin'e
                  terfi edersiniz.
                </div>
              </div>
              <div
                class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-teal-400/30 space-y-1"
              >
                <div class="font-bold text-teal-400 flex items-center gap-1">
                  <span>💠</span> Platin Küme
                </div>
                <div class="text-[var(--color-text-muted)]">
                  İleri ustalık. Bu kümede <strong>100 platin rozet</strong> toplayınca Elmas'a
                  terfi edersiniz.
                </div>
              </div>
              <div
                class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-cyan-400/30 space-y-1"
              >
                <div class="font-bold text-cyan-400 flex items-center gap-1">
                  <span>💎</span> Elmas Küme
                </div>
                <div class="text-[var(--color-text-muted)]">
                  Zirve Grandmaster. Kategorinin tartışmasız efsane seviyesi.
                </div>
              </div>
            </div>
          </div>
        }

        <!-- 8 Kategori Kartı Grid (Üstten Ataçla Tutturulan Küme Tag Tasarımı) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-3">
          @for (tier of categoryTiers(); track tier.category) {
            <div
              class="relative pt-6 pb-4 px-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] transition-all space-y-3 group shadow-2xs hover:shadow-xs"
            >
              <!-- Üstten Tutturulan Ataç ve Küme Rozet Tag'i (Paperclip Attached Tier Tag) -->
              <div
                class="absolute -top-3.5 right-4 z-20 flex flex-col items-center pointer-events-none"
              >
                <!-- Gerçekçi Ataç (Paperclip) Teli -->
                <div
                  class="relative -mb-2.5 z-30 transition-transform group-hover:-translate-y-0.5"
                  [ngClass]="getTierPaperclipStyle(tier.currentTier)"
                >
                  <svg
                    class="w-4 h-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
                    viewBox="0 0 16 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 2C2.79 2 1 3.79 1 6V18C1 21.31 3.69 24 7 24C10.31 24 13 21.31 13 18V4C13 2.34 11.66 1 10 1C8.34 1 7 2.34 7 4V17C7 17.55 7.45 18 8 18C8.55 18 9 17.55 9 17V7"
                      stroke="currentColor"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>

                <!-- Ataçla Tutturulan Küme Tag'i -->
                <div
                  class="px-2.5 py-1 pt-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border backdrop-blur-md transition-all group-hover:scale-105"
                  [ngClass]="getTierBadgeStyle(tier.currentTier)"
                >
                  <span class="text-xs">{{ tier.currentTierIcon }}</span>
                  <span class="text-[11px] tracking-tight font-black">{{
                    tier.currentTierName
                  }}</span>
                </div>
              </div>

              <!-- Kart Gövdesi: İkon, Kategori Adı ve Toplam Rozet -->
              <div class="flex items-center justify-between pr-2">
                <div class="flex items-center gap-2.5">
                  <span
                    class="text-2xl p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] group-hover:scale-110 transition-transform"
                  >
                    {{ tier.icon }}
                  </span>
                  <div>
                    <h3
                      class="text-xs font-bold text-[var(--color-text-main)] truncate max-w-[130px]"
                    >
                      {{ tier.categoryDisplayName }}
                    </h3>
                    <div class="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <span>Toplam:</span>
                      <strong class="font-mono text-emerald-600 dark:text-emerald-400"
                        >{{ tier.totalBadgesEarned }} Rozet</strong
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- İlerleme Çubuğu ve Sonraki Küme Eşiği -->
              <div class="space-y-1.5 pt-1">
                <div
                  class="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]"
                >
                  <span>
                    Küme İçi:
                    <strong class="text-[var(--color-text-main)]">{{
                      tier.currentTierBadgeCount
                    }}</strong>
                    / {{ tier.nextTierRequiredCount > 0 ? tier.nextTierRequiredCount : '∞' }}
                  </span>
                  @if (tier.nextTierRequiredCount > 0) {
                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      Hedef: {{ tier.nextTierName }} ({{
                        tier.nextTierRequiredCount - tier.currentTierBadgeCount
                      }}
                      kaldı)
                    </span>
                  } @else {
                    <span class="text-cyan-500 font-bold font-mono">💎 Zirve Seviye</span>
                  }
                </div>

                <div
                  class="w-full bg-[var(--color-bg-card)] h-2 rounded-full overflow-hidden border border-[var(--color-border-subtle)]"
                >
                  <div
                    class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500 rounded-full"
                    [style.width.%]="tier.progressPercentage"
                  ></div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 5. DÖRT DAVRANIŞ DEĞİŞİMİ YASASI İLE ALIŞKANLIK LİSTESİ -->
      <section id="habits-section" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sol 2 Kolon: Alışkanlıklar Listesi & 4 Yasa Kartları -->
        <div class="lg:col-span-2 space-y-6">
          <div
            class="p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-6"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold text-[var(--color-text-main)]">
                    Günün 4 Yasa Alışkanlıkları
                  </h2>
                  <button
                    type="button"
                    (click)="toggleExplainer('fourLaws')"
                    class="text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                    title="4 Yasa Metodolojisi Nedir?"
                  >
                    ⓘ 4 Yasa Nedir?
                  </button>
                </div>
                <p class="text-xs text-[var(--color-text-muted)]">
                  Görünür Kıl (İşaret) ➔ Çekici Kıl (İstek) ➔ Kolaylaştır (2 Dakika) ➔ Doyurucu Kıl
                  (Ödül)
                </p>
              </div>

              <!-- Hızlı Ekleme Butonu -->
              <button
                type="button"
                (click)="toggleAddHabitForm()"
                class="px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <span>➕</span>
                <span>{{ showAddHabitForm() ? 'Vazgeç' : 'Yeni Atomik Alışkanlık' }}</span>
              </button>
            </div>

            @if (activeExplainer() === 'fourLaws') {
              <div
                class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2 text-[var(--color-text-main)]"
              >
                <div
                  class="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between"
                >
                  <span>💡 4 Davranış Değişimi Yasası Nasıl Çalışır?</span>
                  <button
                    (click)="toggleExplainer('fourLaws')"
                    class="text-[var(--color-text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    ✕ Kapat
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] leading-relaxed">
                  <div
                    class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] space-y-1"
                  >
                    <div class="font-bold text-indigo-600 dark:text-indigo-400">
                      1. Görünür Kıl (İşaret / Cue)
                    </div>
                    <p class="text-[var(--color-text-muted)]">
                      Alışkanlığı günün mevcut bir rutinine demetleyin:
                      <em>"Kahvemi içtikten sonra 15 dk kod yazacağım."</em>
                    </p>
                  </div>
                  <div
                    class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] space-y-1"
                  >
                    <div class="font-bold text-amber-600 dark:text-amber-400">
                      2. Çekici Kıl (İstek / Craving)
                    </div>
                    <p class="text-[var(--color-text-muted)]">
                      Neden yaptığınızı ve olmak istediğiniz kimliği zihinde canlandırarak dopamin
                      motivasyonunu tetikleyin.
                    </p>
                  </div>
                  <div
                    class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] space-y-1"
                  >
                    <div class="font-bold text-purple-600 dark:text-purple-400">
                      3. Kolaylaştır (2-Dakika Kuralı)
                    </div>
                    <p class="text-[var(--color-text-muted)]">
                      Başlama sürtünmesini sıfırlayın. Devasa bir hedef yerine sadece ilk 2
                      dakikalık mikro eyleme odaklanın.
                    </p>
                  </div>
                  <div
                    class="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] space-y-1"
                  >
                    <div class="font-bold text-emerald-600 dark:text-emerald-400">
                      4. Doyurucu Kıl (Ödül / Reward)
                    </div>
                    <p class="text-[var(--color-text-muted)]">
                      Tamamladığınızda anında XP ve kategori rozeti kazanın. Rozetler biriktikçe
                      Bronz ➔ Gümüş ➔ Altın ➔ Platin ➔ Elmas kümelerine terfi edin!
                    </p>
                  </div>
                </div>
              </div>
            }

            <!-- Yeni Alışkanlık Ekleme Formu (Alışkanlık yoksa doğrudan hazır, varsa butonla açılır) -->
            @if (habits().length === 0 || showAddHabitForm()) {
              <div
                class="p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-[var(--color-bg-card)] to-purple-500/5 shadow-xs space-y-5"
              >
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <div
                      class="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"
                    >
                      <span>✨</span>
                      <span>{{
                        habits().length === 0
                          ? 'İlk Atomik Alışkanlığını Tanımla'
                          : 'Yeni Atomik Alışkanlık Tasarla'
                      }}</span>
                    </div>
                    <h3 class="text-sm font-bold text-[var(--color-text-main)]">
                      {{
                        habits().length === 0
                          ? 'Kendi ritüelini belirle ve 4 Davranış Değişimi Yasası ile gününü inşa et'
                          : '4 Davranış Değişimi Yasası Standardında Yeni Görev'
                      }}
                    </h3>
                  </div>
                  @if (habits().length > 0) {
                    <button
                      type="button"
                      (click)="toggleAddHabitForm()"
                      class="text-xs text-[var(--color-text-muted)] hover:text-rose-500 cursor-pointer p-1"
                    >
                      ✕ Kapat
                    </button>
                  }
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Görev / Aktivite Türü (Kategori Seçimi) -->
                  <div class="sm:col-span-2 space-y-2">
                    <div class="flex items-center justify-between">
                      <label
                        class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1.5"
                      >
                        <span>🏷️</span>
                        <span>Aktivite Türü & Kategori</span>
                        <span class="text-rose-500">*</span>
                      </label>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      @for (cat of habitCategories; track cat.key) {
                        <button
                          type="button"
                          (click)="selectCategory(cat.key)"
                          class="p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 text-left"
                          [class.border-indigo-500]="newHabitCategory === cat.key"
                          [class.bg-indigo-500/10]="newHabitCategory === cat.key"
                          [class.text-indigo-600]="newHabitCategory === cat.key"
                          [class.dark:text-indigo-400]="newHabitCategory === cat.key"
                          [class.shadow-2xs]="newHabitCategory === cat.key"
                          [class.border-[var(--color-border-subtle)]]="newHabitCategory !== cat.key"
                          [class.bg-[var(--color-bg-card)]]="newHabitCategory !== cat.key"
                          [class.text-[var(--color-text-muted)]]="newHabitCategory !== cat.key"
                          [class.hover:border-indigo-500/40]="newHabitCategory !== cat.key"
                        >
                          <span class="text-base">{{ cat.icon }}</span>
                          <span class="truncate">{{ cat.label }}</span>
                        </button>
                      }
                    </div>

                    <!-- Kategoriye Özel Hızlı İlham Önerileri -->
                    @if (activeCategoryInspirations().length > 0) {
                      <div
                        class="p-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-1.5 flex-wrap"
                      >
                        <span
                          class="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1 shrink-0"
                        >
                          <span>💡</span>
                          <span>Hızlı Fikirler:</span>
                        </span>
                        @for (insp of activeCategoryInspirations(); track insp.title) {
                          <button
                            type="button"
                            (click)="applyInspiration(insp)"
                            class="px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-medium text-[var(--color-text-muted)] transition-all cursor-pointer shadow-2xs"
                            title="Tıklayarak forma aktar"
                          >
                            + {{ insp.title }}
                          </button>
                        }
                      </div>
                    }
                  </div>

                  <!-- 1. Adım: Ne Yapmak İstiyorsun? -->
                  <div class="space-y-1.5">
                    <label
                      class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                    >
                      <span>1️⃣</span>
                      <span>Ne Yapmak İstiyorsun? (Alışkanlık Başlığı)</span>
                      <span class="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="newHabitTitle"
                      placeholder="Örn: 20 sayfa teknik kitap oku, 15 dk yürüyüş..."
                      class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
                    />
                  </div>

                  <!-- Bağlı Hedef Kimlik -->
                  <div class="space-y-1.5">
                    <label
                      class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                    >
                      <span>🎯</span>
                      <span>Hangi Kimliğine Oy Vereceksin?</span>
                    </label>
                    <select
                      [(ngModel)]="newHabitIdentityId"
                      class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-2xs"
                    >
                      @for (identity of identities(); track identity.id) {
                        <option [value]="identity.id">
                          {{ identity.icon }} {{ identity.name }}
                        </option>
                      }
                    </select>
                  </div>

                  <!-- 2. Adım: Ne Zaman? (İşaret / Tetikleyici) -->
                  <div class="space-y-1.5">
                    <label
                      class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                    >
                      <span>2️⃣</span>
                      <span>Ne Zaman? (1. Yasa: Zaman İşareti)</span>
                      <span class="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="newHabitCue"
                      placeholder="Örn: Sabah ilk kahvemi aldıktan hemen sonra..."
                      class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-2xs"
                    />
                  </div>

                  <!-- 3. Adım: 2-Dakika Kuralı Mikro Adımı -->
                  <div class="space-y-1.5">
                    <label
                      class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                    >
                      <span>3️⃣</span>
                      <span>İlk 2-Dakika Adımı (3. Yasa: Kolaylaştır)</span>
                      <span class="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="newHabitMicroStep"
                      placeholder="Örn: Kitabı masaya koy ve sadece 1 sayfa oku..."
                      class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-2xs"
                    />
                  </div>

                  <!-- Mekan / Çevre Tasarımı (1. Yasa) -->
                  <div class="space-y-2 sm:col-span-2">
                    <div class="flex items-center justify-between">
                      <label
                        class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                      >
                        <span>📍</span>
                        <span>Nerede? (1. Yasa: Mekan & Çevre Tasarımı)</span>
                      </label>
                      <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium"
                        >Hızlı Mekan Seçimi 👇</span
                      >
                    </div>

                    <!-- Hızlı Mekan Seçim Butonları -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (loc of suggestedLocations; track loc.label) {
                        <button
                          type="button"
                          (click)="setLocation(loc.label)"
                          class="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
                          [class.border-indigo-500]="newHabitLocation === loc.label"
                          [class.bg-indigo-500/10]="newHabitLocation === loc.label"
                          [class.text-indigo-600]="newHabitLocation === loc.label"
                          [class.border-[var(--color-border-subtle)]]="
                            newHabitLocation !== loc.label
                          "
                          [class.bg-[var(--color-bg-card)]]="newHabitLocation !== loc.label"
                          [class.text-[var(--color-text-muted)]]="newHabitLocation !== loc.label"
                        >
                          <span>{{ loc.icon }}</span>
                          <span>{{ loc.label }}</span>
                        </button>
                      }
                    </div>

                    <input
                      type="text"
                      [(ngModel)]="newHabitLocation"
                      placeholder="Örn: Çalışma Masası / IDE, Sessiz Oda, Açık Park, Mutfak..."
                      class="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-2xs"
                    />
                  </div>

                  <!-- Hedef Süre / Pomodoro Belirleme (1. İster) -->
                  <div class="space-y-2 sm:col-span-2">
                    <div class="flex items-center justify-between">
                      <label
                        class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1.5"
                      >
                        <span>⏱️</span>
                        <span>Ne Kadar Süre? (Pomodoro Odak Süresi)</span>
                        <span class="text-rose-500">*</span>
                      </label>
                      <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium"
                        >Önerilen Süreler 👇</span
                      >
                    </div>

                    <!-- Hızlı Süre Preset Butonları -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (preset of durationPresets; track preset.minutes) {
                        <button
                          type="button"
                          (click)="setTargetMinutes(preset.minutes)"
                          class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          [class.border-indigo-500]="newHabitTargetMinutes === preset.minutes"
                          [class.bg-indigo-500/10]="newHabitTargetMinutes === preset.minutes"
                          [class.text-indigo-600]="newHabitTargetMinutes === preset.minutes"
                          [class.dark:text-indigo-400]="newHabitTargetMinutes === preset.minutes"
                          [class.border-[var(--color-border-subtle)]]="
                            newHabitTargetMinutes !== preset.minutes
                          "
                          [class.bg-[var(--color-bg-card)]]="
                            newHabitTargetMinutes !== preset.minutes
                          "
                          [class.text-[var(--color-text-muted)]]="
                            newHabitTargetMinutes !== preset.minutes
                          "
                        >
                          <span>⏱️</span>
                          <span>{{ preset.label }}</span>
                        </button>
                      }
                    </div>

                    <!-- Özel Süre Girişi -->
                    <div class="flex items-center gap-2 pt-1">
                      <span class="text-xs text-[var(--color-text-muted)] font-medium"
                        >Veya Özel Süre Gir:</span
                      >
                      <input
                        type="number"
                        min="1"
                        max="180"
                        [(ngModel)]="newHabitTargetMinutes"
                        class="w-20 px-3 py-1.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-center font-bold shadow-2xs focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <span class="text-xs text-[var(--color-text-muted)] font-medium">dakika</span>
                    </div>
                  </div>

                  <!-- Canlı James Clear Uygulama Niyeti Formülü -->
                  <div
                    class="sm:col-span-2 p-3.5 rounded-2xl bg-[var(--color-bg-card)] border border-indigo-500/20 text-xs text-[var(--color-text-muted)] flex items-start gap-2.5 shadow-xs"
                  >
                    <span class="text-base shrink-0">📌</span>
                    <div class="leading-relaxed">
                      <strong class="text-indigo-600 dark:text-indigo-400"
                        >James Clear Uygulama Niyeti Formülü:</strong
                      >
                      <div class="mt-0.5 italic text-[var(--color-text-main)]">
                        "<strong>{{ newHabitCue.trim() || '[ZAMAN / TETİKLEYİCİ]' }}</strong
                        >,
                        <strong class="text-indigo-600 dark:text-indigo-400"
                          >📍 {{ newHabitLocation.trim() || '[MEKAN]' }}</strong
                        >
                        konumunda
                        <strong>{{ newHabitTitle.trim() || '[ALIŞKANLIK]' }}</strong> eylemini
                        <strong class="text-emerald-600 dark:text-emerald-400"
                          >⏱️ {{ newHabitTargetMinutes }} dakika</strong
                        >
                        boyunca odaklanarak gerçekleştireceğim."
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]"
                >
                  <button
                    type="button"
                    (click)="addHabit()"
                    [disabled]="!newHabitTitle.trim()"
                    class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-2"
                  >
                    <span>✨</span>
                    <span>Alışkanlığı Kaydet (+20 XP)</span>
                  </button>
                </div>
              </div>
            }

            <!-- Alışkanlıklar Listesi (Varsa) -->
            @if (habits().length > 0) {
              <div class="space-y-4">
                @for (habit of habits(); track habit.id) {
                  <div
                    class="group p-5 rounded-2xl border transition-all duration-300 space-y-4 shadow-xs"
                    [ngClass]="getHabitCardStatusClass(habit)"
                  >
                    <!-- Üst Başlık & Checkbox & Statü Satırı -->
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-3.5 flex-1 min-w-0">
                        <!-- Tıklanabilir Checkbox -->
                        <button
                          type="button"
                          (click)="toggleHabit(habit.id)"
                          class="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer"
                          [class.bg-cyan-500]="habit.completed"
                          [class.border-cyan-500]="habit.completed"
                          [class.text-white]="habit.completed"
                          [class.border-[var(--color-border-subtle)]]="!habit.completed"
                          [class.bg-[var(--color-bg-card)]]="!habit.completed"
                          [attr.aria-label]="habit.title"
                          [title]="
                            habit.completed
                              ? 'Tamamlanmayı Geri Al'
                              : 'Alışkanlığı Tamamla & Rozeti Kazan'
                          "
                        >
                          @if (habit.completed) {
                            <span class="text-xs font-bold">✓</span>
                          }
                        </button>

                        <!-- Başlık, Kategori, Statü ve Mekan -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <h3
                              class="text-sm font-bold transition-all"
                              [class.line-through]="habit.completed"
                              [class.text-[var(--color-text-muted)]]="habit.completed"
                              [class.text-[var(--color-text-main)]]="!habit.completed"
                            >
                              {{ habit.title }}
                            </h3>

                            <!-- Statü Rozeti (HAZIR / DEVAM EDİYOR / DURAKLATILDI / TAMAMLANDI) -->
                            <span
                              class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all"
                              [ngClass]="getHabitStatusBadgeClass(habit.timerStatus)"
                            >
                              @if (habit.timerStatus === 'HAZIR') {
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span>HAZIR</span>
                              } @else if (habit.timerStatus === 'DEVAM_EDIYOR') {
                                <span
                                  class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"
                                ></span>
                                <span>DEVAM EDİYOR</span>
                              } @else if (habit.timerStatus === 'DURAKLATILDI') {
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>DURAKLATILDI</span>
                              } @else if (habit.timerStatus === 'TAMAMLANDI') {
                                <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                <span>✓ TAMAMLANDI</span>
                              }
                            </span>

                            <!-- Kategori Rozeti -->
                            <span
                              class="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                              [ngClass]="getCategoryBadgeClass(habit.category)"
                            >
                              {{ habit.categoryLabel }}
                            </span>

                            <!-- 1. Yasa Mekan Rozeti -->
                            <span
                              class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                              title="1. Yasa: Gerçekleşeceği Mekan / Çevre"
                            >
                              <span>📍</span>
                              <span>{{ habit.targetLocation }}</span>
                            </span>
                          </div>

                          <!-- 4 Yasa İpuçları -->
                          <div class="mt-2 space-y-1 text-xs">
                            <!-- 1. Yasa: Zaman ve Mekan -->
                            <div
                              class="flex items-center gap-1.5 text-[var(--color-text-muted)] flex-wrap"
                            >
                              <span class="font-bold text-indigo-600 dark:text-indigo-400"
                                >📍 1. Yasa:</span
                              >
                              <span>{{ habit.cue }}</span>
                              <span class="text-indigo-500 font-semibold">• Mekan:</span>
                              <span class="text-[var(--color-text-main)] font-medium">{{
                                habit.targetLocation
                              }}</span>
                            </div>

                            <!-- 2. Yasa: Çekici Kıl -->
                            <div class="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                              <span class="font-bold text-amber-600 dark:text-amber-400"
                                >🎯 2. Yasa (Neden):</span
                              >
                              <span>{{ habit.craving }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- XP Puanı, Sil Butonu & 2 Dakika Kuralı -->
                      <div class="flex flex-col items-end gap-2 shrink-0">
                        <div class="flex items-center gap-1.5">
                          <span
                            class="text-xs font-bold font-mono px-2 py-1 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-indigo-600 dark:text-indigo-400"
                          >
                            +{{ habit.rewardXp }} XP
                          </span>
                          <button
                            type="button"
                            (click)="deleteHabit(habit.id, $event)"
                            class="p-1 rounded-md text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Alışkanlığı Sil"
                            aria-label="Alışkanlığı Sil"
                          >
                            <svg
                              class="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        @if (!habit.completed) {
                          <button
                            type="button"
                            (click)="toggleTwoMinuteMode(habit.id)"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer"
                            [class.border-purple-500/40]="habit.twoMinuteModeActive"
                            [class.bg-purple-500/10]="habit.twoMinuteModeActive"
                            [class.text-purple-600]="habit.twoMinuteModeActive"
                            [class.border-[var(--color-border-subtle)]]="!habit.twoMinuteModeActive"
                            [class.bg-[var(--color-bg-card)]]="!habit.twoMinuteModeActive"
                            [class.text-[var(--color-text-muted)]]="!habit.twoMinuteModeActive"
                            title="Görevi 2 dakikalık mikro başlangıca indirge"
                          >
                            ⚡ 2-Dakika Kuralı
                          </button>
                        }
                      </div>
                    </div>

                    <!-- 2 Dakika Kuralı Açıldığında Görünen Mikro-Adım -->
                    @if (habit.twoMinuteModeActive && !habit.completed) {
                      <div
                        class="p-3 rounded-xl border border-dashed transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        [class.border-emerald-500/40]="habit.microStepDone"
                        [class.bg-emerald-500/5]="habit.microStepDone"
                        [class.border-purple-500/40]="!habit.microStepDone"
                        [class.bg-purple-500/5]="!habit.microStepDone"
                      >
                        <div class="flex items-center gap-2">
                          @if (habit.microStepDone) {
                            <span
                              class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0"
                              >✓</span
                            >
                          }
                          <div>
                            <strong
                              [class.text-emerald-600]="habit.microStepDone"
                              [class.dark:text-emerald-400]="habit.microStepDone"
                              [class.text-purple-600]="!habit.microStepDone"
                              [class.dark:text-purple-400]="!habit.microStepDone"
                            >
                              Sürtünmesiz Mikro Başlangıç:
                            </strong>
                            <span
                              class="text-[var(--color-text-muted)] ml-1 transition-all"
                              [class.line-through]="habit.microStepDone"
                              [class.opacity-60]="habit.microStepDone"
                            >
                              {{ habit.twoMinuteMicroStep }}
                            </span>
                            @if (habit.microStepDone) {
                              <span
                                class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2 inline-flex items-center gap-1"
                              >
                                <span>✓ Tamamlandı</span>
                              </span>
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="completeViaMicroStep(habit.id)"
                          class="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1"
                          [class.bg-emerald-600]="habit.microStepDone"
                          [class.hover:bg-emerald-700]="habit.microStepDone"
                          [class.text-white]="habit.microStepDone"
                          [class.bg-purple-600]="!habit.microStepDone"
                          [class.hover:bg-purple-700]="!habit.microStepDone"
                          [class.text-white]="!habit.microStepDone"
                          [title]="
                            habit.microStepDone
                              ? 'Mikro adımı geri almak için tıklayın'
                              : 'Mikro adımı tamamlandı olarak işaretleyin'
                          "
                        >
                          @if (habit.microStepDone) {
                            <span>✓ Mikro Adım Yapıldı</span>
                          } @else {
                            <span>Mikro Adımı Yaptım ✓</span>
                          }
                        </button>
                      </div>
                    }

                    <!-- POMODORO SAYACI ENTEGRASYONU -->
                    <div
                      class="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <!-- Sol: Sayaç Göstergesi ve İlerleme Çubuğu -->
                      <div class="flex items-center gap-3">
                        <div
                          class="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] flex items-center justify-center shrink-0"
                        >
                          <span class="text-xl">⏱️</span>
                        </div>
                        <div class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-[var(--color-text-muted)]"
                              >Pomodoro:</span
                            >
                            <span
                              class="text-base font-extrabold font-mono tracking-wider"
                              [class.text-blue-600]="habit.timerStatus === 'HAZIR'"
                              [class.dark:text-blue-400]="habit.timerStatus === 'HAZIR'"
                              [class.text-emerald-600]="habit.timerStatus === 'DEVAM_EDIYOR'"
                              [class.dark:text-emerald-400]="habit.timerStatus === 'DEVAM_EDIYOR'"
                              [class.text-amber-600]="habit.timerStatus === 'DURAKLATILDI'"
                              [class.dark:text-amber-400]="habit.timerStatus === 'DURAKLATILDI'"
                              [class.text-cyan-600]="habit.timerStatus === 'TAMAMLANDI'"
                              [class.dark:text-cyan-400]="habit.timerStatus === 'TAMAMLANDI'"
                            >
                              {{ formatTime(habit.remainingSeconds) }}
                            </span>
                            <span class="text-[10px] text-[var(--color-text-muted)]"
                              >/ {{ habit.targetMinutes }} dk</span
                            >
                          </div>

                          <!-- İlerleme Çubuğu -->
                          <div
                            class="w-36 sm:w-44 bg-[var(--color-bg-subtle)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]"
                          >
                            <div
                              class="h-full transition-all duration-300 rounded-full"
                              [class.bg-blue-500]="habit.timerStatus === 'HAZIR'"
                              [class.bg-emerald-500]="habit.timerStatus === 'DEVAM_EDIYOR'"
                              [class.bg-amber-500]="habit.timerStatus === 'DURAKLATILDI'"
                              [class.bg-cyan-500]="habit.timerStatus === 'TAMAMLANDI'"
                              [style.width.%]="getTimerProgressPercent(habit)"
                            ></div>
                          </div>
                        </div>
                      </div>

                      <!-- Sağ: Sayaç Kontrol Butonları & Hızlı Süre Ekleme -->
                      <div class="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                        @if (habit.timerStatus === 'HAZIR') {
                          <button
                            type="button"
                            (click)="startPomodoro(habit.id)"
                            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Pomodoro Sayacını Başlat"
                          >
                            <span>▶️</span>
                            <span>Başlat</span>
                          </button>
                        } @else if (habit.timerStatus === 'DEVAM_EDIYOR') {
                          <button
                            type="button"
                            (click)="pausePomodoro(habit.id)"
                            class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Sayacı Duraklat"
                          >
                            <span>⏸️</span>
                            <span>Duraklat</span>
                          </button>
                          <button
                            type="button"
                            (click)="resetPomodoro(habit.id)"
                            class="px-2 py-1.5 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] text-xs font-medium transition-all cursor-pointer"
                            title="Sayacı Sıfırla"
                          >
                            🔄
                          </button>
                        } @else if (habit.timerStatus === 'DURAKLATILDI') {
                          <button
                            type="button"
                            (click)="startPomodoro(habit.id)"
                            class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Sayaca Devam Et"
                          >
                            <span>▶️</span>
                            <span>Devam Et</span>
                          </button>
                          <button
                            type="button"
                            (click)="resetPomodoro(habit.id)"
                            class="px-2 py-1.5 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] text-xs font-medium transition-all cursor-pointer"
                            title="Sayacı Başa Al"
                          >
                            🔄
                          </button>
                          <button
                            type="button"
                            (click)="completeHabit(habit.id)"
                            class="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Görevi Şimdi Tamamla ve Rozeti Al"
                          >
                            <span>✓</span>
                            <span>Tamamla</span>
                          </button>
                        } @else if (habit.timerStatus === 'TAMAMLANDI') {
                          <span
                            class="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1"
                          >
                            <span>🎉</span>
                            <span>Tamamlandı (+{{ habit.rewardXp }} XP)</span>
                          </span>
                          <button
                            type="button"
                            (click)="resetPomodoro(habit.id)"
                            class="px-2 py-1 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] text-[10px] font-medium transition-all cursor-pointer"
                            title="Sayacı Tekrar Başlatmak İçin Sıfırla"
                          >
                            🔄 Yeniden Başlat
                          </button>
                        }

                        <!-- Hızlı Ek Süre Butonları (Tamamlanmamışsa) -->
                        @if (habit.timerStatus !== 'TAMAMLANDI') {
                          <div
                            class="flex items-center gap-1 pl-1 border-l border-[var(--color-border-subtle)]"
                          >
                            <button
                              type="button"
                              (click)="addExtraTime(habit.id, 5)"
                              class="px-2 py-1 rounded-lg border border-[var(--color-border-subtle)] hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-bold text-[var(--color-text-muted)] transition-all cursor-pointer"
                              title="+5 Dakika Ekle"
                            >
                              +5 Dk
                            </button>
                            <button
                              type="button"
                              (click)="addExtraTime(habit.id, 10)"
                              class="px-2 py-1 rounded-lg border border-[var(--color-border-subtle)] hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-bold text-[var(--color-text-muted)] transition-all cursor-pointer"
                              title="+10 Dakika Ekle"
                            >
                              +10 Dk
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Günün Başarı Kutlaması (100% Tamamlandığında) -->
            @if (completionRate() === 100 && totalHabitsCount() > 0) {
              <div
                class="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs"
              >
                <span class="text-2xl">🏆</span>
                <div>
                  <div class="font-bold text-sm">
                    Tebrikler! Günün Tüm Atomik Alışkanlıkları Tamamlandı!
                  </div>
                  <div class="opacity-90">
                    Bugünkü %1'lik Kaizen dönüşümünü başarıyla mühürledin ve zinciri korudun.
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Sağ Kolon: Kaizen PDCA Retrospektifi & Bilgelik Kartları -->
        <div class="space-y-6">
          <!-- KAIZEN PDCA DÖNGÜSÜ KARTI (Planla - Uygula - Kontrol Et - Önlem Al) -->
          <div
            id="pdca-section"
            class="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-base">🔄</span>
                <h3 class="text-base font-bold text-[var(--color-text-main)]">
                  Kaizen PDCA Döngüsü
                </h3>
                <button
                  type="button"
                  (click)="toggleExplainer('pdca')"
                  class="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                  title="Kaizen PDCA Döngüsü Nedir?"
                >
                  ⓘ Nedir?
                </button>
              </div>
              <span
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                Sürekli İyileşme
              </span>
            </div>

            @if (activeExplainer() === 'pdca') {
              <div
                class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 text-[var(--color-text-main)]"
              >
                <div
                  class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
                >
                  <span>🔄 Planla ➔ Uygula ➔ Kontrol Et ➔ Önlem Al</span>
                  <button
                    (click)="toggleExplainer('pdca')"
                    class="text-[var(--color-text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    ✕ Kapat
                  </button>
                </div>
                <p class="text-[11px] leading-relaxed">
                  Kaizen, Japonca <em>"sürekli iyileştirme"</em> demektir. Gün sonunda retrospektif
                  yaparak bugün kazandığınız %1'lik gelişmeyi mühürleyin. Fark ettiğiniz odak
                  israflarını (Muda) kaydederek yarın tekrarlamamak üzere önlem alın.
                </p>
              </div>
            }

            <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Günün sonunda retrospektif yapın. İsrafları (Muda) eleyerek yarın için önlem alın.
            </p>

            <div class="space-y-3 text-xs">
              <div class="space-y-1">
                <label class="font-semibold text-[var(--color-text-main)]"
                  >Bugün neyi %1 daha iyi yaptın?</label
                >
                <input
                  type="text"
                  [(ngModel)]="kaizenReflectionInput"
                  placeholder="Örn: Sabah telefon bildirimlerini kapalı tuttum..."
                  class="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div class="space-y-1">
                <label class="font-semibold text-[var(--color-text-main)]"
                  >Fark edilen Muda (Odak İsrafı):</label
                >
                <input
                  type="text"
                  [(ngModel)]="mudaInput"
                  placeholder="Örn: Sosyal medyada amaçsız 25 dk harcandı..."
                  class="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-text-main)] focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <button
                type="button"
                (click)="saveDailyReflection()"
                class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all cursor-pointer shadow-xs"
              >
                Günü Mühürle & Kaydet (+30 XP)
              </button>
            </div>
          </div>

          <!-- GÜNÜN KAİZEN & FELSEFE ALINTISI -->
          <div
            class="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-gradient-to-br from-indigo-500/5 via-[var(--color-bg-card)] to-purple-500/5 shadow-xs space-y-4"
          >
            <div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span class="font-semibold uppercase tracking-wider text-[10px] text-indigo-500"
                >Günün İlhamı</span
              >
              <button
                type="button"
                (click)="nextQuote()"
                class="hover:text-[var(--color-text-main)] transition-colors cursor-pointer text-xs"
                title="Yeni Alıntı"
              >
                🔄 Değiştir
              </button>
            </div>

            <blockquote
              class="text-sm font-medium italic text-[var(--color-text-main)] leading-relaxed"
            >
              "{{ activeQuote().text }}"
            </blockquote>

            <div
              class="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)] text-xs"
            >
              <span class="font-bold text-[var(--color-text-main)]">{{
                activeQuote().author
              }}</span>
              <span class="text-[10px] text-[var(--color-text-muted)]">{{
                activeQuote().source
              }}</span>
            </div>
          </div>

          <!-- HIZLI ERİŞİM KISAYOLLARI -->
          <div
            class="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs space-y-3"
          >
            <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Kısayollar
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <a
                routerLink="/users/profile"
                class="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] transition-colors text-xs font-medium text-center flex flex-col items-center gap-1.5 text-[var(--color-text-main)]"
              >
                <span class="text-base">⚙️</span>
                <span>Profil & Güvenlik</span>
              </a>
              <a
                routerLink="/home"
                class="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] transition-colors text-xs font-medium text-center flex flex-col items-center gap-1.5 text-[var(--color-text-main)]"
              >
                <span class="text-base">📖</span>
                <span>Felsefe Dokümanı</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. SÜRE DOLDU UYARI POPUP'I (POMODORO NOTIFICATION MODAL) -->
      @if (timeExpiredModalHabit(); as expiredHabit) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            class="max-w-md w-full rounded-3xl border border-indigo-500/30 bg-[var(--color-bg-card)] p-6 space-y-5 shadow-2xl text-[var(--color-text-main)]"
          >
            <!-- Modal Başlık Satırı -->
            <div
              class="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-2xl animate-bounce">⏰</span>
                <div>
                  <h3 class="text-base font-bold text-[var(--color-text-main)]">
                    Süre Doldu! Odak Tamamlandı
                  </h3>
                  <span class="text-[11px] text-[var(--color-text-muted)]"
                    >Atomik Alışkanlık Pomodoro Sayacı</span
                  >
                </div>
              </div>
              <button
                type="button"
                (click)="closeTimeExpiredModal()"
                class="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                title="Kapat"
              >
                ✕
              </button>
            </div>

            <!-- Modal Gövdesi: Bilgi & Seçenekler -->
            <div class="space-y-3.5 text-xs leading-relaxed">
              <div
                class="p-3.5 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] space-y-1"
              >
                <div class="font-bold text-sm text-[var(--color-text-main)]">
                  {{ expiredHabit.title }}
                </div>
                <div class="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                  <span>🏷️ {{ expiredHabit.categoryLabel }}</span>
                  <span>•</span>
                  <span>📍 {{ expiredHabit.targetLocation }}</span>
                </div>
              </div>

              <p class="text-[var(--color-text-muted)]">
                Tebrikler! Bu alışkanlık için belirlediğiniz
                <strong class="text-indigo-600 dark:text-indigo-400 font-mono"
                  >{{ expiredHabit.targetMinutes }} dakikalık</strong
                >
                odaklanma süresi başarıyla doldu. Şimdi ne yapmak istersiniz?
              </p>

              <!-- 2 Seçenek (6. İster: Alışkanlığı Tamamla veya Süre Ekle) -->
              <div class="space-y-3 pt-1">
                <!-- 1. Seçenek: Alışkanlığı Tamamla (8. İster: Rozet ve XP yalnızca tamamlanınca verilir) -->
                <button
                  type="button"
                  (click)="completeHabit(expiredHabit.id)"
                  class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>🏆</span>
                  <span
                    >Alışkanlığı Tamamla (+{{ expiredHabit.rewardXp }} XP & Kategori Rozetini
                    Kazan)</span
                  >
                </button>

                <!-- 2. Seçenek: Ek Süre Ekleme Akışı (9. İster) -->
                <div
                  class="p-3.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] space-y-2.5"
                >
                  <div
                    class="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-main)]"
                  >
                    <span class="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>Akışı Sürdür: Ek Süre Ekle</span>
                    </span>
                    <span class="text-[10px] text-indigo-500 font-medium">Hızlı Seçenekler 👇</span>
                  </div>

                  <!-- Hızlı Ek Süre Butonları -->
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      (click)="addExtraTime(expiredHabit.id, 5)"
                      class="py-2 px-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold text-[var(--color-text-main)] transition-all cursor-pointer text-center"
                    >
                      +5 Dakika
                    </button>
                    <button
                      type="button"
                      (click)="addExtraTime(expiredHabit.id, 10)"
                      class="py-2 px-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold text-[var(--color-text-main)] transition-all cursor-pointer text-center"
                    >
                      +10 Dakika
                    </button>
                    <button
                      type="button"
                      (click)="addExtraTime(expiredHabit.id, 15)"
                      class="py-2 px-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold text-[var(--color-text-main)] transition-all cursor-pointer text-center"
                    >
                      +15 Dakika
                    </button>
                  </div>

                  <!-- Özel Süre Girişi -->
                  <div class="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      [(ngModel)]="customExtensionMinutes"
                      class="w-20 px-2.5 py-1.5 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-center font-bold"
                    />
                    <span class="text-[11px] text-[var(--color-text-muted)] font-medium"
                      >dakika</span
                    >
                    <button
                      type="button"
                      (click)="addExtraTime(expiredHabit.id, customExtensionMinutes)"
                      class="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Süreyi Uzat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- 7. TEK ODAK KURALI (MÜKERRER SAYAÇ ÖNLEME) UYARI MODAL'I -->
      @if (singleTaskWarningModal(); as warningData) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            class="max-w-md w-full rounded-3xl border border-amber-500/30 bg-[var(--color-bg-card)] p-6 space-y-5 shadow-2xl text-[var(--color-text-main)]"
          >
            <!-- Modal Başlık Satırı -->
            <div
              class="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-2xl p-1.5 rounded-xl bg-amber-500/10 text-amber-500">⚠️</span>
                <div>
                  <h3 class="text-base font-bold text-[var(--color-text-main)]">
                    Tek Odak Kuralı Devrede!
                  </h3>
                  <span class="text-[11px] text-[var(--color-text-muted)]"
                    >Kaizen: Muda (Dağınıklık) Önleme İlkesi</span
                  >
                </div>
              </div>
              <button
                type="button"
                (click)="closeSingleTaskWarningModal()"
                class="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                title="Kapat"
              >
                ✕
              </button>
            </div>

            <!-- Modal Gövdesi: Bilgi & Mesaj -->
            <div class="space-y-4 text-xs leading-relaxed">
              <div
                class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 space-y-1.5"
              >
                <div class="font-bold flex items-center gap-1.5 text-xs">
                  <span>🎯</span>
                  <span>Aynı Anda Tek Bir Göreve Odaklanabilirsiniz!</span>
                </div>
                <p class="text-[11.5px] leading-relaxed">
                  "Aynı anda birden çok işin yapılması odağı ve verimliliği düşürür! Başka bir
                  alışkanlığa başlamadan önce devam eden alışkanlıkları durdur/tamamla."
                </p>
              </div>

              <!-- Şu Anda Devam Eden Alışkanlık Kartı -->
              <div
                class="p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] space-y-1.5"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <span
                      class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"
                    ></span>
                    Şu Anda Devam Eden Alışkanlık
                  </span>
                  <span class="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    ⏱️ {{ formatTime(warningData.runningHabit.remainingSeconds) }}
                  </span>
                </div>
                <div class="font-semibold text-xs text-[var(--color-text-main)]">
                  {{ warningData.runningHabit.title }}
                </div>
                <div class="text-[10px] text-[var(--color-text-muted)] flex items-center gap-2">
                  <span>🏷️ {{ warningData.runningHabit.categoryLabel }}</span>
                  <span>•</span>
                  <span>📍 {{ warningData.runningHabit.targetLocation }}</span>
                </div>
              </div>

              <!-- Başlatılmak İstenen Yeni Alışkanlık -->
              <div
                class="p-3 rounded-2xl bg-[var(--color-bg-subtle)] border border-dashed border-[var(--color-border-subtle)] space-y-1"
              >
                <div
                  class="text-[10px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1"
                >
                  <span>🚀</span>
                  <span>Başlatılmak İstenen Yeni Alışkanlık:</span>
                </div>
                <div class="font-medium text-xs text-[var(--color-text-main)]">
                  {{ warningData.attemptedHabit.title }} ({{
                    warningData.attemptedHabit.targetMinutes
                  }}
                  dk)
                </div>
              </div>

              <!-- Aksiyon Butonları -->
              <div class="space-y-2 pt-1">
                <!-- 1. Seçenek: Devam Edeni Duraklat ve Yeniyi Başlat -->
                <button
                  type="button"
                  (click)="pauseRunningAndStartAttempted()"
                  class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <span>⏸️</span>
                  <span>Devam Edeni Duraklat & Yenisini Başlat</span>
                </button>

                <!-- 2. Seçenek: Vazgeç / Mevcut Göreve Geri Dön -->
                <button
                  type="button"
                  (click)="closeSingleTaskWarningModal()"
                  class="w-full py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  Anladım, Devam Eden Göreve Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly habitService = inject(HabitService);

  readonly currentStreak = signal<number>(0);
  readonly selectedIdentityFilter = signal<string | null>(null);
  readonly showAddHabitForm = signal<boolean>(false);
  readonly isMasteryGuideCollapsed = signal<boolean>(false);
  readonly activeExplainer = signal<string | null>(null);
  readonly masteryStep3Done = signal<boolean>(false);

  newHabitCategory = 'KARIYER';
  newHabitTitle = '';
  newHabitIdentityId = 'pro';
  newHabitCue = '';
  newHabitLocation = 'Çalışma Masası';
  newHabitMicroStep = '';
  newHabitTargetMinutes = 25;

  readonly durationPresets = [
    { minutes: 5, label: '5 Dk (Mikro)' },
    { minutes: 15, label: '15 Dk (Hızlı)' },
    { minutes: 25, label: '25 Dk (Pomodoro)' },
    { minutes: 45, label: '45 Dk (Derin Odak)' },
    { minutes: 60, label: '60 Dk (Blok)' },
  ];

  readonly timeExpiredModalHabit = signal<UserHabit | null>(null);
  readonly singleTaskWarningModal = signal<{
    runningHabit: UserHabit;
    attemptedHabit: UserHabit;
  } | null>(null);
  customExtensionMinutes = 10;

  readonly habitCategories = [
    { key: 'KARIYER', label: 'Mesleki / Çalışma', icon: '💼', defaultIdentity: 'pro' },
    { key: 'BEDEN', label: 'Beden / Sağlık', icon: '🏃', defaultIdentity: 'health' },
    { key: 'ZIHIN', label: 'Zihin / Gelişim', icon: '📖', defaultIdentity: 'reader' },
    { key: 'SOSYAL', label: 'Sosyal / Etkinlik', icon: '☕', defaultIdentity: 'social' },
    { key: 'HOBI', label: 'Hobi & Yaratıcılık', icon: '🎨', defaultIdentity: 'creative' },
    { key: 'SINEMA_KULTUR', label: 'Dizi / Film / Kültür', icon: '🎬', defaultIdentity: 'culture' },
    { key: 'EGLENCE_OYUN', label: 'Oyun & Eğlence', icon: '🎮', defaultIdentity: 'entertainer' },
    { key: 'ODAK', label: 'Farkındalık', icon: '🧘', defaultIdentity: 'mindful' },
  ];

  readonly suggestedLocations = [
    { label: 'Çalışma Masası', icon: '💻' },
    { label: 'Sessiz Oda / Kütüphane', icon: '📖' },
    { label: 'Oturma Odası / TV Köşesi', icon: '🛋️' },
    { label: 'Oyun İstasyonu / Setup', icon: '🎮' },
    { label: 'Kafe / Sosyal Alan', icon: '☕' },
    { label: 'Hobi / Atölye Alanı', icon: '🎨' },
    { label: 'Mutfak', icon: '🍳' },
    { label: 'Açık Hava / Park', icon: '🌳' },
    { label: 'Spor Salonu', icon: '🏋️' },
    { label: 'Sinema / Etkinlik Alanı', icon: '🎬' },
  ];

  readonly categoryInspirations: Record<
    string,
    Array<{ title: string; cue: string; location: string; microStep: string }>
  > = {
    SOSYAL: [
      {
        title: 'Yakın Bir Arkadaşı Arayıp Hatır Sormak',
        cue: 'Akşam yemeğinden hemen sonra',
        location: 'Kafe / Sosyal Alan',
        microStep: 'Telefonu eline al ve WhatsApp\'tan "Nasılsın?" mesajı at',
      },
      {
        title: 'Haftalık Kahve veya Yemek Buluşması Planla',
        cue: 'Cuma öğleden sonra takvime bakınca',
        location: 'Kafe / Sosyal Alan',
        microStep: 'Arkadaşına "Bu hafta sonu kahve içelim mi?" yaz',
      },
      {
        title: 'Aile veya Ev Halkıyla 20 Dk Kesintisiz Sohbet',
        cue: 'Akşam çayını / kahvesini alırken',
        location: 'Oturma Odası / TV Köşesi',
        microStep: 'Telefonu başka odaya bırak ve masaya otur',
      },
    ],
    HOBI: [
      {
        title: '15 Dakika Enstrüman Pratiği (Gitar / Piyano)',
        cue: 'İş bilgisayarını kapattıktan hemen sonra',
        location: 'Hobi / Atölye Alanı',
        microStep: 'Enstrümanın kılıfını aç ve akort yap',
      },
      {
        title: 'Resim, Eskiz Çizimi veya El Sanatları',
        cue: "Akşam saat 21:00'de sessizlik başladığında",
        location: 'Hobi / Atölye Alanı',
        microStep: 'Defteri aç ve ilk 3 çizgiyi karala',
      },
      {
        title: 'Yeni Bir Mutfak / Kahve Tarifi Denemek',
        cue: 'Pazar günü mutfağa girildiğinde',
        location: 'Mutfak',
        microStep: 'Malzemeleri tezgaha diz',
      },
    ],
    SINEMA_KULTUR: [
      {
        title: 'Haftalık 1 Ödüllü Film veya Belgesel İzleme',
        cue: 'Cuma veya Cumartesi akşamı rahatlayınca',
        location: 'Oturma Odası / TV Köşesi',
        microStep: 'Filmi listene ekle ve ilk 5 dakikayı başlat',
      },
      {
        title: 'Yeni Dizi Bölümünü Telefonsuz Odakla İzle',
        cue: 'Akşam dinlenme saatinde',
        location: 'Oturma Odası / TV Köşesi',
        microStep: 'Bölümü aç ve telefonu sehpaya ters koy',
      },
      {
        title: 'Ayda Bir Tiyatro, Sinema veya Sergi Ziyareti',
        cue: 'Haftalık plan yaparken',
        location: 'Sinema / Etkinlik Alanı',
        microStep: 'Bilet platformuna girip vizyona bak',
      },
    ],
    EGLENCE_OYUN: [
      {
        title: 'Suçluluk Duymadan 45 Dk Favori Oyunu Oyna',
        cue: 'Günün tüm zorunlu görevleri tamamlandığında',
        location: 'Oyun İstasyonu / Setup',
        microStep: 'Oyunu başlat ve bir tur oyna',
      },
      {
        title: 'Arkadaşlarla Haftalık Online / Kutu Oyunu Gecesi',
        cue: 'Hafta sonu akşamı toplandığında',
        location: 'Oyun İstasyonu / Setup',
        microStep: 'Oyunu masaya koy veya lobiye bağlan',
      },
    ],
    KARIYER: [
      {
        title: '25 Dk Derin Odaklı Çalışma (Deep Work)',
        cue: 'Sabah ilk kahveyi aldıktan hemen sonra',
        location: 'Çalışma Masası',
        microStep: 'Masaya otur, bildirimleri kapat ve en önemli görevi aç',
      },
    ],
    BEDEN: [
      {
        title: '20 Dk Tempolu Yürüyüş & Temiz Hava',
        cue: 'Ekran başından kalkıp ayakkabıları görünce',
        location: 'Açık Hava / Park',
        microStep: 'Spor ayakkabılarını giy ve kapının önüne çık',
      },
    ],
    ZIHIN: [
      {
        title: '15 Sayfa İlham Verici Kitap Okuma',
        cue: 'Öğle molasında veya yatmadan önce',
        location: 'Sessiz Oda / Kütüphane',
        microStep: 'Kitabın kapağını aç ve tek bir sayfa oku',
      },
    ],
    ODAK: [
      {
        title: '5 Dakika Bilinçli Nefes & Meditasyon',
        cue: 'Güne başlamadan önce veya iş bitiminde',
        location: 'Sessiz Oda / Kütüphane',
        microStep: 'Gözlerini kapat ve 3 derin nefes al',
      },
    ],
  };

  readonly activeCategoryInspirations = computed(() => {
    return this.categoryInspirations[this.newHabitCategory] || [];
  });

  selectCategory(catKey: string): void {
    this.newHabitCategory = catKey;
    const cat = this.habitCategories.find((c) => c.key === catKey);
    if (cat) {
      let matchingIdentity = this.identities().find((i) => i.id === cat.defaultIdentity);
      if (!matchingIdentity) {
        matchingIdentity = this.findIdentityForCategory(catKey);
      }
      if (matchingIdentity) {
        this.newHabitIdentityId = matchingIdentity.id;
      }
    }
  }

  private findIdentityForCategory(catKey: string): UserIdentity | undefined {
    if (!catKey) return undefined;
    const key = catKey.toUpperCase();
    return this.identities().find((i) => {
      const name = i.name.toLowerCase();
      switch (key) {
        case 'SINEMA_KULTUR':
        case 'CULTURE':
          return (
            name.includes('sinema') ||
            name.includes('kültür') ||
            i.icon === '🎬' ||
            i.id === 'culture'
          );
        case 'EGLENCE_OYUN':
        case 'ENTERTAINER':
          return (
            name.includes('kaşif') ||
            name.includes('oyun') ||
            i.icon === '🎮' ||
            i.id === 'entertainer'
          );
        case 'ODAK':
        case 'MINDFUL':
          return (
            name.includes('dingin') ||
            name.includes('bilinçli') ||
            i.icon === '🧘' ||
            i.id === 'mindful'
          );
        case 'KARIYER':
        case 'PRO':
          return (
            name.includes('üretken') ||
            name.includes('profesyonel') ||
            i.icon === '💼' ||
            i.icon === '💻' ||
            i.id === 'pro'
          );
        case 'BEDEN':
        case 'HEALTH':
          return (
            name.includes('zinde') ||
            name.includes('enerjik') ||
            i.icon === '🏃' ||
            i.id === 'health'
          );
        case 'ZIHIN':
        case 'READER':
          return (
            name.includes('öğrenen') ||
            name.includes('düşünür') ||
            i.icon === '📖' ||
            i.id === 'reader'
          );
        case 'SOSYAL':
        case 'SOCIAL':
          return (
            name.includes('sosyal') || name.includes('dost') || i.icon === '☕' || i.id === 'social'
          );
        case 'HOBI':
        case 'CREATIVE':
          return (
            name.includes('yaratıcı') ||
            name.includes('sanat') ||
            i.icon === '🎨' ||
            i.id === 'creative'
          );
        default:
          return false;
      }
    });
  }

  applyInspiration(insp: {
    title: string;
    cue: string;
    location: string;
    microStep: string;
  }): void {
    this.newHabitTitle = insp.title;
    this.newHabitCue = insp.cue;
    this.newHabitLocation = insp.location;
    this.newHabitMicroStep = insp.microStep;
  }

  setLocation(loc: string): void {
    this.newHabitLocation = loc;
  }

  kaizenReflectionInput = '';
  mudaInput = '';

  readonly formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date());

  // 7 Günlük Haftalık Zincir Göstergesi
  readonly weekStreak = signal<DayStreakItem[]>([
    { dayName: 'Pazartesi', dayShort: 'Pzt', completed: false, isToday: false, score: 0 },
    { dayName: 'Salı', dayShort: 'Sal', completed: false, isToday: false, score: 0 },
    { dayName: 'Çarşamba', dayShort: 'Çar', completed: false, isToday: false, score: 0 },
    { dayName: 'Perşembe', dayShort: 'Per', completed: false, isToday: false, score: 0 },
    { dayName: 'Cuma', dayShort: 'Cum', completed: false, isToday: false, score: 0 },
    { dayName: 'Cumartesi', dayShort: 'Cmt', completed: false, isToday: false, score: 0 },
    { dayName: 'Pazar', dayShort: 'Paz', completed: false, isToday: true, score: 0 },
  ]);

  // James Clear Kimlikleri (8 Dengeli Yaşam Kimliği)
  readonly identities = signal<UserIdentity[]>([
    {
      id: 'pro',
      name: 'Üretken Profesyonel & Değer Üreten',
      tagline: 'Yaptığı işe özen gösterir, odaklanır ve her gün somut değer katar',
      icon: '💼',
      level: 1,
      totalVotes: 0,
      votesThreshold: 50,
      color: '#6366F1',
    },
    {
      id: 'reader',
      name: 'Sürekli Öğrenen & Düşünür',
      tagline: 'Her gün yeni bir kavram öğrenir ve zihnini keskin tutar',
      icon: '📖',
      level: 1,
      totalVotes: 0,
      votesThreshold: 40,
      color: '#A855F7',
    },
    {
      id: 'health',
      name: 'Zinde ve Enerjik Birey',
      tagline: 'Bedenine saygı duyar, hareket eder ve berrak bir zihin korur',
      icon: '🏃',
      level: 1,
      totalVotes: 0,
      votesThreshold: 35,
      color: '#10B981',
    },
    {
      id: 'social',
      name: 'Sosyal & Paylaşımcı Dost',
      tagline: 'İnsan ilişkilerine değer verir, sevdikleriyle bağlarını sıcak tutar',
      icon: '☕',
      level: 1,
      totalVotes: 0,
      votesThreshold: 30,
      color: '#F59E0B',
    },
    {
      id: 'creative',
      name: 'Yaratıcı & Çok Yönlü Ruh',
      tagline: 'Hobilerine, sanatına ve üretken tutkularına özenle vakit ayırır',
      icon: '🎨',
      level: 1,
      totalVotes: 0,
      votesThreshold: 30,
      color: '#EC4899',
    },
    {
      id: 'entertainer',
      name: 'Yaşamın Tadını Çıkaran Kaşif',
      tagline: 'Oyunlar, eğlence ve neşeyle zihnini dinlendirir, dengeli yaşar',
      icon: '🎮',
      level: 1,
      totalVotes: 0,
      votesThreshold: 30,
      color: '#8B5CF6',
    },
    {
      id: 'culture',
      name: 'Kültür Sanat & Sinema Tutkunu',
      tagline: 'Sinema, tiyatro ve sanatla vizyonunu genişletir; hikayelerden ilham alır',
      icon: '🎬',
      level: 1,
      totalVotes: 0,
      votesThreshold: 30,
      color: '#F43F5E',
    },
    {
      id: 'mindful',
      name: 'Bilinçli ve Dingin Zihin',
      tagline: 'Nefesine ve ana odaklanır, zihinsel dinginlik ve berraklık kazanır',
      icon: '🧘',
      level: 1,
      totalVotes: 0,
      votesThreshold: 30,
      color: '#14B8A6',
    },
  ]);

  // 4 Yasa Çerçevesinde Atomik Alışkanlıklar Listesi (Varsayılan olarak boş başlar)
  readonly habits = signal<UserHabit[]>([]);

  // 4. Yasa: Kategori Rozetleri & Küme Terfi Sistemi Sinyali
  readonly categoryTiers = signal<CategoryTierItem[]>([
    {
      category: 'KARIYER',
      categoryDisplayName: 'Mesleki / Çalışma',
      icon: '💼',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'BEDEN',
      categoryDisplayName: 'Beden / Sağlık',
      icon: '🏃',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'ZIHIN',
      categoryDisplayName: 'Zihin / Gelişim',
      icon: '📖',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'SOSYAL',
      categoryDisplayName: 'Sosyal / Etkinlik',
      icon: '☕',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'HOBI',
      categoryDisplayName: 'Hobi & Yaratıcılık',
      icon: '🎨',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'SINEMA_KULTUR',
      categoryDisplayName: 'Dizi / Film / Kültür',
      icon: '🎬',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'EGLENCE_OYUN',
      categoryDisplayName: 'Oyun & Eğlence',
      icon: '🎮',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
    {
      category: 'ODAK',
      categoryDisplayName: 'Farkındalık / Meditasyon',
      icon: '🧘',
      currentTier: 'BRONZE',
      currentTierName: 'Bronz Küme',
      currentTierIcon: '🥉',
      currentTierBadgeCount: 0,
      nextTierRequiredCount: 10,
      totalBadgesEarned: 0,
      progressPercentage: 0,
      nextTierName: 'Gümüş Küme',
      maxTierReached: false,
    },
  ]);

  readonly totalBadgesEarnedAllCategories = computed(() => {
    return this.categoryTiers().reduce((acc, t) => acc + t.totalBadgesEarned, 0);
  });

  // Alıntılar
  readonly quotes = [
    {
      text: 'Her gün %1 daha iyiye giderseniz, bir yılın sonunda 37 kat daha iyi olursunuz.',
      author: 'James Clear',
      source: 'Atomik Alışkanlıklar',
    },
    {
      text: 'Bugün dünden daha iyi olmalı, yarın da bugünden. İyileştirmenin sonu yoktur.',
      author: 'Masaaki Imai',
      source: 'Kaizen Felsefesi',
    },
    {
      text: 'Hedeflerin seviyesine yükselmezsiniz; sistemlerinizin seviyesine gerilersiniz.',
      author: 'James Clear',
      source: 'Atomik Alışkanlıklar',
    },
    {
      text: 'Zor olduğu için cesaret edemiyor değiliz; cesaret edemediğimiz için zordur.',
      author: 'Seneca',
      source: 'Stoacı Mektuplar',
    },
  ];
  readonly activeQuoteIndex = signal<number>(0);
  readonly activeQuote = computed(() => this.quotes[this.activeQuoteIndex()]);

  // Hesaplanmış Değerler
  readonly totalHabitsCount = computed(() => this.habits().length);
  readonly completedHabitsCount = computed(() => this.habits().filter((h) => h.completed).length);
  readonly completionRate = computed(() => {
    const total = this.totalHabitsCount();
    if (total === 0) return 0;
    return Math.round((this.completedHabitsCount() / total) * 100);
  });
  readonly totalEarnedPoints = computed(() => {
    return this.habits().reduce((acc, h) => (h.completed ? acc + h.rewardXp : acc), 0);
  });
  readonly totalIdentityVotes = computed(() => {
    return this.identities().reduce((acc, i) => acc + i.totalVotes, 0);
  });

  readonly totalFocusMinutes = computed(() => {
    return this.habits()
      .filter((h) => h.completed)
      .reduce((acc, h) => acc + (h.targetMinutes || parseInt(h.timeEstimate, 10) || 15), 0);
  });

  readonly masteryStep1Done = computed(() => this.identities().length > 0);
  readonly masteryStep2Done = computed(() => this.habits().length > 0);
  readonly masteryStep4Done = computed(() => !!this.kaizenReflectionInput.trim());
  readonly masteryCompletedCount = computed(() => {
    let count = 0;
    if (this.masteryStep1Done()) count++;
    if (this.masteryStep2Done()) count++;
    if (this.masteryStep3Done()) count++;
    if (this.masteryStep4Done()) count++;
    return count;
  });

  readonly userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'Kullanıcı';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email.split('@')[0];
  });

  ngOnInit(): void {
    if (!this.authService.currentUser() && this.authService.isAuthenticated()) {
      this.userService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.authService.currentUser.set(res.data);
          }
        },
      });
    }

    // Backend REST API'den verileri yükle
    if (this.authService.isAuthenticated()) {
      this.habitService.loadDashboardSummary().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const summary = res.data;
            this.applyDashboardSummary(summary);
            if (summary.habits && summary.habits.length > 0) {
              const labelMap: Record<string, string> = {
                ZIHIN: 'Zihin / Gelişim',
                BEDEN: 'Beden / Sağlık',
                KARIYER: 'Mesleki / Çalışma',
                ODAK: 'Farkındalık',
                SOSYAL: 'Sosyal / Etkinlik',
                HOBI: 'Hobi & Yaratıcılık',
                SINEMA_KULTUR: 'Dizi / Film / Kültür',
                EGLENCE_OYUN: 'Oyun & Eğlence',
              };
              this.habits.set(
                summary.habits.map((h) => {
                  const mins = h.targetMinutes || 15;
                  const isCompleted = h.completedToday;
                  return {
                    id: h.publicId,
                    title: h.title,
                    category: (h.category ? h.category.toLowerCase() : 'kariyer') as any,
                    categoryLabel: labelMap[h.category] || 'Genel',
                    identityId: h.identityPublicId || 'pro',
                    cue: h.cueTrigger,
                    targetLocation: h.targetLocation || 'Çalışma Alanı',
                    craving: h.cravingBenefit || 'Zihni akışa sokmak',
                    twoMinuteMicroStep: h.responseMicroStep,
                    rewardXp: h.rewardXp,
                    timeEstimate: `${mins} dk`,
                    targetMinutes: mins,
                    completed: isCompleted,
                    twoMinuteModeActive: false,
                    microStepDone: isCompleted,
                    timerStatus: isCompleted ? 'TAMAMLANDI' : 'HAZIR',
                    remainingSeconds: isCompleted ? 0 : mins * 60,
                    initialSeconds: mins * 60,
                  };
                }),
              );
            }
          }
        },
      });
    }
  }

  applyDashboardSummary(summary: any): void {
    if (summary.currentStreak !== undefined && summary.currentStreak !== null) {
      this.currentStreak.set(summary.currentStreak);
    }
    if (summary.identities && summary.identities.length > 0) {
      this.identities.set(
        summary.identities.map((i: any) => ({
          id: i.publicId,
          name: i.name,
          tagline: i.tagline,
          icon: i.icon || '🎯',
          level: i.level,
          totalVotes: i.totalVotes,
          votesThreshold: i.votesThreshold,
          color: i.color || '#6366F1',
        })),
      );
      if (
        this.newHabitIdentityId === 'pro' ||
        !this.identities().some((i) => i.id === this.newHabitIdentityId)
      ) {
        const defaultCatId = this.findIdentityForCategory(this.newHabitCategory);
        this.newHabitIdentityId = defaultCatId ? defaultCatId.id : this.identities()[0].id;
      }
    }
    if (summary.categoryTiers && summary.categoryTiers.length > 0) {
      this.categoryTiers.set(
        summary.categoryTiers.map((ct: any) => ({
          category: ct.category,
          categoryDisplayName: ct.categoryDisplayName,
          icon: ct.icon,
          currentTier: ct.currentTier,
          currentTierName: ct.currentTierName,
          currentTierIcon: ct.currentTierIcon,
          currentTierBadgeCount: ct.currentTierBadgeCount,
          nextTierRequiredCount: ct.nextTierRequiredCount,
          totalBadgesEarned: ct.totalBadgesEarned,
          progressPercentage: ct.progressPercentage,
          nextTierName: ct.nextTierName,
          maxTierReached: ct.maxTierReached,
        })),
      );
    }
    if (summary.todayReflection) {
      this.kaizenReflectionInput = summary.todayReflection.whatImprovedOnePercent || '';
      this.mudaInput = summary.todayReflection.mudaDetected || '';
    }
  }

  setTargetMinutes(mins: number): void {
    this.newHabitTargetMinutes = mins;
  }

  getHabitCardStatusClass(habit: UserHabit): string {
    switch (habit.timerStatus) {
      case 'DEVAM_EDIYOR':
        return 'border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/30 shadow-emerald-500/10';
      case 'DURAKLATILDI':
        return 'border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/30 shadow-amber-500/10';
      case 'TAMAMLANDI':
        return 'border-cyan-500/80 bg-cyan-500/5 ring-1 ring-cyan-500/30 shadow-cyan-500/10';
      case 'HAZIR':
      default:
        return 'border-blue-500/60 bg-blue-500/5 hover:border-blue-500/80 shadow-blue-500/5';
    }
  }

  getHabitStatusBadgeClass(status: HabitTimerStatus): string {
    switch (status) {
      case 'DEVAM_EDIYOR':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40';
      case 'DURAKLATILDI':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40';
      case 'TAMAMLANDI':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40';
      case 'HAZIR':
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getTimerProgressPercent(habit: UserHabit): number {
    if (habit.timerStatus === 'TAMAMLANDI') return 100;
    if (!habit.initialSeconds || habit.initialSeconds <= 0) return 0;
    const elapsed = habit.initialSeconds - habit.remainingSeconds;
    return Math.min(100, Math.max(0, Math.round((elapsed / habit.initialSeconds) * 100)));
  }

  startPomodoro(habitId: string): void {
    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit || habit.timerStatus === 'TAMAMLANDI') return;

    // Tek Odak Kuralı: Devam eden başka bir alışkanlık varsa yeni sayaç başlatılamaz!
    const runningHabit = this.habits().find(
      (h) => h.id !== habitId && h.timerStatus === 'DEVAM_EDIYOR',
    );
    if (runningHabit) {
      this.singleTaskWarningModal.set({
        runningHabit,
        attemptedHabit: habit,
      });
      this.toastService.warning(
        'Aynı anda birden çok işin yapılması odağı ve verimliliği düşürür! Başka bir alışkanlığa başlamadan önce devam eden alışkanlıkları durdur/tamamla.',
        'Tek Odak Kuralı ⚠️',
      );
      return;
    }

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    this.habits.update((list) =>
      list.map((h) => (h.id === habitId ? { ...h, timerStatus: 'DEVAM_EDIYOR' } : h)),
    );

    const intervalId = setInterval(() => {
      const current = this.habits().find((h) => h.id === habitId);
      if (!current || current.timerStatus !== 'DEVAM_EDIYOR') {
        clearInterval(intervalId);
        return;
      }

      if (current.remainingSeconds <= 1) {
        clearInterval(intervalId);
        this.habits.update((list) =>
          list.map((h) =>
            h.id === habitId ? { ...h, remainingSeconds: 0, timerIntervalId: undefined } : h,
          ),
        );
        this.playNotificationSound();
        const expired = this.habits().find((h) => h.id === habitId);
        if (expired) {
          this.timeExpiredModalHabit.set(expired);
        }
      } else {
        this.habits.update((list) =>
          list.map((h) =>
            h.id === habitId ? { ...h, remainingSeconds: h.remainingSeconds - 1 } : h,
          ),
        );
      }
    }, 1000);

    this.habits.update((list) =>
      list.map((h) => (h.id === habitId ? { ...h, timerIntervalId: intervalId } : h)),
    );
  }

  pausePomodoro(habitId: string): void {
    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    this.habits.update((list) =>
      list.map((h) =>
        h.id === habitId ? { ...h, timerStatus: 'DURAKLATILDI', timerIntervalId: undefined } : h,
      ),
    );
  }

  resetPomodoro(habitId: string): void {
    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    this.habits.update((list) =>
      list.map((h) =>
        h.id === habitId
          ? {
              ...h,
              remainingSeconds: h.initialSeconds,
              timerStatus: 'HAZIR',
              timerIntervalId: undefined,
            }
          : h,
      ),
    );
  }

  addExtraTime(habitId: string, minutes: number): void {
    const extraSeconds = Math.max(1, minutes) * 60;
    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    const newRemaining = habit.remainingSeconds + extraSeconds;
    const newInitial = Math.max(habit.initialSeconds, newRemaining);

    this.habits.update((list) =>
      list.map((h) =>
        h.id === habitId
          ? {
              ...h,
              remainingSeconds: newRemaining,
              initialSeconds: newInitial,
              timerStatus: 'DEVAM_EDIYOR',
              timerIntervalId: undefined,
            }
          : h,
      ),
    );

    this.timeExpiredModalHabit.set(null);
    this.toastService.info(
      `+${minutes} dakika odaklanma süresi eklendi! Sayaç devam ediyor.`,
      'Süre Eklendi ⏱️',
    );
    this.startPomodoro(habitId);
  }

  completeHabit(habitId: string): void {
    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit || habit.completed) return;

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    this.habits.update((list) =>
      list.map((h) =>
        h.id === habitId
          ? {
              ...h,
              completed: true,
              timerStatus: 'TAMAMLANDI',
              twoMinuteModeActive: false,
              microStepDone: true,
              remainingSeconds: 0,
              timerIntervalId: undefined,
            }
          : h,
      ),
    );

    this.timeExpiredModalHabit.set(null);

    const catTier = this.categoryTiers().find(
      (ct) => ct.category.toUpperCase() === habit.category.toUpperCase(),
    );
    const catIcon = catTier?.icon || '🎖️';
    const catName = catTier?.categoryDisplayName || habit.categoryLabel;

    this.toastService.success(
      `"+${habit.rewardXp} XP" ve 1x ${catIcon} ${catName} Rozeti kazanıldı!`,
      'Alışkanlık Tamamlandı 🎉',
    );

    this.castIdentityVote(habit.identityId, false);
    this.awardCategoryBadge(habit.category);

    this.habitService.toggleHabit(habitId, false).subscribe();
  }

  playNotificationSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Yumuşak Çan Tonal Temeli (D5 - 587.33 Hz -> A5 - 880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // 2. Sıcak Harmonik Melodi (A5 - 880 Hz -> D6 - 1174.66 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);
      gain2.gain.setValueAtTime(0, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.2);
      osc2.start(now + 0.08);
      osc2.stop(now + 1.4);
    } catch {
      // Tarayıcı ses izni engeli varsa sessizce devam et
    }
  }

  closeTimeExpiredModal(): void {
    this.timeExpiredModalHabit.set(null);
  }

  closeSingleTaskWarningModal(): void {
    this.singleTaskWarningModal.set(null);
  }

  pauseRunningAndStartAttempted(): void {
    const modalData = this.singleTaskWarningModal();
    if (!modalData) return;

    // 1. Devam eden alışkanlığın sayacını duraklat ve statüsünü DURAKLATILDI yap
    this.pausePomodoro(modalData.runningHabit.id);

    // 2. Modalı kapat
    this.singleTaskWarningModal.set(null);

    // 3. Yeni alışkanlığın sayacını başlat
    this.toastService.info(
      `"${modalData.runningHabit.title}" duraklatıldı. Şimdi "${modalData.attemptedHabit.title}" başlatılıyor.`,
      'Odak Değiştirildi 🔄',
    );
    this.startPomodoro(modalData.attemptedHabit.id);
  }

  ngOnDestroy(): void {
    for (const habit of this.habits()) {
      if (habit.timerIntervalId) {
        clearInterval(habit.timerIntervalId);
      }
    }
  }

  toggleHabit(id: string): void {
    const habit = this.habits().find((h) => h.id === id);
    if (!habit) return;

    if (!habit.completed) {
      this.completeHabit(id);
    } else {
      if (habit.timerIntervalId) {
        clearInterval(habit.timerIntervalId);
      }
      this.habits.update((list) =>
        list.map((h) =>
          h.id === id
            ? {
                ...h,
                completed: false,
                microStepDone: false,
                timerStatus: 'HAZIR',
                remainingSeconds: h.initialSeconds,
                timerIntervalId: undefined,
              }
            : h,
        ),
      );
      this.revokeIdentityVote(habit.identityId);
      this.revokeCategoryBadge(habit.category);
      this.toastService.info(
        `"${habit.title}" tamamlanma durumu geri alındı.`,
        'Durum Güncellendi',
      );
      this.habitService.toggleHabit(id, false).subscribe();
    }
  }

  toggleTwoMinuteMode(id: string): void {
    this.habits.update((list) =>
      list.map((h) => (h.id === id ? { ...h, twoMinuteModeActive: !h.twoMinuteModeActive } : h)),
    );
  }

  completeViaMicroStep(id: string): void {
    const habit = this.habits().find((h) => h.id === id);
    if (!habit) return;

    const nextDone = !habit.microStepDone;
    this.habits.update((list) =>
      list.map((h) =>
        h.id === id
          ? {
              ...h,
              microStepDone: nextDone,
            }
          : h,
      ),
    );

    if (nextDone) {
      this.masteryStep3Done.set(true);
      this.toastService.success(
        '2-Dakika kuralı mikro adımı yapıldı! Sürtünme sıfırlandı, artık odaklanmaya hazırsınız. ⚡',
        'Mikro Adım Tamamlandı ✓',
      );
    } else {
      this.toastService.info('Mikro adım tamamlanma durumu geri alındı.', 'Güncellendi');
    }
  }

  toggleAddHabitForm(): void {
    this.showAddHabitForm.update((v) => {
      const nextVal = !v;
      if (nextVal) {
        const catIdent = this.findIdentityForCategory(this.newHabitCategory);
        if (catIdent) {
          this.newHabitIdentityId = catIdent.id;
        } else if (this.identities().length > 0) {
          this.newHabitIdentityId = this.identities()[0].id;
        }
      }
      return nextVal;
    });
  }

  deleteHabit(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const habit = this.habits().find((h) => h.id === id);
    if (!habit) return;

    if (habit.timerIntervalId) {
      clearInterval(habit.timerIntervalId);
    }

    // Alışkanlık silindiğinde ilgili kimlik matrisindeki oy sayısını ve kategori rozetini anında dinamik düşür
    let targetIdentity = this.identities().find((i) => i.id === habit.identityId);
    if (!targetIdentity) {
      targetIdentity = this.findIdentityForCategory(habit.category);
    }
    if (targetIdentity) {
      this.revokeIdentityVote(targetIdentity.id);
    } else {
      this.revokeIdentityVote(habit.identityId);
    }
    this.revokeCategoryBadge(habit.category);

    const prevHabits = this.habits();
    this.habits.update((list) => list.filter((h) => h.id !== id));
    this.toastService.info(`"${habit.title}" alışkanlığı kaldırıldı.`, 'Alışkanlık Silindi');

    this.habitService.deleteHabit(id).subscribe({
      next: () => {
        // Backend ile verilerin %100 senkron kalması için dashboard özetini arka planda tazele
        this.habitService.loadDashboardSummary().subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.applyDashboardSummary(res.data);
            }
          },
        });
      },
      error: () => {
        this.habits.set(prevHabits);
        if (targetIdentity) {
          this.castIdentityVote(targetIdentity.id, false);
        } else {
          this.castIdentityVote(habit.identityId, false);
        }
        this.awardCategoryBadge(habit.category);
        this.toastService.error('Alışkanlık silinirken bir hata oluştu.', 'Hata');
      },
    });
  }

  addHabit(): void {
    const title = this.newHabitTitle.trim();
    if (!title) return;

    const categoryKey = this.newHabitCategory || 'KARIYER';
    const selectedIdentity =
      this.identities().find((i) => i.id === this.newHabitIdentityId) ||
      this.findIdentityForCategory(categoryKey) ||
      this.identities()[0];
    const targetMins = Math.max(1, this.newHabitTargetMinutes || 25);

    const request = {
      identityPublicId: selectedIdentity?.id,
      title,
      category: categoryKey,
      cueTrigger: this.newHabitCue.trim() || 'Belirlenen saatte',
      targetLocation: this.newHabitLocation.trim() || 'Çalışma Masası',
      responseMicroStep: this.newHabitMicroStep.trim() || 'İlk 2 dakikayı tamamla',
      rewardXp: 20,
      targetMinutes: targetMins,
    };

    this.habitService.createHabit(request).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const newH = res.data;
          const mins = newH.targetMinutes || targetMins;
          const userHabit: UserHabit = {
            id: newH.publicId,
            title: newH.title,
            category: (newH.category ? newH.category.toLowerCase() : 'kariyer') as any,
            categoryLabel: this.getCategoryLabel(newH.category),
            identityId: newH.identityPublicId || 'pro',
            cue: newH.cueTrigger,
            targetLocation: newH.targetLocation || this.newHabitLocation.trim() || 'Çalışma Masası',
            craving: newH.cravingBenefit || 'Yaşam dengesini ve zindeliği korumak',
            twoMinuteMicroStep: newH.responseMicroStep,
            rewardXp: newH.rewardXp,
            timeEstimate: `${mins} dk`,
            targetMinutes: mins,
            completed: false,
            twoMinuteModeActive: false,
            microStepDone: false,
            timerStatus: 'HAZIR',
            remainingSeconds: mins * 60,
            initialSeconds: mins * 60,
          };
          this.habits.update((list) => [...list, userHabit]);
          this.toastService.success(
            `"${userHabit.title}" başarıyla gününe eklendi!`,
            'Alışkanlık Eklendi 🎯',
          );
          // Backend ile verilerin %100 senkron kalması için dashboard özetini arka planda tazele
          this.habitService.loadDashboardSummary().subscribe({
            next: (summaryRes) => {
              if (summaryRes.success && summaryRes.data) {
                this.applyDashboardSummary(summaryRes.data);
              }
            },
          });
        }
      },
      error: () => {
        this.toastService.error('Alışkanlık kaydedilirken bir sorun oluştu.', 'Hata');
      },
    });

    this.newHabitTitle = '';
    this.newHabitCue = '';
    this.newHabitMicroStep = '';
    this.newHabitTargetMinutes = 25;
    this.showAddHabitForm.set(false);
  }

  saveDailyReflection(): void {
    if (!this.kaizenReflectionInput.trim() && !this.mudaInput.trim()) {
      this.toastService.warning('Lütfen en az bir değerlendirme cümlesi yazın.', 'Eksik Alan');
      return;
    }

    this.habitService
      .saveReflection({
        whatImprovedOnePercent: this.kaizenReflectionInput,
        mudaDetected: this.mudaInput,
        pdcaActionForTomorrow: 'Yarın aynı saatte daha odaklı başla',
      })
      .subscribe({
        next: () => {
          this.toastService.success(
            'Günün Kaizen retrospektifi kaydedildi (+30 XP)!',
            'Günün Mührü Basıldı 📜',
          );
        },
      });
  }

  nextQuote(): void {
    this.activeQuoteIndex.update((idx) => (idx + 1) % this.quotes.length);
  }

  private castIdentityVote(identityId: string, sendToBackend = true): void {
    let matchFound = this.identities().some((i) => i.id === identityId);
    let effectiveId = identityId;
    if (!matchFound) {
      const fallback = this.findIdentityForCategory(identityId);
      if (fallback) {
        effectiveId = fallback.id;
      }
    }

    this.identities.update((list) => {
      return list.map((item) => {
        if (item.id === effectiveId) {
          const nextVotes = item.totalVotes + 1;
          const nextLevel = nextVotes >= item.votesThreshold ? item.level + 1 : item.level;
          if (nextLevel > item.level) {
            this.toastService.success(
              `Tebrikler! ${item.name} kimliğinde Seviye ${nextLevel}'e yükseldiniz!`,
              'Seviye Atlandı 🏆',
            );
          }
          return { ...item, totalVotes: nextVotes, level: nextLevel };
        }
        return item;
      });
    });

    // Backend'e oy gönder
    if (sendToBackend && effectiveId && effectiveId.length > 10) {
      // UUID formatı
      this.habitService.castVote(effectiveId).subscribe();
    }
  }

  private revokeIdentityVote(identityId: string): void {
    let matchFound = this.identities().some((i) => i.id === identityId);
    let effectiveId = identityId;
    if (!matchFound) {
      const fallback = this.findIdentityForCategory(identityId);
      if (fallback) {
        effectiveId = fallback.id;
      }
    }

    this.identities.update((list) => {
      return list.map((item) => {
        if (item.id === effectiveId && item.totalVotes > 0) {
          return { ...item, totalVotes: item.totalVotes - 1 };
        }
        return item;
      });
    });
  }

  toggleMasteryGuide(): void {
    this.isMasteryGuideCollapsed.update((v) => !v);
  }

  toggleExplainer(key: string): void {
    this.activeExplainer.update((cur) => (cur === key ? null : key));
  }

  scrollToIdentities(): void {
    document.getElementById('identity-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToHabits(): void {
    document.getElementById('habits-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToPdca(): void {
    document.getElementById('pdca-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  triggerMasteryTwoMinuteQuickAction(): void {
    const incomplete = this.habits().find((h) => !h.completed);
    if (incomplete) {
      this.habits.update((list) =>
        list.map((h) => (h.id === incomplete.id ? { ...h, twoMinuteModeActive: true } : h)),
      );
      this.scrollToHabits();
    }
    this.masteryStep3Done.set(true);
    this.toastService.info(
      '2-Dakika Kuralı devrede! Görev sürtünmesiz mikro adıma indirgendi. Sadece ilk 2 dakikalık adımı atın!',
      'Sürtünme Sıfırlandı ⚡',
    );
  }

  getCategoryLabel(category?: string): string {
    const map: Record<string, string> = {
      KARIYER: 'Mesleki / Çalışma',
      BEDEN: 'Beden / Sağlık',
      ZIHIN: 'Zihin / Gelişim',
      SOSYAL: 'Sosyal / Etkinlik',
      HOBI: 'Hobi & Yaratıcılık',
      SINEMA_KULTUR: 'Dizi / Film / Kültür',
      EGLENCE_OYUN: 'Oyun & Eğlence',
      ODAK: 'Farkındalık',
    };
    return (category ? map[category.toUpperCase()] : null) || 'Genel';
  }

  getCategoryBadgeClass(category: string): string {
    const cat = category?.toLowerCase();
    switch (cat) {
      case 'kariyer':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'beden':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'zihin':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'sosyal':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'hobi':
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20';
      case 'sinema_kultur':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'eglence_oyun':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
      case 'odak':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  }

  getTierBadgeStyle(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'bg-gradient-to-b from-amber-800/25 to-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-600/40 shadow-amber-950/10';
      case 'SILVER':
        return 'bg-gradient-to-b from-slate-200/50 to-slate-400/20 text-slate-700 dark:text-slate-200 border-slate-400/50 shadow-slate-900/10';
      case 'GOLD':
        return 'bg-gradient-to-b from-amber-300/35 to-yellow-500/20 text-amber-800 dark:text-amber-200 border-amber-400/60 shadow-amber-500/20';
      case 'PLATINUM':
        return 'bg-gradient-to-b from-teal-300/35 to-cyan-500/20 text-teal-800 dark:text-teal-200 border-teal-400/60 shadow-teal-500/20';
      case 'DIAMOND':
        return 'bg-gradient-to-b from-cyan-300/45 to-blue-500/25 text-cyan-800 dark:text-cyan-100 border-cyan-400/70 shadow-cyan-500/30 shadow-md ring-1 ring-cyan-400/40 animate-pulse';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }

  getTierPaperclipStyle(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'text-amber-600 dark:text-amber-400';
      case 'SILVER':
        return 'text-slate-400 dark:text-slate-300';
      case 'GOLD':
        return 'text-amber-500 dark:text-yellow-400';
      case 'PLATINUM':
        return 'text-teal-500 dark:text-cyan-400';
      case 'DIAMOND':
        return 'text-cyan-400 dark:text-cyan-200 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]';
      default:
        return 'text-slate-400 dark:text-slate-400';
    }
  }

  private awardCategoryBadge(categoryKey: string): void {
    const normKey = categoryKey?.toUpperCase();
    this.categoryTiers.update((list) =>
      list.map((item) => {
        if (item.category.toUpperCase() !== normKey) return item;
        const newTotal = item.totalBadgesEarned + 1;
        const calc = this.calcTier(newTotal);
        const promoted = calc.tier !== item.currentTier;
        if (promoted) {
          this.toastService.success(
            `Tebrikler! ${item.categoryDisplayName} kategorisinde ${calc.tierName} (${calc.tierIcon})'ne terfi ettiniz!`,
            'KÜME ATLADINIZ! 🏆',
          );
        }
        return {
          ...item,
          totalBadgesEarned: newTotal,
          currentTier: calc.tier,
          currentTierName: calc.tierName,
          currentTierIcon: calc.tierIcon,
          currentTierBadgeCount: calc.badgesInTier,
          nextTierRequiredCount: calc.requiredForNext,
          nextTierName: calc.nextTierName,
          progressPercentage: calc.percentage,
          maxTierReached: calc.tier === 'DIAMOND',
        };
      }),
    );
  }

  private revokeCategoryBadge(categoryKey: string): void {
    const normKey = categoryKey?.toUpperCase();
    this.categoryTiers.update((list) =>
      list.map((item) => {
        if (item.category.toUpperCase() !== normKey || item.totalBadgesEarned <= 0) return item;
        const newTotal = item.totalBadgesEarned - 1;
        const calc = this.calcTier(newTotal);
        return {
          ...item,
          totalBadgesEarned: newTotal,
          currentTier: calc.tier,
          currentTierName: calc.tierName,
          currentTierIcon: calc.tierIcon,
          currentTierBadgeCount: calc.badgesInTier,
          nextTierRequiredCount: calc.requiredForNext,
          nextTierName: calc.nextTierName,
          progressPercentage: calc.percentage,
          maxTierReached: calc.tier === 'DIAMOND',
        };
      }),
    );
  }

  private calcTier(total: number) {
    if (total < 10) {
      const inTier = Math.max(0, total);
      return {
        tier: 'BRONZE' as const,
        tierName: 'Bronz Küme',
        tierIcon: '🥉',
        badgesInTier: inTier,
        requiredForNext: 10,
        nextTierName: 'Gümüş Küme',
        percentage: Math.min(100, Math.round((inTier / 10) * 100)),
      };
    } else if (total < 35) {
      // 10 + 25
      const inTier = total - 10;
      return {
        tier: 'SILVER' as const,
        tierName: 'Gümüş Küme',
        tierIcon: '🥈',
        badgesInTier: inTier,
        requiredForNext: 25,
        nextTierName: 'Altın Küme',
        percentage: Math.min(100, Math.round((inTier / 25) * 100)),
      };
    } else if (total < 85) {
      // 35 + 50
      const inTier = total - 35;
      return {
        tier: 'GOLD' as const,
        tierName: 'Altın Küme',
        tierIcon: '🥇',
        badgesInTier: inTier,
        requiredForNext: 50,
        nextTierName: 'Platin Küme',
        percentage: Math.min(100, Math.round((inTier / 50) * 100)),
      };
    } else if (total < 185) {
      // 85 + 100
      const inTier = total - 85;
      return {
        tier: 'PLATINUM' as const,
        tierName: 'Platin Küme',
        tierIcon: '💠',
        badgesInTier: inTier,
        requiredForNext: 100,
        nextTierName: 'Elmas Küme',
        percentage: Math.min(100, Math.round((inTier / 100) * 100)),
      };
    } else {
      return {
        tier: 'DIAMOND' as const,
        tierName: 'Elmas Küme',
        tierIcon: '💎',
        badgesInTier: total - 185,
        requiredForNext: 0,
        nextTierName: 'Zirve Seviye',
        percentage: 100,
      };
    }
  }
}
