import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { copyrightCertificateService } from '@/services/copyrightCertificateService';
import type { CertificateVerificationResult } from '@/types/copyright-certificate';

const CertificateVerificationPage: React.FC = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [searchParams] = useSearchParams();
  
  const [inputNumber, setInputNumber] = useState(certificateNumber || '');
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const number = certificateNumber || searchParams.get('number');
    if (number) {
      setInputNumber(number);
      verifyCertificate(number);
    }
  }, [certificateNumber, searchParams]);

  const verifyCertificate = async (number?: string) => {
    const targetNumber = number || inputNumber;
    if (!targetNumber.trim()) {
      alert('请输入证书编号');
      return;
    }

    setLoading(true);
    try {
      const verificationResult = await copyrightCertificateService.verifyCertificate(targetNumber.trim());
      setResult(verificationResult);
      setVerified(true);
    } catch (error: any) {
      setResult({
        valid: false,
        message: error.message || '验证失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔐 版权证书验证
          </h1>
          <p className="text-gray-600">
            输入证书编号验证版权证书的真实性
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value.toUpperCase())}
              placeholder="请输入证书编号，如：CP2024XXXXXXXX"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
            />
            <button
              onClick={() => verifyCertificate()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '验证中...' : '验证'}
            </button>
          </div>
        </div>

        {verified && result && (
          <div className={`rounded-2xl shadow-xl overflow-hidden ${
            result.valid ? 'bg-white' : 'bg-red-50'
          }`}>
            {result.valid ? (
              <div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">✅</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">证书验证通过</h2>
                      <p className="text-green-100">该证书真实有效</p>
                    </div>
                  </div>
                </div>

                {result.certificate && (
                  <div className="p-6 space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">证书编号</p>
                      <p className="text-2xl font-bold text-blue-800 font-mono">
                        {result.certificate.certificateNumber}
                      </p>
                    </div>

                    <div className="flex items-start gap-4">
                      {result.certificate.workThumbnail && (
                        <img
                          src={result.certificate.workThumbnail}
                          alt={result.certificate.workTitle}
                          className="w-20 h-20 object-cover rounded-lg shadow"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.certificate.workTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          作品类型: {result.certificate.workType}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">版权所有者</p>
                        <p className="font-medium text-gray-900">
                          {result.certificate.copyrightHolder}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">创作者</p>
                        <p className="font-medium text-gray-900">
                          {result.certificate.creatorName}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span>🔐</span>
                        <span className="font-medium text-gray-900">时间戳存证</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>存证时间: {formatDate(result.certificate.timestamp)}</p>
                        <p className="font-mono text-xs mt-2 bg-white p-2 rounded break-all">
                          {result.certificate.timestampHash}
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 pt-4 border-t">
                      <p>颁发机构: {result.certificate.issuedBy}</p>
                      <p>颁发日期: {formatDate(result.certificate.issuedAt)}</p>
                    </div>

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ 注意事项</p>
                        <ul className="text-sm text-yellow-700 list-disc list-inside">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <span className="text-6xl mb-4 block">❌</span>
                <h2 className="text-xl font-bold text-red-800 mb-2">验证失败</h2>
                <p className="text-red-600">{result.message}</p>
                <div className="mt-6 p-4 bg-white rounded-lg text-left">
                  <p className="text-sm text-gray-600">
                    可能的原因：
                  </p>
                  <ul className="text-sm text-gray-500 list-disc list-inside mt-2">
                    <li>证书编号输入错误</li>
                    <li>证书已被撤销</li>
                    <li>证书已过期</li>
                    <li>证书不存在</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {!verified && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center text-gray-500">
              <span className="text-6xl mb-4 block">📜</span>
              <p className="text-lg font-medium text-gray-700 mb-2">版权证书验证</p>
              <p className="text-sm">
                输入证书编号以验证证书的真实性和有效性
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-medium text-gray-900">验证说明</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. 证书编号可在版权证书上找到</p>
                <p>2. 编号格式为：CP + 年份 + 8位随机字符</p>
                <p>3. 验证通过后可查看证书详细信息</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-4">证书类型说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-2xl mb-2 block">📜</span>
                  <p className="font-medium text-gray-900">标准证书</p>
                  <p className="text-xs text-gray-500 mt-1">基础版权保护</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-2xl mb-2 block">🏅</span>
                  <p className="font-medium text-gray-900">高级证书</p>
                  <p className="text-xs text-gray-500 mt-1">增强版权保护</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-2xl mb-2 block">⛓️</span>
                  <p className="font-medium text-gray-900">区块链证书</p>
                  <p className="text-xs text-gray-500 mt-1">不可篡改存证</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
