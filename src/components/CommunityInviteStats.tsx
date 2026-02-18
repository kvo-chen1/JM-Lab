/**
 * 社群邀请统计组件
 * 津脉社区平台
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCommunityInviteStats } from '@/hooks/useCommunityInvitation';
import {
  TrendingUp,
  Users,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface CommunityInviteStatsProps {
  communityId: string;
}

export function CommunityInviteStats({ communityId }: CommunityInviteStatsProps) {
  const { stats, loading } = useCommunityInviteStats(communityId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        加载统计数据失败
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          邀请与申请统计
        </h2>
        <p className="text-sm text-muted-foreground">
          查看社群的邀请转化率和申请通过率等数据
        </p>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalInvites}</p>
                <p className="text-xs text-muted-foreground">总邀请数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.acceptedInvites}</p>
                <p className="text-xs text-muted-foreground">已接受</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingInvites}</p>
                <p className="text-xs text-muted-foreground">待处理</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">转化率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 邀请详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-4 h-4" />
            邀请统计详情
          </CardTitle>
          <CardDescription>
            各类邀请状态的分布情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 转化率进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>邀请转化率</span>
              <span className="font-medium">{stats.conversionRate}%</span>
            </div>
            <Progress value={stats.conversionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              已接受邀请数 / 总邀请数
            </p>
          </div>

          {/* 状态分布 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">已接受</span>
                </div>
                <span className="font-medium">{stats.acceptedInvites}</span>
              </div>
              <Progress
                value={stats.totalInvites > 0 ? (stats.acceptedInvites / stats.totalInvites) * 100 : 0}
                className="h-1.5 bg-green-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">待处理</span>
                </div>
                <span className="font-medium">{stats.pendingInvites}</span>
              </div>
              <Progress
                value={stats.totalInvites > 0 ? (stats.pendingInvites / stats.totalInvites) * 100 : 0}
                className="h-1.5 bg-yellow-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">已拒绝</span>
                </div>
                <span className="font-medium">{stats.rejectedInvites}</span>
              </div>
              <Progress
                value={stats.totalInvites > 0 ? (stats.rejectedInvites / stats.totalInvites) * 100 : 0}
                className="h-1.5 bg-red-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">已过期</span>
                </div>
                <span className="font-medium">{stats.expiredInvites}</span>
              </div>
              <Progress
                value={stats.totalInvites > 0 ? (stats.expiredInvites / stats.totalInvites) * 100 : 0}
                className="h-1.5 bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 申请统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            申请统计详情
          </CardTitle>
          <CardDescription>
            入群申请的审核情况统计
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 申请通过率 */}
          {stats.totalApplications > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>申请通过率</span>
                <span className="font-medium">
                  {Math.round((stats.approvedApplications / stats.totalApplications) * 100)}%
                </span>
              </div>
              <Progress
                value={(stats.approvedApplications / stats.totalApplications) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* 申请状态分布 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">总申请数</span>
                </div>
                <span className="font-medium">{stats.totalApplications}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">已通过</span>
                </div>
                <span className="font-medium">{stats.approvedApplications}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">待审核</span>
                </div>
                <span className="font-medium">{stats.pendingApplications}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">已拒绝</span>
                </div>
                <span className="font-medium">{stats.rejectedApplications}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 增长趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            社群增长概览
          </CardTitle>
          <CardDescription>
            通过邀请和申请加入的成员统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {stats.acceptedInvites + stats.approvedApplications}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                通过邀请/申请加入
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalInvites + stats.totalApplications}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                总邀请/申请次数
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunityInviteStats;
