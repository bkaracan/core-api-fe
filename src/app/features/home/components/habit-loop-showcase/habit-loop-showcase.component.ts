import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitLaw } from '../../models/behavioral-habit.model';

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
      subTitle: 'Zinciri Kırma (Don\'t Break the Chain) & Görsel İlerleme',
      ruleTitle: 'Ödül Hissi: Anında Tamamlanma Dopamini',
      description:
        'Hemen ödüllendirilen davranışlar tekrarlanır; hemen cezalandırılan davranışlardan kaçınılır. Günlük zincirlerin uzamasını izlemek beyninize güçlü bir zafer hissi verir.',
      quote: '"Bir kural var: Zinciri asla kırma. Eğer bir gün kaçırırsan, asla üst üste iki kez kaçırma."',
      digitalFeature: {
        title: 'Canlı Streak (Seri) & Zincir Görselleştirmesi',
        details: [
          'Etkileşimli GitHub tarzı yeşil hücre matrisi ve mikro-kutlamalar',
          'Kritik kural: "Asla üst üste 2 gün kaçırma" koruma algoritması',
          'Gün sonu retrospektif karnesi ve Kaizen PDCA puanı'
        ],
        actionLabel: 'Zinciri İncele'
      },
      stackingExample: {
        currentHabit: 'Günün son atomik adımını işaretlediğimde',
        newHabit: '1 dakikalık Kaizen retrospektif notumu alacağım',
        immediateReward: 'Seri sayacının 1 gün daha artması ve altın rozet kazanımı'
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
}
