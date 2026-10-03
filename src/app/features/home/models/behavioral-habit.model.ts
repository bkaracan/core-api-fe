export interface KaizenMudaCard {
  id: string;
  type: 'muri' | 'muda' | 'mura';
  title: string;
  subtitle: string;
  tag: string;
  wasteDescription: string;
  kaizenSolution: string;
  icon: string;
  badgeColor: string;
}

export interface TwoMinuteTask {
  id: string;
  category: string;
  intimidatingTask: string;
  atomicMicroStep: string;
  timeSeconds: number;
  completed: boolean;
  whyItWorks: string;
}

export type HabitLawStage = 'cue' | 'craving' | 'response' | 'reward';

export interface HabitLaw {
  id: number;
  stage: HabitLawStage;
  numberText: string;
  title: string;
  subTitle: string;
  ruleTitle: string;
  description: string;
  quote: string;
  digitalFeature: {
    title: string;
    details: string[];
    actionLabel: string;
  };
  stackingExample: {
    currentHabit: string;
    newHabit: string;
    immediateReward: string;
  };
  colorTheme: {
    gradient: string;
    border: string;
    badge: string;
    accent: string;
  };
}

export interface IdentityHabitAction {
  id: string;
  name: string;
  points: number;
  completedToday: boolean;
  tag: string;
}

export interface IdentityPersona {
  id: string;
  title: string;
  statement: string;
  goalContrast: string;
  avatarIcon: string;
  color: string;
  level: number;
  totalVotes: number;
  votesThreshold: number;
  habits: IdentityHabitAction[];
}

export interface PhilosophyQuote {
  id: string;
  quote: string;
  author: string;
  source: string;
  role: string;
  tag: string;
}

export interface LiveMetric {
  id: string;
  label: string;
  value: string;
  changeRate: string;
  subtext: string;
  icon: string;
}

export interface SimulationDataPoint {
  day: number;
  compound: number;
  linear: number;
  decline: number;
}
