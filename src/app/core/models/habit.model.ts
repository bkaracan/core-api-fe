export interface IdentityResponse {
  publicId: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  level: number;
  totalVotes: number;
  votesThreshold: number;
  displayOrder: number;
}

export interface CreateIdentityRequest {
  name: string;
  tagline: string;
  icon?: string;
  color?: string;
  votesThreshold?: number;
}

export interface HabitResponse {
  publicId: string;
  identityPublicId?: string;
  identityName?: string;
  title: string;
  category: 'ZIHIN' | 'BEDEN' | 'KARIYER' | 'ODAK' | 'SOSYAL' | 'HOBI' | 'SINEMA_KULTUR' | 'EGLENCE_OYUN';
  cueTrigger: string;
  targetLocation?: string;
  habitStackCurrent?: string;
  habitStackNew?: string;
  cravingBenefit?: string;
  responseMicroStep: string;
  rewardXp: number;
  frequency: string;
  targetMinutes: number;
  currentStreak: number;
  bestStreak: number;
  active: boolean;
  completedToday: boolean;
}

export interface CreateHabitRequest {
  identityPublicId?: string;
  title: string;
  category?: string;
  cueTrigger: string;
  targetLocation?: string;
  habitStackCurrent?: string;
  habitStackNew?: string;
  cravingBenefit?: string;
  responseMicroStep: string;
  rewardXp?: number;
  targetMinutes?: number;
}

export interface KaizenReflectionResponse {
  publicId: string;
  reflectionDate: string;
  scorePercent: number;
  whatImprovedOnePercent?: string;
  mudaDetected?: string;
  pdcaActionForTomorrow?: string;
}

export interface KaizenReflectionRequest {
  whatImprovedOnePercent?: string;
  mudaDetected?: string;
  pdcaActionForTomorrow?: string;
}

export interface CategoryProgressResponse {
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

export interface DashboardSummaryResponse {
  currentStreak: number;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  totalEarnedXp: number;
  totalIdentityVotes: number;
  identities: IdentityResponse[];
  habits: HabitResponse[];
  todayReflection?: KaizenReflectionResponse;
  categoryTiers?: CategoryProgressResponse[];
}
