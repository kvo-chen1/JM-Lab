import { useEffect, useState, useCallback, useRef } from 'react';
import { getPredictionService, BehaviorType, BehaviorPrediction, UserProfile } from '../services/predictionService';
import { useAgentStore } from './useAgentStore';

/**
 * 用户行为预测 Hook
 * 基于历史行为预测用户需求
 */
export function usePrediction() {
  const predictionServiceRef = useRef(getPredictionService());
  const { currentAgent, messages, currentTask } = useAgentStore();
  
  const [prediction, setPrediction] = useState<BehaviorPrediction | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 记录行为
  const recordBehavior = useCallback((type: BehaviorType, context?: Record<string, any>) => {
    predictionServiceRef.current.recordBehavior(type, {
      agent: currentAgent,
      taskType: currentTask?.type,
      ...context
    });
  }, [currentAgent, currentTask]);

  // 获取预测
  const refreshPrediction = useCallback(async () => {
    setIsLoading(true);
    try {
      const newPrediction = await predictionServiceRef.current.predictNextBehavior();
      setPrediction(newPrediction);
    } catch (error) {
      console.error('[usePrediction] Failed to get prediction:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户画像
  const refreshUserProfile = useCallback(async () => {
    try {
      const profile = await predictionServiceRef.current.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('[usePrediction] Failed to get user profile:', error);
    }
  }, []);

  // 自动记录消息发送行为
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        recordBehavior(BehaviorType.MESSAGE_SEND, {
          content: lastMessage.content,
          messageType: lastMessage.type
        });
      }
    }
  }, [messages, recordBehavior]);

  // 定期刷新预测
  useEffect(() => {
    refreshPrediction();
    refreshUserProfile();

    const interval = setInterval(() => {
      refreshPrediction();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [refreshPrediction, refreshUserProfile]);

  return {
    prediction,
    userProfile,
    isLoading,
    recordBehavior,
    refreshPrediction,
    refreshUserProfile
  };
}

export default usePrediction;
