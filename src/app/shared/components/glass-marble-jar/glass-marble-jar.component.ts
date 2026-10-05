import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MarbleCoord {
  id: number;
  left: number;
  bottom: number;
  size: number;
  variantIndex: number;
}

@Component({
  selector: 'app-glass-marble-jar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex flex-col items-center select-none w-full py-1">
      <!-- Cam Fanus Ana Gövdesi (Glass Dome / Jar) -->
      <div
        class="relative w-32 h-24 sm:w-36 sm:h-26 flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:scale-105"
        [title]="
          identityName() +
          ': ' +
          votes() +
          ' / ' +
          threshold() +
          ' bilye (' +
          fillPercentage() +
          '% dolu)'
        "
      >
        <!-- Fanus Üst Boğazı ve Cam Bilezik (Rim & Collar) -->
        <div class="relative z-20 flex flex-col items-center">
          <div
            class="w-12 h-1.5 rounded-t-sm border-t border-x border-white/60 dark:border-white/20 bg-gradient-to-r from-white/30 via-white/50 to-white/30 dark:from-white/10 dark:via-white/25 dark:to-white/10 backdrop-blur-md shadow-2xs"
          ></div>
          <div
            class="w-14 h-1.5 rounded-xs border border-white/50 dark:border-white/20 bg-white/40 dark:bg-white/15 backdrop-blur-md shadow-inner"
          ></div>
        </div>

        <!-- Fanus Şeffaf Cam Gövde (Glass Body) -->
        <div
          class="relative w-full flex-1 -mt-0.5 rounded-b-[1.75rem] rounded-t-md border-2 border-white/60 dark:border-white/20 bg-gradient-to-b from-white/25 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-md shadow-[inset_0_0_12px_rgba(255,255,255,0.35),0_6px_16px_rgba(0,0,0,0.08)] overflow-hidden flex items-end justify-center pb-2 px-2"
        >
          <!-- Sol Cam Yansıması Çizgisi (Specular Shine Streak) -->
          <div
            class="absolute top-1 left-2 w-1 h-14 rounded-full bg-gradient-to-b from-white/70 via-white/30 to-transparent pointer-events-none transform -rotate-6"
          ></div>

          <!-- Sağ İkincil Yansıma (Secondary Reflection) -->
          <div
            class="absolute top-2 right-2 w-0.5 h-10 rounded-full bg-white/35 pointer-events-none"
          ></div>

          <!-- Taban Cam Kalınlığı Yansıması -->
          <div
            class="absolute bottom-0.5 w-20 h-2 rounded-full bg-white/25 dark:bg-white/10 blur-[0.5px] pointer-events-none"
          ></div>

          <!-- Fanus İçi Işık / Renk Parıltısı -->
          <div
            class="absolute bottom-0 inset-x-0 transition-all duration-700 pointer-events-none opacity-25"
            [style.height.%]="fillPercentage()"
            [style.background]="
              'radial-gradient(ellipse at bottom, ' + color() + ' 0%, transparent 85%)'
            "
          ></div>

          <!-- İçteki Misketler / Bilyeler (3D Glass Marbles) -->
          @if (votes() === 0) {
            <div
              class="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-0.5 py-3"
            >
              <span class="text-sm">🫧</span>
              <span class="text-[9px] font-medium text-[var(--color-text-muted)] tracking-tight"
                >Fanus Boş</span
              >
            </div>
          } @else {
            <div class="relative w-full h-full">
              @for (marble of visibleMarbles(); track marble.id) {
                <div
                  class="absolute rounded-full marble-drop transition-transform duration-300 hover:scale-125 hover:z-30 cursor-pointer"
                  [style.width.px]="marble.size"
                  [style.height.px]="marble.size"
                  [style.left.px]="marble.left"
                  [style.bottom.px]="marble.bottom"
                  [style.background]="getMarbleGradient(marble.variantIndex)"
                  [style.boxShadow]="marbleBoxShadow"
                  [title]="'Bilye #' + (marble.id + 1)"
                >
                  <!-- 3D Işık Noktası (Glistening Specular Highlight) -->
                  <div
                    class="absolute top-[2px] left-[2px] w-[3px] h-[3px] rounded-full bg-white/95 pointer-events-none"
                  ></div>
                </div>
              }

              <!-- Kapasite Aşımı / Ekstra Bilye Rozeti (+X Misket) -->
              @if (overflowCount() > 0) {
                <div
                  class="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white font-mono font-extrabold text-[8px] shadow-sm animate-pulse flex items-center gap-0.5 z-20"
                  title="Fanus kapasitesini aşan ek oylar!"
                >
                  <span>+{{ overflowCount() }}</span>
                  <span>✨</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Fanus Taban Alt Gölgesi (Ambient Base Shadow) -->
        <div class="w-24 h-1.5 rounded-full bg-black/15 dark:bg-black/50 blur-[2px] -mt-0.5"></div>
      </div>

      <!-- Doluluk ve Misket Sayacı Metni -->
      <div class="mt-1.5 w-full flex items-center justify-between text-[10px] px-1 font-mono">
        <span class="font-bold flex items-center gap-1.5" [style.color]="color()">
          <span
            class="inline-block w-2 h-2 rounded-full shadow-2xs"
            [style.background]="getMarbleGradient(0)"
          ></span>
          <span>{{ votes() }} / {{ threshold() }} Bilye</span>
        </span>
        <span
          class="font-semibold px-1.5 py-0.2 rounded-md"
          [class.bg-emerald-500/10]="fillPercentage() >= 100"
          [class.text-emerald-500]="fillPercentage() >= 100"
          [class.text-[var(--color-text-muted)]]="fillPercentage() < 100"
        >
          @if (fillPercentage() >= 100) {
            🎉 %100 Dolu
          } @else {
            %{{ fillPercentage() }}
          }
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes marbleDrop {
        0% {
          transform: translateY(-24px) scale(0.6);
          opacity: 0;
        }
        60% {
          transform: translateY(2px) scale(1.15);
          opacity: 1;
        }
        80% {
          transform: translateY(-2px) scale(0.95);
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      .marble-drop {
        animation: marbleDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      }
    `,
  ],
})
export class GlassMarbleJarComponent {
  readonly votes = input<number>(0);
  readonly threshold = input<number>(30);
  readonly color = input<string>('#6366F1');
  readonly identityName = input<string>('');

  // 3D Bilye Gölge Stili
  readonly marbleBoxShadow =
    'inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.45), inset 1px 1px 2px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.25)';

  // Doğal Fanus İçi Yığılma Slot Koordinatları (21 Adet Doğal Bilye Konumu)
  private readonly marbleSlots: Array<{ left: number; bottom: number; size: number }> = [
    // 1. Sıra (En alt taban - 5 bilye)
    { left: 52, bottom: 4, size: 14 },
    { left: 35, bottom: 5, size: 14 },
    { left: 69, bottom: 5, size: 14 },
    { left: 18, bottom: 9, size: 13 },
    { left: 86, bottom: 9, size: 13 },

    // 2. Sıra (Alt-orta - 5 bilye)
    { left: 44, bottom: 17, size: 14 },
    { left: 61, bottom: 17, size: 14 },
    { left: 26, bottom: 20, size: 13 },
    { left: 78, bottom: 20, size: 13 },
    { left: 11, bottom: 23, size: 12 },

    // 3. Sıra (Orta katman - 4 bilye)
    { left: 52, bottom: 31, size: 14 },
    { left: 36, bottom: 32, size: 13 },
    { left: 68, bottom: 32, size: 13 },
    { left: 20, bottom: 35, size: 12 },

    // 4. Sıra (Üst-orta - 4 bilye)
    { left: 43, bottom: 44, size: 13 },
    { left: 59, bottom: 44, size: 13 },
    { left: 28, bottom: 46, size: 12 },
    { left: 74, bottom: 46, size: 12 },

    // 5. Sıra (Tepe katman - 3 bilye)
    { left: 51, bottom: 56, size: 13 },
    { left: 37, bottom: 57, size: 12 },
    { left: 65, bottom: 57, size: 12 },
  ];

  readonly fillPercentage = computed(() => {
    const t = Math.max(1, this.threshold());
    return Math.min(100, Math.round((this.votes() / t) * 100));
  });

  readonly visibleMarbles = computed<MarbleCoord[]>(() => {
    const count = Math.min(this.votes(), this.marbleSlots.length);
    const result: MarbleCoord[] = [];

    for (let i = 0; i < count; i++) {
      const slot = this.marbleSlots[i];
      result.push({
        id: i,
        left: slot.left,
        bottom: slot.bottom,
        size: slot.size,
        variantIndex: i % 4,
      });
    }
    return result;
  });

  readonly overflowCount = computed(() => {
    return Math.max(0, this.votes() - this.marbleSlots.length);
  });

  getMarbleGradient(variant: number): string {
    const rawColor = this.color() || '#6366F1';
    const hex = this.resolveColorToHex(rawColor);
    const rgb = this.hexToRgb(hex);

    // Bilye yüzeyinde 3D cam derinliği ve ışıltısı için ton varyasyonları
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;

    if (variant === 1) {
      r = Math.min(255, r + 25);
      g = Math.min(255, g + 25);
      b = Math.min(255, b + 25);
    } else if (variant === 2) {
      r = Math.max(0, r - 20);
      g = Math.max(0, g - 20);
      b = Math.max(0, b - 20);
    } else if (variant === 3) {
      r = Math.min(255, r + 15);
      b = Math.min(255, b + 30);
    }

    const lightRgb = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;
    const midRgb = `rgb(${r}, ${g}, ${b})`;
    const darkRgb = `rgb(${Math.max(0, r - 70)}, ${Math.max(0, g - 70)}, ${Math.max(0, b - 70)})`;

    return `radial-gradient(circle at 35% 30%, #ffffff 0%, ${lightRgb} 25%, ${midRgb} 65%, ${darkRgb} 100%)`;
  }

  private resolveColorToHex(c: string): string {
    if (!c) return '#6366F1';
    if (c.startsWith('#')) return c;
    const map: Record<string, string> = {
      indigo: '#6366F1',
      purple: '#A855F7',
      emerald: '#10B981',
      amber: '#F59E0B',
      rose: '#F43F5E',
      teal: '#14B8A6',
      pink: '#EC4899',
      violet: '#8B5CF6',
      cyan: '#06B6D4',
      blue: '#3B82F6',
    };
    return map[c.toLowerCase()] || '#6366F1';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) {
      return { r: 99, g: 102, b: 241 };
    }
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
}
