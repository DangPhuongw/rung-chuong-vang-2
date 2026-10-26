'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide global footer on Quiz Editor page so editor is completely fixed fullscreen
  if (pathname?.startsWith('/editor')) {
    return null;
  }

  return (
    <footer className="border-t border-rule bg-card/90 py-6 text-center text-xs text-muted font-medium">
      <p>© 2026 Đấu Trường Sinh Tồn Trí Tuệ (Quiz Battle Royale). All rights reserved.</p>
    </footer>
  );
}
