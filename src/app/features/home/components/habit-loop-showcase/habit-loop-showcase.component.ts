import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitLaw } from '../../models/behavioral-habit.model';

export interface DemoCategoryProgress {
  key: string;
  name: string;
  icon: string;
  totalBadges: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  tierName: string;
  tierIcon: string;
  badgesInCurrentTier: number;
  requiredForNext: number;
  nextTierName: string;
  nextTierIcon: string;
  justPromoted: boolean;
}

@Component({
  selector: 'app-habit-loop-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-loop-showcase.component.html',
  styleUrl: './habit-loop-showcase.component.scss'
})
export class HabitLoopShowcaseComponent {
  readonly laws: HabitLaw[] = [
    {
      id: 1,
      stage: 'cue',
      numberText: '1. YASA',
      title: 'Görünür Kıl (İşaret / Cue)',
      subTitle: 'Zaman ve Mekan Belirginliği ile Tetikleyici Tasarla',
      ruleTitle: 'İşaret Tasarımı: Nerede ve Ne Zaman?',
      description:
        'İradeye güvenmeyin; çevreyi tasarlayın. Sistemimiz, alışkanlıklarınızı günün belirli saatlerine, takvim bloklarına ve bağlamsal konumlara bağlayarak unutulmaz kılar.',
      quote: '"En güçlü işaretler belirgin ve net olanlardır. Ne zaman ve nerede yapacağınızı önceden planlayın."',
      digitalFeature: {
        title: 'Akıllı Tetikleyiciler & Zaman Bloklama',
        details: [
          'Bağlamsal tetikleme: "Sabah masaya oturduğumda..."',
          'Otomatik takvim senkronizasyonu ve dikkat dağıtmayan mikro-hatırlatıcılar',
          'Çevre tasarımı ipuçları ve sürtünmesiz hazır çalışma alanları'
        ],
        actionLabel: 'Tetikleyiciyi Görselleştir'
      },
      stackingExample: {
        currentHabit: 'Sabah kahvemi doldurduktan sonra',
        newHabit: 'Core-API dashboardunu açıp günün 1 numaralı atomik hedefini belirleyeceğim',
        immediateReward: 'Zihinsel berraklık ve odaklanmış bir sabah'
      },
      colorTheme: {
        gradient: 'from-blue-500/20 to-indigo-500/10',
        border: 'border-blue-500/30',
        badge: 'text-blue-400 bg-blue-500/10',
        accent: '#60a5fa'
      }
    },
    {
      id: 2,
      stage: 'craving',
      numberText: '2. YASA',
      title: 'Çekici Kıl (İstek / Craving)',
      subTitle: 'Alışkanlık Demetleme (Habit Stacking) ile Dopamin Eşlemesi',
      ruleTitle: 'İstek Motoru: Yapmak İstediğin ile Yapman Gerekeni Bağla',
      description:
        'Beyin ödül beklentisiyle dopamin salgılar. Keyif aldığınız mevcut bir ritüelin hemen ardına yeni bir atomik adım ekleyerek alışkanlığı karşı konulamaz kılın.',
      quote: '"Bir alışkanlık ne kadar cazipse, benimsenme olasılığı o kadar yüksektir."',
      digitalFeature: {
        title: 'Alışkanlık Demetleme Sihirbazı (Habit Stacking Engine)',
        details: [
          'Otomatik önerilen kanıtlanmış demetleme şablonları',
          'Dopamin optimizasyonu: İhtiyaç ile arzuyu akıllıca birleştirme',
          'Sosyal taahhüt ve akran takdir mekanizmaları'
        ],
        actionLabel: 'Demetleme Kurgula'
      },
      stackingExample: {
        currentHabit: 'Günlük standup toplantım biter bitmez',
        newHabit: '30 dakikalık derin kodlama oturumu başlatacağım',
        immediateReward: 'Günün en zor işini sabah 10:00 olmadan bitirmiş olma tatmini'
      },
      colorTheme: {
        gradient: 'from-violet-500/20 to-purple-500/10',
        border: 'border-violet-500/30',
        badge: 'text-violet-400 bg-violet-500/10',
        accent: '#a78bfa'
      }
    },
    {
      id: 3,
      stage: 'response',
      numberText: '3. YASA',
      title: 'Kolaylaştır (Tepki / Response)',
      subTitle: 'Sürtünmeyi Sıfırla: 2 Dakika Kuralı & Tek Tık Başlangıç',
      ruleTitle: 'Tepki Optimizasyonu: Başlangıç Direncini Yok Et',
      description:
        'İnsan doğası en az çaba yasasına göre hareket eder. Başlamak için gereken efor ne kadar az olursa, alışkanlığın kalıcı olma şansı o kadar artar.',
      quote: '"Alışkanlıklarınızı öyle kolaylaştırın ki, canınız istemediğinde bile yapabilin."',
      digitalFeature: {
        title: 'Sürtünmesiz Tek Tık Odak Oturumları',
        details: [
          'OAuth 2.1 PKCE ile anında, kesintisiz güvenli giriş',
          'Otomatik olarak 2 dakikaya indirgenmiş mikro-başlangıç görevleri',
          'Önceden yapılandırılmış çalışma ortamları ve tek dokunuşla başlatma'
        ],
        actionLabel: 'Sürtünmeyi Test Et'
      },
      stackingExample: {
        currentHabit: 'Tarayıcıyı açtığım anda',
        newHabit: 'Doğrudan odak panelinde tek tıkla 25 dk Pomodoro başlatacağım',
        immediateReward: 'Tereddüt etmeden akış moduna geçiş'
      },
      colorTheme: {
        gradient: 'from-amber-500/20 to-orange-500/10',
        border: 'border-amber-500/30',
        badge: 'text-amber-400 bg-amber-500/10',
        accent: '#fbbf24'
      }
    },
    {
      id: 4,
      stage: 'reward',
      numberText: '4. YASA',
      title: 'Doyurucu Kıl (Ödül / Reward)',
      subTitle: 'Kategori Rozetleri, Küme Terfileri & Zinciri Kırma',
      ruleTitle: 'Ödül Hissi: Kategori Rozetleri ve Küme Terfisi (Bronz ➔ Elmas)',
      description:
        'Hemen ödüllendirilen davranışlar tekrarlanır. Tamamlanan her görev o kategoriye özel rozet kazandırır. Rozetler biriktikçe Bronz, Gümüş, Altın, Platin ve Elmas kümelerine terfi ederek zafer hissini taçlandırırsınız.',
      quote: '"Başarı, bir gecede gerçekleşen büyük sıçramalardan değil; her gün kazanılan atomik rozetlerin ve terfi edilen kümelerin bileşik sonucudur."',
      digitalFeature: {
        title: 'Kategori Rozetleri & Küme Terfi Motoru',
        details: [
          'Kategoriye özel rozet kazanımı: Her tamamlanan alışkanlık o alanda rozet kazandırır',
          'Sürdürülebilir Küme Terfisi: 10 Bronz Rozet ➔ Gümüş Küme, 25 Gümüş Rozet ➔ Altın Küme, 50 Altın Rozet ➔ Platin, 100 Platin ➔ Elmas Küme',
          'Canlı Streak (Zinciri Kırma) ve mikro-kutlama animasyonları'
        ],
        actionLabel: 'Rozet & Küme Sistemini Keşfet'
      },
      stackingExample: {
        currentHabit: 'Günün atomik görevini tamamladığımda',
        newHabit: 'Kategori rozetimi alıp küme terfi çubuğumu ilerleteceğim',
        immediateReward: 'Kategori rozeti kazanımı ve gümüş/altın kümeye adım adım yükselme dopamini'
      },
      colorTheme: {
        gradient: 'from-emerald-500/20 to-teal-500/10',
        border: 'border-emerald-500/30',
        badge: 'text-emerald-400 bg-emerald-500/10',
        accent: '#34d399'
      }
    }
  ];

