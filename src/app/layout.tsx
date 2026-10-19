import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientInit from '@/components/ClientInit';

export const metadata: Metadata = {
  title: 'Đấu Trường Sinh Tồn Trí Tuệ | Quiz Battle Royale',
  description: 'Nền tảng game trắc nghiệm sinh tồn nhiều người chơi thời gian thực kết hợp cơ chế Rung Chuông Vàng kịch tính.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <ClientInit />
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Đấu Trường Sinh Tồn Trí Tuệ (Quiz Battle Royale). All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
