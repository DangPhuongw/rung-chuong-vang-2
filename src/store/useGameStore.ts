import { create } from 'zustand';
import { PublicRoomState, PublicPlayer } from '../types/game';

interface GameState {
  playerToken: string;
  nickname: string;
  avatar: string;
  roomState: PublicRoomState | null;
  selectedAnswer: number | null;
  hasSubmitted: boolean;
  roundResult: {
    correctIndex: number;
    eliminatedTokens: string[];
    revivedTokens: string[];
    players: PublicPlayer[];
  } | null;
  countdownSeconds: number | null;
  tieBreakAlert: {
    reason: string;
    message: string;
  } | null;
  gameOverData: {
    winner: PublicPlayer;
    leaderboard: PublicPlayer[];
  } | null;
  initPlayer: () => void;
  setNickname: (nick: string) => void;
  setAvatar: (avatar: string) => void;
  setRoomState: (state: PublicRoomState | null) => void;
  setSelectedAnswer: (index: number) => void;
  setRoundResult: (result: any) => void;
  setCountdownSeconds: (sec: number | null) => void;
  setTieBreakAlert: (alert: { reason: string; message: string } | null) => void;
  setGameOverData: (data: any) => void;
  resetRound: () => void;
}

function getOrCreatePlayerToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('player_token');
  if (!token) {
    token = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('player_token', token);
  }
  return token;
}

export const useGameStore = create<GameState>((set) => ({
  playerToken: '',
  nickname: '',
  avatar: 'char_burger',
  roomState: null,
  selectedAnswer: null,
  hasSubmitted: false,
  roundResult: null,
  countdownSeconds: null,
  tieBreakAlert: null,
  gameOverData: null,

  initPlayer: () => {
    if (typeof window !== 'undefined') {
      const token = getOrCreatePlayerToken();
      const savedNick = localStorage.getItem('player_nickname') || '';
      const savedAvatar = localStorage.getItem('player_avatar') || 'char_burger';
      set({ playerToken: token, nickname: savedNick, avatar: savedAvatar });
    }
  },

  setNickname: (nickname: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('player_nickname', nickname);
    }
    set({ nickname });
  },

  setAvatar: (avatar: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('player_avatar', avatar);
    }
    set({ avatar });
  },

  setRoomState: (roomState) => set({ roomState }),

  setSelectedAnswer: (index) => set({ selectedAnswer: index, hasSubmitted: true }),

  setRoundResult: (roundResult) => set({ roundResult }),

  setCountdownSeconds: (countdownSeconds) => set({ countdownSeconds }),

  setTieBreakAlert: (tieBreakAlert) => set({ tieBreakAlert }),

  setGameOverData: (gameOverData) => set({ gameOverData }),

  resetRound: () =>
    set({
      selectedAnswer: null,
      hasSubmitted: false,
      roundResult: null,
      tieBreakAlert: null,
    }),
}));
