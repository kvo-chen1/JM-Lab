import React, { useState, useEffect } from 'react';
import { copyrightCertificateService } from '@/services/copyrightCertificateService';
import type { CopyrightCertificate } from '@/types/copyright-certificate';
import { CERTIFICATE_TEMPLATE_CONFIG } from '@/types/copyright-certificate';

interface CertificateViewerProps {
  certificateId: string;
  onClose?: () => void;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificateId,
  onClose
}) => {
  const [certificate, setCertificate] = useState<CopyrightCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    setLoading(true);
    try {
      const data = await copyrightCertificateService.getCertificateById(certificateId);
      setCertificate(data);
    } catch (e) {
      console.error('加载证书失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await copyrightCertificateService.downloadCertificate(certificateId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `版权证书_${certificate?.certificateNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = await copyrightCertificateService.shareCertificate(certificateId);
      await navigator.clipboard.writeText(url);
      alert('验证链接已复制到剪贴板');
    } catch (error: any) {
      alert(error.message || '分享失败');
    }
  };

  const handlePrint = () => {
    if (certificate) {
      const html = (copyrightCertificateService as any).generateCertificateHTML(certificate);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6 space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="p-6 text-center text-gray-500">
        未找到证书信息
      </div>
    );
  }

  const templateConfig = CERTIFICATE_TEMPLATE_CONFIG[certificate.template];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl w-full">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{templateConfig.icon}</span>
              版权证书
            </h2>
            <p className="text-sm text-white/80 mt-1">{templateConfig.label}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-2">证书编号</p>
          <p className="text-2xl font-bold text-blue-800 font-mono tracking-wider">
            {certificate.certificateNumber}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              certificate.status === 'valid' ? 'bg-green-100 text-green-700' :
              certificate.status === 'expired' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {certificate.status === 'valid' ? '✅ 有效' :
               certificate.status === 'expired' ? '⏰ 已过期' : '❌ 已撤销'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          {certificate.workThumbnail && (
            <img
              src={certificate.workThumbnail}
              alt={certificate.workTitle}
              className="w-24 h-24 object-cover rounded-lg shadow"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{certificate.workTitle}</h3>
            <p className="text-sm text-gray-500 mt-1">作品类型: {certificate.workType}</p>
            {certificate.workHash && (
              <p className="text-xs text-gray-400 mt-1 font-mono">
                指纹: {certificate.workHash.substring(0, 16)}...
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">版权所有者</p>
            <p className="font-medium text-gray-900">{certificate.copyrightHolder}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">创作者</p>
            <p className="font-medium text-gray-900">{certificate.creatorName}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">许可类型</p>
            <p className="font-medium text-gray-900">{certificate.licenseLabel}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">登记时间</p>
            <p className="font-medium text-gray-900">{formatDate(certificate.timestamp)}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔐</span>
            <span className="font-medium text-gray-900">时间戳存证</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">存证方式：</span>
              {certificate.timestampProvider === 'blockchain' ? '区块链存证' :
               certificate.timestampProvider === 'trusted_third_party' ? '可信第三方' : '平台存证'}
            </p>
            <p className="font-mono text-xs bg-white p-2 rounded mt-2 break-all">
              {certificate.timestampHash}
            </p>
            {certificate.blockNumber && (
              <p><span className="font-medium">区块高度：</span>{certificate.blockNumber}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">验证链接</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={certificate.verificationUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border rounded"
            />
            <button
              onClick={handleShare}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              复制
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">颁发机构: {certificate.issuedBy}</p>
            <p className="text-xs text-gray-400">颁发日期: {formatDate(certificate.issuedAt)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? '下载中...' : '下载证书'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            打印
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
