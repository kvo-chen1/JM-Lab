import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Users, ExternalLink, MessageSquare, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

interface CommunityInviteMessageProps {
  communityId: string;
  communityName: string;
  communityDescription?: string;
  communityAvatar?: string;
  inviterName: string;
  inviterAvatar?: string;
  message?: string;
  inviteCode: string;
  inviteLink: string;
  isCompact?: boolean;
  isInviter?: boolean; // 是否是邀请者视角
}

export function CommunityInviteMessage({
  communityId,
  communityName,
  communityDescription,
  communityAvatar,
  inviterName,
  inviterAvatar,
  message,
  inviteCode,
  inviteLink,
  isCompact = false,
  isInviter = false,
}: CommunityInviteMessageProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      toast.success('已接受邀请，欢迎加入社群！');
      setHasResponded(true);
      setTimeout(() => {
        navigate(`/community/${communityId}`);
      }, 1500);
    } catch (error) {
      toast.error('接受邀请失败');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    setHasResponded(true);
    toast.info('已拒绝邀请');
  };

  const handleClick = () => {
    navigate(`/community/${communityId}`);
  };

  if (isCompact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
          isDark
            ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 hover:border-blue-600/50'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 hover:border-blue-300 shadow-sm'
        }`}
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500">
          {communityAvatar ? (
            <img
              src={communityAvatar}
              alt={communityName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              社群邀请
            </span>
          </div>
          <h4
            className={`font-medium text-sm truncate mt-0.5 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {communityName}
          </h4>
        </div>

        <ExternalLink
          className={`w-4 h-4 flex-shrink-0 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        />
      </motion.div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}
    >
      <div
        className={`px-4 py-2.5 border-b ${
          isDark
            ? 'border-gray-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20'
            : 'border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <span
            className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {isInviter ? `你邀请 ${inviterName === '你' ? '对方' : '好友'}加入社群` : `${inviterName} 邀请你加入社群`}
          </span>
        </div>
      </div>

      <motion.div
        whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
        onClick={handleClick}
        className="p-4 cursor-pointer transition-colors"
      >
        <div className="flex gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500">
            {communityAvatar ? (
              <img
                src={communityAvatar}
                alt={communityName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-lg ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {communityName}
            </h4>
            {communityDescription && (
              <p
                className={`text-sm mt-1 line-clamp-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {communityDescription}
              </p>
            )}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isDark
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                查看社群详情
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {message && (
        <div
          className={`px-4 py-3 border-t ${
            isDark
              ? 'border-gray-700 bg-gray-800/30'
              : 'border-gray-100 bg-gray-50/50'
          }`}
        >
          <div className="flex items-start gap-2">
            <MessageSquare
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <p
              className={`text-sm italic ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              &quot;{message}&quot;
            </p>
          </div>
        </div>
      )}

      {!hasResponded && (
        <div
          className={`px-4 py-3 border-t flex gap-3 ${
            isDark
              ? 'border-gray-700 bg-gray-800/50'
              : 'border-gray-100 bg-gray-50/80'
          }`}
        >
          {isInviter ? (
            // 邀请者视角：显示撤销邀请按钮
            <button
              onClick={handleReject}
              disabled={isAccepting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${
                isDark
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <X className="w-4 h-4" />
              撤销邀请
            </button>
          ) : (
            // 被邀请者视角：显示接受/拒绝按钮
            <>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${
                  isDark
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAccepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    接受邀请
                  </>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={isAccepting}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <X className="w-4 h-4" />
                拒绝
              </button>
            </>
          )}
        </div>
      )}

      {hasResponded && (
        <div
          className={`px-4 py-3 border-t text-center text-sm ${
            isDark
              ? 'border-gray-700 bg-gray-800/50 text-gray-400'
              : 'border-gray-100 bg-gray-50/80 text-gray-500'
          }`}
        >
          已处理此邀请
        </div>
      )}
    </div>
  );
}

export default CommunityInviteMessage;
