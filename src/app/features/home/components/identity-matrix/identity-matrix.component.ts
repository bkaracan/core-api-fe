import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdentityPersona } from '../../models/behavioral-habit.model';

@Component({
  selector: 'app-identity-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './identity-matrix.component.html',
  styleUrl: './identity-matrix.component.scss'
})
export class IdentityMatrixComponent {
  readonly personas = signal<IdentityPersona[]>([
    {
      id: 'engineer',
      title: 'Derin Odaklanan Yazılım Mimarı',
      statement: '"Ben her gün temiz kod yazan ve mimariyi sürekli iyileştiren biriyim."',
      goalContrast: 'Hedef: "Büyük projeyi bitir" ➔ Kimlik: "Her gün 1 test yazıp 1 refactor yapan mühendis"',
      avatarIcon: '💻',
      color: 'indigo',
      level: 4,
      totalVotes: 87,
      votesThreshold: 100,
      habits: [
        {
          id: 'eng-1',
          name: 'İlk 45 dakika bildirimleri sessize alarak derin kod yaz',
          points: 1,
          completedToday: true,
          tag: 'Derin Odak'
        },
        {
          id: 'eng-2',
          name: 'Gereksiz 1 kütüphaneyi veya teknik borcu temizle',
          points: 1,
          completedToday: false,
          tag: 'Kaizen Temizlik'
        },
        {
          id: 'eng-3',
          name: '1 API uç noktasının dokümantasyonunu güncelle',
          points: 1,
          completedToday: false,
          tag: 'Süreklilik'
        }
      ]
    },
    {
      id: 'scholar',
      title: 'Sürekli Öğrenen Entelektüel',
      statement: '"Ben her gün yeni bir kavram öğrenen ve not alan meraklı bir zihnim."',
      goalContrast: 'Hedef: "Yılda 50 kitap oku" ➔ Kimlik: "Günde en az 5 sayfa okumadan uyumayan okuyucu"',
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
          tag: 'Öğrenme'
        },
        {
          id: 'sch-2',
          name: 'Okunan kitaptan tek bir atomik not çıkar (Zettelkasten)',
          points: 1,
          completedToday: false,
          tag: 'Sentez'
        },
        {
          id: 'sch-3',
          name: '10 dakika sesli kitap veya eğitici podcast dinle',
          points: 1,
          completedToday: false,
          tag: 'Mikro Adım'
        }
      ]
    },
    {
      id: 'wellness',
      title: 'Zinde ve Enerjik Birey',
      statement: '"Ben bedenine ve zihnine saygı duyan, enerjisini yöneten biriyim."',
      goalContrast: 'Hedef: "15 kilo ver" ➔ Kimlik: "Her gün bedenini hareket ettiren ve su içen sağlıklı insan"',
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
          tag: 'Hidrasyon'
        },
        {
          id: 'wel-2',
          name: '2 dakikalık esneme ve derin nefes ritüeli yap',
          points: 1,
          completedToday: false,
          tag: 'Farkındalık'
        },
        {
          id: 'wel-3',
          name: 'Öğle arasında 15 dakikalık yürüyüşe çık',
          points: 1,
          completedToday: false,
          tag: 'Hareket'
        }
      ]
    }
  ]);

  readonly activePersonaId = signal<string>('engineer');
  readonly lastVotedHabitName = signal<string | null>(null);

  readonly activePersona = computed(() => {
    return this.personas().find((p) => p.id === this.activePersonaId()) || this.personas()[0];
  });

  readonly progressPercentage = computed(() => {
    const p = this.activePersona();
    return Math.min(100, Math.round((p.totalVotes / p.votesThreshold) * 100));
  });

  selectPersona(id: string): void {
    this.activePersonaId.set(id);
    this.lastVotedHabitName.set(null);
  }

  castVote(habitId: string): void {
    const currentPersonas = this.personas();
    const updated = currentPersonas.map((persona) => {
      if (persona.id === this.activePersonaId()) {
        const updatedHabits = persona.habits.map((h) => {
          if (h.id === habitId) {
            const nextState = !h.completedToday;
            if (nextState) {
              this.lastVotedHabitName.set(h.name);
            }
            return { ...h, completedToday: nextState };
          }
          return h;
        });

        const newVotes = persona.habits.reduce((acc, h) => {
          const habitMatched = updatedHabits.find((uh) => uh.id === h.id);
          return acc + (habitMatched?.completedToday ? 1 : 0);
        }, persona.totalVotes - (persona.habits.find((h) => h.id === habitId)?.completedToday ? 1 : 0) + (updatedHabits.find((h) => h.id === habitId)?.completedToday ? 1 : 0));

        return {
          ...persona,
          totalVotes: Math.max(0, newVotes),
          habits: updatedHabits
        };
      }
      return persona;
    });

    this.personas.set(updated);
  }
}
