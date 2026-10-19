'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  PenTool,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Eye,
  Check,
} from 'lucide-react';

interface QuestionForm {
  id?: string;
  category: 'MAIN' | 'TIE_BREAK';
  content: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

const defaultQuestion = (category: 'MAIN' | 'TIE_BREAK', index: number): QuestionForm => ({
  category,
  content: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: category === 'MAIN' ? 15 : 10,
});

export default function EditorPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'MAIN' | 'TIE_BREAK'>('MAIN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainQuestions, setMainQuestions] = useState<QuestionForm[]>([
    defaultQuestion('MAIN', 1),
    defaultQuestion('MAIN', 2),
    defaultQuestion('MAIN', 3),
  ]);
  const [tieBreakQuestions, setTieBreakQuestions] = useState<QuestionForm[]>([
    defaultQuestion('TIE_BREAK', 1),
    defaultQuestion('TIE_BREAK', 2),
  ]);

  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
  const [loadingMyQuizzes, setLoadingMyQuizzes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token) {
      fetchMyQuizzes();
    }
  }, [token]);

  const fetchMyQuizzes = async () => {
    try {
      setLoadingMyQuizzes(true);
      const res = await fetch('/api/quizzes?my=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyQuizzes(false);
    }
  };

  const addQuestion = (category: 'MAIN' | 'TIE_BREAK') => {
    if (category === 'MAIN') {
      setMainQuestions((prev) => [...prev, defaultQuestion('MAIN', prev.length + 1)]);
    } else {
      setTieBreakQuestions((prev) => [...prev, defaultQuestion('TIE_BREAK', prev.length + 1)]);
    }
  };

  const removeQuestion = (category: 'MAIN' | 'TIE_BREAK', index: number) => {
    if (category === 'MAIN') {
      if (mainQuestions.length <= 3) {
        setError('Bắt buộc phải có tối thiểu 3 câu hỏi chính (MAIN)!');
        return;
      }
      setMainQuestions((prev) => prev.filter((_, i) => i !== index));
    } else {
      if (tieBreakQuestions.length <= 2) {
        setError('Bắt buộc phải có tối thiểu 2 câu hỏi sinh tử (TIE_BREAK)!');
        return;
      }
      setTieBreakQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (
    category: 'MAIN' | 'TIE_BREAK',
    index: number,
    field: keyof QuestionForm,
    value: any
  ) => {
    if (category === 'MAIN') {
      setMainQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
      );
    } else {
      setTieBreakQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
      );
    }
  };

  const updateOption = (
    category: 'MAIN' | 'TIE_BREAK',
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    const list = category === 'MAIN' ? mainQuestions : tieBreakQuestions;
    const currentQ = list[qIndex];
    const newOptions = [...currentQ.options];
    newOptions[optIndex] = value;
    updateQuestion(category, qIndex, 'options', newOptions);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!title.trim()) {
      setError('Vui lòng nhập Tiêu đề bộ câu hỏi!');
      return;
    }

    if (mainQuestions.length < 3) {
      setError('Cần có tối thiểu 3 câu hỏi chính (MAIN)!');
      return;
    }

    if (tieBreakQuestions.length < 2) {
      setError('Cần có tối thiểu 2 câu hỏi sinh tử phụ (TIE_BREAK)!');
      return;
    }

    // Validate main questions
    for (let i = 0; i < mainQuestions.length; i++) {
      const q = mainQuestions[i];
      if (!q.content.trim()) {
        setError(`Vui lòng nhập nội dung cho Câu hỏi chính số ${i + 1}!`);
        setActiveTab('MAIN');
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Câu hỏi chính số ${i + 1} chưa điền đủ 4 đáp án!`);
          setActiveTab('MAIN');
          return;
        }
      }
    }

    // Validate tie break questions
    for (let i = 0; i < tieBreakQuestions.length; i++) {
      const q = tieBreakQuestions[i];
      if (!q.content.trim()) {
        setError(`Vui lòng nhập nội dung cho Câu hỏi Tie-Break số ${i + 1}!`);
        setActiveTab('TIE_BREAK');
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Câu hỏi Tie-Break số ${i + 1} chưa điền đủ 4 đáp án!`);
          setActiveTab('TIE_BREAK');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const allQuestions = [...mainQuestions, ...tieBreakQuestions];
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          questions: allQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu bộ câu hỏi thất bại!');
      }

      setSuccessMessage(data.message || 'Lưu thành công!');
      fetchMyQuizzes();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu bộ câu hỏi!');
    } finally {
      setSaving(false);
    }
  };

  const currentQuestions = activeTab === 'MAIN' ? mainQuestions : tieBreakQuestions;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
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
            <span>🛠️ Quiz Editor Studio</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-normal">
              {user?.role}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thiết kế bộ câu hỏi chuẩn thi đấu: Tối thiểu 3 câu Chính (MAIN) & 2 câu Sinh tử (TIE-BREAK).
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveQuiz}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu & gửi duyệt...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu & Gửi Duyệt</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* FORM: GENERAL INFO */}
      <div className="rounded-2xl glass-panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">1. Thông Tin Chung Bộ Quiz</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề bộ câu hỏi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đấu Trường Lịch Sử Việt Nam & Thế Giới"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Mô tả ngắn
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Thử thách kiến thức lịch sử hào hùng..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* TABS: MAIN QUESTIONS VS TIE-BREAK QUESTIONS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('MAIN')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'MAIN'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎯 Tab 1: Câu Hỏi Chính (MAIN)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {mainQuestions.length} câu
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIE_BREAK')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'TIE_BREAK'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Tab 2: Câu Hỏi Sinh Tử (TIE_BREAK)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {tieBreakQuestions.length} câu
            </span>
          </button>
        </div>

        {/* Tab Description Banner */}
        {activeTab === 'MAIN' ? (
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
            <span>
              💡 <b>Câu hỏi Chính:</b> Xuất hiện ở các vòng đầu tiên. Cần tối thiểu 3 câu hỏi (đang có {mainQuestions.length} câu).
            </span>
            <button
              type="button"
              onClick={() => addQuestion('MAIN')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 text-xs shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu hỏi Chính</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
            <span>
              🔥 <b>Câu hỏi Tie-Break:</b> Dành cho 3 tình huống kịch tính (Tất cả chết cùng lúc, Top 3 chiến binh, hoặc hết câu hỏi chính). Cần tối thiểu 2 câu (đang có {tieBreakQuestions.length} câu).
            </span>
            <button
              type="button"
              onClick={() => addQuestion('TIE_BREAK')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 text-xs shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu hỏi Tie-Break</span>
            </button>
          </div>
        )}

        {/* QUESTION CARDS LIST */}
        <div className="space-y-6">
          {currentQuestions.map((q, qIndex) => (
            <div
              key={qIndex}
              className={`rounded-2xl p-6 transition-all border ${
                activeTab === 'MAIN'
                  ? 'glass-panel border-slate-800 hover:border-indigo-500/40'
                  : 'glass-panel-fire border-rose-900/60 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      activeTab === 'MAIN' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    #{qIndex + 1}
                  </span>
                  <span className="font-bold text-sm text-white">
                    {activeTab === 'MAIN' ? 'Câu hỏi Chính' : 'Câu hỏi Tie-Break'} #{qIndex + 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Time limit selector */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thời gian:</span>
                    <select
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(activeTab, qIndex, 'timeLimit', Number(e.target.value))
                      }
                      className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={10} className="bg-slate-900 text-white">10 giây</option>
                      <option value={15} className="bg-slate-900 text-white">15 giây</option>
                      <option value={20} className="bg-slate-900 text-white">20 giây</option>
                      <option value={30} className="bg-slate-900 text-white">30 giây</option>
                    </select>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeQuestion(activeTab, qIndex)}
                    title="Xóa câu hỏi này"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Content Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={q.content}
                  onChange={(e) => updateQuestion(activeTab, qIndex, 'content', e.target.value)}
                  placeholder="Nhập nội dung câu hỏi tại đây..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, optIndex) => {
                  const isCorrect = q.correctIndex === optIndex;
                  return (
                    <div
                      key={optIndex}
                      onClick={() => updateQuestion(activeTab, qIndex, 'correctIndex', optIndex)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                      </div>

                      <input
                        type="text"
                        value={q.options[optIndex]}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateOption(activeTab, qIndex, optIndex, e.target.value);
                        }}
                        placeholder={`Đáp án ${letter}...`}
                        className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-medium"
                      />

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          isCorrect ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      >
                        {isCorrect ? 'Đúng' : 'Chọn'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add more button */}
        <button
          type="button"
          onClick={() => addQuestion(activeTab)}
          className={`w-full py-4 rounded-xl border border-dashed text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'MAIN'
              ? 'border-indigo-700/50 hover:border-indigo-500 text-indigo-300 hover:bg-indigo-950/20'
              : 'border-rose-700/50 hover:border-rose-500 text-rose-300 hover:bg-rose-950/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi mới vào {activeTab === 'MAIN' ? 'bộ Chính' : 'bộ Tie-Break'}</span>
        </button>
      </div>

      {/* MY QUIZZES LIST */}
      <div className="pt-8 border-t border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📁 Bộ Câu Hỏi Của Tôi</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {myQuizzes.length}
          </span>
        </h2>

        {loadingMyQuizzes ? (
          <div className="py-8 text-center text-slate-500 text-xs">Đang tải danh sách...</div>
        ) : myQuizzes.length === 0 ? (
          <p className="text-xs text-slate-500">Bạn chưa tạo bộ câu hỏi nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myQuizzes.map((item) => (
              <div key={item.id} className="p-4 rounded-xl glass-panel space-y-2 border-slate-800">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.mainCount} Main • {item.tieBreakCount} Tie-Break
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{item.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
