import { useState, useEffect, useContext, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/contexts/authContext';
import { brandShowcaseService, BrandShowcase, BrandShowcaseRequest } from '@/services/brandShowcaseService';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { uploadImage } from '@/services/imageService';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Award,
  Image as ImageIcon,
  Video,
  Link,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  History,
  Package,
  Palette,
  ExternalLink,
} from 'lucide-react';

// 表单字段类型
interface FormData {
  brand_id: string;
  brand_name: string;
  brand_logo: string;
  brand_cover: string;
  brand_slogan: string;
  brand_value: string;
  brand_story: string;
  brand_history: string;
  brand_culture: string;
  brand_products: string;
  brand_achievements: string[];
  brand_gallery: string[];
  brand_video: string;
  brand_website: string;
  brand_social: {
    weibo: string;
    wechat: string;
    douyin: string;
    xiaohongshu: string;
  };
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
  is_published: boolean;
}

// 初始表单数据
const initialFormData: FormData = {
  brand_id: '',
  brand_name: '',
  brand_logo: '',
  brand_cover: '',
  brand_slogan: '',
  brand_value: '',
  brand_story: '',
  brand_history: '',
  brand_culture: '',
  brand_products: '',
  brand_achievements: [],
  brand_gallery: [],
  brand_video: '',
  brand_website: '',
  brand_social: {
    weibo: '',
    wechat: '',
    douyin: '',
    xiaohongshu: '',
  },
  contact_info: {
    phone: '',
    email: '',
    address: '',
  },
  is_published: false,
};

