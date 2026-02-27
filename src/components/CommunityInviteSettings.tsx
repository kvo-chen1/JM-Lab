/**
 * 社群邀请设置组件
 * 津脉社区平台
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCommunityInviteSettings } from '@/hooks/useCommunityInvitation';
import type { ApplicationQuestion } from '@/types/community-invitation';
import {
  Settings,
  Users,
  Shield,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
} from 'lucide-react';

interface CommunityInviteSettingsProps {
  communityId: string;
}

const QUESTION_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '下拉选择' },
  { value: 'checkbox', label: '多选框' },
];

export function CommunityInviteSettings({ communityId }: CommunityInviteSettingsProps) {
  const { settings, loading, updateSettings } = useCommunityInviteSettings(communityId);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // 添加问题
  const addQuestion = useCallback(() => {
    const newQuestion: ApplicationQuestion = {
      id: `q-${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  }, []);

  // 更新问题
  const updateQuestion = useCallback((id: string, updates: Partial<ApplicationQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  // 删除问题
  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // 添加选项
  const addOption = useCallback((questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    );
  }, []);

  // 更新选项
  const updateOption = useCallback((questionId: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.map((opt, i) => (i === index ? value : opt)),
            }
          : q
      )
    );
  }, []);

  // 删除选项
  const removeOption = useCallback((questionId: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options?.filter((_, i) => i !== index) }
          : q
      )
    );
  }, []);

  // 保存设置
  const handleSave = useCallback(async () => {
    if (!settings) return;

    const success = await updateSettings({
      allowMemberInvite: settings.allowMemberInvite,
      requireAdminApproval: settings.requireAdminApproval,
      requireApplicationApproval: settings.requireApplicationApproval,
      maxInvitesPerDay: settings.maxInvitesPerDay,
      maxInvitesPerBatch: settings.maxInvitesPerBatch,
      inviteExpireHours: settings.inviteExpireHours,
      applicationQuestions: questions,
      welcomeMessage: settings.welcomeMessage,
    });

    if (success) {
      setIsEditing(false);
    }
  }, [settings, questions, updateSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        加载设置失败
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            邀请与申请设置
          </h2>
          <p className="text-sm text-muted-foreground">
            配置社群的邀请规则和入群申请流程
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存设置
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            编辑设置
          </Button>
        )}
      </div>

      {/* 邀请设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            邀请设置
          </CardTitle>
          <CardDescription>
            配置成员邀请相关的规则和限制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>允许成员邀请</Label>
              <p className="text-sm text-muted-foreground">
                普通成员是否可以邀请其他用户加入社群
              </p>
            </div>
            <Switch
              checked={settings.allowMemberInvite}
              onCheckedChange={(checked) =>
                updateSettings({ allowMemberInvite: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>邀请需管理员审核</Label>
              <p className="text-sm text-muted-foreground">
                成员发送的邀请是否需要管理员审核
              </p>
            </div>
            <Switch
              checked={settings.requireAdminApproval}
              onCheckedChange={(checked) =>
                updateSettings({ requireAdminApproval: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>每日邀请上限</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.maxInvitesPerDay}
                onChange={(e) =>
                  updateSettings({ maxInvitesPerDay: parseInt(e.target.value) || 10 })
                }
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">每人每天最多邀请数</p>
            </div>

            <div className="space-y-2">
              <Label>单次批量上限</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={settings.maxInvitesPerBatch}
                onChange={(e) =>
                  updateSettings({ maxInvitesPerBatch: parseInt(e.target.value) || 20 })
                }
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">单次最多邀请人数</p>
            </div>

            <div className="space-y-2">
              <Label>邀请有效期</Label>
              <Select
                value={settings.inviteExpireHours.toString()}
                onValueChange={(value) =>
                  updateSettings({ inviteExpireHours: parseInt(value) })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">1天</SelectItem>
                  <SelectItem value="72">3天</SelectItem>
                  <SelectItem value="168">7天</SelectItem>
                  <SelectItem value="336">14天</SelectItem>
                  <SelectItem value="720">30天</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">邀请链接有效期</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 申请设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            申请设置
          </CardTitle>
          <CardDescription>
            配置入群申请的审核流程和表单
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>入群申请需审核</Label>
              <p className="text-sm text-muted-foreground">
                关闭后，用户申请将自动通过
              </p>
            </div>
            <Switch
              checked={settings.requireApplicationApproval}
              onCheckedChange={(checked) =>
                updateSettings({ requireApplicationApproval: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>欢迎消息</Label>
            <Textarea
              placeholder="用户加入社群后看到的欢迎消息..."
              value={settings.welcomeMessage || ''}
              onChange={(e) =>
                updateSettings({ welcomeMessage: e.target.value })
              }
              disabled={!isEditing}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              新成员加入时自动发送的欢迎消息（{settings.welcomeMessage?.length || 0}/500）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 申请表单设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            申请表单
          </CardTitle>
          <CardDescription>
            自定义入群申请表单的问题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 border rounded-lg space-y-4"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">问题 {index + 1}</span>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>问题类型</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) =>
                      updateQuestion(question.id, { type: value as any })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>是否必填</Label>
                  <div className="flex items-center h-10">
                    <Switch
                      checked={question.required}
                      onCheckedChange={(checked) =>
                        updateQuestion(question.id, { required: checked })
                      }
                      disabled={!isEditing}
                    />
                    <span className="ml-2 text-sm">
                      {question.required ? '必填' : '选填'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>问题标题</Label>
                <Input
                  placeholder="请输入问题标题"
                  value={question.label}
                  onChange={(e) =>
                    updateQuestion(question.id, { label: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>提示文字</Label>
                <Input
                  placeholder="请输入提示文字（可选）"
                  value={question.placeholder || ''}
                  onChange={(e) =>
                    updateQuestion(question.id, { placeholder: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>

              {(question.type === 'select' || question.type === 'checkbox') && (
                <div className="space-y-2">
                  <Label>选项</Label>
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <Input
                          placeholder={`选项 ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) =>
                            updateOption(question.id, optionIndex, e.target.value)
                          }
                          disabled={!isEditing}
                        />
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(question.id, optionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加选项
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <Button variant="outline" className="w-full" onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              添加问题
            </Button>
          )}

          {questions.length === 0 && !isEditing && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂未设置申请表单问题</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunityInviteSettings;
