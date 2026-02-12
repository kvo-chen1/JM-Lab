import React from 'react';
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  File,
  Palette,
  PenTool,
  Figma,
  Layers
} from 'lucide-react';

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'design' | 'code' | 'archive' | 'other';

interface FileTypeIconProps {
  type: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16'
};

const categoryColors: Record<FileCategory, { bg: string; text: string; border: string }> = {
  image: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  video: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-500 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  },
  audio: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800'
  },
  document: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-500 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  design: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-500 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800'
  },
  code: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-500 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800'
  },
  archive: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  other: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700'
  }
};

export function getFileCategory(type: string, name?: string): FileCategory {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.includes('pdf') || type.includes('document') || type.includes('word') || type.includes('excel') || type.includes('powerpoint') || type.includes('text')) return 'document';
  if (type.includes('photoshop') || type.includes('illustrator') || type.includes('figma') || type.includes('sketch') || type.includes('xd') || name?.match(/\.(psd|ai|sketch|fig|xd|cdr)$/i)) return 'design';
  if (type.includes('code') || type.includes('json') || type.includes('xml') || type.includes('html') || type.includes('javascript') || type.includes('typescript')) return 'code';
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) return 'archive';
  return 'other';
}

export function FileTypeIcon({ type, name, size = 'md', className = '' }: FileTypeIconProps) {
  const category = getFileCategory(type, name);
  const colors = categoryColors[category];
  const sizeClass = sizeMap[size];

  const getIcon = () => {
    switch (category) {
      case 'image':
        return <FileImage className={sizeClass} />;
      case 'video':
        return <FileVideo className={sizeClass} />;
      case 'audio':
        return <FileAudio className={sizeClass} />;
      case 'document':
        if (type.includes('excel') || type.includes('spreadsheet') || name?.match(/\.(xlsx?|csv)$/i)) {
          return <FileSpreadsheet className={sizeClass} />;
        }
        if (type.includes('powerpoint') || type.includes('presentation') || name?.match(/\.(pptx?)$/i)) {
          return <Presentation className={sizeClass} />;
        }
        return <FileText className={sizeClass} />;
      case 'design':
        if (name?.match(/\.psd$/i)) return <Palette className={sizeClass} />;
        if (name?.match(/\.ai$/i)) return <PenTool className={sizeClass} />;
        if (name?.match(/\.fig$/i)) return <Figma className={sizeClass} />;
        if (name?.match(/\.sketch$/i)) return <Layers className={sizeClass} />;
        return <Palette className={sizeClass} />;
      case 'code':
        return <FileCode className={sizeClass} />;
      case 'archive':
        return <FileArchive className={sizeClass} />;
      default:
        return <File className={sizeClass} />;
    }
  };

  return (
    <div className={`flex items-center justify-center rounded-lg ${colors.bg} ${colors.text} ${className}`}>
      {getIcon()}
    </div>
  );
}

export function FileTypeBadge({ type, name }: { type: string; name?: string }) {
  const category = getFileCategory(type, name);
  const colors = categoryColors[category];

  const getLabel = () => {
    switch (category) {
      case 'image': return '图片';
      case 'video': return '视频';
      case 'audio': return '音频';
      case 'document': return '文档';
      case 'design': return '设计';
      case 'code': return '代码';
      case 'archive': return '压缩包';
      default: return '文件';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
      {getLabel()}
    </span>
  );
}

export function getAcceptedFileTypes(): string {
  return 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp3,application/pdf,text/plain,application/msword,application/vnd.openstreetmap.document,application/vnd.ms-excel,application/vnd.openstreetmap.spreadsheet,application/vnd.ms-powerpoint,application/vnd.openstreetmap.presentation';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default FileTypeIcon;
