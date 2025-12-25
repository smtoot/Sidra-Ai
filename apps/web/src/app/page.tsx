'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (token && role) {
      if (role === 'TEACHER') {
        router.push('/teacher/sessions');
      } else if (role === 'PARENT') {
        router.push('/parent');
      } else if (role === 'ADMIN') {
        router.push('/admin/financials');
      }
    }
    setLoading(false);
  }, [router]);

  if (loading) return null; // Or a spinner

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background font-tajawal rtl">
      <div className="text-center space-y-8 p-8 max-w-2xl">
        <h1 className="text-5xl font-bold text-primary">منصة سدرة التعليمية</h1>
        <p className="text-xl text-text-subtle">
          وجهتك الأولى للدروس الخصوصية. نخبة من المعلمين المعتمدين لمساعدة أبنائك في التفوق.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="bg-white text-primary border-2 border-primary px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary/5 transition-colors"
          >
            حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
