/**
 * 收货地址管理页面
 * 支持添加、编辑、删除、设置默认地址
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Phone,
  User,
  Trash2,
  Edit2,
  Check,
  X,
  Home,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// 收货地址类型
interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zip_code?: string;
  is_default: boolean;
  tag?: 'home' | 'work' | 'other';
  created_at: string;
  updated_at: string;
}

// 地址表单数据
interface AddressFormData {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zip_code: string;
  is_default: boolean;
  tag: 'home' | 'work' | 'other';
}

const initialFormData: AddressFormData = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  zip_code: '',
  is_default: false,
  tag: 'home',
};

// 省份数据（简化版）
const provinces = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区',
];

const AddressManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // 获取地址列表
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // 表不存在的情况
        if (error.code === '42P01') {
          setAddresses([]);
          return;
        }
        throw error;
      }
      setAddresses(data || []);
    } catch (err: any) {
      toast.error('获取地址列表失败：' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // 打开添加表单
  const handleAdd = () => {
    setEditingAddress(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  // 打开编辑表单
  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      address: address.address,
      zip_code: address.zip_code || '',
      is_default: address.is_default,
      tag: address.tag || 'home',
    });
    setShowForm(true);
  };

  // 删除地址
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('地址已删除');
    } catch (err: any) {
      toast.error('删除失败：' + err.message);
    }
  };

  // 设置默认地址
  const handleSetDefault = async (id: string) => {
    try {
      // 先取消所有默认地址
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // 设置当前为默认
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setAddresses(addresses.map(a => ({
        ...a,
        is_default: a.id === id,
      })));
      toast.success('默认地址已设置');
    } catch (err: any) {
      toast.error('设置失败：' + err.message);
    }
  };

  // 保存地址
  const handleSave = async () => {
    // 验证表单
    if (!formData.name.trim()) {
      toast.error('请输入收货人姓名');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('请输入联系电话');
      return;
    }
    if (!formData.province || !formData.city || !formData.district) {
      toast.error('请选择完整的省市区');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('请输入详细地址');
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        // 更新地址
        const { error } = await supabase
          .from('user_addresses')
          .update({
            name: formData.name,
            phone: formData.phone,
            province: formData.province,
            city: formData.city,
            district: formData.district,
            address: formData.address,
            zip_code: formData.zip_code || null,
            is_default: formData.is_default,
            tag: formData.tag,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id);

        if (error) {
          if (error.code === '42P01') {
            toast.error('数据库表未创建，请联系管理员');
            return;
          }
          throw error;
        }

        // 如果设置为默认，取消其他默认地址
        if (formData.is_default) {
          await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user?.id)
            .neq('id', editingAddress.id);
        }

        toast.success('地址已更新');
      } else {
        // 添加新地址
        const { data, error } = await supabase
          .from('user_addresses')
          .insert({
            user_id: user?.id,
            name: formData.name,
            phone: formData.phone,
            province: formData.province,
            city: formData.city,
            district: formData.district,
            address: formData.address,
            zip_code: formData.zip_code || null,
            is_default: formData.is_default || addresses.length === 0,
            tag: formData.tag,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') {
            toast.error('数据库表未创建，请联系管理员');
            return;
          }
          throw error;
        }

        // 如果设置为默认，取消其他默认地址
        if (formData.is_default && addresses.length > 0) {
          await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user?.id)
            .neq('id', data.id);
        }

        toast.success('地址已添加');
      }

      setShowForm(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error('保存失败：' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 获取标签图标
  const getTagIcon = (tag?: string) => {
    switch (tag) {
      case 'home':
        return <Home className="w-3 h-3" />;
      case 'work':
        return <Building2 className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };

  // 获取标签文字
  const getTagLabel = (tag?: string) => {
    switch (tag) {
      case 'home':
        return '家';
      case 'work':
        return '公司';
      default:
        return '其他';
    }
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-6">登录后管理您的收货地址</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">收货地址</h1>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新建地址
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-500">加载中...</span>
          </div>
        ) : addresses.length === 0 ? (
          // 空状态
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无收货地址</h3>
            <p className="text-slate-500 mb-6">添加一个收货地址，方便购物时快速选择</p>
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              添加地址
            </button>
          </div>
        ) : (
          // 地址列表
          <div className="space-y-4">
            <AnimatePresence>
              {addresses.map((address, index) => (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl border ${
                    address.is_default ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'
                  } p-5`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-slate-900">{address.name}</span>
                        <span className="text-slate-500">{address.phone}</span>
                        {address.is_default && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            默认
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {getTagIcon(address.tag)}
                          {getTagLabel(address.tag)}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        {address.province} {address.city} {address.district}
                      </p>
                      <p className="text-slate-600 mt-1">{address.address}</p>
                      {address.zip_code && (
                        <p className="text-slate-400 text-sm mt-1">邮编：{address.zip_code}</p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          设为默认
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 添加/编辑地址表单弹窗 */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            {/* 表单 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingAddress ? '编辑地址' : '新建地址'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* 表单内容 - 可滚动区域 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* 收货人姓名 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      收货人姓名
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="请输入收货人姓名"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* 联系电话 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      联系电话
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="请输入联系电话"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* 省市区 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      所在地区
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">省</option>
                        {provinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="市"
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="区"
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* 详细地址 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      详细地址
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="请输入街道、门牌号等详细地址"
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* 邮编 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      邮政编码（选填）
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="请输入邮政编码"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* 地址标签 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      地址标签
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'home', label: '家', icon: Home },
                        { value: 'work', label: '公司', icon: Building2 },
                        { value: 'other', label: '其他', icon: MapPin },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setFormData({ ...formData, tag: value as any })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            formData.tag === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 设为默认 */}
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">设为默认收货地址</span>
                  </label>
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-3 p-6 border-t border-slate-100 bg-white flex-shrink-0">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressManagementPage;
