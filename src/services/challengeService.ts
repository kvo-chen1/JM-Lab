/**
 * 创意挑战服务模块 - 提供创意挑战相关功能
 */

// 挑战状态类型
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'archived';

// 挑战作品接口
export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  title: string;
  thumbnail: string;
  description: string;
  author: string;
  date: string;
  likes: number;
  views: number;
  comments: number;
  isWinner?: boolean;
  rank?: number;
  score?: number;
  feedback?: string;
}

// 挑战接口
export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  culturalElements: string[];
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  submissions: ChallengeSubmission[];
  prizePool: string;
  rules: string[];
  requirements: string[];
  judges: string[];
  featuredImage: string;
  tags: string[];
  participants: number;
  submissionCount: number;
  isFeatured: boolean;
  creator: string;
  createdAt: string;
  updatedAt: string;
  winnerAnnounced: boolean;
  winners: { rank: number; submissionId: string; prize: string }[];
}

const CHALLENGES_KEY = 'jmzf_challenges';
const SUBMISSIONS_KEY = 'jmzf_challenge_submissions';

/**
 * 获取所有挑战
 */
export function getChallenges(): Challenge[] {
  const raw = localStorage.getItem(CHALLENGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 获取单个挑战
 */
export function getChallengeById(id: string): Challenge | undefined {
  const challenges = getChallenges();
  return challenges.find(challenge => challenge.id === id);
}

/**
 * 添加挑战
 */
export function addChallenge(challenge: Omit<Challenge, 'id' | 'submissions' | 'participants' | 'submissionCount' | 'createdAt' | 'updatedAt' | 'winnerAnnounced' | 'winners'>): Challenge {
  const newChallenge: Challenge = {
    id: `challenge-${Date.now()}`,
    submissions: [],
    participants: 0,
    submissionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    winnerAnnounced: false,
    winners: [],
    ...challenge
  };
  
  const challenges = getChallenges();
  challenges.unshift(newChallenge);
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
  
  return newChallenge;
}

/**
 * 更新挑战
 */
export function updateChallenge(id: string, updates: Partial<Challenge>): Challenge | undefined {
  const challenges = getChallenges();
  const index = challenges.findIndex(challenge => challenge.id === id);
  
  if (index !== -1) {
    challenges[index] = {
      ...challenges[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return challenges[index];
  }
  
  return undefined;
}

/**
 * 删除挑战
 */
export function deleteChallenge(id: string): boolean {
  const challenges = getChallenges();
  const newChallenges = challenges.filter(challenge => challenge.id !== id);
  
  if (newChallenges.length !== challenges.length) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(newChallenges));
    return true;
  }
  
  return false;
}

/**
 * 提交挑战作品
 */
export function submitToChallenge(challengeId: string, submission: Omit<ChallengeSubmission, 'id' | 'challengeId' | 'date' | 'likes' | 'views' | 'comments' | 'isWinner' | 'rank' | 'score' | 'feedback'>): ChallengeSubmission | undefined {
  const challenges = getChallenges();
  const challengeIndex = challenges.findIndex(challenge => challenge.id === challengeId);
  
  if (challengeIndex !== -1) {
    const newSubmission: ChallengeSubmission = {
      id: `submission-${Date.now()}`,
      challengeId,
      date: new Date().toISOString(),
      likes: 0,
      views: 0,
      comments: 0,
      ...submission
    };
    
    challenges[challengeIndex].submissions.push(newSubmission);
    challenges[challengeIndex].submissionCount = challenges[challengeIndex].submissions.length;
    
    // 更新参与者数量（去重）
    const participants = new Set(challenges[challengeIndex].submissions.map(sub => sub.author));
    challenges[challengeIndex].participants = participants.size;
    
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return newSubmission;
  }
  
  return undefined;
}

/**
 * 为挑战作品点赞
 */
export function likeSubmission(challengeId: string, submissionId: string): Challenge | undefined {
  const challenges = getChallenges();
  const challengeIndex = challenges.findIndex(challenge => challenge.id === challengeId);
  
  if (challengeIndex !== -1) {
    const submissionIndex = challenges[challengeIndex].submissions.findIndex(sub => sub.id === submissionId);
    
    if (submissionIndex !== -1) {
      challenges[challengeIndex].submissions[submissionIndex].likes += 1;
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
      return challenges[challengeIndex];
    }
  }
  
  return undefined;
}

/**
 * 宣布挑战获胜者
 */
export function announceWinners(challengeId: string, winners: { rank: number; submissionId: string; prize: string }[]): Challenge | undefined {
  const challenges = getChallenges();
  const challengeIndex = challenges.findIndex(challenge => challenge.id === challengeId);
  
  if (challengeIndex !== -1) {
    // 更新挑战状态和获胜者信息
    challenges[challengeIndex].winnerAnnounced = true;
    challenges[challengeIndex].winners = winners;
    challenges[challengeIndex].status = 'completed';
    
    // 更新获胜作品的信息
    winners.forEach(winner => {
      const submissionIndex = challenges[challengeIndex].submissions.findIndex(sub => sub.id === winner.submissionId);
      if (submissionIndex !== -1) {
        challenges[challengeIndex].submissions[submissionIndex].isWinner = true;
        challenges[challengeIndex].submissions[submissionIndex].rank = winner.rank;
      }
    });
    
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return challenges[challengeIndex];
  }
  
  return undefined;
}

/**
 * 获取活跃的挑战
 */
export function getActiveChallenges(): Challenge[] {
  const challenges = getChallenges();
  return challenges.filter(challenge => challenge.status === 'active');
}

/**
 * 获取即将开始的挑战
 */
export function getUpcomingChallenges(): Challenge[] {
  const challenges = getChallenges();
  return challenges.filter(challenge => challenge.status === 'upcoming');
}

/**
 * 获取已完成的挑战
 */
export function getCompletedChallenges(): Challenge[] {
  const challenges = getChallenges();
  return challenges.filter(challenge => challenge.status === 'completed');
}

/**
 * 根据标签获取挑战
 */
export function getChallengesByTag(tag: string): Challenge[] {
  const challenges = getChallenges();
  return challenges.filter(challenge => challenge.tags.includes(tag));
}

/**
 * 获取热门挑战（根据参与人数或提交数量）
 */
export function getPopularChallenges(limit: number = 5): Challenge[] {
  const challenges = getChallenges();
  return challenges
    .sort((a, b) => b.participants - a.participants || b.submissionCount - a.submissionCount)
    .slice(0, limit);
}

/**
 * 获取特色挑战
 */
export function getFeaturedChallenges(): Challenge[] {
  const challenges = getChallenges();
  return challenges.filter(challenge => challenge.isFeatured);
}

/**
 * 更新挑战状态（根据日期自动更新）
 */
export function updateChallengeStatuses(): void {
  const challenges = getChallenges();
  const now = new Date().toISOString();
  let updated = false;
  
  challenges.forEach(challenge => {
    if (challenge.status === 'upcoming' && now >= challenge.startDate) {
      challenge.status = 'active';
      updated = true;
    } else if (challenge.status === 'active' && now > challenge.endDate) {
      challenge.status = 'completed';
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
  }
}

// 导出服务对象
export default {
  getChallenges,
  getChallengeById,
  addChallenge,
  updateChallenge,
  deleteChallenge,
  submitToChallenge,
  likeSubmission,
  announceWinners,
  getActiveChallenges,
  getUpcomingChallenges,
  getCompletedChallenges,
  getChallengesByTag,
  getPopularChallenges,
  getFeaturedChallenges,
  updateChallengeStatuses
};
