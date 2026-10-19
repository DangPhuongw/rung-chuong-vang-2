'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ArrowLeft,
  Filter,
  Loader2,
  Clock,
  Flame,
  Check,
} from 'lucide-react';

interface AdminQuizItem {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  author: {
    id: string;
    username: string;
    role: string;
  };
  mainCount: number;
  tieBreakCount: number;
  totalQuestions: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  const [quizzes, setQuizzes] = useState<AdminQuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Preview modal state
  const [previewQuiz, setPreviewQuiz] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      fetchAdminQuizzes();
    }
  }, [token, user, statusFilter]);

  const fetchAdminQuizzes = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === 'ALL'
          ? '/api/quizzes?all=true'
          : `/api/quizzes?all=true&status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAdminQuizzes();
        if (previewQuiz && previewQuiz.id === id) {
          setPreviewQuiz(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ câu hỏi này không?')) return;
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminQuizzes();
        if (previewQuiz && previewQuiz.id === id) {
          setPreviewQuiz(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPreview = async (id: string) => {
    try {
      setLoadingPreview(true);
      const res = await fetch(`/api/quizzes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewQuiz(data.quiz);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang chủ</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-amber-400" />
            <span>Bảng Điều Khiển Quản Trị (Admin Panel)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Phê duyệt, từ chối và quản lý toàn bộ các bộ câu hỏi trên hệ thống
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status === 'ALL'
                ? 'Tất cả'
                : status === 'PENDING'
                ? 'Chờ duyệt'
                : status === 'APPROVED'
                ? 'Đã duyệt'
                : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes Table / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-sm">Đang tải danh sách bộ câu hỏi...</span>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="py-16 text-center glass-panel rounded-2xl">
          <p className="text-slate-400 font-bold mb-1">Không có bộ câu hỏi nào phù hợp với bộ lọc!</p>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-bold">Bộ câu hỏi</th>
                  <th className="py-4 px-6 font-bold">Tác giả</th>
                  <th className="py-4 px-6 font-bold">Cấu trúc câu</th>
                  <th className="py-4 px-6 font-bold">Trạng thái</th>
                  <th className="py-4 px-6 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{quiz.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{quiz.description}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-indigo-300">
                        {quiz.author?.username || 'Hệ thống'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {quiz.mainCount} Main
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40">
                          {quiz.tieBreakCount} Tie-Break
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                          quiz.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : quiz.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {quiz.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : quiz.status === 'REJECTED'
                          ? 'Từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview button */}
                        <button
                          onClick={() => handleOpenPreview(quiz.id)}
                          title="Xem trước nội dung"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve button */}
                        {quiz.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(quiz.id, 'APPROVED')}
                            title="Duyệt bộ này"
                            className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject button */}
                        {quiz.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(quiz.id, 'REJECTED')}
                            title="Từ chối bộ này"
                            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          title="Xóa vĩnh viễn"
                          className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl glass-panel-glow p-6 sm:p-8 relative border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">{previewQuiz.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{previewQuiz.description}</p>
              </div>
              <button
                onClick={() => setPreviewQuiz(null)}
                className="text-slate-400 hover:text-white font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Questions preview */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                Danh Sách Câu Hỏi ({previewQuiz.questions?.length} câu)
              </h4>

              <div className="space-y-4">
                {previewQuiz.questions?.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-xl border ${
                      q.category === 'TIE_BREAK'
                        ? 'bg-rose-950/20 border-rose-900/50'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-white">
                        #{idx + 1}. [{q.category}] {q.content}
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono">
                        {q.timeLimit}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                              isCorrect
                                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Đóng
              </button>
              {previewQuiz.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(previewQuiz.id, 'APPROVED')}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  Duyệt Bộ Này
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
