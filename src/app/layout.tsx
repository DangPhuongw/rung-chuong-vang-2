import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
    <html lang="vi" className="light">
      <body className="bg-paper text-ink min-h-screen flex flex-col antialiased selection:bg-accent selection:text-ink">
        <ClientInit />
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
