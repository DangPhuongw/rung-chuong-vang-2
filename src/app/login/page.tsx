'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Shield, Sparkles, Bell, Crown, PenTool, ArrowLeft, Loader2, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegisterMode
        ? { username, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác thất bại!');
      }

      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/editor');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: '123456' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập demo thất bại!');
      }

      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/editor');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập nhanh!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md soft-card-elevated p-8 relative">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Về trang chủ</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-paper-2 border border-rule flex items-center justify-center mx-auto mb-3 shadow-sm text-accent-deep">
            {isRegisterMode ? (
              <Sparkles className="w-8 h-8 text-accent-deep" />
            ) : (
              <Bell className="w-8 h-8 fill-accent text-accent-deep" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">
            {isRegisterMode ? 'Đăng Ký Tài Khoản Editor' : 'Đăng Nhập Quản Trị'}
          </h1>
          <p className="text-xs font-medium text-muted mt-1">
            {isRegisterMode
              ? 'Tạo tài khoản để thiết kế và quản lý các bộ câu hỏi'
              : 'Dành cho Editor tạo đề thi và Admin duyệt nội dung'}
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div className="mb-6 p-4 rounded-2xl bg-paper-2 border border-rule">
          <p className="text-[11px] font-bold text-accent-deep mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-accent-deep" />
            <span>Tài khoản Demo (1-Click Thử Nghiệm)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('admin@quiz.com')}
              className="py-2.5 px-3 rounded-full bg-card hover:bg-paper-3 border border-rule text-accent-deep text-xs font-bold transition-colors text-left shadow-sm flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-accent-deep flex-shrink-0" />
              <div>
                <span className="block leading-tight">Admin Demo</span>
                <span className="block text-[10px] font-medium text-muted">admin@quiz.com</span>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('editor@quiz.com')}
              className="py-2.5 px-3 rounded-full bg-card hover:bg-paper-3 border border-rule text-ink text-xs font-bold transition-colors text-left shadow-sm flex items-center gap-2"
            >
              <PenTool className="w-4 h-4 text-muted flex-shrink-0" />
              <div>
                <span className="block leading-tight">Editor Demo</span>
                <span className="block text-[10px] font-medium text-muted">editor@quiz.com</span>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Tên hiển thị / Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: ThayGiaoToan, MasterQuiz…"
                className="w-full px-4 py-2.5 rounded-full bg-card border border-rule text-ink placeholder:text-muted text-sm font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-full bg-card border border-rule text-ink placeholder:text-muted text-sm font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-2.5 rounded-full bg-card border border-rule text-ink placeholder:text-muted text-sm font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pill-btn-primary w-full py-3.5 text-sm font-bold text-accent-ink"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý…</span>
              </>
            ) : isRegisterMode ? (
              <span>Đăng Ký Ngay</span>
            ) : (
              <span>Đăng Nhập Vào Hệ Thống</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-semibold text-muted">
          {isRegisterMode ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                }}
                className="text-accent-deep hover:underline font-bold ml-1"
              >
                Đăng nhập
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                }}
                className="text-accent-deep hover:underline font-bold ml-1"
              >
                Đăng ký Editor mới
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
