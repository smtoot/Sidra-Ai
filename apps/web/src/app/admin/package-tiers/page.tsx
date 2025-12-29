'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface PackageTier {
  id: string;
  sessionCount: number;
  discountPercent: number;
  recurringRatio: number;
  floatingRatio: number;
  rescheduleLimit: number;
  durationWeeks: number;
  gracePeriodDays: number;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isFeatured: boolean;
  badge?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminPackageTiersPage() {
  const [tiers, setTiers] = useState<PackageTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTier, setEditingTier] = useState<PackageTier | null>(null);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllPackageTiers();
      setTiers(data);
    } catch (error) {
      console.error('Failed to load package tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (tier: PackageTier) => {
    try {
      await adminApi.updatePackageTier(tier.id, { isActive: !tier.isActive });
      await loadTiers();
    } catch (error) {
      console.error('Failed to toggle tier status:', error);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذه الباقة؟')) return;

    try {
      await adminApi.deletePackageTier(tierId);
      await loadTiers();
    } catch (error) {
      console.error('Failed to delete tier:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans rtl" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة الباقات الذكية</h1>
          <p className="text-gray-600 mt-1">إعداد وتخصيص مستويات الباقات الذكية</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          إنشاء باقة
        </button>
      </div>

      {/* Tiers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الترتيب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                عدد الحصص
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الخصم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                التقسيم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                المدة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                مميزة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tiers.map((tier) => {
              const recurringCount = Math.round(tier.sessionCount * tier.recurringRatio);
              const floatingCount = tier.sessionCount - recurringCount;

              return (
                <tr key={tier.id} className={!tier.isActive ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tier.displayOrder}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {tier.nameAr || tier.nameEn || `${tier.sessionCount} حصص`}
                    </div>
                    {tier.nameEn && tier.nameAr && (
                      <div className="text-sm text-gray-500">{tier.nameEn}</div>
                    )}
                    {tier.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {tier.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tier.sessionCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tier.discountPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{recurringCount} متكررة</div>
                    <div className="text-gray-500">{floatingCount} مرنة</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{tier.durationWeeks} أسبوع</div>
                    <div className="text-gray-500">+{tier.gracePeriodDays} يوم إضافي</div>
                  </td>
                  <td className="px-6 py-4">
                    {tier.isFeatured ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(tier)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        tier.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tier.isActive ? 'نشط' : 'غير نشط'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTier(tier)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTier) && (
        <TierFormModal
          tier={editingTier}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTier(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTier(null);
            loadTiers();
          }}
        />
      )}
    </div>
  );
}

interface TierFormModalProps {
  tier: PackageTier | null;
  onClose: () => void;
  onSuccess: () => void;
}

function TierFormModal({ tier, onClose, onSuccess }: TierFormModalProps) {
  const [formData, setFormData] = useState({
    sessionCount: tier?.sessionCount || 10,
    discountPercent: tier?.discountPercent || 10,
    recurringRatio: tier?.recurringRatio || 0.8,
    floatingRatio: tier?.floatingRatio || 0.2,
    rescheduleLimit: tier?.rescheduleLimit || 2,
    durationWeeks: tier?.durationWeeks || 6,
    gracePeriodDays: tier?.gracePeriodDays || 14,
    nameAr: tier?.nameAr || '',
    nameEn: tier?.nameEn || '',
    descriptionAr: tier?.descriptionAr || '',
    descriptionEn: tier?.descriptionEn || '',
    isFeatured: tier?.isFeatured || false,
    badge: tier?.badge || '',
    displayOrder: tier?.displayOrder || 999,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const recurringCount = Math.round(formData.sessionCount * formData.recurringRatio);
  const floatingCount = formData.sessionCount - recurringCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate ratios
    if (Math.abs((formData.recurringRatio + formData.floatingRatio) - 1.0) > 0.001) {
      setError('مجموع نسبة الحصص المتكررة والمرنة يجب أن يساوي 1.0');
      return;
    }

    try {
      setSubmitting(true);
      if (tier) {
        await adminApi.updatePackageTier(tier.id, formData);
      } else {
        await adminApi.createPackageTier(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الباقة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {tier ? 'تعديل باقة' : 'إنشاء باقة جديدة'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الحصص
              </label>
              <input
                type="number"
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) })}
                min="1"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الخصم (%)
              </label>
              <input
                type="number"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Session Split */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الحصص المتكررة
              </label>
              <input
                type="number"
                value={formData.recurringRatio}
                onChange={(e) => {
                  const recurring = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    recurringRatio: recurring,
                    floatingRatio: parseFloat((1 - recurring).toFixed(2))
                  });
                }}
                min="0"
                max="1"
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                = {recurringCount} حصة متكررة
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الحصص المرنة
              </label>
              <input
                type="number"
                value={formData.floatingRatio}
                onChange={(e) => {
                  const floating = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    floatingRatio: floating,
                    recurringRatio: parseFloat((1 - floating).toFixed(2))
                  });
                }}
                min="0"
                max="1"
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                = {floatingCount} حصة مرنة
              </p>
            </div>
          </div>

          {/* Duration Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المدة (أسابيع)
              </label>
              <input
                type="number"
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                min="1"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                فترة السماح (أيام)
              </label>
              <input
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) })}
                min="0"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حد إعادة الجدولة
              </label>
              <input
                type="number"
                value={formData.rescheduleLimit}
                onChange={(e) => setFormData({ ...formData, rescheduleLimit: parseInt(e.target.value) })}
                min="0"
                max="10"
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم (عربي)
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم (إنجليزي)
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                dir="ltr"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف (عربي)
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف (إنجليزي)
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                dir="ltr"
              />
            </div>
          </div>

          {/* Marketing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ترتيب العرض
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                min="0"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الشارة
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="الأكثر طلباً"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">باقة مميزة</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : tier ? 'تحديث الباقة' : 'إنشاء الباقة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
