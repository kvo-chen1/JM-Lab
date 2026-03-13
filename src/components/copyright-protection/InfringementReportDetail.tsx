import React, { useState, useEffect } from 'react';
import { infringementReportService } from '@/services/infringementReportService';
import type { InfringementReport, Evidence, AddEvidenceDTO } from '@/types/infringement-report';
import { INFRINGEMENT_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/infringement-report';

interface InfringementReportDetailProps {
  reportId: string;
  onClose?: () => void;
  isAdmin?: boolean;
}

const InfringementReportDetail: React.FC<InfringementReportDetailProps> = ({
  reportId,
  onClose,
  isAdmin = false
}) => {
  const [report, setReport] = useState<InfringementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [newEvidence, setNewEvidence] = useState({
    type: 'screenshot' as Evidence['type'],
    title: '',
    description: '',
    externalUrl: ''
  });

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await infringementReportService.getReportById(reportId);
      setReport(data);
    } catch (e) {
      console.error('加载举报详情失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!report || !newEvidence.title) return;

    try {
      const dto: AddEvidenceDTO = {
        reportId: report.id,
        type: newEvidence.type,
        title: newEvidence.title,
        description: newEvidence.description || undefined,
        externalUrl: newEvidence.externalUrl || undefined
      };

      await infringementReportService.addEvidence(dto);
      await loadReport();
      setShowEvidenceForm(false);
      setNewEvidence({ type: 'screenshot', title: '', description: '', externalUrl: '' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-center text-gray-500">
        未找到举报信息
      </div>
    );
  }

  const typeConfig = INFRINGEMENT_TYPE_CONFIG[report.infringementType];
  const statusConfig = STATUS_CONFIG[report.status];
  const priorityConfig = PRIORITY_CONFIG[report.priority];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">侵权举报详情</h2>
            <p className="text-sm text-white/80 mt-1">举报编号: {report.id}</p>
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
        <div className="flex items-start gap-4">
          {report.targetThumbnail && (
            <img
              src={report.targetThumbnail}
              alt={report.targetTitle}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                {priorityConfig.label}优先级
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {typeConfig.icon} {typeConfig.label}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">举报描述</h4>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.description}</p>
        </div>

        {(report.originalWorkUrl || report.originalWorkTitle) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">原创作品信息</h4>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              {report.originalWorkTitle && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">作品名称：</span>
                  <span className="text-gray-900">{report.originalWorkTitle}</span>
                </p>
              )}
              {report.originalWorkUrl && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">作品链接：</span>
                  <a href={report.originalWorkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {report.originalWorkUrl}
                  </a>
                </p>
              )}
              {report.originalCreationDate && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">创作时间：</span>
                  <span className="text-gray-900">{report.originalCreationDate}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-500">证据材料 ({report.evidence.length})</h4>
            {report.status !== 'resolved' && report.status !== 'rejected' && (
              <button
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加证据
              </button>
            )}
          </div>

          {showEvidenceForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">证据类型</label>
                  <select
                    value={newEvidence.type}
                    onChange={(e) => setNewEvidence({ ...newEvidence, type: e.target.value as any })}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    <option value="screenshot">截图</option>
                    <option value="original_file">原始文件</option>
                    <option value="url">链接</option>
                    <option value="certificate">证书</option>
                    <option value="contract">合同</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标题 *</label>
                  <input
                    type="text"
                    value={newEvidence.title}
                    onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder="证据标题"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">链接</label>
                <input
                  type="url"
                  value={newEvidence.externalUrl}
                  onChange={(e) => setNewEvidence({ ...newEvidence, externalUrl: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  rows={2}
                  placeholder="证据描述..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEvidenceForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleAddEvidence}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {report.evidence.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无证据材料</p>
          ) : (
            <div className="space-y-2">
              {report.evidence.map((evidence) => (
                <div key={evidence.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">
                    {evidence.type === 'screenshot' ? '📸' :
                     evidence.type === 'original_file' ? '📁' :
                     evidence.type === 'url' ? '🔗' :
                     evidence.type === 'certificate' ? '📜' :
                     evidence.type === 'contract' ? '📋' : '📎'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{evidence.title}</p>
                    {evidence.description && (
                      <p className="text-xs text-gray-500">{evidence.description}</p>
                    )}
                  </div>
                  {evidence.externalUrl && (
                    <a
                      href={evidence.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      查看
                    </a>
                  )}
                  {evidence.verified && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      已验证
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">处理时间线</h4>
          <div className="space-y-3">
            {report.timeline.map((entry, index) => (
              <div key={entry.id || index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {index < report.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-sm text-gray-900">{entry.description}</p>
                  <p className="text-xs text-gray-500">
                    {entry.actorName} · {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {report.adminResponse && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">管理员回复</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">{report.adminResponse}</p>
              {report.adminName && (
                <p className="text-xs text-gray-500 mt-2">处理人: {report.adminName}</p>
              )}
            </div>
          </div>
        )}

        {report.resolution && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">处理结果</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-700">{report.resolution}</p>
              {report.resolutionType && (
                <p className="text-xs text-gray-500 mt-2">
                  结果: {report.resolutionType === 'removed' ? '内容已删除' :
                        report.resolutionType === 'warning' ? '已发出警告' :
                        report.resolutionType === 'rejected' ? '举报被驳回' :
                        report.resolutionType === 'escalated' ? '已升级处理' : '未发现违规'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4 flex justify-between items-center text-sm text-gray-500">
          <span>提交于 {formatDate(report.submittedAt)}</span>
          {report.status === 'submitted' && (
            <button
              onClick={async () => {
                if (confirm('确定要撤回此举报吗？')) {
                  await infringementReportService.withdrawReport(report.id);
                  loadReport();
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              撤回举报
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfringementReportDetail;