// 品牌选择器组件
const BrandSelector = ({
  brands,
  selectedBrand,
  onSelect,
  isDark,
}: {
  brands: BrandPartnership[];
  selectedBrand: BrandPartnership | null;
  onSelect: (brand: BrandPartnership) => void;
  isDark: boolean;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {brands.map((brand) => (
        <motion.button
          key={brand.id}
          onClick={() => onSelect(brand)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            p-4 rounded-xl border-2 transition-all text-left
            ${selectedBrand?.id === brand.id
              ? isDark
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-blue-500 bg-blue-50'
              : isDark
                ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }
          `}
        >
          <img
            src={brand.brand_logo}
            alt={brand.brand_name}
            className="w-12 h-12 rounded-lg object-cover mb-3"
          />
          <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {brand.brand_name}
          </h4>
          <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {brand.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
};

// 图片上传组件
const ImageUploader = ({
  value,
  onChange,
  label,
  isDark,
  aspectRatio = 'square',
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  isDark: boolean;
  aspectRatio?: 'square' | 'wide' | 'portrait';
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success('上传成功');
    } catch (error) {
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div
        className={`
          relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden border-2 border-dashed
          ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}
          ${value ? '' : 'hover:border-blue-500'}
          transition-colors
        `}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Upload className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
              <button
                onClick={() => onChange('')}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>点击上传</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
          </label>
        )}
      </div>
    </div>
  );
};

// 多图片上传组件
const GalleryUploader = ({
  images,
  onChange,
  isDark,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  isDark: boolean;
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadImage(file)));
      onChange([...images, ...urls]);
      toast.success(`成功上传 ${urls.length} 张图片`);
    } catch (error) {
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        品牌图库 ({images.length} 张)
      </label>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label
          className={`
            aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer
            ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'}
            transition-colors
          `}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className={`w-6 h-6 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>添加</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};

// 成就列表组件
const AchievementList = ({
  achievements,
  onChange,
  isDark,
}: {
  achievements: string[];
  onChange: (achievements: string[]) => void;
  isDark: boolean;
}) => {
  const [newAchievement, setNewAchievement] = useState('');

  const addAchievement = () => {
    if (newAchievement.trim()) {
      onChange([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    onChange(achievements.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        荣誉成就
      </label>
      <div className="space-y-2">
        {achievements.map((achievement, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              flex items-center gap-2 p-3 rounded-lg
              ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}
            `}
          >
            <Award className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            <span className={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{achievement}</span>
            <button
              onClick={() => removeAchievement(index)}
              className={`p-1 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
            placeholder="添加荣誉成就..."
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
            `}
          />
          <button
            onClick={addAchievement}
            disabled={!newAchievement.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 编辑器组件
const ShowcaseEditor = ({
  formData,
  onChange,
  isDark,
}: {
  formData: FormData;
  onChange: (data: FormData) => void;
  isDark: boolean;
}) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'story' | 'contact'>('basic');

  const sections = [
    { id: 'basic', label: '基本信息', icon: Building2 },
    { id: 'story', label: '品牌故事', icon: History },
    { id: 'contact', label: '联系方式', icon: Phone },
  ];

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    onChange({ ...formData, [field]: value });
  };

  const updateNestedField = <K extends keyof FormData>(
    parent: K,
    field: string,
    value: string
  ) => {
    onChange({
      ...formData,
      [parent]: {
        ...(formData[parent] as Record<string, string>),
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 分段导航 */}
      <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center
              ${activeSection === section.id
                ? isDark
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* 基本信息 */}
      {activeSection === 'basic' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              value={formData.brand_logo}
              onChange={(url) => updateField('brand_logo', url)}
              label="品牌 Logo *"
              isDark={isDark}
              aspectRatio="square"
            />
            <ImageUploader
              value={formData.brand_cover}
              onChange={(url) => updateField('brand_cover', url)}
              label="品牌封面图"
              isDark={isDark}
              aspectRatio="wide"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              品牌名称 *
            </label>
            <input
              type="text"
              value={formData.brand_name}
              onChange={(e) => updateField('brand_name', e.target.value)}
              placeholder="请输入品牌名称"
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              品牌标语
            </label>
            <input
              type="text"
              value={formData.brand_slogan}
              onChange={(e) => updateField('brand_slogan', e.target.value)}
              placeholder="简短有力的品牌口号"
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <GalleryUploader
            images={formData.brand_gallery}
            onChange={(images) => updateField('brand_gallery', images)}
            isDark={isDark}
          />

          <AchievementList
            achievements={formData.brand_achievements}
            onChange={(achievements) => updateField('brand_achievements', achievements)}
            isDark={isDark}
          />
        </motion.div>
      )}

      {/* 品牌故事 */}
      {activeSection === 'story' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              品牌价值
            </label>
            <textarea
              value={formData.brand_value}
              onChange={(e) => updateField('brand_value', e.target.value)}
              placeholder="描述品牌的核心价值观和使命..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-xl border resize-none
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              品牌故事
            </label>
            <textarea
              value={formData.brand_story}
              onChange={(e) => updateField('brand_story', e.target.value)}
              placeholder="讲述品牌的创立故事和发展历程..."
              rows={6}
              className={`
                w-full px-4 py-3 rounded-xl border resize-none
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              发展历程
            </label>
            <textarea
              value={formData.brand_history}
              onChange={(e) => updateField('brand_history', e.target.value)}
              placeholder="按时间线记录品牌的重要里程碑..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-xl border resize-none
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              品牌文化
            </label>
            <textarea
              value={formData.brand_culture}
              onChange={(e) => updateField('brand_culture', e.target.value)}
              placeholder="描述品牌的企业文化和精神内涵..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-xl border resize-none
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              产品服务
            </label>
            <textarea
              value={formData.brand_products}
              onChange={(e) => updateField('brand_products', e.target.value)}
              placeholder="介绍品牌的主要产品和服务..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-xl border resize-none
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>
        </motion.div>
      )}

      {/* 联系方式 */}
      {activeSection === 'contact' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Globe className="w-4 h-4 inline mr-2" />
              官方网站
            </label>
            <input
              type="url"
              value={formData.brand_website}
              onChange={(e) => updateField('brand_website', e.target.value)}
              placeholder="https://www.example.com"
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="w-4 h-4 inline mr-2" />
                联系电话
              </label>
              <input
                type="tel"
                value={formData.contact_info.phone}
                onChange={(e) => updateNestedField('contact_info', 'phone', e.target.value)}
                placeholder="请输入联系电话"
                className={`
                  w-full px-4 py-3 rounded-xl border
                  ${isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="w-4 h-4 inline mr-2" />
                电子邮箱
              </label>
              <input
                type="email"
                value={formData.contact_info.email}
                onChange={(e) => updateNestedField('contact_info', 'email', e.target.value)}
                placeholder="请输入电子邮箱"
                className={`
                  w-full px-4 py-3 rounded-xl border
                  ${isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                `}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <MapPin className="w-4 h-4 inline mr-2" />
              公司地址
            </label>
            <input
              type="text"
              value={formData.contact_info.address}
              onChange={(e) => updateNestedField('contact_info', 'address', e.target.value)}
              placeholder="请输入公司地址"
              className={`
                w-full px-4 py-3 rounded-xl border
                ${isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              `}
            />
          </div>

          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              社交媒体
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>微博</label>
                <input
                  type="text"
                  value={formData.brand_social.weibo}
                  onChange={(e) => updateNestedField('brand_social', 'weibo', e.target.value)}
                  placeholder="微博账号"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  `}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>微信公众号</label>
                <input
                  type="text"
                  value={formData.brand_social.wechat}
                  onChange={(e) => updateNestedField('brand_social', 'wechat', e.target.value)}
                  placeholder="微信公众号"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  `}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>抖音</label>
                <input
                  type="text"
                  value={formData.brand_social.douyin}
                  onChange={(e) => updateNestedField('brand_social', 'douyin', e.target.value)}
                  placeholder="抖音号"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  `}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>小红书</label>
                <input
                  type="text"
                  value={formData.brand_social.xiaohongshu}
                  onChange={(e) => updateNestedField('brand_social', 'xiaohongshu', e.target.value)}
                  placeholder="小红书号"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                  `}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function BrandShowcaseManager() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [userBrands, setUserBrands] = useState<BrandPartnership[]>([]);
  const [myShowcases, setMyShowcases] = useState<BrandShowcase[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandPartnership | null>(null);
  const [editingShowcase, setEditingShowcase] = useState<BrandShowcase | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 计算还可以创建展示的品牌（每个品牌只能有一个展示）
  const availableBrands = userBrands.filter(
    brand => !myShowcases.some(showcase => showcase.brand_id === brand.id)
  );

  useEffect(() => {
    // 直接使用 AuthContext 中的 user
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 使用 AuthContext 中的 user
      if (!user) {
        console.warn('用户未登录，无法加载品牌数据');
        toast.error('请先登录');
        setDebugInfo('未登录');
        return;
      }

      const debugLines: string[] = [];
      debugLines.push(`用户ID: ${user.id}`);
      debugLines.push(`用户邮箱: ${user.email || '无'}`);

      // 直接从服务获取品牌数据（优先从 Supabase，会自动同步到 LocalStorage）
      let brands: BrandPartnership[] = await brandPartnershipService.getMyPartnerships({
        id: user.id,
        email: user.email
      });

      debugLines.push(`从服务获取: ${brands.length} 个品牌`);

      // 显示所有品牌及其状态
      brands.forEach((b, i) => {
        debugLines.push(`  品牌${i+1}: ${b.brand_name}, status=${b.status}, id=${b.id?.slice(0,8)}...`);
      });

      // 如果没有从服务获取到，尝试从 LocalStorage 读取
      if (brands.length === 0) {
        const localData = localStorage.getItem('jmzf_brand_partnerships');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            brands = parsed.filter((p: BrandPartnership) =>
              p.applicant_id === user.id ||
              p.contact_email === user.email
            );
            debugLines.push(`从 LocalStorage 获取: ${brands.length} 个`);
          } catch (e) {
            debugLines.push(`LocalStorage 解析失败: ${e}`);
          }
        }
      }

      debugLines.push(`所有品牌状态: ${brands.map(b => b.status).join(', ') || '无'}`);
      const approvedBrands = brands.filter((b) => b.status === 'approved');
      debugLines.push(`已审核品牌: ${approvedBrands.length} 个`);

      setDebugInfo(debugLines.join('\n'));
      setUserBrands(approvedBrands);

      // 获取已有的品牌展示
      const showcases = await brandShowcaseService.getMyShowcases(user.id);
      setMyShowcases(showcases);
    } catch (error) {
      console.error('加载数据失败:', error);
      setDebugInfo(`错误: ${error}`);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (userBrands.length === 0) {
      toast.error('您还没有通过审核的品牌，请先申请品牌入驻');
      return;
    }
    if (availableBrands.length === 0) {
      toast.error('您的所有品牌都已创建展示，请编辑现有展示');
      return;
    }
    setEditingShowcase(null);
    setFormData(initialFormData);
    setSelectedBrand(null);
    setShowEditor(true);
    setActiveTab('create');
  };

  const handleEdit = (showcase: BrandShowcase) => {
    setEditingShowcase(showcase);
    setFormData({
      brand_id: showcase.brand_id,
      brand_name: showcase.brand_name,
      brand_logo: showcase.brand_logo,
      brand_cover: showcase.brand_cover || '',
      brand_slogan: showcase.brand_slogan || '',
      brand_value: showcase.brand_value || '',
      brand_story: showcase.brand_story || '',
      brand_history: showcase.brand_history || '',
      brand_culture: showcase.brand_culture || '',
      brand_products: showcase.brand_products || '',
      brand_achievements: showcase.brand_achievements || [],
      brand_gallery: showcase.brand_gallery || [],
      brand_video: showcase.brand_video || '',
      brand_website: showcase.brand_website || '',
      brand_social: showcase.brand_social || {
        weibo: '',
        wechat: '',
        douyin: '',
        xiaohongshu: '',
      },
      contact_info: showcase.contact_info || {
        phone: '',
        email: '',
        address: '',
      },
      is_published: showcase.is_published,
    });
    const brand = userBrands.find((b) => b.id === showcase.brand_id);
    setSelectedBrand(brand || null);
    setShowEditor(true);
    setActiveTab('create');
  };

  const handleSave = async (publish = false) => {
    if (!formData.brand_name || !formData.brand_logo) {
      toast.error('请填写品牌名称并上传Logo');
      return;
    }

    setIsSaving(true);
    try {
      const data: BrandShowcaseRequest = {
        ...formData,
        is_published: publish,
      };

      console.log('保存品牌展示数据:', data);
      console.log('当前用户ID:', user?.id);

      const result = await brandShowcaseService.saveShowcase(data, user?.id);
      console.log('保存结果:', result);

      if (result) {
        toast.success(publish ? '发布成功' : '保存成功');
        await loadData();
        setShowEditor(false);
        setActiveTab('list');
      } else {
        toast.error('保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (showcase: BrandShowcase) => {
    const result = await brandShowcaseService.togglePublish(showcase.id, !showcase.is_published);
    if (result) {
      toast.success(showcase.is_published ? '已取消发布' : '发布成功');
      await loadData();
    } else {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (showcase: BrandShowcase) => {
    if (!confirm('确定要删除这个品牌展示吗？此操作不可恢复。')) return;

    const result = await brandShowcaseService.deleteShowcase(showcase.id);
    if (result) {
      toast.success('删除成功');
      await loadData();
    } else {
      toast.error('删除失败');
    }
  };

  const handleSelectBrand = (brand: BrandPartnership) => {
    setSelectedBrand(brand);
    setFormData({
      ...formData,
      brand_id: brand.id,
      brand_name: brand.brand_name,
      brand_logo: brand.brand_logo,
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 头部 */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                品牌展示管理
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                创建和管理您的品牌展示页面，向用户展示品牌魅力
                {!isLoading && userBrands.length > 0 && (
                  <span className="ml-2 text-green-500">
                    (您有 {userBrands.length} 个已通过审核的品牌)
                  </span>
                )}
                {!isLoading && userBrands.length === 0 && (
                  <span className="ml-2 text-amber-500">
                    (您还没有通过审核的品牌)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              disabled={userBrands.length === 0 || availableBrands.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
              新建展示
            </button>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => {
                setActiveTab('list');
                setShowEditor(false);
              }}
              className={`
                py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'list'
                  ? isDark
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              我的展示
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`
                py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'create'
                  ? isDark
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {editingShowcase ? '编辑展示' : '新建展示'}
            </button>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'list' ? (
          /* 展示列表 */
          myShowcases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myShowcases.map((showcase) => (
                <motion.div
                  key={showcase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    rounded-2xl overflow-hidden border
                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                  `}
                >
                  {/* 封面 */}
                  <div className="relative h-40">
                    <img
                      src={showcase.brand_cover || showcase.brand_logo}
                      alt={showcase.brand_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <img
                        src={showcase.brand_logo}
                        alt={showcase.brand_name}
                        className="w-12 h-12 rounded-xl border-2 border-white"
                      />
                      <div>
                        <h3 className="text-white font-bold">{showcase.brand_name}</h3>
                        <span
                          className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${showcase.is_published
                              ? 'bg-green-500/80 text-white'
                              : 'bg-gray-500/80 text-white'
                            }
                          `}
                        >
                          {showcase.is_published ? '已发布' : '草稿'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        <Eye className="w-4 h-4 inline mr-1" />
                        {showcase.view_count || 0} 浏览
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        更新于 {new Date(showcase.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(showcase)}
                        className={`
                          flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm
                          ${isDark
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          transition-colors
                        `}
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleTogglePublish(showcase)}
                        className={`
                          flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm
                          ${showcase.is_published
                            ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                            : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}
                          transition-colors
                        `}
                      >
                        {showcase.is_published ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            取消发布
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            发布
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(showcase)}
                        className={`
                          px-3 py-2 rounded-lg text-sm
                          ${isDark
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'}
                          transition-colors
                        `}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div
                className={`
                  w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center
                  ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                `}
              >
                <Building2 className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                暂无品牌展示
              </h3>
              <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                创建您的第一个品牌展示页面，向用户展示品牌魅力
              </p>
              {userBrands.length === 0 && (
                <p className={`mb-6 text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  您还没有通过审核的品牌，请先申请品牌入驻
                </p>
              )}
              <button
                onClick={handleCreateNew}
                disabled={userBrands.length === 0}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                立即创建
              </button>
              {userBrands.length === 0 && (
                <button
                  onClick={() => {
                    const data = localStorage.getItem('jmzf_brand_partnerships');
                    console.log('LocalStorage 品牌数据:', data);
                    alert('请在控制台查看 LocalStorage 数据');
                  }}
                  className={`ml-4 px-4 py-3 text-sm underline ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  调试：查看本地数据
                </button>
              )}
            </div>
          )
        ) : (
          /* 编辑器 */
          <div className="max-w-4xl mx-auto">
            {!selectedBrand && availableBrands.length > 0 && !editingShowcase && (
              <div className="mb-8">
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  选择要展示的品牌
                </h3>
                <BrandSelector
                  brands={availableBrands}
                  selectedBrand={selectedBrand}
                  onSelect={handleSelectBrand}
                  isDark={isDark}
                />
              </div>
            )}

            {(selectedBrand || editingShowcase) && (
              <>
                <ShowcaseEditor formData={formData} onChange={setFormData} isDark={isDark} />

                {/* 操作按钮 */}
                <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
                      ${isDark
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      disabled:opacity-50 transition-colors
                    `}
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? '保存中...' : '保存草稿'}
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
                      bg-blue-500 text-white hover:bg-blue-600
                      disabled:opacity-50 transition-colors
                    `}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {isSaving ? '发布中...' : '发布展示'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
