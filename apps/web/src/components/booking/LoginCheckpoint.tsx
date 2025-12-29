'use client';

import { Lock } from 'lucide-react';

interface LoginCheckpointProps {
    onLogin: () => void;
    onRegister: () => void;
}

export function LoginCheckpoint({ onLogin, onRegister }: LoginCheckpointProps) {
    return (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
                تسجيل الدخول للمتابعة
            </h3>
            <p className="text-gray-600 mb-6">
                لإتمام الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد
            </p>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                    onClick={onLogin}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                    تسجيل الدخول
                </button>
                <button
                    onClick={onRegister}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-primary hover:text-primary transition-colors"
                >
                    إنشاء حساب جديد
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                <span className="text-green-600">✓</span>
                سيتم حفظ اختياراتك
            </p>
        </div>
    );
}
