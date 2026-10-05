import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdentityPersona } from '../../models/behavioral-habit.model';
import { GlassMarbleJarComponent } from '@shared/components/glass-marble-jar/glass-marble-jar.component';

@Component({
  selector: 'app-identity-matrix',
  standalone: true,
  imports: [CommonModule, GlassMarbleJarComponent],
  templateUrl: './identity-matrix.component.html',
  styleUrl: './identity-matrix.component.scss',
})
export class IdentityMatrixComponent {
  readonly personas = signal<IdentityPersona[]>([
    {
      id: 'pro',
      title: 'Üretken Profesyonel & Değer Üreten',
      statement: '"Ben her gün işine özen gösteren, odaklanan ve kaliteli değer üreten biriyim."',
      goalContrast:
        'Hedef: "Büyük projeyi bitir" ➔ Kimlik: "Her gün kesintisiz odakla en kritik görevini tamamlayan üretici"',
      avatarIcon: '💼',
      color: 'indigo',
      level: 4,
      totalVotes: 87,
      votesThreshold: 100,
      habits: [
        {
          id: 'pro-1',
          name: 'İlk 45 dakika bildirimleri sessize alarak derin odakla çalış',
          points: 1,
          completedToday: true,
          tag: 'Derin Odak',
        },
        {
          id: 'pro-2',
          name: 'Günün en kritik 1 görevini ertelemeden bitir',
          points: 1,
          completedToday: false,
          tag: 'Önceliklendirme',
        },
        {
          id: 'pro-3',
          name: 'Çalışma alanını ve günün yapılacaklar listesini düzenle',
          points: 1,
          completedToday: false,
          tag: 'Kaizen Düzen',
        },
      ],
    },
    {
      id: 'scholar',
      title: 'Sürekli Öğrenen Entelektüel',
      statement: '"Ben her gün yeni bir kavram öğrenen ve not alan meraklı bir zihnim."',
      goalContrast:
        'Hedef: "Yılda 50 kitap oku" ➔ Kimlik: "Günde en az 5 sayfa okumadan uyumayan okuyucu"',
      avatarIcon: '📚',
      color: 'violet',
      level: 3,
      totalVotes: 62,
      votesThreshold: 80,
      habits: [
        {
          id: 'sch-1',
          name: 'Sabah kahvesi eşliğinde 1 akademik makale oku',
          points: 1,
          completedToday: true,
          tag: 'Öğrenme',
        },
        {
          id: 'sch-2',
          name: 'Okunan kitaptan tek bir atomik not çıkar (Zettelkasten)',
          points: 1,
          completedToday: false,
          tag: 'Sentez',
        },
        {
          id: 'sch-3',
          name: '10 dakika sesli kitap veya eğitici podcast dinle',
          points: 1,
          completedToday: false,
          tag: 'Mikro Adım',
        },
      ],
    },
    {
      id: 'wellness',
      title: 'Zinde ve Enerjik Birey',
      statement: '"Ben bedenine ve zihnine saygı duyan, enerjisini yöneten biriyim."',
      goalContrast:
        'Hedef: "15 kilo ver" ➔ Kimlik: "Her gün bedenini hareket ettiren ve su içen sağlıklı insan"',
      avatarIcon: '🏃',
      color: 'emerald',
      level: 5,
      totalVotes: 142,
      votesThreshold: 150,
      habits: [
        {
          id: 'wel-1',
          name: 'Uyanır uyanmaz 1 büyük bardak limonlu su iç',
          points: 1,
          completedToday: true,
          tag: 'Hidrasyon',
        },
        {
          id: 'wel-2',
          name: '2 dakikalık esneme ve derin nefes ritüeli yap',
          points: 1,
          completedToday: false,
          tag: 'Farkındalık',
        },
        {
          id: 'wel-3',
          name: 'Öğle arasında 15 dakikalık yürüyüşe çık',
          points: 1,
          completedToday: false,
          tag: 'Hareket',
        },
      ],
    },
  ]);

  readonly activePersonaId = signal<string>('pro');
  readonly lastVotedHabitName = signal<string | null>(null);

  readonly activePersona = computed(() => {
    return this.personas().find((p) => p.id === this.activePersonaId()) || this.personas()[0];
  });

  readonly remainingVotes = computed(() => {
    const p = this.activePersona();
    return Math.max(0, p.votesThreshold - p.totalVotes);
  });

  readonly progressPercentage = computed(() => {
    const p = this.activePersona();
    if (p.votesThreshold <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((p.totalVotes / p.votesThreshold) * 100)));
  });

  selectPersona(id: string): void {
    this.activePersonaId.set(id);
    this.lastVotedHabitName.set(null);
  }

  castVote(habitId: string): void {
    const currentPersonas = this.personas();
    const updated = currentPersonas.map((persona) => {
      if (persona.id === this.activePersonaId()) {
        const targetHabit = persona.habits.find((h) => h.id === habitId);
        if (!targetHabit) return persona;

        const nextCompleted = !targetHabit.completedToday;
        const voteDelta = nextCompleted ? targetHabit.points || 1 : -(targetHabit.points || 1);

        const updatedHabits = persona.habits.map((h) =>
          h.id === habitId ? { ...h, completedToday: nextCompleted } : h,
        );

        if (nextCompleted) {
          this.lastVotedHabitName.set(targetHabit.name);
        } else {
          this.lastVotedHabitName.set(null);
        }

        let newTotalVotes = Math.max(0, persona.totalVotes + voteDelta);
        let newLevel = persona.level;
        let newThreshold = persona.votesThreshold;

        // Seviye atlama kontrolü (Level-up threshold)
        if (newTotalVotes >= newThreshold) {
          newLevel += 1;
          newThreshold = Math.round(newThreshold * 1.4);
        }

        return {
          ...persona,
          level: newLevel,
          totalVotes: newTotalVotes,
          votesThreshold: newThreshold,
          habits: updatedHabits,
        };
      }
      return persona;
    });

    this.personas.set(updated);
  }
}