  readonly activeLawId = signal<number>(1);

  // Interactive 14-day streak simulation
  readonly streakDays = signal<boolean[]>([
    true, true, true, true, true, true, true,
    true, true, true, true, true, false, false
  ]);

  // 4. Yasa Rozet ve Küme Terfi Simülatörü
  readonly demoCategories = signal<DemoCategoryProgress[]>([
    {
      key: 'kariyer',
      name: 'Mesleki / Çalışma',
      icon: '💼',
      totalBadges: 9, // 1 rozet sonra Gümüş'e terfi edecek! (10 Bronz)
      tier: 'BRONZE',
      tierName: 'Bronz Küme',
      tierIcon: '🥉',
      badgesInCurrentTier: 9,
      requiredForNext: 10,
      nextTierName: 'Gümüş Küme',
      nextTierIcon: '🥈',
      justPromoted: false
    },
    {
      key: 'beden',
      name: 'Beden / Sağlık',
      icon: '🏃',
      totalBadges: 34, // 1 rozet sonra Altın'a terfi edecek! (10 + 25 = 35)
      tier: 'SILVER',
      tierName: 'Gümüş Küme',
      tierIcon: '🥈',
      badgesInCurrentTier: 24,
      requiredForNext: 25,
      nextTierName: 'Altın Küme',
      nextTierIcon: '🥇',
      justPromoted: false
    },
    {
      key: 'zihin',
      name: 'Zihin / Gelişim',
      icon: '📖',
      totalBadges: 84, // 1 rozet sonra Platin'e terfi edecek! (35 + 50 = 85)
      tier: 'GOLD',
      tierName: 'Altın Küme',
      tierIcon: '🥇',
      badgesInCurrentTier: 49,
      requiredForNext: 50,
      nextTierName: 'Platin Küme',
      nextTierIcon: '💠',
      justPromoted: false
    }
  ]);

