'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Shield, Bell, LogIn, LogOut, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Hide global navbar on Quiz Editor page so editor has only 1 header bar
  if (pathname?.startsWith('/editor')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rule bg-card/95 backdrop-blur-md shadow-[0_2px_12px_rgba(40,30,10,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-paper-2 border border-rule flex items-center justify-center text-accent-deep shadow-sm transition-transform group-hover:scale-105 motion-safe:transition-transform">
            <Bell className="w-5 h-5 fill-accent text-accent-deep" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wide text-ink group-hover:text-accent-deep transition-colors">
                Đấu Trường <span className="text-accent-deep">Sinh Tồn</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-paper-2 text-accent-deep border border-rule">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-muted font-medium -mt-0.5">Quiz Battle Royale & Rung Chuông Vàng</p>
          </div>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Navigation links based on role */}
              <Link
                href="/editor"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-paper-2 hover:bg-paper-3 text-ink border border-rule transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-muted" />
                <span>Quiz Editor</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-paper-2 hover:bg-paper-3 text-accent-deep border border-rule transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-accent-deep" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-2 border border-rule">
                <div className="w-6 h-6 rounded-full bg-accent text-accent-ink flex items-center justify-center text-xs font-extrabold shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-ink block leading-tight">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-muted font-bold">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-full bg-paper-2 hover:bg-rose-50 text-muted hover:text-rose-600 border border-rule hover:border-rose-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="pill-btn-primary text-xs sm:text-sm font-bold"
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
