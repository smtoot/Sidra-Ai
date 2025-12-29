'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    Shield,
    Plus,
    Loader2,
    UserX,
    Settings,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface TeamMember {
    id: string;
    email: string;
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    permissionOverrides?: { add?: string[]; remove?: string[] };
    effectivePermissions: string[];
    createdByAdmin?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
}

interface TeamConfig {
    creatableRoles: string[];
    allPermissions: string[];
    rolePermissions: Record<string, string[]>;
}

const ROLE_LABELS: Record<string, string> = {
    'SUPER_ADMIN': 'مدير النظام',
    'ADMIN': 'مسؤول',
    'MODERATOR': 'مشرف',
    'CONTENT_ADMIN': 'مسؤول المحتوى',
    'FINANCE': 'محاسب',
    'SUPPORT': 'دعم فني',
};

const ROLE_COLORS: Record<string, 'error' | 'warning' | 'success' | 'info'> = {
    'SUPER_ADMIN': 'error',
    'ADMIN': 'error',
    'MODERATOR': 'warning',
    'CONTENT_ADMIN': 'info',
    'FINANCE': 'success',
    'SUPPORT': 'info',
};

const PERMISSION_LABELS: Record<string, string> = {
    'users.view': 'عرض المستخدمين',
    'users.ban': 'حظر المستخدمين',
    'teachers.view': 'عرض المعلمين',
    'teachers.approve': 'قبول المعلمين',
    'disputes.view': 'عرض النزاعات',
    'disputes.resolve': 'حل النزاعات',
    'bookings.view': 'عرض الحجوزات',
    'bookings.cancel': 'إلغاء الحجوزات',
    'cms.manage': 'إدارة المحتوى',
    'finance.view': 'عرض المالية',
    'finance.approve': 'الموافقة على المدفوعات',
    'settings.update': 'تعديل الإعدادات',
    'admins.create': 'إنشاء مسؤولين',
    'admins.view': 'عرض المسؤولين',
};

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [config, setConfig] = useState<TeamConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Create form state
    const [formData, setFormData] = useState({
        email: '',
        phoneNumber: '',
        password: '',
        role: 'MODERATOR',
        firstName: '',
        lastName: '',
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // Permission editor state
    const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
    const [permissionChanges, setPermissionChanges] = useState<{ add: string[]; remove: string[] }>({ add: [], remove: [] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [membersData, configData] = await Promise.all([
                adminApi.getTeamMembers(),
                adminApi.getTeamConfig()
            ]);
            setMembers(membersData);
            setConfig(configData);
        } catch (err) {
            console.error('Failed to load team data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const newMember = await adminApi.createTeamMember(formData);
            setMembers(prev => [newMember, ...prev]);
            setShowCreateForm(false);
            setFormData({
                email: '',
                phoneNumber: '',
                password: '',
                role: 'MODERATOR',
                firstName: '',
                lastName: '',
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل إنشاء المستخدم');
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا المستخدم؟')) return;

        setProcessingId(id);
        try {
            await adminApi.deactivateTeamMember(id);
            setMembers(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
        } catch (err) {
            alert('فشل إلغاء التفعيل');
        } finally {
            setProcessingId(null);
        }
    };

    const startEditingPermissions = (member: TeamMember) => {
        setEditingPermissions(member.id);
        setPermissionChanges({
            add: member.permissionOverrides?.add || [],
            remove: member.permissionOverrides?.remove || [],
        });
    };

    const togglePermissionOverride = (permission: string, type: 'add' | 'remove') => {
        setPermissionChanges(prev => {
            const current = [...prev[type]];
            const idx = current.indexOf(permission);

            if (idx >= 0) {
                current.splice(idx, 1);
            } else {
                current.push(permission);
                // Remove from opposite list
                const opposite = type === 'add' ? 'remove' : 'add';
                const oppIdx = prev[opposite].indexOf(permission);
                if (oppIdx >= 0) {
                    prev[opposite].splice(oppIdx, 1);
                }
            }

            return { ...prev, [type]: current };
        });
    };

    const savePermissionChanges = async (memberId: string) => {
        setProcessingId(memberId);
        try {
            const updated = await adminApi.updateTeamMemberPermissions(memberId, permissionChanges);
            setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
            setEditingPermissions(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'فشل حفظ الصلاحيات');
        } finally {
            setProcessingId(null);
        }
    };

    const getDisplayName = (member: TeamMember) => {
        if (member.firstName) {
            return `${member.firstName} ${member.lastName || ''}`.trim();
        }
        return member.email;
    };

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            فريق الإدارة
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">إدارة المسؤولين والمشرفين وصلاحياتهم</p>
                    </div>
                    <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة عضو
                    </Button>
                </header>

                {/* Create Form */}
                {showCreateForm && (
                    <Card padding="lg">
                        <h2 className="text-lg font-semibold mb-4">إضافة عضو جديد</h2>
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="البريد الإلكتروني"
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            />
                            <Input
                                placeholder="رقم الهاتف"
                                required
                                value={formData.phoneNumber}
                                onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                            />
                            <Input
                                placeholder="كلمة المرور"
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                            />
                            <select
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
                                value={formData.role}
                                onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                            >
                                {config?.creatableRoles.map(role => (
                                    <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                                ))}
                            </select>
                            <Input
                                placeholder="الاسم الأول (اختياري)"
                                value={formData.firstName}
                                onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                            />
                            <Input
                                placeholder="الاسم الأخير (اختياري)"
                                value={formData.lastName}
                                onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                            />
                            <div className="col-span-2 flex gap-3 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                                    إلغاء
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Team List */}
                <Card padding="none">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التحميل...
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>لا يوجد أعضاء في الفريق</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow hover={false}>
                                    <TableHead>العضو</TableHead>
                                    <TableHead>الدور</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الصلاحيات</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <React.Fragment key={member.id}>
                                        <TableRow>
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{getDisplayName(member)}</p>
                                                    <p className="text-sm text-gray-500">{member.email}</p>
                                                    <p className="text-xs text-gray-400">{member.phoneNumber}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge variant={ROLE_COLORS[member.role] || 'info'} showDot={false}>
                                                    {ROLE_LABELS[member.role] || member.role}
                                                </StatusBadge>
                                            </TableCell>
                                            <TableCell>
                                                {member.isActive ? (
                                                    <StatusBadge variant="success">نشط</StatusBadge>
                                                ) : (
                                                    <StatusBadge variant="error">معطل</StatusBadge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                                                >
                                                    {member.effectivePermissions.length} صلاحية
                                                    {expandedMember === member.id ? (
                                                        <ChevronUp className="w-4 h-4 mr-1" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 mr-1" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {member.role !== 'SUPER_ADMIN' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => startEditingPermissions(member)}
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </Button>
                                                            {member.isActive && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleDeactivate(member.id)}
                                                                    disabled={processingId === member.id}
                                                                >
                                                                    <UserX className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Permissions */}
                                        {expandedMember === member.id && (
                                            <TableRow hover={false}>
                                                <TableCell colSpan={5}>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-700 mb-3">الصلاحيات الفعلية:</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {member.effectivePermissions.map(perm => (
                                                                <span
                                                                    key={perm}
                                                                    className={`text-xs px-2 py-1 rounded-full ${member.permissionOverrides?.add?.includes(perm)
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                        }`}
                                                                >
                                                                    {PERMISSION_LABELS[perm] || perm}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {member.permissionOverrides?.remove?.length ? (
                                                            <div className="mt-3">
                                                                <h4 className="font-medium text-gray-700 mb-2">صلاحيات محذوفة:</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {member.permissionOverrides.remove.map(perm => (
                                                                        <span key={perm} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                                                            {PERMISSION_LABELS[perm] || perm}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {/* Permission Editor Modal */}
                {editingPermissions && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card padding="lg" className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                            <h2 className="text-lg font-semibold mb-4">تعديل الصلاحيات</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                اختر الصلاحيات لإضافتها أو إزالتها من هذا المستخدم
                            </p>

                            <div className="space-y-3">
                                {config?.allPermissions.map(perm => {
                                    const isAdded = permissionChanges.add.includes(perm);
                                    const isRemoved = permissionChanges.remove.includes(perm);

                                    return (
                                        <div key={perm} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{PERMISSION_LABELS[perm] || perm}</span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={isAdded ? 'default' : 'outline'}
                                                    onClick={() => togglePermissionOverride(perm, 'add')}
                                                    className={isAdded ? 'bg-green-600 hover:bg-green-700' : ''}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    إضافة
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={isRemoved ? 'destructive' : 'outline'}
                                                    onClick={() => togglePermissionOverride(perm, 'remove')}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    إزالة
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <Button variant="outline" onClick={() => setEditingPermissions(null)}>
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => savePermissionChanges(editingPermissions)}
                                    disabled={processingId === editingPermissions}
                                >
                                    {processingId === editingPermissions ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'حفظ التغييرات'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
