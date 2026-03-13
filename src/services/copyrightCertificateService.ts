/**
 * 版权证书服务
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { copyrightProtectionService } from './copyrightProtectionService';
import type {
  CopyrightCertificate,
  CertificateVerificationResult,
  GenerateCertificateDTO,
  CertificateTemplate
} from '@/types/copyright-certificate';
import { CERTIFICATE_TEMPLATE_CONFIG } from '@/types/copyright-certificate';

const getCurrentUserInfo = (): { id: string; name: string } | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.userId,
        name: user.username || user.name || '匿名用户'
      };
    }
  } catch (e) {
    console.error('获取用户信息失败:', e);
  }
  return null;
};

class CopyrightCertificateService {
  async generateCertificate(dto: GenerateCertificateDTO): Promise<CopyrightCertificate> {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      throw new Error('请先登录');
    }

    const declaration = await copyrightProtectionService.getDeclarationById(dto.copyrightDeclarationId);
    if (!declaration) {
      throw new Error('版权声明不存在');
    }

    if (declaration.creatorId !== userInfo.id) {
      throw new Error('无权生成此版权证书');
    }

    const timestampRecord = await copyrightProtectionService.getTimestampByCopyrightId(dto.copyrightDeclarationId);

    const now = new Date().toISOString();
    const certificateNumber = this.generateCertificateNumber();

    const certificate: CopyrightCertificate = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      certificateNumber,
      
      copyrightDeclarationId: dto.copyrightDeclarationId,
      
      workId: declaration.workId,
      workTitle: declaration.workTitle,
      workType: declaration.workType,
      workThumbnail: declaration.workThumbnail,
      workHash: await this.generateWorkHash(declaration.workId),
      
      creatorId: declaration.creatorId,
      creatorName: declaration.creatorName,
      creatorAvatar: declaration.creatorAvatar,
      copyrightHolder: declaration.copyrightHolder,
      
      licenseType: declaration.licenseType,
      licenseLabel: copyrightProtectionService.getLicenseTypeLabel(declaration.licenseType),
      
      timestamp: timestampRecord?.timestamp || now,
      timestampProvider: timestampRecord?.provider || 'internal',
      timestampHash: timestampRecord?.hash || await this.generateHash(now),
      blockNumber: timestampRecord?.blockNumber,
      transactionHash: timestampRecord?.transactionHash,
      
      template: dto.template || 'standard',
      status: 'valid',
      
      validFrom: now,
      validUntil: dto.validUntil,
      
      issuedAt: now,
      issuedBy: '版权保护平台',
      
      verificationUrl: `${window.location.origin}/copyright/verify/${certificateNumber}`,
      qrCodeData: `${window.location.origin}/copyright/verify/${certificateNumber}`,
      
      metadata: dto.metadata
    };

    try {
      const { error } = await supabaseAdmin
        .from('copyright_certificates')
        .insert(certificate);

      if (error) {
        console.warn('保存证书到数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    localCertificates.push(certificate);
    localStorage.setItem('copyright_certificates', JSON.stringify(localCertificates));

    return certificate;
  }

  private generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `CP${year}${random}`;
  }

  private async generateWorkHash(workId: string): Promise<string> {
    const data = workId + Date.now().toString();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 32);
  }

  private async generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyCertificate(certificateNumber: string): Promise<CertificateVerificationResult> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_certificates')
        .select('*')
        .eq('certificateNumber', certificateNumber)
        .single();

      if (!error && data) {
        return this.validateCertificate(data);
      }
    } catch (e) {
      console.warn('从数据库验证失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    const certificate = localCertificates.find((c: CopyrightCertificate) => c.certificateNumber === certificateNumber);

    if (certificate) {
      return this.validateCertificate(certificate);
    }

    return {
      valid: false,
      message: '未找到该证书'
    };
  }

  private validateCertificate(certificate: CopyrightCertificate): CertificateVerificationResult {
    const warnings: string[] = [];

    if (certificate.status === 'revoked') {
      return {
        valid: false,
        certificate,
        message: '该证书已被撤销'
      };
    }

    if (certificate.validUntil && new Date(certificate.validUntil) < new Date()) {
      return {
        valid: false,
        certificate,
        message: '该证书已过期'
      };
    }

    if (certificate.template === 'blockchain' && !certificate.transactionHash) {
      warnings.push('区块链存证信息不完整');
    }

    return {
      valid: true,
      certificate,
      message: '证书验证通过',
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async getCertificateById(id: string): Promise<CopyrightCertificate | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    return localCertificates.find((c: CopyrightCertificate) => c.id === id) || null;
  }

  async getCertificateByNumber(certificateNumber: string): Promise<CopyrightCertificate | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_certificates')
        .select('*')
        .eq('certificateNumber', certificateNumber)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    return localCertificates.find((c: CopyrightCertificate) => c.certificateNumber === certificateNumber) || null;
  }

  async getMyCertificates(): Promise<CopyrightCertificate[]> {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) return [];

    try {
      const { data, error } = await supabaseAdmin
        .from('copyright_certificates')
        .select('*')
        .eq('creatorId', userInfo.id)
        .order('issuedAt', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('从数据库获取失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    return localCertificates.filter((c: CopyrightCertificate) => c.creatorId === userInfo.id);
  }

  async downloadCertificate(certificateId: string): Promise<Blob> {
    const certificate = await this.getCertificateById(certificateId);
    if (!certificate) {
      throw new Error('证书不存在');
    }

    return this.generatePDF(certificate);
  }

  private async generatePDF(certificate: CopyrightCertificate): Promise<Blob> {
    const html = this.generateCertificateHTML(certificate);
    
    const blob = new Blob([html], { type: 'text/html' });
    return blob;
  }

  private generateCertificateHTML(certificate: CopyrightCertificate): string {
    const templateConfig = CERTIFICATE_TEMPLATE_CONFIG[certificate.template];
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>版权证书 - ${certificate.certificateNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 40px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      position: relative;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
      position: relative;
    }
    .header .template-badge {
      display: inline-block;
      margin-top: 15px;
      padding: 5px 15px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 14px;
      position: relative;
    }
    .content {
      padding: 40px;
    }
    .certificate-number {
      text-align: center;
      margin-bottom: 30px;
    }
    .certificate-number .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .certificate-number .value {
      font-size: 24px;
      font-weight: bold;
      color: #1e3a8a;
      font-family: monospace;
      letter-spacing: 2px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .info-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 10px;
    }
    .info-item .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .info-item .value {
      font-size: 16px;
      color: #111827;
      font-weight: 500;
    }
    .work-preview {
      display: flex;
      gap: 20px;
      align-items: center;
      padding: 20px;
      background: #f9fafb;
      border-radius: 10px;
    }
    .work-preview img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 10px;
    }
    .work-preview .work-info {
      flex: 1;
    }
    .work-preview .work-title {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 10px;
    }
    .work-preview .work-type {
      font-size: 14px;
      color: #6b7280;
    }
    .timestamp-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #3b82f6;
    }
    .timestamp-section .hash {
      font-family: monospace;
      font-size: 12px;
      color: #1e40af;
      word-break: break-all;
      background: white;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
    }
    .footer {
      padding: 30px 40px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer .issued-by {
      font-size: 14px;
      color: #6b7280;
    }
    .footer .issued-date {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 5px;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 100px;
      color: rgba(0,0,0,0.03);
      font-weight: bold;
      pointer-events: none;
      z-index: -1;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="watermark">版权证书</div>
  <div class="certificate">
    <div class="header">
      <h1>${templateConfig.icon} 版权登记证书</h1>
      <p class="subtitle">Copyright Registration Certificate</p>
      <span class="template-badge">${templateConfig.label}</span>
    </div>
    
    <div class="content">
      <div class="certificate-number">
        <div class="label">证书编号</div>
        <div class="value">${certificate.certificateNumber}</div>
      </div>
      
      <div class="section">
        <div class="section-title">作品信息</div>
        <div class="work-preview">
          ${certificate.workThumbnail ? `<img src="${certificate.workThumbnail}" alt="${certificate.workTitle}">` : ''}
          <div class="work-info">
            <div class="work-title">${certificate.workTitle}</div>
            <div class="work-type">作品类型: ${certificate.workType}</div>
            ${certificate.workHash ? `<div class="work-type">作品指纹: ${certificate.workHash.substring(0, 16)}...</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">版权信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">版权所有者</div>
            <div class="value">${certificate.copyrightHolder}</div>
          </div>
          <div class="info-item">
            <div class="label">许可类型</div>
            <div class="value">${certificate.licenseLabel}</div>
          </div>
          <div class="info-item">
            <div class="label">创作者</div>
            <div class="value">${certificate.creatorName}</div>
          </div>
          <div class="info-item">
            <div class="label">登记时间</div>
            <div class="value">${new Date(certificate.timestamp).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">时间戳存证</div>
        <div class="timestamp-section">
          <div><strong>存证方式:</strong> ${certificate.timestampProvider === 'blockchain' ? '区块链存证' : certificate.timestampProvider === 'trusted_third_party' ? '可信第三方' : '平台存证'}</div>
          <div class="hash">
            <strong>存证哈希:</strong><br>
            ${certificate.timestampHash}
          </div>
          ${certificate.blockNumber ? `<div style="margin-top:10px"><strong>区块高度:</strong> ${certificate.blockNumber}</div>` : ''}
          ${certificate.transactionHash ? `<div style="margin-top:10px"><strong>交易哈希:</strong><br><span style="font-size:10px">${certificate.transactionHash}</span></div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div>
        <div class="issued-by">颁发机构: ${certificate.issuedBy}</div>
        <div class="issued-date">颁发日期: ${new Date(certificate.issuedAt).toLocaleDateString('zh-CN')}</div>
      </div>
      <div class="qr-placeholder">
        在线验证<br>
        ${certificate.verificationUrl}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  async shareCertificate(certificateId: string): Promise<string> {
    const certificate = await this.getCertificateById(certificateId);
    if (!certificate) {
      throw new Error('证书不存在');
    }

    return certificate.verificationUrl;
  }

  async revokeCertificate(certificateId: string, reason: string): Promise<boolean> {
    const certificate = await this.getCertificateById(certificateId);
    if (!certificate) {
      throw new Error('证书不存在');
    }

    const userInfo = getCurrentUserInfo();
    if (userInfo?.id !== certificate.creatorId) {
      throw new Error('无权撤销此证书');
    }

    certificate.status = 'revoked';

    try {
      const { error } = await supabaseAdmin
        .from('copyright_certificates')
        .update({ status: 'revoked' })
        .eq('id', certificateId);

      if (error) {
        console.warn('更新数据库失败:', error);
      }
    } catch (e) {
      console.warn('数据库操作失败:', e);
    }

    const localCertificates = JSON.parse(localStorage.getItem('copyright_certificates') || '[]');
    const index = localCertificates.findIndex((c: CopyrightCertificate) => c.id === certificateId);
    if (index !== -1) {
      localCertificates[index] = certificate;
      localStorage.setItem('copyright_certificates', JSON.stringify(localCertificates));
    }

    return true;
  }

  getTemplateLabel(template: CertificateTemplate): string {
    return CERTIFICATE_TEMPLATE_CONFIG[template]?.label || template;
  }
}

export const copyrightCertificateService = new CopyrightCertificateService();
export default copyrightCertificateService;
