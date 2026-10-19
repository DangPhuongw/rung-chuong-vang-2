'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Shield, Sparkles, LogIn, UserPlus, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

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
      <div className="w-full max-w-md rounded-2xl glass-panel-glow p-8 relative border-indigo-500/30">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            {isRegisterMode ? <UserPlus className="w-6 h-6 text-white" /> : <LogIn className="w-6 h-6 text-white" />}
          </div>
          <h1 className="text-2xl font-black text-white">
            {isRegisterMode ? 'Đăng Ký Tài Khoản Editor' : 'Đăng Nhập Quản Trị'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegisterMode
              ? 'Tạo tài khoản để thiết kế và quản lý các bộ câu hỏi'
              : 'Dành cho Editor tạo đề thi và Admin duyệt nội dung'}
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Tài khoản Demo (1-Click Test)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('admin@quiz.com')}
              className="py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all text-left"
            >
              👑 Admin Demo
              <span className="block text-[10px] font-normal text-amber-400/70">admin@quiz.com</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('editor@quiz.com')}
              className="py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all text-left"
            >
              ✍️ Editor Demo
              <span className="block text-[10px] font-normal text-indigo-400/70">editor@quiz.com</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tên hiển thị / Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: ThayGiaoToan, MasterQuiz..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : isRegisterMode ? (
              <span>Đăng Ký Ngay</span>
            ) : (
              <span>Đăng Nhập</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegisterMode ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1"
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
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1"
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
