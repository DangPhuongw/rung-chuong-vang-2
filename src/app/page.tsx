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
  HelpCircle,
  Loader2,
  Gamepad2,
  Target,
  Flame,
  X,
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
  const { playerToken, nickname, setNickname, avatar } = useGameStore();

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
        avatar: avatar || 'char_burger',
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
        <div className="relative group soft-card p-7 lg:p-9 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-accent/15 rounded-full blur-3xl -z-10" />

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-paper-2 border border-rule text-accent-deep text-xs font-bold mb-4">
              <PenTool className="w-3.5 h-3.5" />
              <span>Sáng tạo nội dung</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-paper-2 border border-rule flex items-center justify-center text-accent-deep shadow-sm">
                <Sparkles className="w-6 h-6 text-accent-deep" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                Quiz Editor
                <span className="block text-accent-deep">
                  Kiến Tạo Đấu Trường
                </span>
              </h1>
            </div>

            <p className="text-muted text-sm sm:text-base leading-relaxed mb-6 font-medium">
              Tạo bộ câu hỏi chuẩn thi đấu với hai giai đoạn: Bộ câu hỏi chính và Bộ câu hỏi sinh tử Tie-Break rực lửa. Tùy chỉnh thời gian, mức độ thử thách cho riêng bạn.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="#available-quizzes"
                className="pill-btn-primary text-xs sm:text-sm font-bold text-accent-ink"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tạo Phòng Thi Đấu</span>
              </a>

              <Link
                href="/editor"
                className="pill-btn-secondary text-xs sm:text-sm font-bold text-ink"
              >
                <PenTool className="w-4 h-4 text-muted" />
                <span>Tạo Bộ Quiz Mới</span>
              </Link>
            </div>

            <p className="text-xs text-center text-muted font-medium">
              {user ? (
                <span>Đang đăng nhập với vai trò <b className="text-ink font-bold">{user.role}</b></span>
              ) : (
                <span>Cần tài khoản Editor hoặc Admin để lưu bộ câu hỏi mới</span>
              )}
            </p>
          </div>
        </div>

        {/* RIGHT CARD: JOIN ROOM CARD */}
        <div className="relative group soft-card p-7 lg:p-9 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-accent/15 rounded-full blur-3xl -z-10" />

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-paper-2 border border-rule text-accent-deep text-xs font-bold mb-4">
              <Swords className="w-3.5 h-3.5" />
              <span>Trực tiếp tham chiến</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-paper-2 border border-rule flex items-center justify-center text-accent-deep shadow-sm">
                <Swords className="w-6 h-6 text-accent-deep" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Tham Gia Đấu Trường
              </h2>
            </div>

            <p className="text-muted text-sm leading-relaxed mb-6 font-medium">
              Nhập mã phòng do chủ phòng cung cấp và bắt đầu cuộc chiến sinh tồn trí tuệ ngay tức thì mà không cần đăng ký.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            {joinError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {joinError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Biệt danh của bạn (Nickname)
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="Ví dụ: Chiến Binh Rồng, Trạng Nguyên…"
                className="w-full px-4 py-3 rounded-full bg-card border border-rule text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm font-semibold transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Mã phòng thi đấu (Room ID)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="VD: A8F9K2"
                className="w-full px-4 py-3 rounded-full bg-paper-2 border border-rule text-ink placeholder:text-muted font-bold tracking-widest text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="pill-btn-primary w-full py-3.5 text-sm font-bold text-accent-ink whitespace-nowrap"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối vào phòng…</span>
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
      <section className="space-y-6" id="available-quizzes">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
          <div className="flex items-center gap-4">
            {/* Gamified Circular Badge from Reference Image */}
            <div className="gamified-badge-circle w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
              <span className="text-base sm:text-lg font-extrabold text-ink leading-none num">
                {quizzes.length}
              </span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink flex items-center gap-2">
                <span>Các Bộ Câu Hỏi Sẵn Sàng</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-paper-2 text-accent-deep border border-rule">
                  {quizzes.length} bộ quiz
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1 font-medium">
                Chọn một bộ câu hỏi để tạo phòng và nhận mã QR cho mọi người cùng quét tham gia
              </p>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chủ đề, từ khóa…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-card border border-rule text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-medium transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* QUIZZES GRID */}
        {loadingQuizzes ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-deep" />
            <span className="text-sm font-bold">Đang tải danh sách đấu trường…</span>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-3xl border-2 border-dashed border-rule p-8 shadow-sm">
            <HelpCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-ink font-extrabold mb-1">Không tìm thấy bộ câu hỏi nào!</p>
            <p className="text-xs text-muted mb-4 font-medium">
              Hãy thử tìm kiếm với từ khóa khác hoặc tự tạo bộ câu hỏi mới.
            </p>
            <Link
              href="/editor"
              className="pill-btn-primary inline-flex text-xs font-bold text-accent-ink"
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
                className="group soft-card p-6 flex flex-col justify-between hover:border-accent hover:shadow-card hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-muted">
                      Tác giả: <strong className="text-ink">{quiz.author?.username || 'Hệ thống'}</strong>
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      Đã duyệt
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink group-hover:text-accent-deep transition-colors line-clamp-1 mb-2">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4 font-medium">
                    {quiz.description || 'Chưa có mô tả chi tiết cho bộ câu hỏi này.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-paper-2 border border-rule text-ink font-medium">
                      <Target className="w-3 h-3 text-accent-deep" />
                      <span>{quiz.mainCount} Câu Chính</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                      <Flame className="w-3 h-3 text-rose-500" />
                      <span>{quiz.tieBreakCount} Câu Tie-Break</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayNowClick(quiz)}
                  className="pill-btn-primary w-full text-xs sm:text-sm font-bold text-accent-ink"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Tạo Phòng & Lấy Mã QR</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: ENTER NICKNAME TO PLAY NOW */}
      {activeQuizForPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card p-7 relative border border-rule shadow-2xl space-y-5">
            <button
              onClick={() => setActiveQuizForPlay(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-paper-2 hover:bg-paper-3 text-muted hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-paper-2 border border-rule flex items-center justify-center mx-auto mb-3 text-accent-deep shadow-sm">
                <Gamepad2 className="w-7 h-7 text-accent-deep" />
              </div>
              <h3 className="text-xl font-extrabold text-ink">Mở Phòng Thi Đấu (Host)</h3>
              <p className="text-xs text-muted mt-1 font-medium">
                Bộ câu hỏi: <strong className="text-ink">{activeQuizForPlay.title}</strong>
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {createError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Biệt danh chủ phòng (Nickname)
              </label>
              <input
                type="text"
                autoFocus
                maxLength={24}
                value={modalNickname}
                onChange={(e) => setModalNickname(e.target.value)}
                placeholder="Nhập tên của bạn để thi đấu…"
                className="w-full px-4 py-3 rounded-full bg-card border border-rule text-ink placeholder:text-muted text-sm font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors shadow-sm"
              />
              <p className="text-[11px] text-muted font-medium">
                Hệ thống sẽ tạo phòng và cấp Mã QR + Mã PIN để người khác quét tham gia ngay!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveQuizForPlay(null)}
                className="pill-btn-secondary flex-1 py-3 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isCreatingRoom}
                onClick={handleConfirmCreateRoom}
                className="pill-btn-primary flex-1 py-3 text-xs font-bold text-accent-ink"
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo phòng…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tạo Phòng & Lấy Mã QR</span>
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
