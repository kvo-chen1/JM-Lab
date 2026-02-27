/**
 * 收到的邀请列表组件
 * 津脉社区平台
 */

import React from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReceivedInvitations } from '@/hooks/useCommunityInvitation';
import { communityInvitationService } from '@/services/communityInvitationService';
import {
  Check,
  X,
  Mail,
  Users,
  Clock,
  AlertTriangle,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ReceivedInvitations() {
  const { invitations, loading, acceptInvitation, rejectInvitation, refresh } = useReceivedInvitations();
  const [reportingInvitation, setReportingInvitation] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState('');
  const [reportDescription, setReportDescription] = React.useState('');

  const handleReport = async () => {
    if (!reportingInvitation || !reportReason) return;

    try {
      await communityInvitationService.reportInvitation(
        {
          invitationId: reportingInvitation,
          reportedUserId: '', // 需要从邀请中获取
          communityId: '', // 需要从邀请中获取
          reason: reportReason as any,
          description: reportDescription,
        },
        '' // 当前用户ID
      );
      toast.success('举报已提交，我们会尽快处理');
      setReportingInvitation(null);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      toast.error('举报失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            待处理
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            已接受
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            已拒绝
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            已过期
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const processedInvitations = invitations.filter((inv) => inv.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            收到的邀请
          </h2>
          <p className="text-sm text-muted-foreground">
            您有 {pendingInvitations.length} 个待处理的邀请
          </p>
        </div>
      </div>

      {/* 待处理邀请 */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">待处理</h3>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={invitation.community?.avatar} />
                    <AvatarFallback>
                      <Users className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">
                          {invitation.community?.name || '未知社群'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          邀请人: {invitation.inviter?.username || '未知用户'}
                        </p>
                      </div>
                      {getStatusBadge(invitation.status)}
                    </div>

                    {invitation.message && (
                      <p className="mt-2 text-sm text-muted-foreground bg-white p-2 rounded">
                        {invitation.message}
                      </p>
                    )}

                    {invitation.expiresAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        有效期至: {new Date(invitation.expiresAt).toLocaleString('zh-CN')}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => acceptInvitation(invitation.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        接受邀请
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectInvitation(invitation.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setReportingInvitation(invitation.id)}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            举报不当邀请
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 已处理邀请 */}
      {processedInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">历史记录</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {processedInvitations.map((invitation) => (
                <Card key={invitation.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={invitation.community?.avatar} />
                        <AvatarFallback>
                          <Users className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">
                              {invitation.community?.name || '未知社群'}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              邀请人: {invitation.inviter?.username || '未知用户'}
                            </p>
                          </div>
                          {getStatusBadge(invitation.status)}
                        </div>

                        {invitation.acceptedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            接受时间: {new Date(invitation.acceptedAt).toLocaleString('zh-CN')}
                          </p>
                        )}
                        {invitation.rejectedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            拒绝时间: {new Date(invitation.rejectedAt).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无收到的邀请</p>
        </div>
      )}

      {/* 举报对话框 */}
      <Dialog open={!!reportingInvitation} onOpenChange={() => setReportingInvitation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报不当邀请</DialogTitle>
            <DialogDescription>
              请选择举报原因并提供详细说明
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">举报原因</label>
              <select
                className="w-full p-2 border rounded-md"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">请选择原因</option>
                <option value="spam">垃圾信息</option>
                <option value="harassment">骚扰行为</option>
                <option value="inappropriate">不当内容</option>
                <option value="fake">虚假信息</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">详细说明</label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[100px]"
                placeholder="请详细描述您遇到的问题..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reportDescription.length}/500
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportingInvitation(null)}>
              取消
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason}
              variant="destructive"
            >
              提交举报
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReceivedInvitations;
