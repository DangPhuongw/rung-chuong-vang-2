'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';

export default function ClientInit() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const initPlayer = useGameStore((s) => s.initPlayer);

  useEffect(() => {
    initAuth();
    initPlayer();
  }, [initAuth, initPlayer]);

  return null;
}
