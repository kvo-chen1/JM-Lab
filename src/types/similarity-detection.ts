/**
 * 相似度检测和侵权预警类型定义
 */

export type SimilarityType = 'image' | 'text' | 'mixed';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'pending' | 'confirmed' | 'dismissed' | 'resolved';

export interface ImageFeature {
  hash: string;
  perceptualHash: string;
  colorHistogram: number[];
  edgeFeatures?: number[];
  dominantColors: string[];
}

export interface TextFeature {
  tfidf: Record<string, number>;
  ngrams: string[];
  embeddings?: number[];
  keywords: string[];
}

export interface SimilarityResult {
  id: string;
  sourceWorkId: string;
  targetWorkId: string;
  sourceWorkTitle: string;
  targetWorkTitle: string;
  sourceWorkThumbnail?: string;
  targetWorkThumbnail?: string;
  sourceCreatorId: string;
  sourceCreatorName: string;
  targetCreatorId: string;
  targetCreatorName: string;
  similarityType: SimilarityType;
  similarityScore: number;
  imageSimilarity?: number;
  textSimilarity?: number;
  matchedFeatures: string[];
  details: {
    description: string;
    matchedRegions?: { x: number; y: number; width: number; height: number }[];
  };
  createdAt: string;
}

export interface InfringementAlert {
  id: string;
  workId: string;
  workTitle: string;
  workThumbnail?: string;
  workCreatorId: string;
  workCreatorName: string;
  alertType: 'potential_infringement' | 'similarity_detected' | 'suspicious_upload';
  severity: AlertSeverity;
  status: AlertStatus;
  similarityResults: SimilarityResult[];
  description: string;
  recommendation: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimilarityCheckRequest {
  workId: string;
  workType: 'image' | 'video' | 'audio' | 'text' | 'design' | 'other';
  imageUrl?: string;
  textContent?: string;
  title?: string;
  description?: string;
  creatorId: string;
}

export interface SimilarityCheckResponse {
  success: boolean;
  hasSimilarWorks: boolean;
  similarityResults: SimilarityResult[];
  alert?: InfringementAlert;
  message: string;
}

export interface SimilarityStats {
  totalChecks: number;
  potentialInfringements: number;
  confirmedInfringements: number;
  falsePositives: number;
  averageSimilarityScore: number;
}

export const SEVERITY_CONFIG: Record<AlertSeverity, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  low: {
    label: '低风险',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'ℹ️'
  },
  medium: {
    label: '中风险',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '⚠️'
  },
  high: {
    label: '高风险',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '🔶'
  },
  critical: {
    label: '极高风险',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '🚨'
  }
};

export const ALERT_TYPE_CONFIG: Record<InfringementAlert['alertType'], {
  label: string;
  description: string;
}> = {
  potential_infringement: {
    label: '潜在侵权',
    description: '检测到与已存在作品高度相似'
  },
  similarity_detected: {
    label: '相似作品',
    description: '发现相似作品，请确认是否为原创'
  },
  suspicious_upload: {
    label: '可疑上传',
    description: '上传行为存在可疑特征'
  }
};
