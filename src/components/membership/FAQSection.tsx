import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  isDark: boolean;
}

const FAQSection: React.FC<FAQSectionProps> = ({ isDark }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: '如何升级会员？',
      answer: '您可以在会员中心选择想要的会员套餐，点击"立即升级"按钮，完成支付后即可升级。支持支付宝、微信支付等多种支付方式。'
    },
    {
      id: 'faq-2',
      question: '会员到期后会自动续费吗？',
      answer: '目前不会自动续费，到期前7天我们会通过邮件和站内信提醒您手动续费。您也可以在会员设置中开启自动续费功能。'
    },
    {
      id: 'faq-3',
      question: '可以退款吗？',
      answer: '会员购买后7天内可以申请退款，超过7天不支持退款。退款将按照剩余会员天数比例计算，退款将在3-5个工作日内原路返回。'
    },
    {
      id: 'faq-4',
      question: '如何使用会员权益？',
      answer: '升级会员后，您可以直接使用所有会员权益，无需额外操作。部分高级功能可能需要刷新页面后才能生效。'
    },
    {
      id: 'faq-5',
      question: '可以降级会员吗？',
      answer: '可以。您可以在会员到期后选择不续费，系统会自动降级为免费会员。当前会员周期内不支持主动降级。'
    },
    {
      id: 'faq-6',
      question: '商业授权是什么意思？',
      answer: 'VIP会员享有商业授权，可以将AI生成的作品用于商业用途，包括广告、产品设计、出版物等，无需额外支付版权费用。'
    }
  ];

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          常见问题
        </h3>
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm
          ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}
        `}>
          <HelpCircle size={16} />
          <span>{faqs.length} 个问题</span>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              rounded-2xl border overflow-hidden transition-all duration-200
              ${openId === faq.id
                ? isDark
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-white border-gray-200 shadow-md'
                : isDark
                  ? 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                  : 'bg-white/50 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${openId === faq.id
                    ? isDark
                      ? 'bg-indigo-500/20'
                      : 'bg-indigo-100'
                    : isDark
                      ? 'bg-slate-800'
                      : 'bg-gray-100'
                  }
                `}>
                  <HelpCircle
                    size={16}
                    className={openId === faq.id ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-gray-500'}
                  />
                </div>
                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                  {faq.question}
                </span>
              </div>
              <motion.div
                animate={{ rotate: openId === faq.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${openId === faq.id
                    ? isDark
                      ? 'bg-indigo-500/20'
                      : 'bg-indigo-100'
                    : isDark
                      ? 'bg-slate-800'
                      : 'bg-gray-100'
                  }
                `}
              >
                <ChevronDown
                  size={18}
                  className={openId === faq.id ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-gray-500'}
                />
              </motion.div>
            </button>

            <AnimatePresence>
              {openId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`
                    px-5 pb-5 pt-0
                    ${isDark ? 'text-slate-400' : 'text-gray-600'}
                  `}>
                    <div className={`
                      pl-11 pt-2 border-t
                      ${isDark ? 'border-slate-700/50' : 'border-gray-100'}
                    `}>
                      <p className="text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* 联系支持 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`
          mt-8 p-6 rounded-2xl border
          ${isDark
            ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30'
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
          }
        `}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}
          `}>
            <MessageCircle size={20} className="text-indigo-500" />
          </div>
          <div>
            <h4 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
              还有其他问题？
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              我们的客服团队随时为您服务
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
              ${isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <Mail size={16} />
            <span>邮件咨询</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
              ${isDark
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }
            `}
          >
            <Phone size={16} />
            <span>电话联系</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQSection;
