import { Component, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhilosophyQuote, LiveMetric } from '../../models/behavioral-habit.model';

@Component({
  selector: 'app-philosophy-quote-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './philosophy-quote-slider.component.html',
  styleUrl: './philosophy-quote-slider.component.scss'
})
export class PhilosophyQuoteSliderComponent implements OnInit, OnDestroy {
  readonly quotes: PhilosophyQuote[] = [
    {
      id: 'clear-systems',
      quote: 'Hedeflerinizin seviyesine yükselmezsiniz; sistemlerinizin seviyesine düşersiniz.',
      author: 'James Clear',
      role: 'Yazar, "Atomik Alışkanlıklar"',
      source: 'Atomic Habits (Bölüm 1)',
      tag: 'Sistem Yaklaşımı'
    },
    {
      id: 'kaizen-imai',
      quote: 'Kaizen demek, her gün, herkesle ve her yerde küçük sürekli iyileşmeler yapmak demektir. Büyük sıçramalar değil, minik adımlar esastır.',
      author: 'Masaaki Imai',
      role: 'Kaizen Enstitüsü Kurucusu',
      source: 'Kaizen: Japon Yönetiminin Başarısı',
      tag: 'Sürekli İyileşme'
    },
    {
      id: 'clear-compound',
      quote: 'Alışkanlıklar kendini geliştirmenin bileşik faizidir. Para nasıl katlanarak büyürse, alışkanlıklarınızın etkisi de tekrarladıkça katlanır.',
      author: 'James Clear',
      role: 'Davranış Bilimi Araştırmacısı',
      source: '%1 Kuralı',
      tag: 'Bileşik Etki'
    },
    {
      id: 'aurelius-small',
      quote: 'Bir bina tek bir tuğlayla tamamlanmaz, ancak tek bir tuğla konmadan da hiçbir şey inşa edilemez.',
      author: 'Marcus Aurelius',
      role: 'Stoacı Filozof & Roma İmparatoru',
      source: 'Kendime Düşünceler',
      tag: 'Stoacı Disiplin'
    }
  ];

  readonly liveMetrics: LiveMetric[] = [
    {
      id: 'steps',
      label: 'Bugün Atılan Atomik Adım',
      value: '48,290+',
      changeRate: '+12.4% bu hafta',
      subtext: 'Kullanıcılarımızın tamamladığı 2 dakikalık mikro-eylemler',
      icon: '⚡'
    },
    {
      id: 'focus',
      label: 'Kurtarılan Derin Odak',
      value: '9,450 Saat',
      changeRate: 'Muda Tasarrufu',
      subtext: 'Erteleme ve dikkat dağınıklığından geri kazanılan zaman',
      icon: '🛡️'
    },
    {
      id: 'multiplier',
      label: 'Ortalama Bileşik Çarpan',
      value: '37.8×',
      changeRate: 'Yıllık Hedef',
      subtext: 'Her gün %1 daha iyi olan üyelerin kümülatif başarısı',
      icon: '📈'
    },
    {
      id: 'streaks',
      label: 'Kırılmayan Zincir Serisi',
      value: '14,820 Gün',
      changeRate: 'Zinciri Kırma Kuralı',
      subtext: 'Görsel streak takibiyle korunan alışkanlıklar',
      icon: '🔗'
    }
  ];

  readonly activeQuoteIndex = signal<number>(0);
  private autoSlideInterval?: any;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  nextQuote(): void {
    this.activeQuoteIndex.update((i) => (i + 1) % this.quotes.length);
  }

  prevQuote(): void {
    this.activeQuoteIndex.update((i) => (i - 1 + this.quotes.length) % this.quotes.length);
  }

  goToQuote(index: number): void {
    this.activeQuoteIndex.set(index);
    this.restartAutoSlide();
  }

  private startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextQuote();
    }, 6000);
  }

  private restartAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }
}
