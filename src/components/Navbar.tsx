'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Shield, Sparkles, LogIn, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-950/60 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[2px] transition-transform group-hover:scale-105 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider bg-gradient-to-r from-amber-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                ĐẤU TRƯỜNG SINH TỒN
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Quiz Battle Royale & Rung Chuông Vàng</p>
          </div>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Navigation links based on role */}
              <Link
                href="/editor"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Quiz Editor</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-200 block leading-tight">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập / Đăng ký</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
