/**
 * 社群入群申请对话框组件
 * 津脉社区平台
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCommunityJoinRequests, useCommunityInviteSettings } from '@/hooks/useCommunityInvitation';
import type { ApplicationQuestion } from '@/types/community-invitation';
import { Send, Loader2, FileText } from 'lucide-react';

interface CommunityJoinRequestDialogProps {
  communityId: string;
  communityName: string;
  communityDescription?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CommunityJoinRequestDialog({
  communityId,
  communityName,
  communityDescription,
  trigger,
  onSuccess,
}: CommunityJoinRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { settings, loading: loadingSettings } = useCommunityInviteSettings(communityId);
  const { submitApplication, loading: submitting } = useCommunityJoinRequests(communityId);

  // 处理表单字段变化
  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // 处理复选框变化
  const handleCheckboxChange = useCallback((questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentValues = prev[questionId] ? prev[questionId].split(',') : [];
      let newValues: string[];
      
      if (checked) {
        newValues = [...currentValues, option];
      } else {
        newValues = currentValues.filter((v) => v !== option);
      }
      
      return { ...prev, [questionId]: newValues.join(',') };
    });
  }, []);

  // 提交申请
  const handleSubmit = useCallback(async () => {
    // 验证必填项
    if (settings?.applicationQuestions) {
      for (const question of settings.applicationQuestions) {
        if (question.required && !answers[question.id]) {
          toast.error(`请填写「${question.label}」`);
          return;
        }
      }
    }

    const request = await submitApplication({
      communityId,
      reason,
      answers,
    });

    if (request) {
      setOpen(false);
      setReason('');
      setAnswers({});
      onSuccess?.();
    }
  }, [communityId, reason, answers, settings, submitApplication, onSuccess]);

  // 渲染问题字段
  const renderQuestion = (question: ApplicationQuestion) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'text':
        return (
          <Input
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleAnswerChange(question.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || '请选择'} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const currentValues = value ? value.split(',') : [];
              const isChecked = currentValues.includes(option);
              
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(question.id, option, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`${question.id}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Send className="w-4 h-4 mr-2" />
            申请加入
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>申请加入「{communityName}」</DialogTitle>
          <DialogDescription>
            {communityDescription || '请填写以下信息提交入群申请'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 申请理由 */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              申请理由
              <span className="text-muted-foreground text-xs ml-2">（可选）</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="请简要说明您想加入这个社群的原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {reason.length}/500
              </span>
            </div>
          </div>

          {/* 自定义问题 */}
          {loadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : settings?.applicationQuestions && settings.applicationQuestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>社群申请问题</span>
              </div>
              
              {settings.applicationQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label>
                    {question.label}
                    {question.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          ) : null}

          {/* 提示信息 */}
          {settings?.requireApplicationApproval !== false && (
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              提交申请后，需要等待社群管理员审核。审核结果将通过站内消息通知您。
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              <>提交申请</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommunityJoinRequestDialog;
