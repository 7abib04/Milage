import { CategoryType } from '../types';

export const Colors = {
  // Deep space liquid canvas
  background: '#07090E',
  backgroundSecondary: '#0E131F',
  backgroundTertiary: '#141C2E',

  // Liquid Frosted Glass
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBackgroundElevated: 'rgba(255, 255, 255, 0.10)',
  glassBackgroundActive: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.28)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textTertiary: 'rgba(255, 255, 255, 0.44)',
  textMuted: 'rgba(255, 255, 255, 0.28)',

  // Brand liquid gradients & accents
  accentPrimary: '#00F2FE',
  accentSecondary: '#4FACFE',
  accentPurple: '#A855F7',
  accentRose: '#F43F5E',
  accentAmber: '#F59E0B',
  accentEmerald: '#10B981',

  // Status
  danger: '#EF4444',
  dangerGlass: 'rgba(239, 68, 68, 0.2)',
  dangerBorder: 'rgba(239, 68, 68, 0.4)',
  success: '#10B981',
  successGlass: 'rgba(16, 185, 129, 0.2)',
  warning: '#F59E0B',

  // Categories Color Map
  category: {
    Driving: {
      primary: '#38BDF8',
      secondary: '#0284C7',
      glass: 'rgba(56, 189, 248, 0.16)',
      border: 'rgba(56, 189, 248, 0.35)',
    },
    Running: {
      primary: '#F97316',
      secondary: '#EA580C',
      glass: 'rgba(249, 115, 22, 0.16)',
      border: 'rgba(249, 115, 22, 0.35)',
    },
    Walking: {
      primary: '#34D399',
      secondary: '#059669',
      glass: 'rgba(52, 211, 153, 0.16)',
      border: 'rgba(52, 211, 153, 0.35)',
    },
    Cycling: {
      primary: '#A78BFA',
      secondary: '#7C3AED',
      glass: 'rgba(167, 139, 250, 0.16)',
      border: 'rgba(167, 139, 250, 0.35)',
    },
    Other: {
      primary: '#FBBF24',
      secondary: '#D97706',
      glass: 'rgba(251, 191, 36, 0.16)',
      border: 'rgba(251, 191, 36, 0.35)',
    },
  } as Record<CategoryType, { primary: string; secondary: string; glass: string; border: string }>,
};

export const getCategoryColor = (category: CategoryType) => {
  return Colors.category[category] || Colors.category.Other;
};
