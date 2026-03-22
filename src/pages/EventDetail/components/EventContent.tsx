import { FileText, Award, Users, BookOpen, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Event } from '@/types';

interface EventContentProps {
  event: Event;
}

interface ContentSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function ContentSection({ icon, title, children, delay = 0 }: ContentSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="text-green-500">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function EventContent({ event }: EventContentProps) {
  const renderContent = (content: string | null | undefined) => {
    if (!content) return <p className="text-gray-500">暂无内容</p>;
    
    // 简单的段落分割
    const paragraphs = content.split('\n').filter(p => p.trim());
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="text-gray-300 leading-relaxed mb-4 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  const renderRewards = (rewards: string | null | undefined) => {
    if (!rewards) return <p className="text-gray-500">暂无奖励设置</p>;
    
    const rewardItems = rewards.split('\n').filter(r => r.trim());
    return (
      <ul className="space-y-3">
        {rewardItems.map((reward, index) => {
          const match = reward.match(/^(一等奖 | 二等奖 | 三等奖 | 参与奖 | 特等奖|\d+ 等奖)[:：]?\s*(.*)/);
          if (match) {
            return (
              <li key={index} className="flex items-start gap-3">
                <Award className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-yellow-500">{match[1]}</span>
                  <span className="text-gray-300 ml-2">{match[2]}</span>
                </div>
              </li>
            );
          }
          return (
            <li key={index} className="flex items-start gap-3">
              <Award className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{reward}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderRequirements = (requirements: string | null | undefined) => {
    if (!requirements) return <p className="text-gray-500">暂无要求</p>;
    
    const reqItems = requirements.split('\n').filter(r => r.trim());
    return (
      <ul className="space-y-2">
        {reqItems.map((req, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">{req}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* 活动详情 */}
      <ContentSection
        icon={<FileText className="w-6 h-6" />}
        title="活动详情"
        delay={0.1}
      >
        {renderContent(event.description)}
      </ContentSection>

      {/* 作品要求 */}
      <ContentSection
        icon={<FileText className="w-6 h-6" />}
        title="作品要求"
        delay={0.2}
      >
        {renderRequirements(event.requirements)}
      </ContentSection>

      {/* 参与方式 */}
      <ContentSection
        icon={<Users className="w-6 h-6" />}
        title="参与方式"
        delay={0.3}
      >
        {renderContent(event.content)}
      </ContentSection>

      {/* 活动奖励 */}
      <ContentSection
        icon={<Award className="w-6 h-6" />}
        title="活动奖励"
        delay={0.4}
      >
        {renderRewards(event.rewards)}
      </ContentSection>

      {/* 活动规则 */}
      {event.tags && (
        <ContentSection
          icon={<BookOpen className="w-6 h-6" />}
          title="活动规则"
          delay={0.5}
        >
          <div className="flex flex-wrap gap-2">
            {event.tags.split(',').map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-500 border border-green-500/20"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </ContentSection>
      )}
    </div>
  );
}
