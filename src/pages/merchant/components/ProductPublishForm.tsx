/**
 * 商品发布表单组件
 * 使用腾讯云 COS 存储图片
 */
import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { uploadImage } from '@/services/storageServiceNew';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProductPublishFormProps {
  merchantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  original_price: string;
  stock: string;
  category: string;
  status: 'active' | 'inactive';
}

const CATEGORIES = [
  { value: '文创产品', label: '文创产品' },
  { value: '非遗手作', label: '非遗手作' },
  { value: '传统书画', label: '传统书画' },
  { value: '地标模型', label: '地标模型' },
  { value: '特色食品', label: '特色食品' },
  { value: '服饰配件', label: '服饰配件' },
  { value: '家居用品', label: '家居用品' },
  { value: '其他', label: '其他' },
];

const ProductPublishForm: React.FC<ProductPublishFormProps> = ({ 
  merchantId, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    original_price: '',
    stock: '',
    category: '',
    status: 'active',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('最多只能上传5张图片');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是有效的图片文件`);
          continue;
        }

        // 验证文件大小 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} 超过5MB限制`);
          continue;
        }

        // 使用 storageServiceNew 上传到腾讯云 COS
        const imageUrl = await uploadImage(file, 'products');
        uploadedUrls.push(imageUrl);
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
        toast.success(`成功上传 ${uploadedUrls.length} 张图片`);
      }
    } catch (error: any) {
      console.error('上传图片出错:', error);
      toast.error('上传图片时发生错误: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('请输入商品名称');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('请输入有效的商品价格');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('请输入有效的库存数量');
      return false;
    }
    if (!formData.category) {
      toast.error('请选择商品分类');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const productData = {
        merchant_id: merchantId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock: parseInt(formData.stock),
        category: formData.category,
        images: images,
        status: formData.status,
        sales_count: 0,
        rating: 0,
        review_count: 0,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('商品发布成功！');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('发布商品失败:', error);
      toast.error('发布商品失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* 背景遮罩 - 增强遮罩效果 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* 表单内容 - 增强阴影和边框效果 */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-[var(--border-primary)]"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">发布商品</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">填写商品信息并上传图片</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 商品图片 */}
          <div>
            <Label className="text-[var(--text-primary)] mb-2 block">
              商品图片 <span className="text-[var(--text-muted)]">(最多5张)</span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[var(--border-primary)]">
                  <img src={url} alt={`商品图片 ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[#5ba3d4] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 text-[var(--text-muted)] mb-1" />
                      <span className="text-xs text-[var(--text-muted)]">上传图片</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              支持 JPG、PNG 格式，单张图片不超过 5MB，图片将存储在腾讯云 COS
            </p>
          </div>

          {/* 商品名称 */}
          <div>
            <Label htmlFor="name" className="text-[var(--text-primary)] mb-2 block">
              商品名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="请输入商品名称"
              className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
              maxLength={100}
            />
          </div>

          {/* 商品描述 */}
          <div>
            <Label htmlFor="description" className="text-[var(--text-primary)] mb-2 block">
              商品描述
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="请输入商品描述，详细介绍商品特点、材质、尺寸等信息"
              rows={4}
              className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] resize-none"
              maxLength={2000}
            />
          </div>

          {/* 价格和库存 - 优化为并排布局 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price" className="text-[var(--text-primary)] mb-2 block text-sm">
                售价 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">¥</span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="pl-7 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] h-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="original_price" className="text-[var(--text-primary)] mb-2 block text-sm">
                原价
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">¥</span>
                <Input
                  id="original_price"
                  name="original_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.original_price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="pl-7 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] h-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stock" className="text-[var(--text-primary)] mb-2 block text-sm">
                库存 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] h-10"
              />
            </div>
          </div>

          {/* 分类和状态 - 优化为并排布局 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-[var(--text-primary)] mb-2 block text-sm">
                商品分类 <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5ba3d4]/20 focus:border-[#5ba3d4] h-10"
              >
                <option value="">请选择分类</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="status" className="text-[var(--text-primary)] mb-2 block text-sm">
                上架状态
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#5ba3d4]/20 focus:border-[#5ba3d4] h-10"
              >
                <option value="active">立即上架</option>
                <option value="inactive">暂不上架</option>
              </select>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              取消
            </Button>
            {submitting ? (
              <Button
                type="submit"
                disabled={true}
                className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white min-w-[120px]"
                loading={true}
              >
                发布中...
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white min-w-[120px]"
                icon={<CheckCircle2 className="w-4 h-4" />}
                iconPosition="left"
              >
                发布商品
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductPublishForm;
