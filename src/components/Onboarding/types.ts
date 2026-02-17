export interface OnboardingStep {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  targetPath: string;
  targetId?: string | null;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'fullscreen';
  primaryAction?: string;
  secondaryAction?: string;
  highlightElements?: string[];
  showPulse?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
}

export interface OnboardingConfig {
  steps: OnboardingStep[];
  allowSkip: boolean;
  showProgress: boolean;
  autoStart: boolean;
  completionReward?: {
    points: number;
    badge?: string;
  };
}

export interface TargetElement {
  id: string;
  rect: DOMRect;
  label?: string;
}

export interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}
