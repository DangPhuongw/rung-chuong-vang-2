'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/useGameStore';
import { PublicRoomState, PublicPlayer } from '@/types/game';
import { lobbyAudio } from '@/lib/lobbyAudio';
import CartoonAvatar, { CARTOON_AVATAR_LIST } from '@/components/CartoonAvatar';
import {
  Crown,
  Heart,
  Skull,
  Clock,
  Flame,
  Copy,
  Check,
  Play,
  RotateCcw,
  Home,
  Users,
  ShieldAlert,
  Loader2,
  Trophy,
  ArrowRight,
  Send,
  MessageCircle,
  X,
  Target,
  Award,
  Bell,
  HeartCrack,
  Bot,
  User,
  Trash2,
  Eye,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderName: string;
  avatar: string;
  text: string;
  time: string;
  isHost?: boolean;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = (params?.roomId as string) || '';
  const roomId = rawRoomId.toUpperCase();

  const { playerToken, nickname, setNickname, avatar, setAvatar } = useGameStore();

  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState('');

  // Nickname entry modal if joining via direct link without nickname
  const [needNicknameModal, setNeedNicknameModal] = useState(false);
  const [inputNickname, setInputNickname] = useState(nickname || '');

  // Interaction states
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  // Life tracking states
  const [lifeLostAlert, setLifeLostAlert] = useState(false);
  const prevLivesRef = useRef<number>(3);
  const lifeLostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedAnswerRef = useRef<number | null>(null);

  // Edit Character Modal
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editNickname, setEditNickname] = useState(nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(avatar || 'char_burger');

  // Realtime room chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'system-init',
      senderName: 'Hệ thống',
      avatar: 'char_owl',
      text: 'Chào mừng bạn đến với Đấu Trường! Hãy chuẩn bị và thi đấu hết mình nhé.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Countdown timer for question
  const [timerSeconds, setTimerSeconds] = useState<number>(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Round Result data
  const [roundResult, setRoundResult] = useState<{
    correctIndex: number;
    eliminatedTokens: string[];
    revivedTokens: string[];
    players: PublicPlayer[];
  } | null>(null);

  // Starting countdown (3..2..1)
  const [startingCountdown, setStartingCountdown] = useState<number | null>(null);

  // Tie break alert state
  const [tieBreakAlert, setTieBreakAlert] = useState<{
    reason: string;
    message: string;
  } | null>(null);

  // Game over data
  const [gameOverData, setGameOverData] = useState<{
    winner: PublicPlayer | null;
    leaderboard: PublicPlayer[];
  } | null>(null);

  const socket = getSocket();
  const prevPlayerCountRef = useRef<number>(0);

  // Format PIN code with space (e.g. 791 541)
  const formatRoomPin = (code: string) => {
    if (!code) return '';
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    return code;
  };

  // Socket connection & events setup
  useEffect(() => {
    if (!roomId) return;

    let token = playerToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('player_token') || '';
    }

    const currentNick =
      nickname ||
      (typeof window !== 'undefined' ? localStorage.getItem('player_nickname') || '' : '');
    const currentAvatar =
      avatar ||
      (typeof window !== 'undefined' ? localStorage.getItem('player_avatar') || 'char_burger' : 'char_burger');

    if (!currentNick) {
      setNeedNicknameModal(true);
      setLoadingRoom(false);
      return;
    }

    joinRoom(token, currentNick, currentAvatar);

    // Socket Event Listeners
    socket.on('room_state_sync', (state: PublicRoomState) => {
      setRoomState(state);
      setLoadingRoom(false);

      // Play chime when new player joins lobby
      if (state.state === 'LOBBY' && state.players) {
        if (prevPlayerCountRef.current > 0 && state.players.length > prevPlayerCountRef.current) {
          lobbyAudio.playJoinSound();
        }
        prevPlayerCountRef.current = state.players.length;
      }

      // Sync current player's lives ref
      const currentMe = state.players?.find((p) => p.playerToken === token);
      if (currentMe) {
        prevLivesRef.current = currentMe.lives;
      }
      if (state.state === 'LOBBY') {
        prevLivesRef.current = 3;
        if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
        setLifeLostAlert(false);
      }

      if (state.state === 'GAME_OVER' && state.winner) {
        setGameOverData({
          winner: state.winner,
          leaderboard: state.players,
        });
      }
    });

    socket.on('new_chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-40), msg]);
    });

    socket.on('game_countdown', (data: { seconds: number }) => {
      setStartingCountdown(data.seconds);
      setRoundResult(null);
      setTieBreakAlert(null);
      setGameOverData(null);
      selectedAnswerRef.current = null;
      setSelectedAnswerIndex(null);
      setHasSubmitted(false);
      prevLivesRef.current = 3;
      if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
      setLifeLostAlert(false);

      let count = data.seconds;
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setStartingCountdown(null);
        } else {
          setStartingCountdown(count);
        }
      }, 1000);
    });

    socket.on('new_question', (data: any) => {
      setStartingCountdown(null);
      setRoundResult(null);
      setTieBreakAlert(null);
      selectedAnswerRef.current = null;
      setSelectedAnswerIndex(null);
      setHasSubmitted(false);
      if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
      setLifeLostAlert(false);

      const limit = data.question?.timeLimit || 15;
      setTimerSeconds(limit);

      if (timerRef.current) clearInterval(timerRef.current);
      let sec = limit;
      timerRef.current = setInterval(() => {
        sec -= 1;
        if (sec <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerSeconds(0);
        } else {
          setTimerSeconds(sec);
        }
      }, 1000);
    });

    socket.on('round_result', (data: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRoundResult(data);

      // Current player status before and after this round
      const myResultPlayer = data.players?.find((p: any) => p.playerToken === token);
      const prevLives = prevLivesRef.current;
      const newLives = myResultPlayer ? myResultPlayer.lives : 0;
      const wasAlive = prevLives > 0;

      // Update ref to new lives for next comparison
      prevLivesRef.current = newLives;

      // If user was ALREADY a spectator before this round resolved, do NOT alert or buzz!
      if (!wasAlive) {
        if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
        setLifeLostAlert(false);
        return;
      }

      // Check current user's answer vs correctIndex
      const myAns = selectedAnswerRef.current;
      const isCorrect = myAns !== null && myAns === data.correctIndex;

      if (isCorrect) {
        lobbyAudio.playCorrectSound();
        if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
        setLifeLostAlert(false);
      } else {
        // Player was alive in this round and just lost a life!
        lobbyAudio.playWrongSound();
        if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
        setLifeLostAlert(true);
        lifeLostTimeoutRef.current = setTimeout(() => {
          setLifeLostAlert(false);
        }, 4000);
      }
    });

    socket.on('tie_break_activated', (data: { reason: string; message: string }) => {
      setTieBreakAlert(data);
      setRoundResult(null);
      if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
      setLifeLostAlert(false);
    });

    socket.on('game_over', (data: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (lifeLostTimeoutRef.current) clearTimeout(lifeLostTimeoutRef.current);
      setLifeLostAlert(false);
      setGameOverData(data);

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFC107', '#FFB300', '#10B981', '#3B82F6', '#F43F5E'],
        });
      } catch (e) {
        // Confetti fallback
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('room_state_sync');
      socket.off('new_chat_message');
      socket.off('game_countdown');
      socket.off('new_question');
      socket.off('round_result');
      socket.off('tie_break_activated');
      socket.off('game_over');
    };
  }, [roomId, playerToken, nickname]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/room/${roomId}`);
    }
  }, [roomId]);

  const joinRoom = (token: string, nick: string, userAvatar?: string) => {
    setLoadingRoom(true);
    setRoomError('');

    socket.emit(
      'join_room',
      { roomId, nickname: nick, playerToken: token, avatar: userAvatar || avatar || 'char_burger' },
      (res: { success: boolean; roomState?: PublicRoomState; error?: string }) => {
        setLoadingRoom(false);
        if (res.success && res.roomState) {
          setRoomState(res.roomState);
        } else {
          setRoomError(res.error || 'Không thể vào phòng này!');
        }
      }
    );
  };

  const handleModalJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNickname.trim()) return;

    const cleanNick = inputNickname.trim();
    setNickname(cleanNick);
    setNeedNicknameModal(false);

    let token = playerToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('player_token') || '';
      if (!token) {
        token = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem('player_token', token);
      }
    }
    joinRoom(token, cleanNick, avatar);
  };

  const handleStartGame = () => {
    if (!roomState) return;
    lobbyAudio.playClickSound();
    socket.emit('start_game', { roomId, playerToken });
  };

  const handleSubmitAnswer = (answerIndex: number) => {
    if (hasSubmitted || !roomState || roomState.state !== 'QUESTION_ACTIVE') return;

    const me = roomState.players.find((p) => p.playerToken === playerToken);
    if (!me || me.status !== 'ALIVE') return;

    lobbyAudio.playClickSound();
    selectedAnswerRef.current = answerIndex;
    setSelectedAnswerIndex(answerIndex);
    setHasSubmitted(true);

    socket.emit('submit_answer', {
      roomId,
      playerToken,
      answerIndex,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const me = roomState?.players.find((p) => p.playerToken === playerToken);
    socket.emit('send_chat_message', {
      roomId,
      nickname: me?.nickname || nickname || 'Đấu thủ',
      avatar: me?.avatar || avatar || 'char_burger',
      text: chatInput.trim(),
      isHost: me?.isHost || false,
    });
    setChatInput('');
  };

  const handleCopyInviteLink = () => {
    const url = joinUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    lobbyAudio.playClickSound();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRoomId = () => {
    if (!roomState?.roomId) return;
    navigator.clipboard.writeText(roomState.roomId);
    setCopiedRoomId(true);
    lobbyAudio.playClickSound();
    setTimeout(() => setCopiedRoomId(false), 2500);
  };

  const handlePlayAgain = () => {
    socket.emit('reset_room', { roomId, playerToken });
  };

  // Add Bot (Chế độ thử nghiệm test game)
  const handleAddBot = (count: number = 1) => {
    socket.emit('add_bot', { roomId, playerToken, count });
    lobbyAudio.playClickSound();
  };

  // Remove single Bot
  const handleRemoveBot = (botToken: string) => {
    socket.emit('remove_bot', { roomId, playerToken, botToken });
    lobbyAudio.playClickSound();
  };

  // Clear all Bots
  const handleClearBots = () => {
    socket.emit('clear_bots', { roomId, playerToken });
    lobbyAudio.playClickSound();
  };

  // Open Edit Character Modal
  const handleOpenEditCharacter = () => {
    setEditNickname(me?.nickname || nickname || '');
    setSelectedAvatar(me?.avatar || avatar || 'char_burger');
    setShowCharacterModal(true);
  };

  // Save Character Changes
  const handleSaveCharacter = () => {
    const cleanNick = editNickname.trim();
    if (!cleanNick) return;

    setNickname(cleanNick);
    setAvatar(selectedAvatar);

    socket.emit('update_player', {
      roomId,
      playerToken,
      nickname: cleanNick,
      avatar: selectedAvatar,
    });

    setShowCharacterModal(false);
  };

  // Find current user's player object
  const me = roomState?.players.find((p) => p.playerToken === playerToken);
  const isHost = me?.isHost || false;
  const isSpectator = me?.status === 'ELIMINATED';
  const myLives = me ? me.lives : 3;

  // Render Hearts helper
  const renderHearts = (lives: number, status: string) => {
    if (status === 'ELIMINATED') {
      return (
        <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
          <Skull className="w-3.5 h-3.5" />
          <span>Hết mạng</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map((heart) => (
          <Heart
            key={heart}
            className={`w-3.5 h-3.5 ${
              heart <= lives
                ? 'fill-rose-500 text-rose-500 drop-shadow-sm'
                : 'fill-slate-200 text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 1. MODAL: Enter Nickname if needed
  if (needNicknameModal) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md soft-card-elevated p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-paper-2 border border-rule flex items-center justify-center mx-auto text-accent-deep shadow-sm">
            <Bell className="w-8 h-8 fill-accent text-accent-deep" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink">Đấu Trường Sinh Tồn</h2>
          <p className="text-xs text-muted font-medium">
            Nhập biệt danh để tiến vào phòng thi đấu <b className="text-accent-deep">#{roomId}</b>
          </p>

          <form onSubmit={handleModalJoin} className="space-y-4 pt-2">
            <input
              type="text"
              autoFocus
              required
              maxLength={24}
              value={inputNickname}
              onChange={(e) => setInputNickname(e.target.value)}
              placeholder="Nhập Nickname của bạn…"
              className="w-full px-4 py-3 rounded-full bg-card border border-rule text-ink placeholder:text-muted text-sm font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
            />
            <button
              type="submit"
              className="pill-btn-primary w-full py-3.5 text-sm font-bold text-accent-ink"
            >
              <span>Vào Đấu Trường Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOADING STATE
  if (loadingRoom) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-muted font-bold">
        <Loader2 className="w-10 h-10 animate-spin text-accent-deep" />
        <p className="text-sm">Đang kết nối vào phòng #{roomId}…</p>
      </div>
    );
  }

  // 3. ERROR STATE
  if (roomError || !roomState) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md soft-card p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-extrabold text-ink mb-2">Không Thể Vào Phòng</h2>
          <p className="text-xs text-muted mb-6 font-medium">{roomError || 'Phòng không tồn tại hoặc đã bị hủy.'}</p>
          <Link
            href="/"
            className="pill-btn-secondary inline-flex text-xs font-bold"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Hình Chính</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 2: STARTING COUNTDOWN ====================
  if (roomState.state === 'STARTING' || startingCountdown !== null) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <p className="text-sm font-extrabold text-accent-deep animate-pulse">
            Đấu trường chuẩn bị mở ra
          </p>
          {/* Gamified Score Badge Countdown from Reference Image */}
          <div className="gamified-badge-circle w-36 h-36 mx-auto">
            <span className="text-7xl font-extrabold text-ink leading-none num">
              {startingCountdown ?? 3}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink">Sẵn Sàng Chiến Đấu!</h2>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 3: TIE-BREAK ALERT ====================
  if (roomState.state === 'TIE_BREAK_ALERT' || tieBreakAlert) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-2xl soft-card-elevated border-2 border-rose-300 bg-card p-8 sm:p-12 text-center space-y-6 shadow-md">
          <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-sm animate-pulse">
            <Flame className="w-10 h-10 fill-rose-500 text-rose-500" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
            Kích Hoạt Tie-Break Sinh Tử!
          </h2>

          <p className="text-base sm:text-lg text-ink font-bold leading-relaxed px-4">
            {tieBreakAlert?.message || 'Bước vào loạt đấu súng phụ để tìm ra nhà vô địch!'}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 text-xs text-rose-600 font-bold">
            <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Câu hỏi Tie-Break tiếp theo sẽ bắt đầu sau giây lát…</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 4: GAME OVER ====================
  if (roomState.state === 'GAME_OVER' || gameOverData) {
    const winner = gameOverData?.winner || roomState.winner;
    const leaderboard = gameOverData?.leaderboard || roomState.players;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-in zoom-in-95 duration-300">
        {/* Winner Hero Card */}
        <div className="soft-card-elevated border-2 border-accent p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="abstract-blob w-96 h-96 bg-accent/20 -top-20 -right-20" />

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-paper-2 border border-rule text-accent-deep text-xs font-bold mb-4">
            <Trophy className="w-4 h-4 text-accent-deep" />
            <span>Chiến binh sinh tồn cuối cùng</span>
          </div>

          <div className="relative inline-block mb-4">
            <Crown className="w-10 h-10 text-accent-deep absolute -top-7 left-1/2 -translate-x-1/2 drop-shadow-sm" />
            <div className="flex items-center justify-center">
              <CartoonAvatar
                avatarId={winner?.avatar}
                nickname={winner?.nickname || ''}
                size={96}
                isHost={winner?.isHost}
                showArchedName={false}
                showCheckmark={false}
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mb-1">
            {winner?.nickname || 'Nhà Vô Địch'}
          </h1>
          <p className="text-xs text-muted font-medium mb-6">
            Đã vượt qua tất cả các đối thủ để chạm tay vào Chiếc Chuông Vàng!
          </p>

          {/* Gamified Score Highlight */}
          <div className="gamified-badge-circle w-28 h-28 mx-auto mb-8">
            <span className="text-2xl font-extrabold text-ink num leading-none">
              {winner?.score ?? 0}
            </span>
            <span className="text-xs font-bold text-muted mt-1">điểm tổng</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isHost && (
              <button
                onClick={handlePlayAgain}
                className="pill-btn-primary text-xs sm:text-sm font-bold text-accent-ink"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại Trận Mới (Reset Room)</span>
              </button>
            )}
            <Link
              href="/"
              className="pill-btn-secondary text-xs sm:text-sm font-bold text-ink"
            >
              <Home className="w-4 h-4 text-muted" />
              <span>Về Trang Chủ</span>
            </Link>
          </div>
        </div>

        {/* Final Leaderboard */}
        <div className="soft-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-deep" />
            <span>Bảng Xếp Hạng Chung Cuộc</span>
          </h2>

          <div className="divide-y divide-rule">
            {leaderboard.map((p, idx) => (
              <div
                key={p.playerToken}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-accent text-accent-ink'
                        : idx === 1
                        ? 'bg-paper-3 text-ink'
                        : idx === 2
                        ? 'bg-paper-2 text-accent-deep border border-rule'
                        : 'bg-paper text-muted'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <CartoonAvatar
                    avatarId={p.avatar}
                    nickname=""
                    size={36}
                    showArchedName={false}
                    showCheckmark={false}
                  />
                  <div>
                    <span className="font-bold text-sm text-ink block">{p.nickname}</span>
                    <span className="text-[11px] text-muted font-medium">
                      {p.status === 'ALIVE' ? 'Sống sót' : `Loại ở vòng ${p.eliminatedAtRound || 1}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>{renderHearts(p.lives, p.status)}</div>
                  <span className="text-xs font-bold text-accent-deep num">
                    {p.score} điểm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 1: LOBBY (PHÒNG CHỜ) ====================
  const isLobby = roomState.state === 'LOBBY';

  if (isLobby) {
    const playerCount = roomState.players.length;
    const maxCapacity = 300;
    const hasBots = roomState.players.some((p) => p.isBot);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
        {/* Lobby Hero Card */}
        <div className="soft-card-elevated p-8 sm:p-10 text-center relative overflow-hidden space-y-6">
          <div className="abstract-blob w-80 h-80 bg-accent/20 -top-20 -right-20" />

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-paper-2 border border-rule text-accent-deep text-xs font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Phòng chờ đang mở</span>
          </div>

          {/* Quiz Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Bộ Câu Hỏi: <span className="text-accent-deep">{roomState.quizTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium mt-1">
              Mời người chơi quét mã QR hoặc nhập mã PIN bên dưới để tham gia đấu trường
            </p>
          </div>

          {/* PIN & QR Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto items-center p-5 rounded-3xl bg-paper-2 border border-rule">
            {/* PIN Code Box */}
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold text-muted block">
                Mã phòng thi đấu (PIN):
              </span>
              <div className="p-3.5 rounded-2xl bg-card border-2 border-accent flex items-center justify-between shadow-sm">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-widest text-accent-deep num">
                  {formatRoomPin(roomState.roomId)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  title="Sao chép mã PIN"
                  className="p-2 rounded-full hover:bg-paper-2 text-muted hover:text-accent-deep transition-colors"
                >
                  {copiedRoomId ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted font-medium">
                Website: <span className="font-bold text-ink">{typeof window !== 'undefined' ? window.location.host : ''}</span>
              </p>
            </div>

            {/* QR Code Box */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-2xl bg-card border border-rule shadow-sm">
                <QRCodeSVG
                  value={joinUrl || (typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : '')}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[11px] text-muted font-medium mt-1.5">
                Quét mã để tham gia
              </span>
            </div>
          </div>

          {/* Action Row: Copy Link & Player Counter */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              onClick={handleCopyInviteLink}
              className="pill-btn-secondary text-xs font-bold shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép link mời!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted" />
                  <span>Sao chép link mời bạn bè</span>
                </>
              )}
            </button>

            {/* PLAYER COUNTER BANNER */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-paper-2 border border-rule text-accent-deep font-bold text-xs sm:text-sm shadow-sm">
              <Users className="w-4 h-4 text-accent-deep" />
              <span>Đã tham gia: <b className="text-base font-extrabold num">{playerCount}</b> / {maxCapacity} người chơi</span>
            </div>
          </div>
        </div>

        {/* TEST FEATURE: ADD BOT TOOLBAR */}
        {isHost && (
          <div className="p-4 sm:p-5 rounded-3xl bg-paper-2 border-2 border-dashed border-rule flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-card border border-rule flex items-center justify-center text-accent-deep shadow-sm">
                <Bot className="w-5 h-5 text-accent-deep" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-ink">Chế độ thử nghiệm: Thêm Bot Test Game</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper border border-rule text-accent-deep font-bold">
                    Demo Test
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-0.5">
                  Thêm bot giả lập vào hàng đợi để kiểm tra cơ chế thi đấu, trả lời câu hỏi, trừ mạng và loại trực tiếp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddBot(1)}
                className="px-4 py-2 rounded-full bg-card hover:bg-paper-3 border border-rule text-accent-deep text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>+ 1 Bot</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBot(5)}
                className="pill-btn-primary py-2 px-4 text-xs font-bold text-accent-ink flex items-center gap-1.5"
              >
                <span>+ 5 Bot</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBot(10)}
                className="pill-btn-primary py-2 px-4 text-xs font-bold text-accent-ink flex items-center gap-1.5"
              >
                <span>+ 10 Bot</span>
              </button>

              {hasBots && (
                <button
                  type="button"
                  onClick={handleClearBots}
                  className="px-3.5 py-2 rounded-full bg-card hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xóa hết Bot</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Players List Card */}
        <div className="soft-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-rule pb-4">
            <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-deep" />
              <span>Danh Sách Người Chơi ({playerCount} người)</span>
            </h2>

            <button
              onClick={handleOpenEditCharacter}
              className="pill-btn-secondary text-xs font-bold py-2 px-4 shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-muted" />
              <span>Đổi nhân vật / Avatar</span>
            </button>
          </div>

          {/* Player Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {roomState.players.map((p) => {
              const isCurrentMe = p.playerToken === playerToken;
              return (
                <div
                  key={p.playerToken}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-colors relative group ${
                    isCurrentMe
                      ? 'bg-paper-2 ring-2 ring-accent/30'
                      : p.isBot
                      ? 'bg-paper'
                      : 'bg-paper-2/60'
                  }`}
                >
                  {/* If host and this is a bot, allow quick delete */}
                  {isHost && p.isBot && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBot(p.playerToken)}
                      title="Xóa Bot này"
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-card/90 hover:bg-rose-500 hover:text-white border border-rule flex items-center justify-center text-[10px] text-muted transition-colors opacity-70 group-hover:opacity-100 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <CartoonAvatar
                    avatarId={p.avatar}
                    nickname={p.nickname}
                    isHost={p.isHost}
                    isMe={isCurrentMe}
                    size={72}
                    showArchedName={false}
                    showCheckmark={true}
                  />

                  <div className="w-full">
                    <span className="font-bold text-xs sm:text-sm text-ink block truncate">
                      {p.nickname}
                    </span>
                    {p.isHost ? (
                      <span className="text-[10px] font-bold text-accent-deep flex items-center justify-center gap-1 mt-0.5">
                        <Crown className="w-3 h-3 text-accent-deep" />
                        <span>Chủ phòng</span>
                      </span>
                    ) : p.isBot ? (
                      <span className="text-[10px] text-accent-deep bg-paper-2 px-2 py-0.5 rounded-full border border-rule font-bold inline-flex items-center gap-1 mt-0.5">
                        <Bot className="w-3 h-3" />
                        <span>Bot Test</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        ✓ Đã sẵn sàng
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {playerCount === 1 && (
            <p className="text-center text-xs text-muted font-medium pt-2 flex items-center justify-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-accent-deep" />
              <span>Bạn đang là người chơi duy nhất trong phòng. Bạn có thể bấm bắt đầu ngay để trải nghiệm solo, hoặc mời thêm bạn bè!</span>
            </p>
          )}

          {/* Bottom Action Button */}
          <div className="pt-6 border-t border-rule text-center">
            {isHost ? (
              <div className="space-y-2 max-w-sm mx-auto">
                <button
                  onClick={handleStartGame}
                  className="pill-btn-primary w-full py-4 text-base font-bold text-accent-ink shadow-md"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Bắt Đầu Trận Đấu</span>
                </button>
                <p className="text-[11px] text-muted font-medium">
                  Chủ phòng có quyền bắt đầu trận đấu bất kỳ lúc nào!
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-paper-2 border border-rule inline-flex items-center gap-2.5 text-xs text-accent-deep font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-accent-deep" />
                <span>Đang chờ Chủ phòng bấm bắt đầu để vào câu hỏi…</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Character Modal */}
        {showCharacterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-card p-6 sm:p-8 space-y-5 border border-rule shadow-2xl relative">
              <button
                onClick={() => setShowCharacterModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-paper-2 text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-extrabold text-ink">Tùy Chọn Nhân Vật & Avatar</h3>
                <p className="text-xs text-muted">Chọn diện mạo đại diện vui nhộn cho bạn trong phòng thi đấu</p>
              </div>

              {/* Current Preview */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-paper-2 border border-rule">
                <CartoonAvatar
                  avatarId={selectedAvatar}
                  nickname={editNickname || 'Tên của bạn'}
                  isHost={isHost}
                  isMe={true}
                  size={100}
                  showArchedName={true}
                  showCheckmark={true}
                />
              </div>

              {/* Nickname input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Biệt danh của bạn:</label>
                <input
                  type="text"
                  maxLength={20}
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-card border border-rule text-xs font-bold text-ink focus:outline-none focus:border-accent shadow-sm"
                />
              </div>

              {/* Character grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Chọn nhân vật:</label>
                <div className="grid grid-cols-5 gap-2.5 max-h-44 overflow-y-auto p-1">
                  {CARTOON_AVATAR_LIST.map((item) => {
                    const isSelected = selectedAvatar === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAvatar(item.id)}
                        className={`p-1.5 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-paper-2 ring-2 ring-accent/40'
                            : 'hover:bg-paper-2'
                        }`}
                      >
                        <CartoonAvatar
                          avatarId={item.id}
                          nickname=""
                          size={46}
                          showArchedName={false}
                          showCheckmark={false}
                        />
                        <span className="text-[9px] font-bold text-ink truncate w-full text-center mt-1">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCharacterModal(false)}
                  className="pill-btn-secondary flex-1 py-3 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveCharacter}
                  className="pill-btn-primary flex-1 py-3 text-xs font-bold text-accent-ink"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== SCREEN 5: ARENA (THI ĐẤU & TRẢ LỜI CÂU HỎI) ====================
  const currentQuestion = roomState.currentQuestion;
  const isTieBreakMode = roomState.poolMode === 'TIE_BREAK';
  const alivePlayers = roomState.players.filter((p) => p.status === 'ALIVE');
  const aliveCount = alivePlayers.length;
  const totalCount = roomState.players.length;

  return (
    <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* SPECTATOR BANNER IF ELIMINATED */}
      {isSpectator && (
        <div className="p-3.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 animate-pulse shadow-sm">
          <Skull className="w-5 h-5 text-rose-500" />
          <span>Bạn đã hết mạng! Bạn đang theo dõi trận đấu với tư cách Khán giả (Spectator)</span>
        </div>
      )}

      {/* ARENA TOP BAR: MODE BADGE, SỐ MẠNG CỦA TÔI & TIMER PROGRESS */}
      <div className="soft-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Badge & Round */}
          <div className="flex items-center gap-2">
            {isTieBreakMode ? (
              <span className="px-3.5 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                <Flame className="w-4 h-4 fill-white" />
                <span>Vòng Tie-Break Sinh Tử</span>
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full bg-paper-2 text-accent-deep border border-rule font-bold text-xs flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-accent-deep" />
                <span>Vòng Câu Hỏi Chính</span>
              </span>
            )}
            <span className="text-xs font-bold text-muted num">
              Vòng #{roomState.roundNumber}
            </span>
          </div>

          {/* SỐ MẠNG CỦA TÔI TRÊN THANH HEADER */}
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-colors shadow-sm ${
            myLives === 3
              ? 'bg-paper-2 border-rule'
              : myLives === 2
              ? 'bg-paper-2 border-accent'
              : myLives === 1
              ? 'bg-rose-50 border-rose-300 animate-pulse'
              : 'bg-paper border-rule opacity-60'
          }`}>
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>Mạng của bạn:</span>
            </span>

            {/* Hearts List */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((h) => {
                const isAlive = h <= myLives;
                return (
                  <Heart
                    key={h}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isAlive
                        ? 'fill-rose-500 text-rose-500 drop-shadow-sm scale-110'
                        : 'fill-slate-200 text-slate-300 scale-90'
                    }`}
                  />
                );
              })}
            </div>

            <span className="text-xs font-extrabold text-accent-deep num">
              ({myLives}/3 mạng)
            </span>

            {myLives === 1 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold animate-pulse">
                Nguy hiểm!
              </span>
            )}
          </div>

          {/* Survival Count & Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <span>Sống sót:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold num">
                {aliveCount} / {totalCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-ink px-3 py-1 rounded-full bg-paper-2 border border-rule shadow-sm">
              <Clock className="w-4 h-4 text-accent-deep" />
              <span className="text-sm font-extrabold num">{timerSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {currentQuestion && (
          <div className="w-full h-2 rounded-full bg-paper-2 overflow-hidden border border-rule">
            <div
              className={`h-full transition-transform duration-1000 rounded-full origin-left ${
                isTieBreakMode ? 'bg-rose-500' : 'bg-accent'
              }`}
              style={{
                transform: `scaleX(${Math.min(1, Math.max(0, timerSeconds / currentQuestion.timeLimit))})`,
              }}
            />
          </div>
        )}
      </div>

      {/* 3-COLUMN RESPONSIVE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== COL 1: LEFT SIDEBAR (lg:col-span-3) ==================== */}
        <div className="lg:col-span-3 space-y-5 order-2 lg:order-1">
          {/* Action Button: Back to Home */}
          <Link
            href="/"
            className="pill-btn-secondary w-full text-xs font-bold text-ink justify-center"
          >
            <Home className="w-4 h-4 text-muted" />
            <span>Về Màn Hình Chính</span>
          </Link>

          {/* Room Info & PIN Card */}
          <div className="soft-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted">
                Mã Phòng Thi Đấu
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-paper-2 flex items-center justify-between">
              <span className="text-2xl font-extrabold tracking-widest text-accent-deep num">
                {formatRoomPin(roomState.roomId)}
              </span>
              <button
                type="button"
                onClick={handleCopyRoomId}
                title="Sao chép mã phòng"
                className="p-1.5 rounded-full hover:bg-paper-3 text-muted hover:text-ink transition-colors"
              >
                {copiedRoomId ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Topic Card */}
          <div className="soft-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-muted flex items-center gap-1.5">
              <Award className="w-4 h-4 text-accent-deep" />
              <span>Chủ Đề Thi Đấu</span>
            </h3>
            <div className="p-3 rounded-2xl bg-paper-2 border border-rule flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-deep flex-shrink-0" />
              <span className="text-xs font-bold text-accent-deep block leading-snug">
                {roomState.quizTitle}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== COL 2: MAIN QUESTION & ANSWERS (lg:col-span-6) ==================== */}
        <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
          {/* LIFE LOST DRAMATIC BANNER */}
          {lifeLostAlert && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 font-bold text-xs sm:text-sm flex items-center justify-between shadow-md animate-pulse">
              <div className="flex items-center gap-3">
                <HeartCrack className="w-7 h-7 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="block font-extrabold text-rose-700">Trả lời sai! Bạn vừa bị trừ 1 mạng!</span>
                  <span className="text-xs text-rose-600 font-medium">
                    {myLives > 0
                      ? `Số mạng còn lại của bạn: ${myLives}/3 mạng. Hãy cẩn thận ở câu tiếp theo!`
                      : 'Bạn đã hết 3 mạng và chuyển sang chế độ Khán giả (Spectator)!'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-base font-extrabold px-3 py-1 bg-card rounded-xl border border-rose-200 text-rose-600 shadow-sm num">
                <span>-1</span>
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
            </div>
          )}

          {/* Large Question Card */}
          <div className="soft-card-elevated p-7 sm:p-9 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
            <div className="abstract-blob w-56 h-56 bg-accent/20 -top-16 -right-16" />

            <div>
              {/* Question Header & Lifeline Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-rule">
                <div className="text-xs font-bold text-muted flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent-deep" />
                  <span>Câu hỏi #{roomState.currentQuestionIndex + 1}</span>
                </div>

                {/* SỐ MẠNG CỦA TÔI TRONG THẺ CÂU HỎI */}
                <div className={`flex items-center gap-2.5 px-3.5 py-1 rounded-full border text-xs font-bold ${
                  myLives === 3
                    ? 'bg-paper-2 border-rule text-accent-deep'
                    : myLives === 2
                    ? 'bg-paper-2 border-accent text-accent-deep'
                    : myLives === 1
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-paper border-rule text-muted'
                }`}>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Số mạng của tôi:</span>
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((h) => (
                      <Heart
                        key={h}
                        className={`w-3.5 h-3.5 ${
                          h <= myLives
                            ? 'fill-rose-500 text-rose-500'
                            : 'fill-slate-200 text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-extrabold num">({myLives}/3)</span>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink leading-snug">
                  {currentQuestion?.content || 'Đang tải câu hỏi…'}
                </h2>

                <div className="w-14 h-14 rounded-2xl bg-paper-2 border border-rule flex-shrink-0 flex items-center justify-center text-accent-deep shadow-sm">
                  {isTieBreakMode ? (
                    <Flame className="w-7 h-7 text-rose-500" />
                  ) : (
                    <Target className="w-7 h-7 text-accent-deep" />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-muted font-medium border-t border-rule">
              <span>Chọn một trong bốn đáp án bên dưới:</span>
              <span className="num">Thời gian: {currentQuestion?.timeLimit || 15}s</span>
            </div>
          </div>

          {/* 4 Answer Options (Vertical Pill Options) */}
          <div className="space-y-3">
            {currentQuestion?.options.map((optText, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = selectedAnswerIndex === optIdx;

              let answerStateClass = '';
              let badgeBg = 'bg-paper-2 text-ink border border-rule';

              if (roomState.state === 'ROUND_RESULT' && roundResult) {
                const isCorrect = roundResult.correctIndex === optIdx;
                if (isCorrect) {
                  answerStateClass = 'correct';
                  badgeBg = 'bg-emerald-500 text-white border-transparent';
                } else if (isSelected && !isCorrect) {
                  answerStateClass = 'incorrect';
                  badgeBg = 'bg-rose-500 text-white border-transparent';
                }
              } else if (isSelected) {
                answerStateClass = 'selected';
                badgeBg = 'bg-accent text-accent-ink border-accent-deep';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={hasSubmitted || isSpectator || roomState.state !== 'QUESTION_ACTIVE'}
                  onClick={() => handleSubmitAnswer(optIdx)}
                  className={`pill-answer w-full ${answerStateClass} ${
                    hasSubmitted && !isSelected ? 'opacity-60' : ''
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0 transition-colors shadow-sm ${badgeBg}`}
                  >
                    {letter}
                  </span>

                  <span className="flex-1 text-left text-sm sm:text-base font-semibold text-ink">
                    {optText}
                  </span>

                  {roomState.state === 'ROUND_RESULT' && roundResult && roundResult.correctIndex === optIdx && (
                    <Check className="w-5 h-5 text-emerald-600 stroke-[3] flex-shrink-0" />
                  )}
                  {isSelected && roomState.state === 'QUESTION_ACTIVE' && (
                    <span className="text-xs font-bold text-accent-deep bg-paper-2 px-3 py-1 rounded-full border border-rule flex-shrink-0">
                      Đã chọn
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status footer for submitted answer */}
          {hasSubmitted && roomState.state === 'QUESTION_ACTIVE' && (
            <div className="p-3.5 rounded-2xl bg-paper-2 border border-rule text-xs font-bold text-accent-deep text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Bạn đã khóa đáp án! Đang chờ đối thủ và hết thời gian để công bố kết quả…</span>
            </div>
          )}

          {/* ROUND RESULT FEEDBACK FOR CURRENT PLAYER */}
          {roomState.state === 'ROUND_RESULT' && roundResult && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm animate-in zoom-in-95 duration-200 ${
              isSpectator
                ? 'bg-paper-2 border-rule text-ink'
                : selectedAnswerIndex !== null && selectedAnswerIndex === roundResult.correctIndex
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                {isSpectator ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-paper-3 text-muted flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-ink block">
                        Chế độ theo dõi (Khán giả)
                      </span>
                      <span className="text-xs text-muted font-medium">
                        Đáp án đúng câu này là: <b className="text-accent-deep font-bold">{String.fromCharCode(65 + roundResult.correctIndex)}</b>. Các chiến binh còn lại đang so tài!
                      </span>
                    </div>
                  </>
                ) : selectedAnswerIndex !== null && selectedAnswerIndex === roundResult.correctIndex ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-sm">
                      ✓
                    </div>
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-800 block">
                        Xuất sắc! Bạn đã trả lời đúng!
                      </span>
                      <span className="text-xs text-emerald-700 font-medium">
                        Giữ nguyên số mạng: ({myLives}/3 mạng). Chuẩn bị cho câu tiếp theo…
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-sm">
                      ✕
                    </div>
                    <div>
                      <span className="font-extrabold text-sm sm:text-base text-rose-800 block">
                        {selectedAnswerIndex === null
                          ? 'Hết giờ! Bạn chưa kịp chọn đáp án (bị trừ 1 mạng)!'
                          : 'Rất tiếc! Bạn đã trả lời sai (bị trừ 1 mạng)!'}
                      </span>
                      <span className="text-xs text-rose-700 font-medium">
                        Đáp án đúng là: {String.fromCharCode(65 + roundResult.correctIndex)}. Số mạng còn lại: {myLives}/3 mạng.
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-full bg-card border border-rule flex-shrink-0 shadow-sm num">
                {isSpectator ? (
                  <span className="text-muted flex items-center gap-1">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Khán giả</span>
                  </span>
                ) : selectedAnswerIndex !== null && selectedAnswerIndex === roundResult.correctIndex ? (
                  <span className="text-emerald-700">+ Điểm tốc độ</span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <span>-1</span>
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================== COL 3: RIGHT SIDEBAR (lg:col-span-3) ==================== */}
        <div className="lg:col-span-3 space-y-5 order-3">
          {/* Survival Leaderboard */}
          <div className="soft-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-accent-deep" />
                <span>Bảng Sinh Tồn</span>
              </h3>
              <span className="text-xs font-bold text-ink num">
                {roomState.players.length} đấu thủ
              </span>
            </div>

            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 divide-y divide-rule">
              {roomState.players.map((p) => (
                <div
                  key={p.playerToken}
                  className={`pt-2 pb-1.5 flex items-center justify-between ${
                    p.status === 'ALIVE'
                      ? ''
                      : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0">
                      <CartoonAvatar
                        avatarId={p.avatar}
                        nickname=""
                        size={32}
                        showArchedName={false}
                        showCheckmark={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-ink truncate">
                          {p.nickname}
                        </span>
                        {p.isHost && (
                          <Crown className="w-3 h-3 text-accent-deep flex-shrink-0" />
                        )}
                        {p.isBot && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-paper-2 border border-rule text-accent-deep font-bold flex-shrink-0">
                            Bot
                          </span>
                        )}
                        {p.playerToken === playerToken && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-deep font-bold">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">{renderHearts(p.lives, p.status)}</div>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-accent-deep flex-shrink-0 num">
                    {p.score}p
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Realtime Room Chat */}
          <div className="soft-card p-5 space-y-3 flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-rule pb-2.5">
              <h3 className="text-xs font-bold text-muted flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-accent-deep" />
                <span>Khung Chat Phòng</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs"
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-xl bg-paper-2 border border-rule space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink flex items-center gap-1">
                      <CartoonAvatar
                        avatarId={msg.avatar}
                        nickname=""
                        size={20}
                        showArchedName={false}
                        showCheckmark={false}
                      />
                      <span>{msg.senderName}</span>
                      {msg.isHost && (
                        <Crown className="w-3 h-3 text-accent-deep" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted num">{msg.time}</span>
                  </div>
                  <p className="text-ink font-medium pl-5 break-words">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin cổ vũ…"
                maxLength={100}
                className="flex-1 px-3.5 py-2 rounded-full bg-card border border-rule text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors shadow-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-full bg-accent hover:bg-accent-deep text-accent-ink disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
