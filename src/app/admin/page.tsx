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
  Loader2,
  Clock,
  Crown,
  Check,
  X,
  ListFilter,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Về trang chủ</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-paper-2 border border-rule flex items-center justify-center text-accent-deep shadow-sm">
              <Crown className="w-5 h-5 text-accent-deep" />
            </span>
            <span>Bảng Điều Khiển Quản Trị</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted mt-1">
            Phê duyệt, từ chối và quản lý toàn bộ các bộ câu hỏi trên hệ thống
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-paper-2 p-1.5 rounded-full border border-rule">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-accent text-accent-ink shadow-sm'
                  : 'text-muted hover:text-ink'
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
        <div className="py-20 flex flex-col items-center justify-center text-muted gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-deep" />
          <span className="text-sm font-bold">Đang tải danh sách bộ câu hỏi…</span>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="py-16 text-center soft-card">
          <p className="text-muted font-bold mb-1">Không có bộ câu hỏi nào phù hợp với bộ lọc!</p>
        </div>
      ) : (
        <div className="soft-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-paper-2 text-xs text-muted border-b border-rule font-bold">
                <tr>
                  <th className="py-4 px-6 font-bold">Bộ câu hỏi</th>
                  <th className="py-4 px-6 font-bold">Tác giả</th>
                  <th className="py-4 px-6 font-bold">Cấu trúc câu</th>
                  <th className="py-4 px-6 font-bold">Trạng thái</th>
                  <th className="py-4 px-6 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-paper-2/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-ink text-sm">{quiz.title}</div>
                      <div className="text-xs font-medium text-muted line-clamp-1">{quiz.description}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-bold text-accent-deep bg-paper-2 border border-rule px-2 py-0.5 rounded-lg">
                        {quiz.author?.username || 'Hệ thống'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-paper-2 text-ink border border-rule font-bold">
                          {quiz.mainCount} Main
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                          {quiz.tieBreakCount} Tie-Break
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          quiz.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : quiz.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
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
                          className="p-2 rounded-xl bg-paper-2 hover:bg-paper-3 text-muted hover:text-ink border border-rule transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve button */}
                        {quiz.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(quiz.id, 'APPROVED')}
                            title="Duyệt bộ này"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject button */}
                        {quiz.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(quiz.id, 'REJECTED')}
                            title="Từ chối bộ này"
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          title="Xóa vĩnh viễn"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-3xl bg-card p-6 sm:p-8 relative border border-rule shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rule pb-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-ink">{previewQuiz.title}</h3>
                <p className="text-xs font-medium text-muted mt-0.5">{previewQuiz.description}</p>
              </div>
              <button
                onClick={() => setPreviewQuiz(null)}
                className="w-8 h-8 rounded-full bg-paper-2 hover:bg-paper-3 text-muted hover:text-ink font-bold flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions preview */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-accent-deep flex items-center gap-1.5">
                <ListFilter className="w-4 h-4" />
                <span>Danh Sách Câu Hỏi ({previewQuiz.questions?.length} câu)</span>
              </h4>

              <div className="space-y-4">
                {previewQuiz.questions?.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border ${
                      q.category === 'TIE_BREAK'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-paper-2/60 border-rule'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-xs text-ink">
                        #{idx + 1}. [{q.category}] {q.content}
                      </span>
                      <span className="text-[11px] font-bold text-accent-deep bg-paper-2 px-2 py-0.5 rounded-lg border border-rule flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{q.timeLimit}s</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-950 font-extrabold'
                                : 'bg-paper-2 text-ink font-semibold'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-8 pt-4 border-t border-rule flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="pill-btn-secondary py-2.5 px-4 text-xs font-bold"
              >
                Đóng
              </button>
              {previewQuiz.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(previewQuiz.id, 'APPROVED')}
                  className="pill-btn-primary py-2.5 px-5 text-xs font-bold text-accent-ink"
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
