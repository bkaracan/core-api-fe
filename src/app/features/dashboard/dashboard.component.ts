import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { HabitService } from '@core/services/habit.service';
import { GlassMarbleJarComponent } from '@shared/components/glass-marble-jar/glass-marble-jar.component';

export type HabitTimerStatus = 'HAZIR' | 'DEVAM_EDIYOR' | 'DURAKLATILDI' | 'TAMAMLANDI';
export type ScheduledDay = 'BUGUN' | 'YARIN';

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
  // Atomik Alışkanlıklar Planlama: Yalnızca Bugün veya Yarın
  scheduledDay: ScheduledDay;
  scheduledDate: string; // YYYY-MM-DD
  environmentPrepared?: boolean; // James Clear 1. Yasa: Yarın için çevre akşamdan hazırlandı mı?
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
      <!-- 0. PROGRAMIM ANA BAŞLIK VE SEKME YÖNETİMİ -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border-subtle)]"
      >
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xl">📅</span>
            <h1 class="text-xl md:text-2xl font-black tracking-tight text-[var(--color-text-main)]">
              Programım
            </h1>
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
            >
              Atomik Kaizen Çerçevesi
            </span>
          </div>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
            Günlük alışkanlık döngülerinizi yönetin, kimliğinizi inşa edin ve küme rozetlerinizi takip edin.
          </p>
        </div>

        <!-- Sekmeler (Tabs) -->
        <div
          class="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] self-start sm:self-auto shadow-2xs"
        >
          <button
            type="button"
            (click)="setProgramTab('PROGRAM')"
            [class]="
              activeProgramTab() === 'PROGRAM'
                ? 'bg-[var(--color-bg-card)] text-indigo-600 dark:text-indigo-400 shadow-xs font-bold border border-indigo-500/20'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-medium'
            "
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <span>📋</span>
            <span>Günün Alışkanlıkları</span>
          </button>

          <button
            type="button"
            (click)="setProgramTab('IDENTITIES')"
            [class]="
              activeProgramTab() === 'IDENTITIES'
                ? 'bg-[var(--color-bg-card)] text-indigo-600 dark:text-indigo-400 shadow-xs font-bold border border-indigo-500/20'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-medium'
            "
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <span>🧬</span>
            <span>Kimlik Matrisi</span>
          </button>

          <button
            type="button"
            (click)="setProgramTab('TIERS')"
            [class]="
              activeProgramTab() === 'TIERS'
                ? 'bg-[var(--color-bg-card)] text-indigo-600 dark:text-indigo-400 shadow-xs font-bold border border-indigo-500/20'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-medium'
            "
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <span>🏆</span>
            <span>Kategori Rozetleri & Kümeler</span>
            @if (totalBadgesEarnedAllCategories() > 0) {
              <span
                class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold"
              >
                {{ totalBadgesEarnedAllCategories() }}
              </span>
            }
          </button>
        </div>
      </div>

      <!-- 1. GÜNÜN ALIŞKANLIKLARI / PROGRAM AKIŞI -->
      @if (activeProgramTab() === 'PROGRAM') {
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
                  class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl border transition-all text-center relative"
                  [class.ring-2]="day.isToday"
                  [class.ring-indigo-500]="day.isToday"
                  [class.border-emerald-500/50]="day.completed"
                  [class.bg-emerald-500/15]="day.completed"
                  [class.border-indigo-500]="day.isToday && !day.completed"
                  [class.bg-indigo-500/10]="day.isToday && !day.completed"
                  [class.border-[var(--color-border-subtle)]]="!day.completed && !day.isToday"
                  [class.bg-[var(--color-bg-card)]]="!day.completed && !day.isToday"
                >
                  <span
                    class="text-[10px] font-bold"
                    [class.text-indigo-600]="day.isToday"
                    [class.dark:text-indigo-400]="day.isToday"
                    [class.text-[var(--color-text-muted)]]="!day.isToday"
                  >
                    {{ day.dayShort }}
                  </span>
                  <div
                    class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    [class.bg-emerald-500]="day.completed"
                    [class.text-white]="day.completed"
                    [class.bg-indigo-500/20]="day.isToday && !day.completed"
                    [class.text-indigo-500]="day.isToday && !day.completed"
                    [class.bg-[var(--color-bg-subtle)]]="!day.completed && !day.isToday"
                    [class.text-[var(--color-text-muted)]]="!day.completed && !day.isToday"
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
                  2 Dakika Kuralını Dene
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
                veya "2 Dakika Kuralı" butonunu kullanarak sürtünmesiz ilk adımını at!
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
                      3. Kolaylaştır (2 Dakika Kuralı)
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

            <!-- 1. ATOMİK ALIŞKANLIKLAR FELSEFESİ BANNER: UZUN VADELİ PLANLARA YER YOK -->
            <div
              class="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/5 border border-indigo-500/20 text-xs space-y-1.5"
            >
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                  <span class="text-base">⚡</span>
                  <span>Atomik Alışkanlıklar Prensibi: Uzun Vadeli Planlara Yer Yok!</span>
                </div>
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                >
                  Sistem > Hedefler
                </span>
              </div>
              <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                James Clear'ın belirttiği gibi: <em>"Hedeflerinizin seviyesine yükselmezsiniz, sistemlerinizin seviyesine gerilersiniz."</em>
                Aylar veya haftalar sonrasına yapılan soyut planlar ertelemeyi doğurur. Sistemimizde zihni dağıtmadan yalnızca <strong>Bugün</strong>'ün eylemine ve <strong>Yarın</strong>'ın hazırlığına odaklanabilirsiniz.
              </p>
            </div>

            <!-- 2. GÜNLÜK PROGRAM SEKMELERİ: BUGÜN vs YARIN -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]"
            >
              <div class="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
                <!-- Bugün Sekmesi -->
                <button
                  type="button"
                  (click)="switchScheduleTab('BUGUN')"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  [class.bg-[var(--color-bg-card)]]="activeScheduleTab() === 'BUGUN'"
                  [class.text-indigo-600]="activeScheduleTab() === 'BUGUN'"
                  [class.dark:text-indigo-400]="activeScheduleTab() === 'BUGUN'"
                  [class.shadow-2xs]="activeScheduleTab() === 'BUGUN'"
                  [class.border]="activeScheduleTab() === 'BUGUN'"
                  [class.border-[var(--color-border-subtle)]]="activeScheduleTab() === 'BUGUN'"
                  [class.text-[var(--color-text-muted)]]="activeScheduleTab() !== 'BUGUN'"
                  [class.hover:text-[var(--color-text-main)]]="activeScheduleTab() !== 'BUGUN'"
                >
                  <span class="text-base">☀️</span>
                  <span>Bugünün Programı</span>
                  <span
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    [class.bg-indigo-500/15]="activeScheduleTab() === 'BUGUN'"
                    [class.text-indigo-600]="activeScheduleTab() === 'BUGUN'"
                    [class.dark:text-indigo-400]="activeScheduleTab() === 'BUGUN'"
                    [class.bg-[var(--color-bg-card)]]="activeScheduleTab() !== 'BUGUN'"
                    [class.text-[var(--color-text-muted)]]="activeScheduleTab() !== 'BUGUN'"
                  >
                    {{ todayHabits().length }}
                  </span>
                </button>

                <!-- Yarın Sekmesi -->
                <button
                  type="button"
                  (click)="switchScheduleTab('YARIN')"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  [class.bg-[var(--color-bg-card)]]="activeScheduleTab() === 'YARIN'"
                  [class.text-purple-600]="activeScheduleTab() === 'YARIN'"
                  [class.dark:text-purple-400]="activeScheduleTab() === 'YARIN'"
                  [class.shadow-2xs]="activeScheduleTab() === 'YARIN'"
                  [class.border]="activeScheduleTab() === 'YARIN'"
                  [class.border-[var(--color-border-subtle)]]="activeScheduleTab() === 'YARIN'"
                  [class.text-[var(--color-text-muted)]]="activeScheduleTab() !== 'YARIN'"
                  [class.hover:text-[var(--color-text-main)]]="activeScheduleTab() !== 'YARIN'"
                >
                  <span class="text-base">🌙</span>
                  <span>Yarının Programı</span>
                  <span
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    [class.bg-purple-500/15]="activeScheduleTab() === 'YARIN'"
                    [class.text-purple-600]="activeScheduleTab() === 'YARIN'"
                    [class.dark:text-purple-400]="activeScheduleTab() === 'YARIN'"
                    [class.bg-[var(--color-bg-card)]]="activeScheduleTab() !== 'YARIN'"
                    [class.text-[var(--color-text-muted)]]="activeScheduleTab() !== 'YARIN'"
                  >
                    {{ tomorrowHabits().length }}
                  </span>
                </button>
              </div>

              <!-- Aktif Gün Rozeti & Bilgisi -->
              <div class="px-3 py-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                @if (activeScheduleTab() === 'BUGUN') {
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="font-medium"
                    >Aktif Çevrim:
                    <strong class="text-[var(--color-text-main)]">{{ todayDateFormatted }}</strong></span
                  >
                } @else {
                  <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span class="font-medium"
                    >Ön Hazırlık:
                    <strong class="text-[var(--color-text-main)]">{{ tomorrowDateFormatted }}</strong>
                    (Akşamdan Tasarla)</span
                  >
                }
              </div>
            </div>

            <!-- Yeni Alışkanlık Ekleme Formu -->
            @if (showAddHabitForm() || (habits().length === 0 && activeScheduleTab() === 'BUGUN')) {
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
                  @if (habits().length > 0 || showAddHabitForm()) {
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
                  <!-- HEDEF PROGRAM GÜNÜ SEÇİMİ (Yalnızca Bugün veya Yarın) -->
                  <div
                    class="sm:col-span-2 space-y-2 p-3.5 rounded-2xl bg-[var(--color-bg-subtle)] border border-indigo-500/20"
                  >
                    <div class="flex items-center justify-between">
                      <label
                        class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1.5"
                      >
                        <span>📅</span>
                        <span>Programlanacak Gün (Hedef Gün)</span>
                        <span class="text-rose-500">*</span>
                      </label>
                      <span
                        class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1"
                      >
                        <span>🔒</span>
                        <span>Uzun Vadeli Planlara Kapalı</span>
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <!-- Bugün Butonu -->
                      <button
                        type="button"
                        (click)="setScheduledDay('BUGUN')"
                        class="p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 text-left"
                        [class.border-indigo-500]="newHabitScheduledDay() === 'BUGUN'"
                        [class.bg-indigo-500/10]="newHabitScheduledDay() === 'BUGUN'"
                        [class.text-indigo-600]="newHabitScheduledDay() === 'BUGUN'"
                        [class.dark:text-indigo-400]="newHabitScheduledDay() === 'BUGUN'"
                        [class.shadow-2xs]="newHabitScheduledDay() === 'BUGUN'"
                        [class.border-[var(--color-border-subtle)]]="
                          newHabitScheduledDay() !== 'BUGUN'
                        "
                        [class.bg-[var(--color-bg-card)]]="newHabitScheduledDay() !== 'BUGUN'"
                        [class.text-[var(--color-text-muted)]]="newHabitScheduledDay() !== 'BUGUN'"
                      >
                        <span class="text-xl">☀️</span>
                        <div>
                          <div class="font-extrabold text-[var(--color-text-main)]">
                            Bugün İçin Programla
                          </div>
                          <div class="text-[10px] font-normal opacity-80">
                            {{ todayDateShort }} (Şimdi Eyleme Geç & Zinciri Başlat)
                          </div>
                        </div>
                      </button>

                      <!-- Yarın Butonu -->
                      <button
                        type="button"
                        (click)="setScheduledDay('YARIN')"
                        class="p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 text-left"
                        [class.border-purple-500]="newHabitScheduledDay() === 'YARIN'"
                        [class.bg-purple-500/10]="newHabitScheduledDay() === 'YARIN'"
                        [class.text-purple-600]="newHabitScheduledDay() === 'YARIN'"
                        [class.dark:text-purple-400]="newHabitScheduledDay() === 'YARIN'"
                        [class.shadow-2xs]="newHabitScheduledDay() === 'YARIN'"
                        [class.border-[var(--color-border-subtle)]]="
                          newHabitScheduledDay() !== 'YARIN'
                        "
                        [class.bg-[var(--color-bg-card)]]="newHabitScheduledDay() !== 'YARIN'"
                        [class.text-[var(--color-text-muted)]]="newHabitScheduledDay() !== 'YARIN'"
                      >
                        <span class="text-xl">🌙</span>
                        <div>
                          <div class="font-extrabold text-[var(--color-text-main)]">
                            Yarın İçin Programla
                          </div>
                          <div class="text-[10px] font-normal opacity-80">
                            {{ tomorrowDateShort }} (Akşamdan Ortamı & İşareti Tasarla)
                          </div>
                        </div>
                      </button>
                    </div>

                    <div
                      class="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] pt-0.5"
                    >
                      <span class="text-indigo-500 font-bold">ℹ️ Atomik Alışkanlıklar Kuralı:</span>
                      <span>
                        Beynimiz devasa hedefleri ve uzak tarihli planları soyut algılar ve erteler.
                        Bu sebeple sistemimiz yalnızca <strong>Bugün</strong> ve
                        <strong>Yarın</strong> için somut mikro planlar yapmanıza izin verir.
                      </span>
                    </div>
                  </div>

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

                  <!-- 2. Adım: Ne Zaman? (İşaret / Tetikleyici & Dijital Saat) -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <label
                        class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1.5"
                      >
                        <span>2️⃣</span>
                        <span>Ne Zaman? (1. Yasa: Zaman İşareti)</span>
                        <span class="text-rose-500">*</span>
                      </label>
                      @if (newHabitSpecificTime) {
                        <div class="flex items-center gap-1.5">
                          <span
                            class="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all"
                            [ngClass]="getTimePeriodBadgeClass()"
                          >
                            {{ getTimePeriodLabel() }}
                          </span>
                          <span
                            class="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
                          >
                            🕒 {{ newHabitSpecificTime }}
                          </span>
                        </div>
                      } @else {
                        <span class="text-[10px] text-[var(--color-text-muted)] font-medium">
                          ⏰ Saat & Rutin İşareti
                        </span>
                      }
                    </div>

                    <!-- Modern Dijital Saat & Demetleme Kartı -->
                    <div
                      class="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-[var(--color-bg-subtle)] to-purple-500/5 border border-indigo-500/20 space-y-3.5 shadow-2xs"
                    >
                      <!-- Üst Kısım: Dijital Saat Göstergesi & Hızlı Butonlar -->
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <!-- Şık Dijital Kadran (Saat & Dakika) -->
                        <div class="flex items-center gap-2.5">
                          <!-- Saat Bloğu -->
                          <div class="flex flex-col items-center">
                            <button
                              type="button"
                              (click)="adjustHour(1)"
                              class="w-12 h-6 rounded-t-lg bg-[var(--color-bg-card)] hover:bg-indigo-500 hover:text-white border border-b-0 border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Saati 1 Artır"
                            >
                              ▲
                            </button>
                            <input
                              type="text"
                              [value]="newHabitHour || '--'"
                              (change)="onHourInputChange($event)"
                              maxlength="2"
                              class="w-12 h-11 text-center text-xl font-mono font-black border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              title="Saat (00 - 23)"
                            />
                            <button
                              type="button"
                              (click)="adjustHour(-1)"
                              class="w-12 h-6 rounded-b-lg bg-[var(--color-bg-card)] hover:bg-indigo-500 hover:text-white border border-t-0 border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Saati 1 Azalt"
                            >
                              ▼
                            </button>
                            <span
                              class="text-[9px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] mt-1"
                            >
                              Saat
                            </span>
                          </div>

                          <!-- Ayraç (Yanıp Sönen İki Nokta) -->
                          <div class="text-xl font-black font-mono text-indigo-500 animate-pulse pb-4">
                            :
                          </div>

                          <!-- Dakika Bloğu -->
                          <div class="flex flex-col items-center">
                            <button
                              type="button"
                              (click)="adjustMinute(5)"
                              class="w-12 h-6 rounded-t-lg bg-[var(--color-bg-card)] hover:bg-indigo-500 hover:text-white border border-b-0 border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Dakikayı 5 Artır"
                            >
                              ▲
                            </button>
                            <input
                              type="text"
                              [value]="newHabitMinute || '00'"
                              (change)="onMinuteInputChange($event)"
                              maxlength="2"
                              class="w-12 h-11 text-center text-xl font-mono font-black border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              title="Dakika (00 - 59)"
                            />
                            <button
                              type="button"
                              (click)="adjustMinute(-5)"
                              class="w-12 h-6 rounded-b-lg bg-[var(--color-bg-card)] hover:bg-indigo-500 hover:text-white border border-t-0 border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Dakikayı 5 Azalt"
                            >
                              ▼
                            </button>
                            <span
                              class="text-[9px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] mt-1"
                            >
                              Dakika
                            </span>
                          </div>
                        </div>

                        <!-- Sağ: Hızlı Eylemler (Şu Anki Saat & Sıfırla & Sistem Seçici) -->
                        <div class="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            (click)="setCurrentTime()"
                            class="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
                            title="Şu anki gerçek saate ayarla"
                          >
                            <span>⏱️</span>
                            <span>Şu Anki Saat</span>
                          </button>

                          <label
                            class="px-2.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                            title="Sistem saat menüsünü aç"
                          >
                            <span>🕒</span>
                            <span>Seçici</span>
                            <input
                              type="time"
                              [ngModel]="newHabitSpecificTime"
                              (ngModelChange)="onSpecificTimeChange($event)"
                              class="sr-only"
                            />
                          </label>

                          @if (newHabitSpecificTime || newHabitHour) {
                            <button
                              type="button"
                              (click)="clearSpecificTime()"
                              class="px-2.5 py-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs font-medium cursor-pointer transition-colors"
                              title="Seçilen saati kaldır"
                            >
                              ✕ Temizle
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Alışkanlık Demetleme / Durumsal Tetikleyici Metni -->
                      <div class="space-y-1 pt-2 border-t border-[var(--color-border-subtle)]">
                        <label
                          class="text-[11px] font-semibold text-[var(--color-text-main)] flex items-center justify-between"
                        >
                          <span class="flex items-center gap-1">
                            <span>🔗</span>
                            <span>Alışkanlık Demetleme / Rutin Tetikleyici (Opsiyonel):</span>
                          </span>
                          <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Formüle Otomatik İşlenir
                          </span>
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="newHabitCue"
                          placeholder="Örn: Sabah ilk kahvemi aldıktan sonra, toplantı bitiminde, akşam yemeğinden hemen önce..."
                          class="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-2xs focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 3. Adım: 2 Dakika Kuralı Mikro Adımı -->
                  <div class="space-y-1.5">
                    <label
                      class="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1"
                    >
                      <span>3️⃣</span>
                      <span>İlk 2 Dakika Adımı (3. Yasa: Kolaylaştır)</span>
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
                    class="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-[var(--color-bg-card)] to-purple-500/10 border border-indigo-500/30 text-xs text-[var(--color-text-muted)] flex items-start gap-3 shadow-xs"
                  >
                    <span class="text-xl shrink-0 mt-0.5">📜</span>
                    <div class="leading-relaxed space-y-2 w-full">
                      <div class="flex items-center justify-between">
                        <strong
                          class="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5"
                        >
                          <span>📌</span>
                          <span>James Clear Uygulama Niyeti Formülü (Implementation Intentions):</span>
                        </strong>
                        <span
                          class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20"
                        >
                          1. Yasa: Görünür Kıl
                        </span>
                      </div>
                      <div
                        class="text-xs text-[var(--color-text-main)] leading-relaxed bg-[var(--color-bg-card)]/90 p-3 rounded-xl border border-[var(--color-border-subtle)] shadow-2xs"
                      >
                        "<strong class="text-indigo-600 dark:text-indigo-400 font-bold">{{
                          newHabitScheduledDay() === 'BUGUN' ? 'Bugün' : 'Yarın'
                        }}</strong
                        >,
                        <strong
                          class="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/25"
                        >
                          {{ getImplementationIntentTime() }}
                        </strong>,
                        <strong class="text-emerald-600 dark:text-emerald-400 font-bold">
                          📍 {{ newHabitLocation.trim() || '[MEKAN]' }}
                        </strong>
                        konumunda
                        <strong class="text-amber-600 dark:text-amber-400 font-bold">
                          {{ newHabitTitle.trim() || '[ALIŞKANLIK BAŞLIĞI]' }}
                        </strong>
                        eylemini
                        <strong class="text-purple-600 dark:text-purple-400 font-bold">
                          ⏱️ {{ newHabitTargetMinutes }} dakika
                        </strong>
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
                    <span>{{
                      newHabitScheduledDay() === 'BUGUN'
                        ? 'Alışkanlığı Bugüne Kaydet (+20 XP)'
                        : 'Alışkanlığı Yarına Planla (+20 XP)'
                    }}</span>
                  </button>
                </div>
              </div>
            }

            <!-- Alışkanlıklar Listesi (Seçili Günün Programı) -->
            @if (displayedHabits().length > 0) {
              <div class="space-y-4">
                @for (habit of displayedHabits(); track habit.id) {
                  <div
                    class="group p-5 rounded-2xl border transition-all duration-300 space-y-4 shadow-xs"
                    [ngClass]="getHabitCardStatusClass(habit)"
                  >
                    @if (editingHabitId() === habit.id) {
                      <!-- Alışkanlık Kartı Düzenleme Modu -->
                      <div class="space-y-4">
                        <!-- Düzenleme Başlığı & Vazgeç -->
                        <div class="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                          <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shadow-2xs">
                              ✏️
                            </div>
                            <div>
                              <h3 class="text-sm font-bold text-[var(--color-text-main)]">
                                Alışkanlığı Düzenle
                              </h3>
                              <p class="text-[11px] text-[var(--color-text-muted)]">
                                Parametreleri güncelleyip anında kaydedin
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            (click)="cancelEditHabit()"
                            class="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-all"
                          >
                            ✕ Vazgeç
                          </button>
                        </div>

                        <!-- 1. Alışkanlık Adı -->
                        <div class="space-y-1.5">
                          <label class="block text-xs font-semibold text-[var(--color-text-main)]">
                            Alışkanlık Adı <span class="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="editHabitTitle"
                            placeholder="Örn: 25 Dk Derin Odaklı Kodlama"
                            class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                          />
                        </div>

                        <!-- 2. Kategori & Hedef Kimlik -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div class="space-y-1.5">
                            <label class="block text-xs font-semibold text-[var(--color-text-main)]">
                              Kategori
                            </label>
                            <select
                              [(ngModel)]="editHabitCategory"
                              class="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            >
                              @for (cat of habitCategories; track cat.key) {
                                <option [value]="cat.key.toLowerCase()">{{ cat.icon }} {{ cat.label }}</option>
                              }
                            </select>
                          </div>
                          <div class="space-y-1.5">
                            <label class="block text-xs font-semibold text-[var(--color-text-main)]">
                              Hedef Kimlik
                            </label>
                            <select
                              [(ngModel)]="editHabitIdentityId"
                              class="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            >
                              @for (identity of identities(); track identity.id) {
                                <option [value]="identity.id">{{ identity.icon }} {{ identity.name }}</option>
                              }
                            </select>
                          </div>
                        </div>

                        <!-- 3. Saat & Zaman İşareti (James Clear Uygulama Niyeti Formülü) -->
                        <div class="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/40 space-y-3">
                          <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                              <span>⏰</span>
                              <span>Saat & Zaman İşareti</span>
                            </label>
                            @if (editHabitSpecificTime) {
                              <button
                                type="button"
                                (click)="clearEditSpecificTime()"
                                class="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer transition-colors"
                              >
                                ✕ Saati Temizle
                              </button>
                            }
                          </div>

                          <div class="flex flex-wrap items-center gap-4 bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                            <!-- Saat / Dakika Stepper -->
                            <div class="flex items-center gap-2">
                              <!-- Saat Bloğu -->
                              <div class="flex flex-col items-center">
                                <button
                                  type="button"
                                  (click)="adjustEditHour(1)"
                                  class="w-10 h-5 rounded-t-lg bg-[var(--color-bg-subtle)] hover:bg-indigo-500 hover:text-white border border-b-0 border-[var(--color-border-subtle)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                  title="Saati 1 Artır"
                                >
                                  ▲
                                </button>
                                <input
                                  type="text"
                                  [value]="editHabitHour || '--'"
                                  (change)="onEditHourInputChange($event)"
                                  maxlength="2"
                                  class="w-10 h-9 text-center text-lg font-mono font-bold border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  title="Saat (00 - 23)"
                                />
                                <button
                                  type="button"
                                  (click)="adjustEditHour(-1)"
                                  class="w-10 h-5 rounded-b-lg bg-[var(--color-bg-subtle)] hover:bg-indigo-500 hover:text-white border border-t-0 border-[var(--color-border-subtle)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                  title="Saati 1 Azalt"
                                >
                                  ▼
                                </button>
                                <span class="text-[8px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] mt-0.5">Saat</span>
                              </div>

                              <div class="text-lg font-bold font-mono text-indigo-500 animate-pulse pb-3">:</div>

                              <!-- Dakika Bloğu -->
                              <div class="flex flex-col items-center">
                                <button
                                  type="button"
                                  (click)="adjustEditMinute(5)"
                                  class="w-10 h-5 rounded-t-lg bg-[var(--color-bg-subtle)] hover:bg-indigo-500 hover:text-white border border-b-0 border-[var(--color-border-subtle)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                  title="Dakikayı 5 Artır"
                                >
                                  ▲
                                </button>
                                <input
                                  type="text"
                                  [value]="editHabitMinute || '00'"
                                  (change)="onEditMinuteInputChange($event)"
                                  maxlength="2"
                                  class="w-10 h-9 text-center text-lg font-mono font-bold border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  title="Dakika (00 - 59)"
                                />
                                <button
                                  type="button"
                                  (click)="adjustEditMinute(-5)"
                                  class="w-10 h-5 rounded-b-lg bg-[var(--color-bg-subtle)] hover:bg-indigo-500 hover:text-white border border-t-0 border-[var(--color-border-subtle)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                  title="Dakikayı 5 Azalt"
                                >
                                  ▼
                                </button>
                                <span class="text-[8px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] mt-0.5">Dakika</span>
                              </div>
                            </div>

                            <div class="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                (click)="setEditCurrentTime()"
                                class="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <span>⏱️</span>
                                <span>Şu Anki Saat</span>
                              </button>
                            </div>
                          </div>

                          <div class="space-y-1">
                            <label class="block text-[11px] font-medium text-[var(--color-text-muted)]">
                              Zaman İşareti / Uygulama Niyeti Formülü
                            </label>
                            <input
                              type="text"
                              [(ngModel)]="editHabitCue"
                              placeholder="Örn: Saat 09:00'da ilk kahveyi aldıktan hemen sonra"
                              class="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                            />
                          </div>
                        </div>

                        <!-- 4. Mekan / Nerede? -->
                        <div class="space-y-1.5">
                          <label class="block text-xs font-semibold text-[var(--color-text-main)]">
                            📍 Nerede? (Mekan / Çevre)
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="editHabitLocation"
                            list="editHabitLocationOptions"
                            placeholder="Örn: Çalışma Masası, Sessiz Oda..."
                            class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                          />
                          <datalist id="editHabitLocationOptions">
                            @for (loc of suggestedLocations; track loc.label) {
                              <option [value]="loc.label">{{ loc.icon }} {{ loc.label }}</option>
                            }
                          </datalist>
                        </div>

                        <!-- 5. 2 Dakika Kuralı (Mikro Başlangıç Adımı) -->
                        <div class="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1.5">
                          <label class="block text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>3. Yasa: 2 Dakika Kuralı (Mikro Başlangıç Adımı)</span>
                          </label>
                          <input
                            type="text"
                            [(ngModel)]="editHabitMicroStep"
                            placeholder="Örn: Masaya otur ve defteri aç (Direnci sıfıra indir)"
                            class="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                          />
                        </div>

                        <!-- 6. Hedef Odaklanma Süresi -->
                        <div class="space-y-1.5">
                          <label class="block text-xs font-semibold text-[var(--color-text-main)]">
                            ⏱️ Hedef Odaklanma Süresi (Dakika)
                          </label>
                          <div class="flex flex-wrap items-center gap-1.5">
                            @for (mins of [2, 5, 15, 25, 45, 60]; track mins) {
                              <button
                                type="button"
                                (click)="setEditTargetMinutes(mins)"
                                class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer"
                                [class.bg-indigo-600]="editHabitTargetMinutes === mins"
                                [class.text-white]="editHabitTargetMinutes === mins"
                                [class.border-indigo-600]="editHabitTargetMinutes === mins"
                                [class.border-[var(--color-border-subtle)]]="editHabitTargetMinutes !== mins"
                                [class.bg-[var(--color-bg-card)]]="editHabitTargetMinutes !== mins"
                                [class.text-[var(--color-text-muted)]]="editHabitTargetMinutes !== mins"
                              >
                                {{ mins }} dk
                              </button>
                            }
                            <input
                              type="number"
                              min="1"
                              max="240"
                              [(ngModel)]="editHabitTargetMinutes"
                              class="w-16 px-2 py-1 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-center font-bold"
                            />
                            <span class="text-xs text-[var(--color-text-muted)] font-medium">dk</span>
                          </div>
                        </div>

                        <!-- Alt Aksiyon Butonları -->
                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                          <button
                            type="button"
                            (click)="cancelEditHabit()"
                            class="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            (click)="saveEditHabit(habit.id)"
                            class="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
                          >
                            <span>💾</span>
                            <span>Değişiklikleri Kaydet</span>
                          </button>
                        </div>
                      </div>
                    } @else {
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

                            <!-- Gün Programı Rozeti (Bugün / Yarın) -->
                            <span
                              class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all"
                              [class.bg-emerald-500/10]="habit.scheduledDay === 'BUGUN'"
                              [class.text-emerald-600]="habit.scheduledDay === 'BUGUN'"
                              [class.dark:text-emerald-400]="habit.scheduledDay === 'BUGUN'"
                              [class.border-emerald-500/30]="habit.scheduledDay === 'BUGUN'"
                              [class.bg-purple-500/10]="habit.scheduledDay === 'YARIN'"
                              [class.text-purple-600]="habit.scheduledDay === 'YARIN'"
                              [class.dark:text-purple-400]="habit.scheduledDay === 'YARIN'"
                              [class.border-purple-500/30]="habit.scheduledDay === 'YARIN'"
                            >
                              <span>{{ habit.scheduledDay === 'BUGUN' ? '☀️ Bugün' : '🌙 Yarın' }}</span>
                            </span>

                            <!-- Kategori Rozeti -->
                            <span
                              class="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                              [ngClass]="getCategoryBadgeClass(habit.category)"
                            >
                              {{ habit.categoryLabel }}
                            </span>

                          </div>

                          <!-- Alışkanlık Belirlenen Bilgileri: Zaman, Mekan & Kimlik Oyu -->
                          <div class="mt-2.5 flex items-center gap-2 text-xs flex-wrap">
                            <!-- Zaman -->
                            <span
                              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] shadow-2xs"
                              title="Belirlenen Zaman ve Rutin İşareti"
                            >
                              <span class="text-indigo-500">⏰</span>
                              <span class="font-medium text-[var(--color-text-main)]">{{ habit.cue }}</span>
                            </span>

                            <!-- Mekan -->
                            <span
                              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] shadow-2xs"
                              title="Alışkanlığın Gerçekleşeceği Mekan"
                            >
                              <span class="text-emerald-500">📍</span>
                              <span class="font-medium text-[var(--color-text-main)]">{{ habit.targetLocation }}</span>
                            </span>

                            <!-- Kimlik Oyu -->
                            <span
                              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs"
                              title="Bu alışkanlığın oy kazandırdığı hedef kimlik"
                            >
                              <span>🎯</span>
                              <span>+1 Oy: {{ getIdentityDisplayName(habit.identityId) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- XP Puanı, Gün Değiştirme, Sil Butonu & 2 Dakika Kuralı -->
                      <div class="flex flex-col items-end gap-2 shrink-0">
                        <div class="flex items-center gap-1.5 flex-wrap justify-end">
                          @if (habit.scheduledDay === 'BUGUN') {
                            <button
                              type="button"
                              (click)="moveHabitToDay(habit.id, 'YARIN')"
                              class="text-[10px] font-medium px-2 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-purple-500/40 hover:text-purple-600 dark:hover:text-purple-400 text-[var(--color-text-muted)] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Bu alışkanlığı yarının programına aktar"
                            >
                              <span>🌙 Yarına Aktar</span>
                            </button>
                          } @else {
                            <button
                              type="button"
                              (click)="moveHabitToDay(habit.id, 'BUGUN')"
                              class="text-[10px] font-medium px-2 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-[var(--color-text-muted)] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Bu alışkanlığı hemen bugünün programına taşı"
                            >
                              <span>☀️ Bugüne Al</span>
                            </button>
                          }

                          <span
                            class="text-xs font-bold font-mono px-2 py-1 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-indigo-600 dark:text-indigo-400"
                          >
                            +{{ habit.rewardXp }} XP
                          </span>
                          <button
                            type="button"
                            (click)="startEditHabit(habit, $event)"
                            class="p-1 rounded-md text-[var(--color-text-muted)] hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Alışkanlığı Düzenle"
                            aria-label="Alışkanlığı Düzenle"
                          >
                            <svg
                              class="w-3.5 h-3.5 pointer-events-none"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            (click)="openDeleteConfirmModal(habit, $event)"
                            class="p-1 rounded-md text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Alışkanlığı Sil"
                            aria-label="Alışkanlığı Sil"
                          >
                            <svg
                              class="w-3.5 h-3.5 pointer-events-none"
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
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all duration-200 cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-xs"
                            [class.border-purple-500]="habit.twoMinuteModeActive"
                            [class.bg-purple-500/20]="habit.twoMinuteModeActive"
                            [class.text-purple-600]="habit.twoMinuteModeActive"
                            [class.dark:text-purple-300]="habit.twoMinuteModeActive"
                            [class.hover:bg-purple-500/30]="habit.twoMinuteModeActive"
                            [class.border-[var(--color-border-subtle)]]="!habit.twoMinuteModeActive"
                            [class.bg-[var(--color-bg-card)]]="!habit.twoMinuteModeActive"
                            [class.text-[var(--color-text-muted)]]="!habit.twoMinuteModeActive"
                            [class.hover:border-purple-500/60]="!habit.twoMinuteModeActive"
                            [class.hover:text-purple-600]="!habit.twoMinuteModeActive"
                            [class.dark:hover:text-purple-400]="!habit.twoMinuteModeActive"
                            [class.hover:bg-purple-500/10]="!habit.twoMinuteModeActive"
                            title="Görevi 2 dakikalık mikro başlangıca indirge"
                          >
                            <span>⚡</span>
                            <span>2 Dakika Kuralı</span>
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
                  }
                </div>
              }
              </div>
            }

            <!-- Boş Durum (Seçili Günün Programı Henüz Boşsa) -->
            @if (displayedHabits().length === 0 && !showAddHabitForm()) {
              <div
                class="p-8 rounded-2xl border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 bg-[var(--color-bg-subtle)]/50"
              >
                <div class="text-3xl">{{ activeScheduleTab() === 'BUGUN' ? '☀️' : '🌙' }}</div>
                <div class="space-y-1">
                  <h4 class="text-sm font-bold text-[var(--color-text-main)]">
                    {{
                      activeScheduleTab() === 'BUGUN'
                        ? 'Bugün için henüz bir alışkanlık programlanmadı'
                        : 'Yarın için henüz bir alışkanlık programlanmadı'
                    }}
                  </h4>
                  <p class="text-xs text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
                    @if (activeScheduleTab() === 'BUGUN') {
                      Atomik Alışkanlıklar felsefesiyle hemen şimdi küçük bir 2 dakikalık adım atın ve bugünün zincirini başlatın.
                    } @else {
                      James Clear'ın dediği gibi: <em>"En iyi sabah rutini, bir önceki akşam yapılan hazırlıkla başlar."</em> Yarının ortamını ve ritüelini bugünden tasarlayın.
                    }
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openAddHabitForCurrentTab()"
                  class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <span>➕</span>
                  <span>{{
                    activeScheduleTab() === 'BUGUN'
                      ? 'Bugün İçin Alışkanlık Ekle'
                      : 'Yarın İçin Alışkanlık Planla'
                  }}</span>
                </button>
              </div>
            }

            <!-- Günün Başarı Kutlaması (Bugün 100% Tamamlandığında) -->
            @if (activeScheduleTab() === 'BUGUN' && completionRate() === 100 && totalHabitsCount() > 0) {
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
      }

      <!-- 2. KİMLİK MATRİSİ SEKMESİ İÇERİĞİ -->
      @if (activeProgramTab() === 'IDENTITIES') {
        <div class="space-y-6 animate-fade-in">
          <div class="flex items-center justify-between">
            <button
              type="button"
              (click)="setProgramTab('PROGRAM')"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>←</span>
              <span>Günün Alışkanlıklarına Dön</span>
            </button>
            <span class="text-xs text-[var(--color-text-muted)] font-mono">
              Toplam Verilen Oy:
              <strong class="text-indigo-600 dark:text-indigo-400">{{ totalIdentityVotes() }}</strong>
            </span>
          </div>

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
        </div>
      }

      <!-- 3. KATEGORİ ROZETLERİ & KÜME TERFİ SİSTEMİ SEKMESİ İÇERİĞİ -->
      @if (activeProgramTab() === 'TIERS') {
        <div class="space-y-6 animate-fade-in">
          <div class="flex items-center justify-between">
            <button
              type="button"
              (click)="setProgramTab('PROGRAM')"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>←</span>
              <span>Günün Alışkanlıklarına Dön</span>
            </button>
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-xs font-mono"
            >
              <span class="text-base">🎖️</span>
              <span class="text-[var(--color-text-muted)]">Toplam Rozet:</span>
              <strong class="text-emerald-600 dark:text-emerald-400 font-black">{{
                totalBadgesEarnedAllCategories()
              }}</strong>
            </div>
          </div>

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

            <!-- 8 Kategori Kartı Grid (Modern Glassmorphism & League Trophy Tasarımı) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              @for (tier of categoryTiers(); track tier.category) {
                <div
                  class="relative p-5 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)]/70 transition-all duration-300 space-y-4 group shadow-xs hover:shadow-md overflow-hidden"
                  [ngClass]="getTierCardStyle(tier.currentTier)"
                >
                  <!-- Kart Köşesi Ambient Glow Efekti -->
                  <div
                    class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br pointer-events-none blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                    [ngClass]="getTierGlowStyle(tier.currentTier)"
                  ></div>

                  <!-- Üst Satır: Kategori İkonu & Küme Rozeti -->
                  <div class="flex items-center justify-between gap-2 relative z-10">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-11 h-11 rounded-2xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 group-hover:border-indigo-500/30 transition-all shrink-0"
                      >
                        {{ tier.icon }}
                      </div>
                      <span
                        class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap"
                      >
                        {{ tier.totalBadgesEarned }} Rozet
                      </span>
                    </div>

                    <!-- Şık Küme Terfi Rozeti (Tier Badge Pill) -->
                    <div
                      class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border backdrop-blur-md transition-all shrink-0 shadow-2xs group-hover:scale-105"
                      [ngClass]="getTierBadgeStyle(tier.currentTier)"
                    >
                      <span class="text-sm leading-none">{{ tier.currentTierIcon }}</span>
                      <span class="text-[11px] font-extrabold tracking-tight whitespace-nowrap">{{
                        tier.currentTierName
                      }}</span>
                    </div>
                  </div>

                  <!-- Kategori Adı (Tam Genişlikte, Kesilmez ve Tam Görünür) -->
                  <div class="relative z-10 pt-0.5">
                    <h3
                      class="text-sm font-bold text-[var(--color-text-main)] tracking-tight leading-snug break-words"
                    >
                      {{ tier.categoryDisplayName }}
                    </h3>
                  </div>

                  <!-- Orta Kısım: Küme İlerleme Çubuğu ve Sayaç -->
                  <div class="space-y-2 relative z-10 pt-1">
                    <div
                      class="flex items-center justify-between text-xs text-[var(--color-text-muted)]"
                    >
                      <span class="font-medium text-[11px]">Küme İçi İlerleme</span>
                      <div class="font-mono text-xs">
                        <strong class="text-[var(--color-text-main)] font-bold">{{
                          tier.currentTierBadgeCount
                        }}</strong>
                        <span class="text-[var(--color-text-muted)]">
                          / {{ tier.nextTierRequiredCount > 0 ? tier.nextTierRequiredCount : '∞' }}</span
                        >
                        <span class="ml-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400"
                          >(%{{ tier.progressPercentage | number: '1.0-0' }})</span
                        >
                      </div>
                    </div>

                    <!-- Gradient Progress Bar -->
                    <div
                      class="w-full bg-[var(--color-bg-subtle)] h-2 rounded-full overflow-hidden border border-[var(--color-border-subtle)] p-0.5"
                    >
                      <div
                        class="h-full bg-gradient-to-r rounded-full transition-all duration-500"
                        [ngClass]="getTierProgressGradient(tier.currentTier)"
                        [style.width.%]="tier.progressPercentage"
                      ></div>
                    </div>

                    <!-- Alt Durum Mesajı -->
                    <div class="flex items-center justify-between pt-0.5 text-[11px]">
                      @if (tier.nextTierRequiredCount > 0) {
                        <span class="text-[var(--color-text-muted)]">
                          Hedef: <strong class="text-[var(--color-text-main)]">{{ tier.nextTierName }}</strong>
                        </span>
                        <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {{ tier.nextTierRequiredCount - tier.currentTierBadgeCount }} kaldı
                        </span>
                      } @else {
                        <span class="text-cyan-500 font-bold font-mono flex items-center gap-1">
                          <span>💎</span>
                          <span>Zirve Seviye: Grandmaster</span>
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Alt Kısım: 5 Küme Kademesi Yolculuk Göstergesi (Mini Milestone Stepper) -->
                  <div
                    class="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)] relative z-10"
                  >
                    <div class="flex items-center gap-1.5 w-full">
                      @for (step of [
                        { icon: '🥉', name: 'Bronz', idx: 0 },
                        { icon: '🥈', name: 'Gümüş', idx: 1 },
                        { icon: '🥇', name: 'Altın', idx: 2 },
                        { icon: '💠', name: 'Platin', idx: 3 },
                        { icon: '💎', name: 'Elmas', idx: 4 }
                      ]; track step.idx) {
                        <div
                          class="flex-1 flex flex-col items-center gap-1 group/step cursor-default"
                          [title]="step.name + ' Küme'"
                        >
                          <div
                            class="w-full h-1 rounded-full transition-all"
                            [class.bg-gradient-to-r]="getTierLevelIndex(tier.currentTier) >= step.idx"
                            [class.from-indigo-500]="getTierLevelIndex(tier.currentTier) >= step.idx"
                            [class.to-emerald-400]="getTierLevelIndex(tier.currentTier) >= step.idx"
                            [class.bg-[var(--color-border-subtle)]]="getTierLevelIndex(tier.currentTier) < step.idx"
                          ></div>
                          <span
                            class="text-[10px] transition-opacity"
                            [class.opacity-100]="getTierLevelIndex(tier.currentTier) >= step.idx"
                            [class.opacity-30]="getTierLevelIndex(tier.currentTier) < step.idx"
                            [class.scale-110]="getTierLevelIndex(tier.currentTier) === step.idx"
                          >
                            {{ step.icon }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      }

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

      <!-- 8. ALIŞKANLIK SİLME ONAY POPUP'I (DELETE CONFIRMATION MODAL) -->
      @if (deleteConfirmModalHabit(); as habitToDelete) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          (click)="closeDeleteConfirmModal()"
        >
          <div
            class="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[var(--color-bg-card)] p-6 space-y-5 shadow-2xl text-[var(--color-text-main)] animate-scale-up"
            (click)="$event.stopPropagation()"
          >
            <!-- Modal Başlık Satırı -->
            <div
              class="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-2xl p-2 rounded-2xl bg-rose-500/10 text-rose-500">🗑️</span>
                <div>
                  <h3 class="text-base font-bold text-[var(--color-text-main)]">
                    Alışkanlığı Silmek İstediğinize Emin Misiniz?
                  </h3>
                  <span class="text-[11px] text-[var(--color-text-muted)]">
                    Bu işlem geri alınamaz
                  </span>
                </div>
              </div>
              <button
                type="button"
                (click)="closeDeleteConfirmModal()"
                class="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"
                title="Kapat"
              >
                ✕
              </button>
            </div>

            <!-- Modal Gövdesi: Bilgi & Detaylar -->
            <div class="space-y-4 text-xs leading-relaxed">
              <div
                class="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-[var(--color-text-main)] space-y-2"
              >
                <div class="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Silinecek Alışkanlık:</span>
                </div>
                <div class="text-sm font-bold text-[var(--color-text-main)]">
                  {{ habitToDelete.title }}
                </div>
                <div class="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] flex-wrap pt-0.5">
                  <span class="px-2 py-0.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] font-medium">
                    🏷️ {{ habitToDelete.categoryLabel }}
                  </span>
                  <span>•</span>
                  <span>📍 {{ habitToDelete.targetLocation }}</span>
                  <span>•</span>
                  <span>⏱️ {{ habitToDelete.targetMinutes }} dk</span>
                </div>
              </div>

              <p class="text-[11.5px] text-[var(--color-text-muted)] leading-relaxed">
                Bu alışkanlığı sildiğinizde; ilgili <strong>hedef kimlik oyları</strong>, <strong>kazanılan kategori rozeti</strong> ve <strong>günlük program kaydı</strong> sistemden kaldırılacaktır.
              </p>

              <!-- Aksiyon Butonları -->
              <div class="grid grid-cols-2 gap-2.5 pt-1">
                <!-- Vazgeç -->
                <button
                  type="button"
                  (click)="closeDeleteConfirmModal()"
                  class="py-2.5 px-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  Vazgeç
                </button>

                <!-- Evet, Alışkanlığı Sil -->
                <button
                  type="button"
                  (click)="confirmDeleteHabit()"
                  class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-rose-500/25 active:scale-95"
                >
                  <span>🗑️</span>
                  <span>Evet, Sil</span>
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Programım Ana Sekmeleri (Günün Alışkanlıkları | Kimlik Matrisi | Kategori Rozetleri)
  readonly activeProgramTab = signal<'PROGRAM' | 'IDENTITIES' | 'TIERS'>('PROGRAM');

  readonly currentStreak = signal<number>(0);
  readonly selectedIdentityFilter = signal<string | null>(null);
  readonly showAddHabitForm = signal<boolean>(false);
  readonly isMasteryGuideCollapsed = signal<boolean>(false);
  readonly activeExplainer = signal<string | null>(null);
  readonly masteryStep3Done = signal<boolean>(false);

  // Günlük Planlama & Atomik Alışkanlıklar (Yalnızca Bugün veya Yarın)
  readonly activeScheduleTab = signal<ScheduledDay>('BUGUN');
  readonly newHabitScheduledDay = signal<ScheduledDay>('BUGUN');

  newHabitCategory = 'KARIYER';
  newHabitTitle = '';
  newHabitIdentityId = 'pro';
  newHabitCue = '';
  newHabitHour = '';
  newHabitMinute = '00';
  newHabitSpecificTime = '';
  newHabitLocation = 'Çalışma Masası';
  newHabitMicroStep = '';
  newHabitTargetMinutes = 25;

  readonly hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

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
  // Alışkanlık Silme Onay Modal Durumu
  readonly deleteConfirmModalHabit = signal<UserHabit | null>(null);

  // Alışkanlık Kartı Düzenleme Durumu
  readonly editingHabitId = signal<string | null>(null);
  editHabitTitle = '';
  editHabitCategory: UserHabit['category'] = 'kariyer';
  editHabitIdentityId = 'pro';
  editHabitCue = '';
  editHabitHour = '';
  editHabitMinute = '00';
  editHabitSpecificTime = '';
  editHabitLocation = '';
  editHabitMicroStep = '';
  editHabitTargetMinutes = 25;

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
    this.clearSpecificTime();
    this.newHabitLocation = insp.location;
    this.newHabitMicroStep = insp.microStep;
  }

  getTurkishTimeLocativeSuffix(time: string): string {
    if (!time || !time.includes(':')) return "'da";
    const parts = time.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    if (isNaN(hour)) return "'da";

    // TDK Kuralı: Dakika "00" (tam saat) ise ek saat değerine göre gelir.
    // Dakika "00" değilse ek dakika değerine göre gelir.
    if (isNaN(minute) || minute === 0) {
      switch (hour) {
        case 3:
        case 4:
        case 5:
        case 13:
        case 14:
        case 15:
        case 23:
          return "'te";
        case 1:
        case 2:
        case 7:
        case 8:
        case 11:
        case 12:
        case 17:
        case 18:
        case 20:
        case 21:
        case 22:
          return "'de";
        case 6:
        case 9:
        case 10:
        case 16:
        case 19:
        case 0:
        case 24:
        default:
          return "'da";
      }
    } else {
      if (minute === 10 || minute === 30) {
        return "'da"; // on'da, otuz'da
      }
      if (minute === 20 || minute === 50) {
        return "'de"; // yirmi'de, elli'de
      }
      if (minute === 40) {
        return "'ta"; // kırk'ta
      }

      const lastDigit = minute % 10;
      switch (lastDigit) {
        case 3:
        case 4:
        case 5:
          return "'te"; // üç'te, dört'te, beş'te
        case 1:
        case 2:
        case 7:
        case 8:
          return "'de"; // bir'de, iki'de, yedi'de, sekiz'de
        case 6:
        case 9:
        default:
          return "'da"; // altı'da, dokuz'da
      }
    }
  }

  formatTurkishTimeWithLocative(time: string): string {
    if (!time) return '';
    return `${time}${this.getTurkishTimeLocativeSuffix(time)}`;
  }

  getImplementationIntentTime(): string {
    const time = this.newHabitSpecificTime;
    const cue = this.newHabitCue.trim();
    if (time && cue) {
      if (cue.toLowerCase().includes(time)) {
        return `⏰ ${cue}`;
      }
      const timeFormatted = this.formatTurkishTimeWithLocative(time);
      return `⏰ Saat ${timeFormatted} (${cue})`;
    } else if (time) {
      const timeFormatted = this.formatTurkishTimeWithLocative(time);
      return `⏰ Saat ${timeFormatted}`;
    } else if (cue) {
      return `⏰ ${cue}`;
    }
    return '⏰ [ZAMAN & TETİKLEYİCİ]';
  }

  getTimePeriodLabel(): string {
    if (!this.newHabitSpecificTime) return '';
    const hour = parseInt(this.newHabitSpecificTime.split(':')[0], 10);
    if (isNaN(hour)) return '';
    if (hour >= 5 && hour < 12) return '🌅 Sabah Rutini';
    if (hour >= 12 && hour < 17) return '☀️ Öğle & Odak';
    if (hour >= 17 && hour < 22) return '🌆 Akşamüstü';
    return '🌙 Gece Dinlenmesi';
  }

  getTimePeriodBadgeClass(): string {
    if (!this.newHabitSpecificTime) return '';
    const hour = parseInt(this.newHabitSpecificTime.split(':')[0], 10);
    if (isNaN(hour)) return '';
    if (hour >= 5 && hour < 12) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (hour >= 12 && hour < 17) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
    if (hour >= 17 && hour < 22) {
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
    }
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
  }

  onSpecificTimeChange(val: string): void {
    this.newHabitSpecificTime = val;
    if (val && val.includes(':')) {
      const [h, m] = val.split(':');
      this.newHabitHour = h;
      this.newHabitMinute = m;
    } else if (!val) {
      this.newHabitHour = '';
      this.newHabitMinute = '00';
    }
  }

  onHourOrMinuteChange(): void {
    if (this.newHabitHour) {
      const min = this.newHabitMinute || '00';
      this.newHabitSpecificTime = `${this.newHabitHour}:${min}`;
    } else {
      this.newHabitSpecificTime = '';
    }
  }

  onHourInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val === '') {
      this.newHabitHour = '';
      this.onHourOrMinuteChange();
      return;
    }
    let num = parseInt(val, 10);
    if (num > 23) num = 23;
    if (num < 0) num = 0;
    this.newHabitHour = String(num).padStart(2, '0');
    input.value = this.newHabitHour;
    if (!this.newHabitMinute) this.newHabitMinute = '00';
    this.onHourOrMinuteChange();
  }

  onMinuteInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val === '') {
      this.newHabitMinute = '00';
      this.onHourOrMinuteChange();
      return;
    }
    let num = parseInt(val, 10);
    if (num > 59) num = 59;
    if (num < 0) num = 0;
    this.newHabitMinute = String(num).padStart(2, '0');
    input.value = this.newHabitMinute;
    if (this.newHabitHour === '') {
      this.newHabitHour = String(new Date().getHours()).padStart(2, '0');
    }
    this.onHourOrMinuteChange();
  }

  adjustHour(delta: number): void {
    let currentH = this.newHabitHour ? parseInt(this.newHabitHour, 10) : new Date().getHours();
    currentH = (currentH + delta + 24) % 24;
    this.newHabitHour = String(currentH).padStart(2, '0');
    if (!this.newHabitMinute) this.newHabitMinute = '00';
    this.onHourOrMinuteChange();
  }

  adjustMinute(delta: number): void {
    if (!this.newHabitHour) {
      this.newHabitHour = String(new Date().getHours()).padStart(2, '0');
    }
    let currentM = this.newHabitMinute ? parseInt(this.newHabitMinute, 10) : 0;
    currentM = (currentM + delta + 60) % 60;
    this.newHabitMinute = String(currentM).padStart(2, '0');
    this.onHourOrMinuteChange();
  }

  setCurrentTime(): void {
    const now = new Date();
    this.newHabitHour = String(now.getHours()).padStart(2, '0');
    const rawMin = now.getMinutes();
    const roundedMin = Math.round(rawMin / 5) * 5;
    if (roundedMin >= 60) {
      this.newHabitHour = String((now.getHours() + 1) % 24).padStart(2, '0');
      this.newHabitMinute = '00';
    } else {
      this.newHabitHour = String(now.getHours()).padStart(2, '0');
      this.newHabitMinute = String(roundedMin).padStart(2, '0');
    }
    this.onHourOrMinuteChange();
  }

  clearSpecificTime(): void {
    this.newHabitHour = '';
    this.newHabitMinute = '00';
    this.newHabitSpecificTime = '';
  }

  setLocation(loc: string): void {
    this.newHabitLocation = loc;
  }

  kaizenReflectionInput = '';
  mudaInput = '';

  readonly todayDate = new Date();
  readonly tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  readonly todayIso = this.formatIsoDate(this.todayDate);
  readonly tomorrowIso = this.formatIsoDate(this.tomorrowDate);

  readonly formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(this.todayDate);

  readonly todayDateFormatted = this.formattedDate;

  readonly tomorrowDateFormatted = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(this.tomorrowDate);

  readonly todayDateShort = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(this.todayDate);

  readonly tomorrowDateShort = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(this.tomorrowDate);

  private formatIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 7 Günlük Haftalık Zincir Göstergesi
  readonly weekStreak = signal<DayStreakItem[]>(this.generateInitialWeekStreak());

  private generateInitialWeekStreak(): DayStreakItem[] {
    const todayIndex = (new Date().getDay() + 6) % 7; // Pazartesi: 0, Salı: 1, ..., Pazar: 6
    const weekDays: Array<{ name: string; short: string }> = [
      { name: 'Pazartesi', short: 'Pzt' },
      { name: 'Salı', short: 'Sal' },
      { name: 'Çarşamba', short: 'Çar' },
      { name: 'Perşembe', short: 'Per' },
      { name: 'Cuma', short: 'Cum' },
      { name: 'Cumartesi', short: 'Cmt' },
      { name: 'Pazar', short: 'Paz' },
    ];

    return weekDays.map((d, idx) => ({
      dayName: d.name,
      dayShort: d.short,
      completed: false,
      isToday: idx === todayIndex,
      score: 0,
    }));
  }

  updateTodayStreakCompletion(): void {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const hasCompletedHabit = this.todayHabits().some((h) => h.completed);
    this.weekStreak.update((days) =>
      days.map((d, idx) => (idx === todayIndex ? { ...d, completed: hasCompletedHabit } : d)),
    );
  }

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

  // Alıntılar (Günün İlhamı)
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
    {
      text: 'Biz sürekli yaptığımız şeylerin toplamıyız. O halde mükemmellik bir eylem değil, bir alışkanlıktır.',
      author: 'Aristoteles',
      source: 'Nikomakhos\'a Etik',
    },
    {
      text: 'Sabahları uyanmakta zorlandığında kendine şunu hatırlat: Bir insanın görevini yapmak için uyanıyorum.',
      author: 'Marcus Aurelius',
      source: 'Kendime Düşünceler',
    },
    {
      text: 'Binlerce kilometrelik bir yolculuk bile tek bir atomik adımla başlar.',
      author: 'Lao Tzu',
      source: 'Tao Te Ching',
    },
    {
      text: 'Bir şeyi alışkanlık haline getirmek istiyorsan onu her gün tekrar et. İstemiyorsan başka bir şeye odaklan.',
      author: 'Epiktetos',
      source: 'Söylevler',
    },
    {
      text: 'Durmadığın ve her gün devam ettiğin sürece, ne kadar yavaş ilerlediğinin hiçbir önemi yoktur.',
      author: 'Konfüçyüs',
      source: 'Konuşmalar',
    },
    {
      text: 'Dün akıllıydım, dünyayı değiştirmek istedim. Bugün bilgeyim, kendimi ve alışkanlıklarımı değiştiriyorum.',
      author: 'Mevlana Celaleddin Rumi',
      source: 'Mesnevi',
    },
    {
      text: 'Bugünün bir saati, yarının iki saatine bedeldir. Sistemi bugün kur, işareti görünür kıl.',
      author: 'Benjamin Franklin',
      source: 'Zavallı Richard\'ın Almanak\'ı',
    },
    {
      text: 'Bir eylem ekersin, bir alışkanlık biçersin. Bir alışkanlık ekersin, bir karakter biçersin.',
      author: 'Ralph Waldo Emerson',
      source: 'Denemeler',
    },
    {
      text: 'Tek bir vuruşta usta olmak için bin günü çalışmaya feda et. Yolu anlamak her gün atılan küçük adımda saklıdır.',
      author: 'Miyamoto Musashi',
      source: 'Beş Çember Kitabı',
    },
    {
      text: 'Alışkanlıklar bilgi, beceri ve arzunun kesişim noktasıdır. Karakterimiz, alışkanlıklarımızın bileşkesidir.',
      author: 'Stephen Covey',
      source: 'Etkili İnsanların 7 Alışkanlığı',
    },
  ];
  readonly activeQuoteIndex = signal<number>(0);
  readonly activeQuote = computed(() => this.quotes[this.activeQuoteIndex()]);

  // Hesaplanmış Değerler
  readonly todayHabits = computed(() =>
    this.habits().filter((h) => (h.scheduledDay ?? 'BUGUN') === 'BUGUN'),
  );
  readonly tomorrowHabits = computed(() =>
    this.habits().filter((h) => h.scheduledDay === 'YARIN'),
  );
  readonly displayedHabits = computed(() =>
    this.activeScheduleTab() === 'BUGUN' ? this.todayHabits() : this.tomorrowHabits(),
  );

  readonly totalHabitsCount = computed(() => this.todayHabits().length);
  readonly completedHabitsCount = computed(() => this.todayHabits().filter((h) => h.completed).length);
  readonly completionRate = computed(() => {
    const total = this.totalHabitsCount();
    if (total === 0) return 0;
    return Math.round((this.completedHabitsCount() / total) * 100);
  });
  readonly totalEarnedPoints = computed(() => {
    return this.todayHabits().reduce((acc, h) => (h.completed ? acc + h.rewardXp : acc), 0);
  });
  readonly tomorrowHabitsCount = computed(() => this.tomorrowHabits().length);
  readonly totalIdentityVotes = computed(() => {
    return this.identities().reduce((acc, i) => acc + i.totalVotes, 0);
  });

  readonly totalFocusMinutes = computed(() => {
    return this.todayHabits()
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
    // URL sekme senkronizasyonu (?tab=program | identities | tiers)
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'identities') {
        this.activeProgramTab.set('IDENTITIES');
      } else if (tab === 'tiers') {
        this.activeProgramTab.set('TIERS');
      } else {
        this.activeProgramTab.set('PROGRAM');
      }
    });

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
              const scheduleMap = this.getStoredScheduleMap();
              this.habits.set(
                summary.habits.map((h) => {
                  const mins = h.targetMinutes || 15;
                  const isCompleted = h.completedToday;
                  const sDay: ScheduledDay = scheduleMap[h.publicId] || (h.scheduledDay ?? 'BUGUN');
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
                    scheduledDay: sDay,
                    scheduledDate: sDay === 'BUGUN' ? this.todayIso : this.tomorrowIso,
                    environmentPrepared: false,
                  };
                }),
              );
              this.updateTodayStreakCompletion();
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
    if (habit.scheduledDay === 'YARIN') {
      return 'border-purple-500/40 bg-purple-500/5 hover:border-purple-500/70 shadow-purple-500/5';
    }
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
    this.updateTodayStreakCompletion();

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
      this.updateTodayStreakCompletion();
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
        '2 Dakika kuralı mikro adımı yapıldı! Sürtünme sıfırlandı, artık odaklanmaya hazırsınız. ⚡',
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
        this.newHabitScheduledDay.set(this.activeScheduleTab());
        this.clearSpecificTime();
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

  switchScheduleTab(tab: ScheduledDay): void {
    this.activeScheduleTab.set(tab);
  }

  setScheduledDay(day: ScheduledDay): void {
    this.newHabitScheduledDay.set(day);
  }

  openAddHabitForCurrentTab(): void {
    this.newHabitScheduledDay.set(this.activeScheduleTab());
    this.clearSpecificTime();
    this.showAddHabitForm.set(true);
  }

  moveHabitToDay(habitId: string, targetDay: ScheduledDay): void {
    this.habits.update((list) =>
      list.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            scheduledDay: targetDay,
            scheduledDate: targetDay === 'BUGUN' ? this.todayIso : this.tomorrowIso,
          };
        }
        return h;
      }),
    );
    this.saveStoredSchedule(habitId, targetDay);
    this.updateTodayStreakCompletion();
    const dayLabel = targetDay === 'BUGUN' ? 'Bugün' : 'Yarın';
    this.toastService.info(
      `Alışkanlık ${dayLabel} programına taşındı.`,
      `Program Güncellendi 📅`,
    );
  }

  toggleEnvironmentPrepared(habitId: string): void {
    this.habits.update((list) =>
      list.map((h) => {
        if (h.id === habitId) {
          const nextState = !h.environmentPrepared;
          if (nextState) {
            this.toastService.success(
              'Yarının ortamı hazırlandı! (1. Yasa: İşareti Görünür Kıl)',
              'Çevre Tasarlandı 🌿',
            );
          }
          return { ...h, environmentPrepared: nextState };
        }
        return h;
      }),
    );
  }

  private getStoredScheduleMap(): Record<string, ScheduledDay> {
    try {
      const raw = localStorage.getItem('atomic_habit_schedules');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveStoredSchedule(habitId: string, day: ScheduledDay): void {
    try {
      const map = this.getStoredScheduleMap();
      map[habitId] = day;
      localStorage.setItem('atomic_habit_schedules', JSON.stringify(map));
    } catch {
      // Ignore localStorage errors
    }
  }

  openDeleteConfirmModal(habit: UserHabit, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.deleteConfirmModalHabit.set(habit);
  }

  closeDeleteConfirmModal(): void {
    this.deleteConfirmModalHabit.set(null);
  }

  confirmDeleteHabit(): void {
    const habit = this.deleteConfirmModalHabit();
    if (!habit) return;
    this.deleteConfirmModalHabit.set(null);
    this.deleteHabit(habit.id);
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

    const scheduledDay = this.newHabitScheduledDay();
    const scheduledDate = scheduledDay === 'BUGUN' ? this.todayIso : this.tomorrowIso;

    const categoryKey = this.newHabitCategory || 'KARIYER';
    const selectedIdentity =
      this.identities().find((i) => i.id === this.newHabitIdentityId) ||
      this.findIdentityForCategory(categoryKey) ||
      this.identities()[0];
    const targetMins = Math.max(1, this.newHabitTargetMinutes || 25);

    let rawCue = this.newHabitCue.trim();
    let effectiveCue = rawCue;
    if (this.newHabitSpecificTime) {
      const timeWithSuffix = this.formatTurkishTimeWithLocative(this.newHabitSpecificTime);
      if (rawCue) {
        effectiveCue = rawCue.toLowerCase().includes(this.newHabitSpecificTime)
          ? rawCue
          : `Saat ${timeWithSuffix} - ${rawCue}`;
      } else {
        effectiveCue = `Saat ${timeWithSuffix}`;
      }
    } else if (!effectiveCue) {
      effectiveCue = 'Belirlenen saatte';
    }

    const isValidUuid = (val?: string | null) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const request = {
      identityPublicId: isValidUuid(selectedIdentity?.id) ? selectedIdentity?.id : undefined,
      title,
      category: categoryKey,
      cueTrigger: effectiveCue,
      targetLocation: this.newHabitLocation.trim() || 'Çalışma Masası',
      responseMicroStep: this.newHabitMicroStep.trim() || 'İlk 2 dakikayı tamamla',
      rewardXp: 20,
      targetMinutes: targetMins,
      scheduledDay,
      scheduledDate,
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
            scheduledDay,
            scheduledDate,
            environmentPrepared: false,
          };
          this.saveStoredSchedule(userHabit.id, scheduledDay);
          this.habits.update((list) => [...list, userHabit]);
          this.activeScheduleTab.set(scheduledDay);
          const dayLabel = scheduledDay === 'BUGUN' ? 'Bugün' : 'Yarın';
          this.toastService.success(
            `"${userHabit.title}" ${dayLabel} programına başarıyla eklendi!`,
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
    this.clearSpecificTime();
    this.newHabitMicroStep = '';
    this.newHabitTargetMinutes = 25;
    this.newHabitScheduledDay.set(this.activeScheduleTab());
    this.showAddHabitForm.set(false);
  }

  startEditHabit(habit: UserHabit, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.editingHabitId.set(habit.id);
    this.editHabitTitle = habit.title;
    this.editHabitCategory = habit.category;
    this.editHabitIdentityId = habit.identityId;
    this.editHabitLocation = habit.targetLocation || 'Çalışma Masası';
    this.editHabitMicroStep = habit.twoMinuteMicroStep || 'İlk 2 dakikayı tamamla';
    this.editHabitTargetMinutes = habit.targetMinutes || 25;

    this.editHabitCue = habit.cue || '';
    const timeMatch = habit.cue?.match(/(?:Saat\s+)?(\d{1,2})[:.](\d{2})/i);
    if (timeMatch) {
      this.editHabitHour = timeMatch[1].padStart(2, '0');
      this.editHabitMinute = timeMatch[2];
      this.editHabitSpecificTime = `${this.editHabitHour}:${this.editHabitMinute}`;
    } else {
      this.editHabitHour = '';
      this.editHabitMinute = '00';
      this.editHabitSpecificTime = '';
    }
  }

  cancelEditHabit(): void {
    this.editingHabitId.set(null);
    this.clearEditSpecificTime();
  }

  onEditTimeChange(): void {
    if (this.editHabitHour) {
      const min = this.editHabitMinute || '00';
      this.editHabitSpecificTime = `${this.editHabitHour}:${min}`;
      const timeWithSuffix = this.formatTurkishTimeWithLocative(this.editHabitSpecificTime);
      this.editHabitCue = `Saat ${timeWithSuffix}`;
    } else {
      this.editHabitSpecificTime = '';
    }
  }

  clearEditSpecificTime(): void {
    this.editHabitHour = '';
    this.editHabitMinute = '00';
    this.editHabitSpecificTime = '';
    this.editHabitCue = '';
  }

  adjustEditHour(delta: number): void {
    let currentH = this.editHabitHour ? parseInt(this.editHabitHour, 10) : new Date().getHours();
    currentH = (currentH + delta + 24) % 24;
    this.editHabitHour = String(currentH).padStart(2, '0');
    if (!this.editHabitMinute) this.editHabitMinute = '00';
    this.onEditTimeChange();
  }

  adjustEditMinute(delta: number): void {
    if (!this.editHabitHour) {
      this.editHabitHour = String(new Date().getHours()).padStart(2, '0');
    }
    let currentM = this.editHabitMinute ? parseInt(this.editHabitMinute, 10) : 0;
    currentM = (currentM + delta + 60) % 60;
    this.editHabitMinute = String(currentM).padStart(2, '0');
    this.onEditTimeChange();
  }

  setEditCurrentTime(): void {
    const now = new Date();
    this.editHabitHour = String(now.getHours()).padStart(2, '0');
    const rawMin = now.getMinutes();
    const roundedMin = Math.round(rawMin / 5) * 5;
    if (roundedMin >= 60) {
      this.editHabitHour = String((now.getHours() + 1) % 24).padStart(2, '0');
      this.editHabitMinute = '00';
    } else {
      this.editHabitHour = String(now.getHours()).padStart(2, '0');
      this.editHabitMinute = String(roundedMin).padStart(2, '0');
    }
    this.onEditTimeChange();
  }

  onEditHourInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 23) {
      this.editHabitHour = String(num).padStart(2, '0');
      if (!this.editHabitMinute) this.editHabitMinute = '00';
      this.onEditTimeChange();
    }
  }

  onEditMinuteInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      this.editHabitMinute = String(num).padStart(2, '0');
      if (!this.editHabitHour) {
        this.editHabitHour = String(new Date().getHours()).padStart(2, '0');
      }
      this.onEditTimeChange();
    }
  }

  setEditLocation(loc: string): void {
    this.editHabitLocation = loc;
  }

  setEditTargetMinutes(mins: number): void {
    this.editHabitTargetMinutes = mins;
  }

  saveEditHabit(habitId: string): void {
    const title = this.editHabitTitle.trim();
    if (!title) {
      this.toastService.warning('Lütfen alışkanlık adı giriniz.', 'Eksik Bilgi');
      return;
    }

    const habit = this.habits().find((h) => h.id === habitId);
    if (!habit) return;

    const categoryKey = (this.editHabitCategory || 'kariyer').toUpperCase();
    const categoryKeyLower = categoryKey.toLowerCase() as UserHabit['category'];
    const selectedIdentity =
      this.identities().find((i) => i.id === this.editHabitIdentityId) ||
      this.findIdentityForCategory(categoryKey) ||
      this.identities()[0];
    const targetMins = Math.max(1, this.editHabitTargetMinutes || 25);

    let effectiveCue = this.editHabitCue.trim();
    if (this.editHabitSpecificTime) {
      const timeWithSuffix = this.formatTurkishTimeWithLocative(this.editHabitSpecificTime);
      if (effectiveCue) {
        if (!effectiveCue.toLowerCase().includes(this.editHabitSpecificTime)) {
          effectiveCue = `Saat ${timeWithSuffix} - ${effectiveCue}`;
        }
      } else {
        effectiveCue = `Saat ${timeWithSuffix}`;
      }
    } else if (!effectiveCue) {
      effectiveCue = 'Belirlenen saatte';
    }

    const newLocation = this.editHabitLocation.trim() || 'Çalışma Masası';
    const newMicroStep = this.editHabitMicroStep.trim() || 'İlk 2 dakikayı tamamla';

    // Update local habit state immediately
    this.habits.update((list) =>
      list.map((h) => {
        if (h.id === habitId) {
          const newInitialSeconds = targetMins * 60;
          const newRemainingSeconds =
            h.timerStatus === 'DEVAM_EDIYOR' || h.timerStatus === 'DURAKLATILDI'
              ? h.remainingSeconds
              : newInitialSeconds;

          return {
            ...h,
            title,
            category: categoryKeyLower,
            categoryLabel: this.getCategoryLabel(categoryKey),
            identityId: selectedIdentity?.id || h.identityId,
            cue: effectiveCue,
            targetLocation: newLocation,
            twoMinuteMicroStep: newMicroStep,
            targetMinutes: targetMins,
            timeEstimate: `${targetMins} dk`,
            initialSeconds: newInitialSeconds,
            remainingSeconds: newRemainingSeconds,
          };
        }
        return h;
      }),
    );

    this.editingHabitId.set(null);
    this.clearEditSpecificTime();

    const isValidUuid = (val?: string | null) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const effectiveIdentityId = isValidUuid(selectedIdentity?.id)
      ? selectedIdentity?.id
      : isValidUuid(habit.identityId)
        ? habit.identityId
        : undefined;

    // Backend update request
    const request = {
      identityPublicId: effectiveIdentityId,
      title,
      category: categoryKey,
      cueTrigger: effectiveCue,
      targetLocation: newLocation,
      responseMicroStep: newMicroStep,
      targetMinutes: targetMins,
      rewardXp: habit.rewardXp || 20,
    };

    this.habitService.updateHabit(habitId, request).subscribe({
      next: () => {
        this.toastService.success(
          `"${title}" alışkanlığı başarıyla güncellendi!`,
          'Alışkanlık Güncellendi 🎯',
        );
        this.habitService.loadDashboardSummary().subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.applyDashboardSummary(res.data);
            }
          },
        });
      },
      error: () => {
        // Local state preserved
      },
    });
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

  setProgramTab(tab: 'PROGRAM' | 'IDENTITIES' | 'TIERS'): void {
    this.activeProgramTab.set(tab);
    const queryParamValue = tab === 'IDENTITIES' ? 'identities' : tab === 'TIERS' ? 'tiers' : 'program';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: queryParamValue },
      queryParamsHandling: 'merge',
    });
  }

  scrollToIdentities(): void {
    this.setProgramTab('IDENTITIES');
    setTimeout(() => {
      document.getElementById('identity-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  scrollToHabits(): void {
    this.setProgramTab('PROGRAM');
    setTimeout(() => {
      document.getElementById('habits-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
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
      '2 Dakika Kuralı devrede! Görev sürtünmesiz mikro adıma indirgendi. Sadece ilk 2 dakikalık adımı atın!',
      'Sürtünme Sıfırlandı ⚡',
    );
  }

  getIdentityDisplayName(identityId?: string): string {
    if (!identityId) return 'Üretken Kimlik';
    const match = this.identities().find((i) => i.id === identityId);
    if (match) return match.name;
    const catMatch = this.findIdentityForCategory(identityId);
    if (catMatch) return catMatch.name;
    return 'Üretken Kimlik';
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

  getTierLevelIndex(tier: string): number {
    switch (tier) {
      case 'BRONZE':
        return 0;
      case 'SILVER':
        return 1;
      case 'GOLD':
        return 2;
      case 'PLATINUM':
        return 3;
      case 'DIAMOND':
        return 4;
      default:
        return 0;
    }
  }

  getTierBadgeStyle(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'bg-gradient-to-r from-amber-950/20 via-amber-900/15 to-amber-800/20 text-amber-700 dark:text-amber-300 border-amber-600/30 shadow-xs';
      case 'SILVER':
        return 'bg-gradient-to-r from-slate-200/70 via-slate-300/40 to-slate-200/60 dark:from-slate-800/60 dark:via-slate-700/40 dark:to-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600/50 shadow-xs';
      case 'GOLD':
        return 'bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/15 text-amber-600 dark:text-yellow-300 border-amber-400/50 shadow-xs shadow-amber-500/10';
      case 'PLATINUM':
        return 'bg-gradient-to-r from-teal-500/20 via-emerald-400/20 to-cyan-500/20 text-teal-600 dark:text-teal-300 border-teal-400/50 shadow-xs shadow-teal-500/10';
      case 'DIAMOND':
        return 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-indigo-500/25 text-cyan-600 dark:text-cyan-200 border-cyan-400/60 shadow-sm shadow-cyan-500/25 ring-1 ring-cyan-400/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }

  getTierCardStyle(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'hover:border-amber-600/40 hover:shadow-amber-900/5';
      case 'SILVER':
        return 'hover:border-slate-400/50 hover:shadow-slate-900/5';
      case 'GOLD':
        return 'hover:border-amber-400/50 hover:shadow-amber-500/10';
      case 'PLATINUM':
        return 'hover:border-teal-400/50 hover:shadow-teal-500/10';
      case 'DIAMOND':
        return 'hover:border-cyan-400/60 hover:shadow-cyan-500/15 border-cyan-500/20';
      default:
        return 'hover:border-indigo-500/30';
    }
  }

  getTierProgressGradient(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'from-amber-600 to-amber-500';
      case 'SILVER':
        return 'from-slate-400 to-slate-200';
      case 'GOLD':
        return 'from-amber-500 via-yellow-400 to-amber-300';
      case 'PLATINUM':
        return 'from-teal-500 via-emerald-400 to-cyan-400';
      case 'DIAMOND':
        return 'from-cyan-400 via-sky-300 to-indigo-400';
      default:
        return 'from-emerald-500 to-teal-400';
    }
  }

  getTierGlowStyle(tier: string): string {
    switch (tier) {
      case 'BRONZE':
        return 'from-amber-600/10 to-transparent';
      case 'SILVER':
        return 'from-slate-400/10 to-transparent';
      case 'GOLD':
        return 'from-amber-400/15 via-yellow-500/10 to-transparent';
      case 'PLATINUM':
        return 'from-teal-400/15 via-emerald-500/10 to-transparent';
      case 'DIAMOND':
        return 'from-cyan-400/20 via-blue-500/15 to-transparent';
      default:
        return 'from-indigo-500/10 to-transparent';
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
