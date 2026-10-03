import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KaizenMudaCard, TwoMinuteTask } from '../../models/behavioral-habit.model';

@Component({
  selector: 'app-kaizen-muda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kaizen-muda.component.html',
  styleUrl: './kaizen-muda.component.scss'
})
export class KaizenMudaComponent implements OnDestroy {
  readonly mudaCards: KaizenMudaCard[] = [
    {
      id: 'muri',
      type: 'muri',
      title: 'Muri (無理) — Aşırı Yüklenme',
      subtitle: 'Devasa Hedeflerin Yarattığı Zihinsel Felç',
      tag: 'Aşırı Yükleme',
      wasteDescription:
        '"Yarın 3 saat aralıksız kitap yazacağım" veya "Haftada 6 gün 2 saat spor yapacağım" gibi iradeyi tüketen gerçek dışı yükler.',
      kaizenSolution:
        'Kaizen Adımı: Görevi zihnin direnç gösteremeyeceği kadar küçük mikro parçalara (2 Dakika Kuralı) böl.',
      icon: '⚡',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'muda',
      type: 'muda',
      title: 'Muda (無駄) — Odak İsrafı',
      subtitle: 'Sürtünme, Erteleme ve Çevresel Dikkat Dağınıklığı',
      tag: 'Zaman İsrafı',
      wasteDescription:
        'Göreve başlamadan önce bildirimlere kapılma, çalışma alanındaki karmaşa ve karar yorgunluğu nedeniyle yaşanan zaman kayıpları.',
      kaizenSolution:
        'Kaizen Adımı: Çevre tasarımı ve 1. Yasa (Görünür Kıl) ile sürtünmeyi sıfıra indir, tek tıkla başla.',
      icon: '⏳',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'mura',
      type: 'mura',
      title: 'Mura (斑) — Tutarsızlık',
      subtitle: 'Dalgalı İrade & Kopan Alışkanlık Zincirleri',
      tag: 'Dalgalanma',
      wasteDescription:
        'Bir gün aşırı motivasyonla 10 saat çalışıp, takip eden günlerde tükenmişlik ile hiçbir şey yapamama dengesizliği.',
      kaizenSolution:
        'Kaizen Adımı: PDCA (Planla-Uygula-Kontrol Et-Önlem Al) retrospektifi ile ritmik ve tahmin edilebilir rutinler kur.',
      icon: '🔄',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    }
  ];

  readonly tasks: TwoMinuteTask[] = [
    {
      id: 'report',
      category: 'İş & Odak',
      intimidatingTask: 'Kapsamlı Yıllık Raporu Hazırla (40 Sayfa)',
      atomicMicroStep: 'Dosyayı aç, başlığı yaz ve 1 giriş cümlesi oluştur',
      timeSeconds: 120,
      completed: false,
      whyItWorks: 'Başlama direnci aşıldığında zihin akış moduna geçer.'
    },
    {
      id: 'reading',
      category: 'Kişisel Gelişim',
      intimidatingTask: 'Ayda 4 Kalın Kitap Oku ve Özet Çıkar',
      atomicMicroStep: 'Kitabı eline al, kapağını aç ve sadece 1 paragraf oku',
      timeSeconds: 120,
      completed: false,
      whyItWorks: '1 sayfa okuyan biri artık "okuyucu" kimliğini aktive etmiştir.'
    },
    {
      id: 'fitness',
      category: 'Sağlık & Beden',
      intimidatingTask: 'Ağır Antrenman & 10 Kilometre Koşu Yap',
      atomicMicroStep: 'Koşu ayakkabılarını giy ve kapının önüne çık',
      timeSeconds: 120,
      completed: false,
      whyItWorks: 'En büyük sürtünme ayakkabıyı giymektir; giydikten sonra devam gelir.'
    },
    {
      id: 'code',
      category: 'Mühendislik',
      intimidatingTask: 'Tüm Modülü Mikroservis Mimarisine Refactor Et',
      atomicMicroStep: 'İlk fonksiyon için boş bir test dosyası aç ve 1 test adı yaz',
      timeSeconds: 120,
      completed: false,
      whyItWorks: 'Küçük bir yeşil test, dopamin salgılatır ve sonraki adımı kolaylaştırır.'
    }
  ];

  readonly selectedTaskId = signal<string>('report');
  readonly timerRemaining = signal<number>(120);
  readonly isTimerRunning = signal<boolean>(false);
  readonly hasCompletedSimulation = signal<boolean>(false);
  private timerInterval?: any;

  readonly activeTask = computed(() => {
    return this.tasks.find((t) => t.id === this.selectedTaskId()) || this.tasks[0];
  });

  readonly formattedTime = computed(() => {
    const s = this.timerRemaining();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  });

  readonly timerProgress = computed(() => {
    return ((120 - this.timerRemaining()) / 120) * 100;
  });

  selectTask(id: string): void {
    this.stopTimer();
    this.selectedTaskId.set(id);
    this.timerRemaining.set(120);
    this.hasCompletedSimulation.set(false);
  }

  startTimer(): void {
    if (this.isTimerRunning()) return;
    this.isTimerRunning.set(true);
    this.hasCompletedSimulation.set(false);

    this.timerInterval = setInterval(() => {
      const current = this.timerRemaining();
      if (current <= 1) {
        this.completeTimer();
      } else {
        // Accelerate simulation by 2s per tick for realistic demo feel
        this.timerRemaining.set(Math.max(0, current - 2));
      }
    }, 200);
  }

  pauseTimer(): void {
    this.stopTimer();
  }

  completeTimer(): void {
    this.stopTimer();
    this.timerRemaining.set(0);
    this.hasCompletedSimulation.set(true);
  }

  resetTimer(): void {
    this.stopTimer();
    this.timerRemaining.set(120);
    this.hasCompletedSimulation.set(false);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    this.isTimerRunning.set(false);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
