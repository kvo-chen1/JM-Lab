#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, rmSync, statSync, readdirSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * 检查文件是否应该被排除
 */
function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some(pattern => {
    // 将glob模式转换为正则表达式
    const regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** 匹配任意目录
      .replace(/\*/g, '[^/]*') // * 匹配任意字符（除了/）
      .replace(/\./g, '\\.') // 转义点号
      .replace(/\?/g, '.'); // ? 匹配单个字符
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  });
}

/**
 * 递归读取目录
 */
function readDirRecursive(dirPath, excludePatterns) {
  const files = [];
  
  function readDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(process.cwd(), fullPath);
      
      if (entry.isDirectory()) {
        // 检查目录是否应该被排除
        if (!shouldExclude(relativePath + '/**', excludePatterns) && 
            !shouldExclude(relativePath + '/*', excludePatterns)) {
          readDir(fullPath);
        }
      } else {
        // 检查文件是否应该被排除
        if (!shouldExclude(relativePath, excludePatterns)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  readDir(dirPath);
  return files;
}
/**
 * 自动化冗余文件检测与清理工具
 */
class RedundancyCleaner {
  constructor() {
    this.config = this.loadConfig();
    this.files = [];
    this.results = {
      unreferenced: [],
      duplicates: [],
      brokenImages: [],
      unusedStyles: [],
      tempFiles: []
    };
  }

  /**
   * 加载配置
   */
  loadConfig() {
    const defaultConfig = {
      scanDirectories: ['src', 'assets', 'public'],
      exclude: [
        'node_modules/**',
        '.git/**',
        '.vercel/**',
        '.github/**',
        '.trae/**',
        'dist/**',
        'coverage/**',
        'test-results/**',
        '*.log',
        '*.tmp',
        'temp/**',
        '*.gitignore',
        '*.env*',
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        'tsconfig*.json',
        'vite.config*.ts',
        'tailwind.config.js',
        'postcss.config.js',
        'jest.config.js',
        'playwright.config.ts'
      ],
      fileTypes: {
        code: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'],
        styles: ['.css', '.scss', '.sass', '.less', '.styl'],
        images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
        config: ['.json', '.yml', '.yaml', '.toml']
      },
      tempFilePatterns: ['*.tmp', 'temp/**', '*.log', '*.swp', '*.swo', '.DS_Store'],
      maxTempFileAge: 7 * 24 * 60 * 60 * 1000 // 7天
    };

    return defaultConfig;
  }

  /**
   * 扫描目录，收集文件信息
   */
  scanDirectories() {
    console.log('开始扫描项目目录...');

    for (const dir of this.config.scanDirectories) {
      if (!existsSync(dir)) {
        console.warn(`跳过不存在的目录: ${dir}`);
        continue;
      }

      const allFiles = readDirRecursive(dir, this.config.exclude);
      
      for (const file of allFiles) {
        try {
          const stats = statSync(file);
          this.files.push({
            path: file,
            relativePath: relative(process.cwd(), file),
            ext: extname(file).toLowerCase(),
            size: stats.size,
            mtime: stats.mtime.getTime(),
            content: null
          });
        } catch (error) {
          console.warn(`无法读取文件信息: ${file}`, error.message);
        }
      }
    }

    console.log(`扫描完成，共收集 ${this.files.length} 个文件`);
  }

  /**
   * 读取文件内容（仅代码文件）
   */
  readCodeFiles() {
    console.log('读取代码文件内容...');

    for (const file of this.files) {
      if (this.config.fileTypes.code.includes(file.ext) || 
          this.config.fileTypes.styles.includes(file.ext) ||
          this.config.fileTypes.config.includes(file.ext)) {
        try {
          file.content = readFileSync(file.path, 'utf-8');
        } catch (error) {
          console.warn(`无法读取文件: ${file.path}`, error.message);
        }
      }
    }
  }

  /**
   * 检测未引用的文件
   */
  detectUnreferencedFiles() {
    console.log('检测未引用的文件...');

    const codeFiles = this.files.filter(f => this.config.fileTypes.code.includes(f.ext) || 
                                           this.config.fileTypes.styles.includes(f.ext));
    const resourceFiles = this.files.filter(f => this.config.fileTypes.images.includes(f.ext) || 
                                               this.config.fileTypes.styles.includes(f.ext) && !this.config.fileTypes.code.includes(f.ext));

    for (const resourceFile of resourceFiles) {
      const fileName = basename(resourceFile.path);
      const isReferenced = codeFiles.some(codeFile => 
        codeFile.content && codeFile.content.includes(fileName)
      );

      if (!isReferenced) {
        this.results.unreferenced.push(resourceFile);
      }
    }

    console.log(`检测到 ${this.results.unreferenced.length} 个未引用文件`);
  }

  /**
   * 检测重复文件
   */
  detectDuplicateFiles() {
    console.log('检测重复文件...');

    const fileHashes = new Map();

    for (const file of this.files) {
      if (file.size === 0) continue;
      if (this.config.fileTypes.images.includes(file.ext) || file.ext === '.svg') {
        try {
          const buffer = readFileSync(file.path);
          const hash = crypto.createHash('md5').update(buffer).digest('hex');
          
          if (fileHashes.has(hash)) {
            fileHashes.get(hash).push(file);
          } else {
            fileHashes.set(hash, [file]);
          }
        } catch (error) {
          console.warn(`无法计算文件哈希: ${file.path}`, error.message);
        }
      }
    }

    for (const [hash, files] of fileHashes) {
      if (files.length > 1) {
        this.results.duplicates.push(files);
      }
    }

    console.log(`检测到 ${this.results.duplicates.length} 组重复文件`);
  }

  /**
   * 检测损坏的图片
   */
  async detectBrokenImages() {
    console.log('检测损坏的图片...');

    const imageFiles = this.files.filter(f => this.config.fileTypes.images.includes(f.ext));

    for (const imageFile of imageFiles) {
      try {
        await sharp(imageFile.path).metadata();
      } catch (error) {
        this.results.brokenImages.push(imageFile);
      }
    }

    console.log(`检测到 ${this.results.brokenImages.length} 个损坏图片`);
  }

  /**
   * 检测临时文件
   */
  detectTempFiles() {
    console.log('检测临时文件...');

    const now = Date.now();

    for (const file of this.files) {
      // 检查文件扩展名或路径是否匹配临时文件模式
      const isTempFile = this.config.tempFilePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(file.relativePath);
      });

      // 检查文件是否过期
      const isExpired = now - file.mtime > this.config.maxTempFileAge;

      if (isTempFile || isExpired) {
        this.results.tempFiles.push(file);
      }
    }

    console.log(`检测到 ${this.results.tempFiles.length} 个临时文件`);
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('生成清理报告...');

    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: this.files.length,
      results: this.results,
      summary: {
        unreferenced: this.results.unreferenced.length,
        duplicates: this.results.duplicates.length,
        brokenImages: this.results.brokenImages.length,
        tempFiles: this.results.tempFiles.length,
        totalToClean: this.results.unreferenced.length + 
                     this.results.duplicates.reduce((sum, group) => sum + group.length - 1, 0) + 
                     this.results.brokenImages.length + 
                     this.results.tempFiles.length
      }
    };

    const reportPath = 'redundancy-report.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n=== 清理报告 ===`);
    console.log(`总文件数: ${report.totalFiles}`);
    console.log(`未引用文件: ${report.summary.unreferenced}`);
    console.log(`重复文件组: ${report.summary.duplicates}`);
    console.log(`损坏图片: ${report.summary.brokenImages}`);
    console.log(`临时文件: ${report.summary.tempFiles}`);
    console.log(`可清理文件总数: ${report.summary.totalToClean}`);
    console.log(`\n详细报告已保存至: ${reportPath}`);

    return report;
  }

  /**
   * 预览待清理文件
   */
  previewClean() {
    const report = this.generateReport();
    
    console.log(`\n=== 待清理文件预览 ===`);
    
    if (this.results.unreferenced.length > 0) {
      console.log(`\n1. 未引用文件:`);
      this.results.unreferenced.forEach(file => {
        console.log(`   - ${file.relativePath} (${(file.size / 1024).toFixed(2)}KB)`);
      });
    }
    
    if (this.results.duplicates.length > 0) {
      console.log(`\n2. 重复文件:`);
      this.results.duplicates.forEach((group, index) => {
        console.log(`   组 ${index + 1}:`);
        group.forEach(file => {
          console.log(`   - ${file.relativePath} (${(file.size / 1024).toFixed(2)}KB)`);
        });
      });
    }
    
    if (this.results.brokenImages.length > 0) {
      console.log(`\n3. 损坏图片:`);
      this.results.brokenImages.forEach(file => {
        console.log(`   - ${file.relativePath} (${(file.size / 1024).toFixed(2)}KB)`);
      });
    }
    
    if (this.results.tempFiles.length > 0) {
      console.log(`\n4. 临时文件:`);
      this.results.tempFiles.forEach(file => {
        console.log(`   - ${file.relativePath} (${(file.size / 1024).toFixed(2)}KB)`);
      });
    }
    
    return report;
  }

  /**
   * 执行清理操作
   */
  cleanFiles() {
    console.log(`\n=== 执行清理操作 ===`);
    
    let cleanedCount = 0;
    let totalSavedSize = 0;

    // 清理未引用文件
    for (const file of this.results.unreferenced) {
      try {
        rmSync(file.path);
        cleanedCount++;
        totalSavedSize += file.size;
        console.log(`已删除: ${file.relativePath}`);
      } catch (error) {
        console.error(`删除失败: ${file.relativePath}`, error.message);
      }
    }

    // 清理重复文件（保留一个）
    for (const group of this.results.duplicates) {
      // 保留第一个文件，删除其余
      for (let i = 1; i < group.length; i++) {
        const file = group[i];
        try {
          rmSync(file.path);
          cleanedCount++;
          totalSavedSize += file.size;
          console.log(`已删除重复文件: ${file.relativePath}`);
        } catch (error) {
          console.error(`删除失败: ${file.relativePath}`, error.message);
        }
      }
    }

    // 清理损坏图片
    for (const file of this.results.brokenImages) {
      try {
        rmSync(file.path);
        cleanedCount++;
        totalSavedSize += file.size;
        console.log(`已删除损坏图片: ${file.relativePath}`);
      } catch (error) {
        console.error(`删除失败: ${file.relativePath}`, error.message);
      }
    }

    // 清理临时文件
    for (const file of this.results.tempFiles) {
      try {
        rmSync(file.path);
        cleanedCount++;
        totalSavedSize += file.size;
        console.log(`已删除临时文件: ${file.relativePath}`);
      } catch (error) {
        console.error(`删除失败: ${file.relativePath}`, error.message);
      }
    }

    console.log(`\n=== 清理完成 ===`);
    console.log(`已删除文件数: ${cleanedCount}`);
    console.log(`释放存储空间: ${(totalSavedSize / 1024 / 1024).toFixed(2)} MB`);
    
    return { cleanedCount, totalSavedSize };
  }

  /**
   * 运行扫描
   */
  async runScan() {
    this.scanDirectories();
    this.readCodeFiles();
    this.detectUnreferencedFiles();
    this.detectDuplicateFiles();
    await this.detectBrokenImages();
    this.detectTempFiles();
    this.previewClean();
  }

  /**
   * 运行清理
   */
  async runClean() {
    this.scanDirectories();
    this.readCodeFiles();
    this.detectUnreferencedFiles();
    this.detectDuplicateFiles();
    await this.detectBrokenImages();
    this.detectTempFiles();
    this.previewClean();
    this.cleanFiles();
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
=== 自动化冗余文件检测与清理工具 ===
`);
    console.log(`使用方式:`);
    console.log(`  pnpm run clean:scan    - 扫描并预览冗余文件`);
    console.log(`  pnpm run clean:remove  - 扫描并清理冗余文件`);
    console.log(`  pnpm run clean:help    - 显示帮助信息`);
    console.log(`
功能:`);
    console.log(`  - 检测未引用的文件`);
    console.log(`  - 检测重复资源文件`);
    console.log(`  - 检测损坏的图片文件`);
    console.log(`  - 检测临时文件和过期文件`);
    console.log(`  - 生成详细的清理报告`);
    console.log(`  - 支持安全的文件清理`);
    console.log(`
配置:`);
    console.log(`  可在脚本中修改默认配置，包括扫描目录、排除规则等`);
  }
}

/**
 * 主函数
 */
async function main() {
  const cleaner = new RedundancyCleaner();
  const args = process.argv.slice(2);

  switch (args[0]) {
    case 'scan':
      await cleaner.runScan();
      break;
    case 'remove':
      await cleaner.runClean();
      break;
    case 'help':
    default:
      cleaner.showHelp();
      break;
  }
}

main().catch(error => {
  console.error('工具执行出错:', error);
  process.exit(1);
});
