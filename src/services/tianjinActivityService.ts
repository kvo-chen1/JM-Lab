import apiClient from '@/lib/apiClient';

export interface Activity {
  id: string;
  title: string;
  cover: string;
  deadline: string;
  status: 'active' | 'ending_soon' | 'ended';
  description: string;
}

export interface SubmissionParams {
  activityId: string;
  workTitle: string;
  workDesc: string;
  workUrl: string;
  authorName: string;
  authorPhone: string;
}

export const tianjinActivityService = {
  async getActivities(): Promise<Activity[]> {
    try {
      const response = await fetch('/api/tianjin/activities');
      if (!response.ok) return [];
      const result = await response.json();
      return result.ok ? result.data : [];
    } catch (e) {
      console.error('Failed to fetch activities:', e);
      return [];
    }
  },

  async submitWork(params: SubmissionParams): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch('/api/tianjin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const result = await response.json();
      return { ok: result.ok, message: result.message || (result.ok ? '提交成功' : '提交失败') };
    } catch (e) {
      console.error('Failed to submit work:', e);
      return { ok: false, message: '提交失败，请稍后重试' };
    }
  }
};
