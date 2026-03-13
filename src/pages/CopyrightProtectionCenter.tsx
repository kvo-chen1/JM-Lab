import React, { useState, useEffect } from 'react';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import { similarityDetectionService } from '@/services/similarityDetectionService';
import { infringementReportService } from '@/services/infringementReportService';
import { copyrightCertificateService } from '@/services/copyrightCertificateService';
import {
  CopyrightBadge,
  CopyrightDeclarationForm,
  CopyrightDeclarationDetail,
  SimilarityChecker,
  InfringementAlertList,
  InfringementReportForm,
  InfringementReportDetail,
  CertificateGenerator,
  CertificateViewer
} from '@/components/copyright-protection';
import type { CopyrightDeclaration, InfringementAlert, InfringementReport } from '@/types';

type TabType = 'overview' | 'declarations' | 'alerts' | 'reports' | 'certificates';

const CopyrightProtectionCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [declarations, setDeclarations] = useState<CopyrightDeclaration[]>([]);
  const [alerts, setAlerts] = useState<InfringementAlert[]>([]);
  const [reports, setReports] = useState<InfringementReport[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [stats, setStats] = useState({
    declarations: 0,
    alerts: 0,
    reports: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);

  const [showDeclarationForm, setShowDeclarationForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showCertificateGenerator, setShowCertificateGenerator] = useState(false);
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [selectedCopyrightId, setSelectedCopyrightId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [declData, alertData, reportData, certData] = await Promise.all([
        copyrightProtectionService.getMyDeclarations(),
        similarityDetectionService.getAlerts(),
        infringementReportService.getMyReports(),
        copyrightCertificateService.getMyCertificates()
      ]);

      setDeclarations(declData);
      setAlerts(alertData);
      setReports(reportData);
      setCertificates(certData);

      setStats({
        declarations: declData.length,
        alerts: alertData.filter((a: InfringementAlert) => a.status === 'pending').length,
        reports: reportData.filter((r: InfringementReport) => r.status === 'submitted').length,
        certificates: certData.length
      });
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: '概览', icon: '📊' },
    { id: 'declarations' as TabType, label: '版权声明', icon: '📜', count: stats.declarations },
    { id: 'alerts' as TabType, label: '侵权预警', icon: '⚠️', count: stats.alerts },
    { id: 'reports' as TabType, label: '侵权举报', icon: '🚨', count: stats.reports },
    { id: 'certificates' as TabType, label: '版权证书', icon: '🏆', count: stats.certificates }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">版权声明</p>
              <p className="text-3xl font-bold mt-1">{stats.declarations}</p>
            </div>
            <span className="text-4xl opacity-80">📜</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">待处理预警</p>
              <p className="text-3xl font-bold mt-1">{stats.alerts}</p>
            </div>
            <span className="text-4xl opacity-80">⚠️</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">进行中举报</p>
              <p className="text-3xl font-bold mt-1">{stats.reports}</p>
            </div>
            <span className="text-4xl opacity-80">🚨</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">版权证书</p>
              <p className="text-3xl font-bold mt-1">{stats.certificates}</p>
            </div>
            <span className="text-4xl opacity-80">🏆</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowDeclarationForm(true)}
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">📝</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">创建版权声明</p>
                <p className="text-xs text-gray-500">保护您的作品</p>
              </div>
            </button>
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl">🚨</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">举报侵权</p>
                <p className="text-xs text-gray-500">维护您的权益</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl">🔍</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">相似度检测</p>
                <p className="text-xs text-gray-500">发现潜在侵权</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">🏆</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">生成证书</p>
                <p className="text-xs text-gray-500">获取版权证明</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
          {declarations.length === 0 && reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📭</span>
              <p>暂无活动记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {declarations.slice(0, 3).map(decl => (
                <div key={decl.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">📜</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{decl.workTitle}</p>
                    <p className="text-xs text-gray-500">版权声明已创建</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(decl.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {reports.slice(0, 2).map(report => (
                <div key={report.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">🚨</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                    <p className="text-xs text-gray-500">侵权举报已提交</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(report.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">版权保护指南</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">1. 声明版权</h4>
            <p className="text-sm text-gray-600">
              为您的作品创建版权声明，明确许可类型和使用权限。
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">2. 时间戳存证</h4>
            <p className="text-sm text-gray-600">
              使用时间戳记录创作时间，为版权归属提供证据。
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">3. 生成证书</h4>
            <p className="text-sm text-gray-600">
              生成版权证书，作为版权归属的正式证明文件。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeclarations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">我的版权声明</h2>
        <button
          onClick={() => setShowDeclarationForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 创建声明
        </button>
      </div>

      {declarations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <span className="text-6xl mb-4 block">📜</span>
          <p className="text-gray-500 mb-4">暂无版权声明</p>
          <button
            onClick={() => setShowDeclarationForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建第一个版权声明
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {declarations.map(decl => (
            <div
              key={decl.id}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedDeclarationId(decl.id)}
            >
              <div className="flex items-start gap-3">
                {decl.workThumbnail && (
                  <img
                    src={decl.workThumbnail}
                    alt={decl.workTitle}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{decl.workTitle}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {copyrightProtectionService.getLicenseTypeLabel(decl.licenseType)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      decl.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {copyrightProtectionService.getStatusLabel(decl.status)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(decl.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">侵权预警</h2>
      </div>
      <InfringementAlertList
        status="pending"
        onAlertClick={(alert) => console.log('Alert clicked:', alert)}
      />
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">我的举报</h2>
        <button
          onClick={() => setShowReportForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          + 提交举报
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <span className="text-6xl mb-4 block">🚨</span>
          <p className="text-gray-500 mb-4">暂无举报记录</p>
          <button
            onClick={() => setShowReportForm(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            提交第一个举报
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReportId(report.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.targetTitle}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  report.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {report.status === 'submitted' ? '待处理' :
                   report.status === 'resolved' ? '已解决' : report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">我的证书</h2>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <span className="text-6xl mb-4 block">🏆</span>
          <p className="text-gray-500 mb-4">暂无版权证书</p>
          <p className="text-sm text-gray-400">先创建版权声明，然后生成证书</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCertificateId(cert.id)}
            >
              <div className="flex items-start gap-3">
                {cert.workThumbnail && (
                  <img
                    src={cert.workThumbnail}
                    alt={cert.workTitle}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-mono">{cert.certificateNumber}</p>
                  <h3 className="font-medium text-gray-900 truncate mt-1">{cert.workTitle}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      cert.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cert.status === 'valid' ? '有效' : '已撤销'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">版权保护中心</h1>
          <p className="text-gray-600 mt-1">管理您的版权声明、侵权预警和证书</p>
        </div>

        <div className="bg-white rounded-xl shadow mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'declarations' && renderDeclarations()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'certificates' && renderCertificates()}
          </>
        )}

        {showDeclarationForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <CopyrightDeclarationForm
                  workId={`work-${Date.now()}`}
                  workTitle="新作品"
                  workType="image"
                  onSuccess={(decl) => {
                    setShowDeclarationForm(false);
                    loadData();
                  }}
                  onCancel={() => setShowDeclarationForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedDeclarationId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <CopyrightDeclarationDetail
              copyrightId={selectedDeclarationId}
              onClose={() => setSelectedDeclarationId(null)}
            />
          </div>
        )}

        {selectedReportId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <InfringementReportDetail
              reportId={selectedReportId}
              onClose={() => setSelectedReportId(null)}
            />
          </div>
        )}

        {selectedCertificateId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <CertificateViewer
              certificateId={selectedCertificateId}
              onClose={() => setSelectedCertificateId(null)}
            />
          </div>
        )}

        {showCertificateGenerator && selectedCopyrightId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <CertificateGenerator
              copyrightDeclarationId={selectedCopyrightId}
              onSuccess={(cert) => {
                setShowCertificateGenerator(false);
                setSelectedCopyrightId(null);
                loadData();
              }}
              onCancel={() => {
                setShowCertificateGenerator(false);
                setSelectedCopyrightId(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyrightProtectionCenter;
