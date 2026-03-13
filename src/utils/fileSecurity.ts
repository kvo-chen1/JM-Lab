const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  other: 25 * 1024 * 1024,
  default: 25 * 1024 * 1024,
};

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.ps1',
  '.scr', '.com', '.pif', '.application', '.gadget',
  '.msi', '.msp', '.mst', '.cpl', '.jar', '.app',
];

const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-dosexec',
  'text/javascript',
  'application/javascript',
];

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileType?: 'image' | 'video' | 'document' | 'other';
}

export interface FileSecurityConfig {
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocumentTypes: string[];
  maxFileSize: typeof MAX_FILE_SIZE;
  blockDangerousExtensions: boolean;
  blockDangerousMimeTypes: boolean;
  scanForMalware: boolean;
  sanitizeSvg: boolean;
}

const DEFAULT_CONFIG: FileSecurityConfig = {
  allowedImageTypes: ALLOWED_IMAGE_TYPES,
  allowedVideoTypes: ALLOWED_VIDEO_TYPES,
  allowedDocumentTypes: ALLOWED_DOCUMENT_TYPES,
  maxFileSize: MAX_FILE_SIZE,
  blockDangerousExtensions: true,
  blockDangerousMimeTypes: true,
  scanForMalware: false,
  sanitizeSvg: true,
};

class FileSecurity {
  private config: FileSecurityConfig;

  constructor(config: Partial<FileSecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<FileSecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FileSecurityConfig {
    return { ...this.config };
  }

  validateFile(file: File): FileValidationResult {
    const result: FileValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const fileExtension = this.getFileExtension(file.name).toLowerCase();
    const mimeType = file.type;

    const fileType = this.detectFileType(file);
    result.fileType = fileType;

    if (file.size === 0) {
      result.valid = false;
      result.errors.push('文件不能为空');
      return result;
    }

    const maxSize = this.config.maxFileSize[fileType] || this.config.maxFileSize.default;
    if (file.size > maxSize) {
      result.valid = false;
      result.errors.push(`文件大小不能超过 ${this.formatFileSize(maxSize)}`);
    }

    if (this.config.blockDangerousExtensions) {
      if (DANGEROUS_EXTENSIONS.some(ext => fileExtension === ext)) {
        result.valid = false;
        result.errors.push('不允许的文件类型');
      }
    }

    if (this.config.blockDangerousMimeTypes) {
      if (DANGEROUS_MIME_TYPES.some(type => mimeType === type)) {
        result.valid = false;
        result.errors.push('不允许的文件类型');
      }
    }

    if (fileType === 'image' && !this.config.allowedImageTypes.includes(mimeType)) {
      result.warnings.push(`不常见的图片格式: ${mimeType}`);
    }

    if (fileType === 'video' && !this.config.allowedVideoTypes.includes(mimeType)) {
      result.warnings.push(`不常见的视频格式: ${mimeType}`);
    }

    if (fileType === 'document' && !this.config.allowedDocumentTypes.includes(mimeType)) {
      result.warnings.push(`不常见的文档格式: ${mimeType}`);
    }

    if (fileExtension === '.svg' && this.config.sanitizeSvg) {
      result.warnings.push('SVG文件将被自动清理');
    }

    return result;
  }

  validateFiles(files: File[]): {
    validFiles: File[];
    invalidFiles: Array<{ file: File; errors: string[] }>;
    results: FileValidationResult[];
  } {
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; errors: string[] }> = [];
    const results: FileValidationResult[] = [];

    for (const file of files) {
      const result = this.validateFile(file);
      results.push(result);

      if (result.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, errors: result.errors });
      }
    }

    return { validFiles, invalidFiles, results };
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.slice(lastDot);
  }

  private detectFileType(file: File): 'image' | 'video' | 'document' | 'other' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('application/') || file.type.startsWith('text/')) return 'document';
    return 'other';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  generateSafeFileName(originalName: string): string {
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.slice(0, originalName.length - extension.length);

    const safeBaseName = baseName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    return `${safeBaseName}_${timestamp}_${randomString}${extension}`;
  }

  async sanitizeSvg(svgContent: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    const errors = doc.querySelectorAll('parsererror');
    if (errors.length > 0) {
      throw new Error('Invalid SVG content');
    }

    const dangerousElements = ['script', 'foreignObject', 'iframe', 'embed', 'object'];
    dangerousElements.forEach(tag => {
      const elements = doc.getElementsByTagName(tag);
      while (elements.length > 0) {
        elements[0].parentNode?.removeChild(elements[0]);
      }
    });

    const allElements = doc.getElementsByTagName('*');
    for (const element of allElements) {
      const attributes = Array.from(element.attributes);
      for (const attr of attributes) {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
        if (attr.value.toLowerCase().includes('javascript:')) {
          element.removeAttribute(attr.name);
        }
      }
    }

    return doc.documentElement.outerHTML;
  }

  scanFile(file: File): Promise<{ safe: boolean; threats: string[] }> {
    return new Promise((resolve) => {
      const threats: string[] = [];

      if (file.name.includes('..')) {
        threats.push('路径遍历尝试');
      }

      if (DANGEROUS_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
        threats.push('危险文件扩展名');
      }

      resolve({
        safe: threats.length === 0,
        threats,
      });
    });
  }
}

export const fileSecurity = new FileSecurity();

export default fileSecurity;