  readonly activeLaw = () => {
    return this.laws.find((l) => l.id === this.activeLawId()) || this.laws[0];
  };

  selectLaw(id: number): void {
    this.activeLawId.set(id);
  }

  toggleStreakDay(index: number): void {
    const current = [...this.streakDays()];
    current[index] = !current[index];
    this.streakDays.set(current);
  }

  get completedStreakCount(): number {
    return this.streakDays().filter(Boolean).length;
  }

  simulateEarnBadge(key: string): void {
    this.demoCategories.update((list) =>
      list.map((item) => {
        if (item.key !== key) return item;
        const newTotal = item.totalBadges + 1;
        const calc = this.calculateTierFromTotal(newTotal);
        const justPromoted = calc.tier !== item.tier;
        return {
          ...item,
          totalBadges: newTotal,
          tier: calc.tier,
          tierName: calc.tierName,
          tierIcon: calc.tierIcon,
          badgesInCurrentTier: calc.badgesInCurrentTier,
          requiredForNext: calc.requiredForNext,
          nextTierName: calc.nextTierName,
          nextTierIcon: calc.nextTierIcon,
          justPromoted
        };
      })
    );
  }

  private calculateTierFromTotal(total: number) {
    if (total < 10) {
      return {
        tier: 'BRONZE' as const,
        tierName: 'Bronz Küme',
        tierIcon: '🥉',
        badgesInCurrentTier: total,
        requiredForNext: 10,
        nextTierName: 'Gümüş Küme',
        nextTierIcon: '🥈'
      };
    } else if (total < 35) { // 10 + 25
      return {
        tier: 'SILVER' as const,
        tierName: 'Gümüş Küme',
        tierIcon: '🥈',
        badgesInCurrentTier: total - 10,
        requiredForNext: 25,
        nextTierName: 'Altın Küme',
        nextTierIcon: '🥇'
      };
    } else if (total < 85) { // 35 + 50
      return {
        tier: 'GOLD' as const,
        tierName: 'Altın Küme',
        tierIcon: '🥇',
        badgesInCurrentTier: total - 35,
        requiredForNext: 50,
        nextTierName: 'Platin Küme',
        nextTierIcon: '💠'
      };
    } else if (total < 185) { // 85 + 100
      return {
        tier: 'PLATINUM' as const,
        tierName: 'Platin Küme',
        tierIcon: '💠',
        badgesInCurrentTier: total - 85,
        requiredForNext: 100,
        nextTierName: 'Elmas Küme',
        nextTierIcon: '💎'
      };
    } else {
      return {
        tier: 'DIAMOND' as const,
        tierName: 'Elmas Küme',
        tierIcon: '💎',
        badgesInCurrentTier: total - 185,
        requiredForNext: 0,
        nextTierName: 'Zirve Seviye',
        nextTierIcon: '👑'
      };
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
}
