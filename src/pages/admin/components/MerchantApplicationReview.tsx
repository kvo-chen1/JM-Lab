/**
 * 商家入驻审核组件
 * 用于管理员审核商家申请
 */
import React, { useState, useEffect } from 'react';
import { 
  Store, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Search,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  merchantApplicationService, 
  MerchantApplication 
} from '@/services/merchantApplicationService';
import { toast } from 'sonner';

interface MerchantApplicationReviewProps {
  isDarkMode: boolean;
}

const MerchantApplicationReview: React.FC<MerchantApplicationReviewProps> = ({ isDarkMode }) => {
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<MerchantApplication | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const filter = statusFilter === 'all' ? {} : { status: statusFilter };
      const { data } = await merchantApplicationService.getApplications(filter);
      setApplications(data);
    } catch (error) {
      console.error('获取申请列表失败:', error);
      toast.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await merchantApplicationService.getApplicationStats();
      setStats(stats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleReview = (application: MerchantApplication) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    
    setProcessing(true);
    try {
      await merchantApplicationService.reviewApplication(selectedApplication.id, 'approved');
      toast.success('审核通过');
      setReviewModalOpen(false);
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    
    setProcessing(true);
    try {
      await merchantApplicationService.reviewApplication(
        selectedApplication.id, 
        'rejected', 
        rejectionReason
      );
      toast.success('已拒绝申请');
      setReviewModalOpen(false);
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500 border-0">待审核</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500 border-0">已通过</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 border-0">已拒绝</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => 
    app.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.contact_phone.includes(searchQuery)
  );

  const bgPrimary = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white';
  const bgSecondary = isDarkMode ? 'bg-[#141414]' : 'bg-gray-50';
  const bgTertiary = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const borderPrimary = isDarkMode ? 'border-gray-800' : 'border-gray-200';

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${bgSecondary} rounded-xl p-4 border ${borderPrimary}`}>
          <p className={`text-sm ${textMuted} mb-1`}>申请总数</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`${bgSecondary} rounded-xl p-4 border ${borderPrimary}`}>
          <p className={`text-sm ${textMuted} mb-1`}>待审核</p>
          <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
        </div>
        <div className={`${bgSecondary} rounded-xl p-4 border ${borderPrimary}`}>
          <p className={`text-sm ${textMuted} mb-1`}>已通过</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.approved}</p>
        </div>
        <div className={`${bgSecondary} rounded-xl p-4 border ${borderPrimary}`}>
          <p className={`text-sm ${textMuted} mb-1`}>已拒绝</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={`${bgSecondary} rounded-xl p-4 border ${borderPrimary}`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索店铺名称、联系人或电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${bgTertiary} ${borderPrimary} ${textPrimary}`}
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-3 py-2 border ${borderPrimary} rounded-lg ${bgTertiary} ${textPrimary} text-sm`}
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* 申请列表 */}
      <div className={`${bgSecondary} rounded-xl border ${borderPrimary} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${bgTertiary} border-b ${borderPrimary}`}>
              <tr>
                <th className={`text-left px-4 py-3 text-sm font-medium ${textMuted}`}>店铺信息</th>
                <th className={`text-left px-4 py-3 text-sm font-medium ${textMuted}`}>联系人</th>
                <th className={`text-left px-4 py-3 text-sm font-medium ${textMuted}`}>申请时间</th>
                <th className={`text-left px-4 py-3 text-sm font-medium ${textMuted}`}>状态</th>
                <th className={`text-left px-4 py-3 text-sm font-medium ${textMuted}`}>操作</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderPrimary}`}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#5ba3d4]" />
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-4 py-8 text-center ${textMuted}`}>
                    暂无申请数据
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className={`hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bgTertiary} flex items-center justify-center`}>
                          {app.store_logo ? (
                            <img src={app.store_logo} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Store className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${textPrimary}`}>{app.store_name}</p>
                          {app.store_description && (
                            <p className={`text-sm ${textMuted} truncate max-w-[200px]`}>
                              {app.store_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={textSecondary}>{app.contact_name}</p>
                        <p className={`text-sm ${textMuted}`}>{app.contact_phone}</p>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${textMuted}`}>
                      {new Date(app.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(app)}
                        className={`${borderPrimary} ${textSecondary} hover:${textPrimary}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 审核弹窗 */}
      {reviewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewModalOpen(false)}
          />
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${bgPrimary} rounded-2xl shadow-2xl`}>
            {/* 头部 */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 ${bgSecondary} border-b ${borderPrimary} rounded-t-2xl`}>
              <div>
                <h2 className={`text-xl font-semibold ${textPrimary}`}>审核商家申请</h2>
                <p className={`text-sm ${textMuted} mt-0.5`}>查看申请详情并进行审核</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className={`p-2 rounded-lg hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors`}
              >
                <XCircle className={`w-5 h-5 ${textMuted}`} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* 店铺信息 */}
              <div>
                <h3 className={`font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
                  <Store className="w-4 h-4 text-[#5ba3d4]" />
                  店铺信息
                </h3>
                <div className={`${bgSecondary} rounded-lg p-4 space-y-3`}>
                  <div className="flex items-center gap-4">
                    {selectedApplication.store_logo && (
                      <img 
                        src={selectedApplication.store_logo} 
                        alt="店铺Logo" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className={`font-medium ${textPrimary}`}>{selectedApplication.store_name}</p>
                      <p className={`text-sm ${textMuted}`}>{selectedApplication.store_description || '暂无描述'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 联系人信息 */}
              <div>
                <h3 className={`font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
                  <User className="w-4 h-4 text-[#5ba3d4]" />
                  联系人信息
                </h3>
                <div className={`${bgSecondary} rounded-lg p-4 space-y-2`}>
                  <p className={textSecondary}><span className={textMuted}>姓名：</span>{selectedApplication.contact_name}</p>
                  <p className={textSecondary}><span className={textMuted}>电话：</span>{selectedApplication.contact_phone}</p>
                  {selectedApplication.contact_email && (
                    <p className={textSecondary}><span className={textMuted}>邮箱：</span>{selectedApplication.contact_email}</p>
                  )}
                </div>
              </div>

              {/* 资质文件 */}
              <div>
                <h3 className={`font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
                  <FileText className="w-4 h-4 text-[#5ba3d4]" />
                  资质文件
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedApplication.business_license && (
                    <div>
                      <p className={`text-sm ${textMuted} mb-2`}>营业执照</p>
                      <img 
                        src={selectedApplication.business_license} 
                        alt="营业执照" 
                        className="w-full h-32 object-cover rounded-lg border ${borderPrimary}"
                      />
                    </div>
                  )}
                  {selectedApplication.id_card_front && (
                    <div>
                      <p className={`text-sm ${textMuted} mb-2`}>身份证正面</p>
                      <img 
                        src={selectedApplication.id_card_front} 
                        alt="身份证正面" 
                        className="w-full h-32 object-cover rounded-lg border ${borderPrimary}"
                      />
                    </div>
                  )}
                  {selectedApplication.id_card_back && (
                    <div>
                      <p className={`text-sm ${textMuted} mb-2`}>身份证反面</p>
                      <img 
                        src={selectedApplication.id_card_back} 
                        alt="身份证反面" 
                        className="w-full h-32 object-cover rounded-lg border ${borderPrimary}"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 审核操作 */}
              {selectedApplication.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                      拒绝原因（如拒绝请填写）
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="请输入拒绝原因..."
                      rows={3}
                      className={`w-full px-3 py-2 border ${borderPrimary} rounded-lg ${bgTertiary} ${textPrimary} resize-none`}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleReject}
                      disabled={processing}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      拒绝申请
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      通过申请
                    </Button>
                  </div>
                </div>
              )}

              {/* 审核结果 */}
              {selectedApplication.status !== 'pending' && (
                <div className={`${bgSecondary} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${textMuted}`}>
                      审核时间：{new Date(selectedApplication.reviewed_at!).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                    <div className="mt-2 p-3 bg-red-500/10 rounded-lg">
                      <p className="text-sm text-red-400 mb-1">拒绝原因：</p>
                      <p className={textSecondary}>{selectedApplication.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantApplicationReview;
