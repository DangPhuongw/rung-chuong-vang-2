'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/store/useGameStore';
import { PublicRoomState, PublicPlayer } from '@/types/game';
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
  Sparkles,
  Trophy,
  ArrowRight,
} from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = (params?.roomId as string) || '';
  const roomId = rawRoomId.toUpperCase();

  const { playerToken, nickname, setNickname } = useGameStore();

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

  // Socket connection & events setup
  useEffect(() => {
    if (!roomId) return;

    // Check if player has token
    let token = playerToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('player_token') || '';
    }

    const currentNick = nickname || (typeof window !== 'undefined' ? localStorage.getItem('player_nickname') || '' : '');

    if (!currentNick) {
      setNeedNicknameModal(true);
      setLoadingRoom(false);
      return;
    }

    joinRoom(token, currentNick);

    // Socket Event Listeners
    socket.on('room_state_sync', (state: PublicRoomState) => {
      setRoomState(state);
      setLoadingRoom(false);

      if (state.state === 'GAME_OVER' && state.winner) {
        setGameOverData({
          winner: state.winner,
          leaderboard: state.players,
        });
      }
    });

    socket.on('game_countdown', (data: { seconds: number }) => {
      setStartingCountdown(data.seconds);
      setRoundResult(null);
      setTieBreakAlert(null);
      setGameOverData(null);
      setSelectedAnswerIndex(null);
      setHasSubmitted(false);

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
      setSelectedAnswerIndex(null);
      setHasSubmitted(false);

      // Start local countdown timer
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
    });

    socket.on('tie_break_activated', (data: { reason: string; message: string }) => {
      setTieBreakAlert(data);
      setRoundResult(null);
    });

    socket.on('game_over', (data: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOverData(data);

      // Launch fireworks!
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#a855f7', '#6366f1', '#10b981', '#f43f5e'],
        });
      } catch (e) {
        // Confetti fallback
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('room_state_sync');
      socket.off('game_countdown');
      socket.off('new_question');
      socket.off('round_result');
      socket.off('tie_break_activated');
      socket.off('game_over');
    };
  }, [roomId, playerToken, nickname]);

  const joinRoom = (token: string, nick: string) => {
    setLoadingRoom(true);
    setRoomError('');

    socket.emit(
      'join_room',
      { roomId, nickname: nick, playerToken: token },
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

    setNickname(inputNickname.trim());
    setNeedNicknameModal(false);

    let token = playerToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('player_token') || '';
    }
    joinRoom(token, inputNickname.trim());
  };

  const handleStartGame = () => {
    if (!roomState) return;
    socket.emit('start_game', { roomId, playerToken });
  };

  const handleSubmitAnswer = (answerIndex: number) => {
    if (hasSubmitted || !roomState || roomState.state !== 'QUESTION_ACTIVE') return;

    // Check if player is alive
    const me = roomState.players.find((p) => p.playerToken === playerToken);
    if (!me || me.status !== 'ALIVE') return;

    setSelectedAnswerIndex(answerIndex);
    setHasSubmitted(true);

    socket.emit('submit_answer', {
      roomId,
      playerToken,
      answerIndex,
    });
  };

  const handleCopyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePlayAgain = () => {
    socket.emit('reset_room', { roomId, playerToken });
  };

  // Find current user's player object
  const me = roomState?.players.find((p) => p.playerToken === playerToken);
  const isHost = me?.isHost || false;
  const isSpectator = me?.status === 'ELIMINATED';

  // Render Hearts helper
  const renderHearts = (lives: number, status: string) => {
    if (status === 'ELIMINATED') {
      return (
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Skull className="w-3.5 h-3.5 text-rose-500" />
          <span>Bị loại</span>
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
                ? 'fill-rose-500 text-rose-500 filter drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]'
                : 'fill-slate-800 text-slate-700'
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
        <div className="w-full max-w-md rounded-2xl glass-panel-glow p-8 text-center border-amber-500/40">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
            🔔
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Đấu Trường Sinh Tồn</h2>
          <p className="text-xs text-slate-400 mb-6">
            Nhập biệt danh để tiến vào phòng thi đấu <b className="text-amber-400">#{roomId}</b>
          </p>

          <form onSubmit={handleModalJoin} className="space-y-4">
            <input
              type="text"
              autoFocus
              required
              maxLength={24}
              value={inputNickname}
              onChange={(e) => setInputNickname(e.target.value)}
              placeholder="Nhập Nickname của bạn..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Đang kết nối vào phòng #{roomId}...</p>
      </div>
    );
  }

  // 3. ERROR STATE
  if (roomError || !roomState) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl glass-panel p-8 text-center border-rose-900/50">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Không Thể Vào Phòng</h2>
          <p className="text-xs text-slate-400 mb-6">{roomError || 'Phòng không tồn tại hoặc đã bị hủy.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Hình Chính</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 1: LOBBY ====================
  if (roomState.state === 'LOBBY') {
    const playerCount = roomState.players.length;
    const canStart = playerCount >= 2;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Lobby Header Card */}
        <div className="rounded-3xl glass-panel-glow p-8 text-center relative border-indigo-500/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
            <span>Đang Ở Phòng Đợi (Lobby)</span>
          </span>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-300 mb-2">
            Bộ Câu Hỏi: <strong className="text-white">{roomState.quizTitle}</strong>
          </h1>

          {/* ROOM ID DISPLAY */}
          <div className="my-6 inline-block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mã Phòng Thi Đấu</p>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 px-6 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl shadow-amber-500/10">
              {roomState.roomId}
            </div>
          </div>

          {/* Copy Link Button */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã Sao Chép Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Link Mời Bạn Bè</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Players List Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Danh Sách Người Chơi Trong Phòng</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {playerCount} người
              </span>
            </h2>
            {!canStart && (
              <span className="text-xs text-amber-400 font-medium">
                (Cần tối thiểu 2 người chơi để bắt đầu)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roomState.players.map((p) => {
              const isThisMe = p.playerToken === playerToken;
              return (
                <div
                  key={p.playerToken}
                  className={`p-4 rounded-2xl glass-panel flex items-center gap-3 border transition-all ${
                    isThisMe
                      ? 'border-indigo-500/60 ring-1 ring-indigo-500/40 bg-indigo-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-2xl border border-slate-800 shadow-inner">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{p.nickname}</span>
                      {isThisMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-bold">
                          Bạn
                        </span>
                      )}
                    </div>
                    {p.isHost ? (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Chủ phòng (Host)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Đã sẵn sàng</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Host vs Participant */}
        <div className="pt-4 border-t border-slate-800 text-center">
          {isHost ? (
            <div className="space-y-2">
              <button
                disabled={!canStart}
                onClick={handleStartGame}
                className={`py-4 px-8 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 mx-auto shadow-xl ${
                  canStart
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>🚀 BẮT ĐẦU TRẬN ĐẤU (START GAME)</span>
              </button>
              {!canStart && (
                <p className="text-xs text-slate-500">
                  Hãy gửi mã phòng hoặc link cho ít nhất 1 người bạn để mở trận đấu!
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl glass-panel inline-flex items-center gap-3 text-slate-300 text-sm border-slate-800">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Đang chờ chủ phòng bắt đầu trận đấu...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== SCREEN 2: STARTING COUNTDOWN ====================
  if (roomState.state === 'STARTING' || startingCountdown !== null) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <p className="text-sm font-bold text-amber-400 uppercase tracking-widest animate-pulse">
            ĐẤU TRƯỜNG CHUẨN BỊ MỞ RA
          </p>
          <div className="w-36 h-36 rounded-3xl bg-slate-900 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/20 flex items-center justify-center mx-auto animate-bounce-subtle">
            <span className="text-7xl font-black text-amber-300 font-mono">
              {startingCountdown ?? 3}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">SẴN SÀNG CHIẾN ĐẤU!</h2>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 3: TIE-BREAK ALERT (4s dramatic) ====================
  if (roomState.state === 'TIE_BREAK_ALERT' || tieBreakAlert) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-2xl rounded-3xl glass-panel-fire p-8 sm:p-12 text-center space-y-6 border-rose-500 shadow-2xl shadow-rose-600/30">
          <div className="w-20 h-20 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center mx-auto text-4xl animate-pulse">
            🔥
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase text-glow-red">
            KÍCH HOẠT TIE-BREAK SINH TỬ!
          </h2>

          <p className="text-base sm:text-lg text-rose-200 font-bold leading-relaxed px-4">
            {tieBreakAlert?.message || 'Bước vào loạt đấu súng phụ để tìm ra nhà vô địch!'}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-mono text-rose-300">
            <Clock className="w-4 h-4 animate-spin text-rose-400" />
            <span>Câu hỏi Tie-Break tiếp theo sẽ bắt đầu sau giây lát...</span>
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
        <div className="rounded-3xl glass-panel-glow p-8 sm:p-12 text-center relative border-amber-500/50 shadow-2xl shadow-amber-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>CHIẾN BINH SINH TỒN CUỐI CÙNG</span>
          </div>

          <div className="relative inline-block mb-4">
            <Crown className="w-10 h-10 text-amber-400 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce" />
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-xl shadow-amber-500/30">
              {winner?.avatar || '👑'}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2 text-glow-gold">
            {winner?.nickname || 'Vô Địch'}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-300 mb-6">
            <span className="flex items-center gap-1 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500" />
              <span>{winner?.lives} Mạng còn lại</span>
            </span>
            <span>•</span>
            <span className="text-indigo-400">Điểm tốc độ: {winner?.score} pts</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
            {isHost && (
              <button
                onClick={handlePlayAgain}
                className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại Trận Mới (Host Reset)</span>
              </button>
            )}
            <Link
              href="/"
              className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về Màn Hình Chính</span>
            </Link>
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="rounded-2xl glass-panel p-6 space-y-4 border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <span>Bảng Xếp Hạng Chung Cuộc</span>
          </h2>

          <div className="space-y-2">
            {leaderboard.map((p, idx) => (
              <div
                key={p.playerToken}
                className={`p-3.5 rounded-xl flex items-center justify-between border ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <span className="font-bold text-sm text-white block">{p.nickname}</span>
                    <span className="text-[11px] text-slate-400">
                      {p.status === 'ALIVE' ? 'Sống sót' : `Loại ở vòng ${p.eliminatedAtRound || 1}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>{renderHearts(p.lives, p.status)}</div>
                  <span className="font-mono text-xs font-bold text-indigo-300">
                    {p.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SCREEN 5: ARENA (QUESTION_ACTIVE | ROUND_RESULT) ====================
  const currentQuestion = roomState.currentQuestion;
  const isTieBreakMode = roomState.poolMode === 'TIE_BREAK';
  const alivePlayers = roomState.players.filter((p) => p.status === 'ALIVE');
  const aliveCount = alivePlayers.length;
  const totalCount = roomState.players.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* SPECTATOR BANNER IF ELIMINATED */}
      {isSpectator && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 animate-pulse">
          <Skull className="w-5 h-5 text-rose-500" />
          <span>💀 BẠN ĐÃ HẾT MẠNG! Bạn đang theo dõi trận đấu với tư cách Khán giả (Spectator)</span>
        </div>
      )}

      {/* ARENA HEADER: MODE BADGE, PROGRESS BAR & SURVIVAL COUNTER */}
      <div className="rounded-2xl glass-panel p-4 sm:p-5 border-slate-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Badge */}
          <div className="flex items-center gap-2">
            {isTieBreakMode ? (
              <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 animate-pulse">
                <Flame className="w-4 h-4 fill-white" />
                <span>🔥 VÒNG TIE-BREAK SINH TỬ</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-wider">
                🎯 VÒNG CÂU HỎI CHÍNH
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">
              Vòng #{roomState.roundNumber}
            </span>
          </div>

          {/* Survival Count */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
            <span>Sống sót:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-base">
              {aliveCount} / {totalCount}
            </span>
            <span className="text-slate-400">người</span>
          </div>

          {/* Timer Clock */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm">{timerSeconds}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        {currentQuestion && (
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ${
                isTieBreakMode ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, (timerSeconds / currentQuestion.timeLimit) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* ARENA MAIN GRID: QUESTION & OPTIONS (LEFT) + SURVIVAL SIDEBAR (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: QUESTION AND 4 OPTIONS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Box */}
          <div
            className={`rounded-3xl p-6 sm:p-8 min-h-[160px] flex flex-col justify-center border transition-all ${
              isTieBreakMode ? 'glass-panel-fire' : 'glass-panel-glow'
            }`}
          >
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Câu hỏi #{roomState.currentQuestionIndex + 1}
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-relaxed">
              {currentQuestion?.content || 'Đang tải câu hỏi...'}
            </h2>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion?.options.map((optText, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = selectedAnswerIndex === optIdx;

              // Check round result highlights
              let buttonStyle = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-900';
              let badgeStyle = 'bg-slate-800 text-slate-400';

              if (roomState.state === 'ROUND_RESULT' && roundResult) {
                const isCorrect = roundResult.correctIndex === optIdx;
                if (isCorrect) {
                  buttonStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20';
                  badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
                } else if (isSelected) {
                  buttonStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 ring-1 ring-rose-500';
                  badgeStyle = 'bg-rose-500 text-white font-black';
                }
              } else if (isSelected) {
                buttonStyle = 'bg-indigo-950/70 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500';
                badgeStyle = 'bg-indigo-500 text-white font-black';
              }

              const disabled = isSpectator || hasSubmitted || roomState.state === 'ROUND_RESULT';

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSubmitAnswer(optIdx)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all active:scale-[0.99] ${buttonStyle} ${
                    disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${badgeStyle}`}
                  >
                    {letter}
                  </span>
                  <span className="font-semibold text-sm sm:text-base leading-snug pt-1">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Submission status feedback */}
          {hasSubmitted && roomState.state === 'QUESTION_ACTIVE' && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold text-center animate-pulse">
              ✓ Đã chốt đáp án! Đang chờ đối thủ hoàn thành...
            </div>
          )}

          {/* Round result feedback banner */}
          {roomState.state === 'ROUND_RESULT' && roundResult && (
            <div className="p-4 rounded-2xl glass-panel border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  Đáp án chính xác:{' '}
                  <strong className="text-emerald-400">
                    {String.fromCharCode(65 + roundResult.correctIndex)}
                  </strong>
                </span>
                <span className="text-xs text-slate-400">Chuẩn bị vòng tiếp theo...</span>
              </div>
              {roundResult.revivedTokens && roundResult.revivedTokens.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  ⚡ Tất cả người chơi vừa được hồi sinh 1 mạng vì cùng gục ngã!
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE SURVIVAL SIDEBAR */}
        <div className="space-y-4">
          <div className="rounded-2xl glass-panel p-5 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>BẢNG SINH TỒN ({totalCount})</span>
              <span className="text-[11px] text-slate-400">❤️ = 1 Mạng</span>
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {roomState.players
                .slice()
                .sort((a, b) => {
                  if (a.status === 'ALIVE' && b.status !== 'ALIVE') return -1;
                  if (a.status !== 'ALIVE' && b.status === 'ALIVE') return 1;
                  return b.score - a.score;
                })
                .map((p) => {
                  const isThisMe = p.playerToken === playerToken;
                  return (
                    <div
                      key={p.playerToken}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        p.status === 'ELIMINATED'
                          ? 'bg-slate-950/40 border-slate-900 opacity-60'
                          : isThisMe
                          ? 'bg-indigo-950/30 border-indigo-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{p.avatar}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-white truncate">
                              {p.nickname}
                            </span>
                            {isThisMe && (
                              <span className="text-[9px] px-1 rounded bg-indigo-500 text-white font-bold">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div>{renderHearts(p.lives, p.status)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Answering indicator */}
                        {p.status === 'ALIVE' && (
                          <span
                            title={p.hasAnswered ? 'Đã trả lời' : 'Đang suy nghĩ'}
                            className={`text-xs ${
                              p.hasAnswered ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {p.hasAnswered ? '✅' : '⏳'}
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {p.score}p
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
