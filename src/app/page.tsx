'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { getSocket } from '@/lib/socket';
import {
  Swords,
  PenTool,
  Play,
  Search,
  Sparkles,
  Users,
  Flame,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface QuizItem {
  id: string;
  title: string;
  description: string;
  status: string;
  author: {
    id: string;
    username: string;
  };
  mainCount: number;
  tieBreakCount: number;
  totalQuestions: number;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { playerToken, nickname, setNickname } = useGameStore();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Join Room inputs
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinNickname, setJoinNickname] = useState(nickname || '');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Play Now Modal
  const [activeQuizForPlay, setActiveQuizForPlay] = useState<QuizItem | null>(null);
  const [modalNickname, setModalNickname] = useState(nickname || '');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (nickname) {
      setJoinNickname(nickname);
      setModalNickname(nickname);
    }
  }, [nickname]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const cleanRoomId = joinRoomId.trim().toUpperCase();
    const cleanNick = joinNickname.trim();

    if (!cleanNick) {
      setJoinError('Vui lòng nhập Biệt danh (Nickname)!');
      return;
    }

    if (!cleanRoomId || cleanRoomId.length < 4) {
      setJoinError('Vui lòng nhập đúng Mã phòng (Room ID)!');
      return;
    }

    setIsJoining(true);
    setNickname(cleanNick);

    // Redirect to room page where socket connection is verified
    router.push(`/room/${cleanRoomId}`);
  };

  const handlePlayNowClick = (quiz: QuizItem) => {
    setActiveQuizForPlay(quiz);
    setCreateError('');
    if (nickname) {
      setModalNickname(nickname);
    }
  };

  const handleConfirmCreateRoom = () => {
    if (!activeQuizForPlay) return;
    const cleanNick = modalNickname.trim();
    if (!cleanNick) {
      setCreateError('Vui lòng nhập biệt danh để tham gia!');
      return;
    }

    setIsCreatingRoom(true);
    setCreateError('');
    setNickname(cleanNick);

    const socket = getSocket();
    socket.emit(
      'create_room',
      {
        quizSetId: activeQuizForPlay.id,
        nickname: cleanNick,
        playerToken,
      },
      (res: { success: boolean; roomId?: string; error?: string }) => {
        setIsCreatingRoom(false);
        if (res.success && res.roomId) {
          router.push(`/room/${res.roomId}`);
        } else {
          setCreateError(res.error || 'Không thể tạo phòng lúc này!');
        }
      }
    );
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* HERO SECTION: 2-COLUMN GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* LEFT CARD: QUIZ EDITOR CTA */}
        <div className="relative group rounded-2xl p-7 lg:p-9 glass-panel-glow flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-125" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-4">
              <PenTool className="w-3.5 h-3.5" />
              <span>Sáng tạo nội dung</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
              🛠️ Quiz Editor
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Kiến Tạo Đấu Trường
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Tạo bộ câu hỏi chuẩn thi đấu với 2 giai đoạn: Bộ câu hỏi chính và Bộ câu hỏi sinh tử Tie-Break rực lửa. Tùy chỉnh thời gian, mức độ thử thách cho riêng bạn.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/editor"
              className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <PenTool className="w-5 h-5" />
              <span>Tạo Bộ Quiz Mới</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <p className="text-xs text-center text-slate-400">
              {user ? (
                <span>Đang đăng nhập với vai trò <b className="text-indigo-300">{user.role}</b></span>
              ) : (
                <span>Cần tài khoản Editor hoặc Admin để lưu bộ câu hỏi</span>
              )}
            </p>
          </div>
        </div>

        {/* RIGHT CARD: JOIN ROOM CARD */}
        <div className="relative group rounded-2xl p-7 lg:p-9 glass-panel flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
              <Swords className="w-3.5 h-3.5" />
              <span>Trực tiếp tham chiến</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              ⚔️ Tham Gia Đấu Trường
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Nhập mã phòng do chủ phòng cung cấp và bắt đầu cuộc chiến sinh tồn trí tuệ ngay tức thì mà không cần đăng ký.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            {joinError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {joinError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Biệt danh của bạn (Nickname)
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="Ví dụ: Chiến Binh Rồng, Trạng Nguyên..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mã phòng thi đấu (Room ID)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="VD: A8F9K2"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 placeholder-slate-500 font-mono font-bold tracking-widest text-base uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối vào phòng...</span>
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  <span>Vào Phòng Ngay (Join Room)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* BOTTOM SECTION: AVAILABLE QUIZZES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>📚 Các Bộ Câu Hỏi Đã Sẵn Sàng</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {quizzes.length} bộ quiz
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Chọn một bộ câu hỏi để mở phòng chơi ngay cùng bạn bè
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chủ đề, từ khóa..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* QUIZZES GRID */}
        {loadingQuizzes ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-sm">Đang tải danh sách đấu trường...</span>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-2xl border-dashed border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-bold mb-1">Không tìm thấy bộ câu hỏi nào!</p>
            <p className="text-xs text-slate-500 mb-4">
              Hãy thử tìm kiếm với từ khóa khác hoặc tự tạo bộ câu hỏi mới.
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Tạo bộ câu hỏi ngay</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group rounded-2xl glass-panel p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-slate-400">
                      Tác giả: <strong className="text-slate-200">{quiz.author?.username || 'Hệ thống'}</strong>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      Đã duyệt
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-2">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {quiz.description || 'Chưa có mô tả chi tiết cho bộ câu hỏi này.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-medium">
                      🎯 {quiz.mainCount} Câu Chính
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 font-medium">
                      🔥 {quiz.tieBreakCount} Câu Tie-Break
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayNowClick(quiz)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Now (Mở Phòng)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: ENTER NICKNAME TO PLAY NOW */}
      {activeQuizForPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel-glow p-6 sm:p-7 relative border-indigo-500/50">
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <span>🚀 Mở Phòng Thi Đấu</span>
            </h3>
            <p className="text-xs text-indigo-300 mb-4 line-clamp-1">
              Bộ câu hỏi: <strong>{activeQuizForPlay.title}</strong>
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {createError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Biệt danh chủ phòng (Nickname)
              </label>
              <input
                type="text"
                autoFocus
                maxLength={24}
                value={modalNickname}
                onChange={(e) => setModalNickname(e.target.value)}
                placeholder="Nhập tên của bạn để thi đấu..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Bạn sẽ là Chủ phòng (Host) và cũng tham gia trả lời câu hỏi cùng mọi người.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveQuizForPlay(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isCreatingRoom}
                onClick={handleConfirmCreateRoom}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo phòng...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Vào Phòng Đợi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
