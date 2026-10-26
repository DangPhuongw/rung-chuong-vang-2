'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Check,
  FolderOpen,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Image as ImageIcon,
  X,
  Target,
  Flame,
  CheckSquare,
  Type,
  ListOrdered,
  Radio,
} from 'lucide-react';

export type SlideType = 'buttons' | 'checkboxes' | 'type_answer' | 'reorder';

export interface SlideQuestion {
  id?: string;
  type: SlideType;
  category: 'MAIN' | 'TIE_BREAK';
  content: string;
  // Type 1: buttons (1 trong 4 câu đúng)
  correctAnswer: string;
  falseAnswers: [string, string, string];
  // Type 2: checkboxes (nhiều câu đúng)
  checkboxOptions: Array<{ text: string; isCorrect: boolean }>;
  // Type 3: type_answer (nhập đáp án)
  primaryAnswer: string;
  acceptedAnswers: string[];
  // Type 4: reorder (sắp xếp theo thứ tự)
  orderItems: [string, string, string, string];
  funFact?: string;
  timeLimit: number;
  media?: string;
}

const defaultSlide = (
  category: 'MAIN' | 'TIE_BREAK',
  index: number,
  type: SlideType = 'buttons'
): SlideQuestion => ({
  id: `slide_${category}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${index}`,
  type,
  category,
  content: '',
  correctAnswer: '',
  falseAnswers: ['', '', ''],
  checkboxOptions: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
  primaryAnswer: '',
  acceptedAnswers: [],
  orderItems: ['', '', '', ''],
  funFact: '',
  timeLimit: category === 'MAIN' ? 15 : 10,
  media: `/cards/card_${index % 12}.jpg`,
});

const PRESET_CARDS = [
  '/cards/card_0.jpg',
  '/cards/card_1.jpg',
  '/cards/card_2.jpg',
  '/cards/card_3.jpg',
  '/cards/card_4.jpg',
  '/cards/card_5.jpg',
  '/cards/card_6.jpg',
  '/cards/card_7.jpg',
  '/cards/card_8.jpg',
  '/cards/card_9.jpg',
  '/cards/card_10.jpg',
  '/cards/card_11.jpg',
];

export const SCREEN_ADD_SLIDE = -2;
export const SCREEN_SETTINGS = -1;

export default function EditorPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<'MAIN' | 'TIE_BREAK'>('MAIN');
  // SCREEN_ADD_SLIDE (-2) = Add Slide Screen, SCREEN_SETTINGS (-1) = Settings, >= 0 = Active Slide
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [previousSlideIndex, setPreviousSlideIndex] = useState<number>(0);
  const slideStripRef = useRef<HTMLDivElement>(null);

  // Quiz Meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverMedia, setCoverMedia] = useState('/cards/card_0.jpg');

  // Question Collections
  const [mainQuestions, setMainQuestions] = useState<SlideQuestion[]>([
    defaultSlide('MAIN', 0, 'buttons'),
    defaultSlide('MAIN', 1, 'checkboxes'),
    defaultSlide('MAIN', 2, 'type_answer'),
  ]);
  const [tieBreakQuestions, setTieBreakQuestions] = useState<SlideQuestion[]>([
    defaultSlide('TIE_BREAK', 0, 'reorder'),
    defaultSlide('TIE_BREAK', 1, 'buttons'),
  ]);

  // Modals & States
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'cover' | 'slide'>('slide');
  const [customMediaUrl, setCustomMediaUrl] = useState('');

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMyQuizzesModalOpen, setIsMyQuizzesModalOpen] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
  const [loadingMyQuizzes, setLoadingMyQuizzes] = useState(false);

  // Drag and drop states for slide thumbnails
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentQuestions = activeCategory === 'MAIN' ? mainQuestions : tieBreakQuestions;

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

  // Keep activeSlideIndex within bounds when switching categories
  useEffect(() => {
    if (activeSlideIndex >= currentQuestions.length) {
      setActiveSlideIndex(Math.max(0, currentQuestions.length - 1));
    }
  }, [activeCategory, currentQuestions.length, activeSlideIndex]);

  // Scroll active slide thumbnail into view
  useEffect(() => {
    if (slideStripRef.current && activeSlideIndex >= 0) {
      const activeEl = slideStripRef.current.children[activeSlideIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  }, [activeSlideIndex, activeCategory]);

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

  const isSlideIncomplete = (slide: SlideQuestion) => {
    if (!slide.content.trim()) return true;
    if (slide.type === 'buttons') {
      return !slide.correctAnswer.trim() || !slide.falseAnswers[0].trim();
    }
    if (slide.type === 'checkboxes') {
      const hasCorrect = slide.checkboxOptions.some((o) => o.isCorrect && o.text.trim());
      return !hasCorrect;
    }
    if (slide.type === 'type_answer') {
      return !slide.primaryAnswer.trim();
    }
    if (slide.type === 'reorder') {
      return !slide.orderItems[0].trim() || !slide.orderItems[1].trim();
    }
    return false;
  };

  // Centralized question pool mutator to eliminate category-branching duplication
  const mutateQuestions = (updater: (prev: SlideQuestion[]) => SlideQuestion[]) => {
    if (activeCategory === 'MAIN') {
      setMainQuestions(updater);
    } else {
      setTieBreakQuestions(updater);
    }
  };

  // Open Add Slide Screen
  const openAddSlideScreen = () => {
    if (activeSlideIndex >= 0) {
      setPreviousSlideIndex(activeSlideIndex);
    }
    setActiveSlideIndex(SCREEN_ADD_SLIDE);
  };

  // Create a slide with the chosen type
  const selectSlideType = (type: SlideType) => {
    mutateQuestions((prev) => {
      const next = [...prev, defaultSlide(activeCategory, prev.length, type)];
      setActiveSlideIndex(next.length - 1);
      return next;
    });
  };

  // Switch type on the current active slide
  const changeActiveSlideType = (newType: SlideType) => {
    if (activeSlideIndex < 0) return;
    updateSlideField('type', newType);
  };

  const duplicateSlide = (idx: number) => {
    const target = currentQuestions[idx];
    if (!target) return;
    mutateQuestions((prev) => {
      const next = [...prev];
      const clone: SlideQuestion = {
        ...target,
        id: `slide_${activeCategory}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        content: target.content ? `${target.content} (Bản sao)` : '',
        falseAnswers: [...target.falseAnswers],
        checkboxOptions: target.checkboxOptions.map((o) => ({ ...o })),
        acceptedAnswers: [...target.acceptedAnswers],
        orderItems: [...target.orderItems],
      };
      next.splice(idx + 1, 0, clone);
      return next;
    });
    setActiveSlideIndex(idx + 1);
  };

  const removeSlide = (idx: number) => {
    if (currentQuestions.length <= 1) {
      setError(
        activeCategory === 'MAIN'
          ? 'Cần giữ lại ít nhất 1 câu hỏi chính!'
          : 'Cần giữ lại ít nhất 1 câu hỏi Tie-Break!'
      );
      return;
    }
    mutateQuestions((prev) => prev.filter((_, i) => i !== idx));
    setActiveSlideIndex((prev) => Math.max(0, idx - 1));
  };

  const moveSlide = (idx: number, direction: 'LEFT' | 'RIGHT') => {
    const targetIdx = direction === 'LEFT' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentQuestions.length) return;
    mutateQuestions((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setActiveSlideIndex(targetIdx);
  };

  // Reorder slide via Drag & Drop
  const handleDropSlide = (targetIdx: number) => {
    if (draggedSlideIndex === null || draggedSlideIndex === targetIdx) {
      setDraggedSlideIndex(null);
      setDragOverSlideIndex(null);
      return;
    }
    if (targetIdx < 0 || targetIdx >= currentQuestions.length) {
      setDraggedSlideIndex(null);
      setDragOverSlideIndex(null);
      return;
    }

    const activeSlideObj = activeSlideIndex >= 0 ? currentQuestions[activeSlideIndex] : null;

    mutateQuestions((prev) => {
      const next = [...prev];
      const [movedSlide] = next.splice(draggedSlideIndex, 1);
      next.splice(targetIdx, 0, movedSlide);
      return next;
    });

    if (activeSlideIndex === draggedSlideIndex) {
      setActiveSlideIndex(targetIdx);
    } else if (activeSlideObj) {
      const newActiveIdx = currentQuestions.indexOf(activeSlideObj);
      if (newActiveIdx !== -1) {
        setActiveSlideIndex(newActiveIdx);
      }
    }

    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
  };

  const updateSlideField = (field: keyof SlideQuestion, value: any) => {
    mutateQuestions((prev) => {
      const next = [...prev];
      if (next[activeSlideIndex]) {
        next[activeSlideIndex] = { ...next[activeSlideIndex], [field]: value };
      }
      return next;
    });
  };

  // Buttons type helper
  const updateFalseAnswer = (falseIndex: number, value: string) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const updatedFalse: [string, string, string] = [...currentSlide.falseAnswers];
    updatedFalse[falseIndex] = value;
    updateSlideField('falseAnswers', updatedFalse);
  };

  // Checkboxes type helper
  const updateCheckboxOptionText = (optIdx: number, text: string) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const nextOpts = currentSlide.checkboxOptions.map((opt, i) =>
      i === optIdx ? { ...opt, text } : opt
    );
    updateSlideField('checkboxOptions', nextOpts);
  };

  const toggleCheckboxOptionCorrect = (optIdx: number) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const nextOpts = currentSlide.checkboxOptions.map((opt, i) =>
      i === optIdx ? { ...opt, isCorrect: !opt.isCorrect } : opt
    );
    updateSlideField('checkboxOptions', nextOpts);
  };

  // Type Answer helper
  const addAcceptedAnswer = () => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    updateSlideField('acceptedAnswers', [...currentSlide.acceptedAnswers, '']);
  };

  const updateAcceptedAnswer = (idx: number, val: string) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const next = [...currentSlide.acceptedAnswers];
    next[idx] = val;
    updateSlideField('acceptedAnswers', next);
  };

  const removeAcceptedAnswer = (idx: number) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const next = currentSlide.acceptedAnswers.filter((_, i) => i !== idx);
    updateSlideField('acceptedAnswers', next);
  };

  // Reorder helper
  const updateOrderItem = (itemIdx: number, val: string) => {
    const currentSlide = currentQuestions[activeSlideIndex];
    if (!currentSlide) return;
    const next: [string, string, string, string] = [...currentSlide.orderItems];
    next[itemIdx] = val;
    updateSlideField('orderItems', next);
  };

  const openMediaPicker = (target: 'cover' | 'slide') => {
    setMediaTarget(target);
    setCustomMediaUrl('');
    setIsMediaModalOpen(true);
  };

  const selectMedia = (url: string) => {
    if (mediaTarget === 'cover') {
      setCoverMedia(url);
    } else {
      updateSlideField('media', url);
    }
    setIsMediaModalOpen(false);
  };

  const handleSaveQuiz = async () => {
    setError('');
    setSuccessMessage('');

    if (!title.trim()) {
      setActiveSlideIndex(SCREEN_SETTINGS);
      setError('Vui lòng nhập Tiêu đề bộ câu hỏi tại mục Cài đặt (Settings)!');
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

    // Validate Main questions
    for (let i = 0; i < mainQuestions.length; i++) {
      const q = mainQuestions[i];
      if (isSlideIncomplete(q)) {
        setActiveCategory('MAIN');
        setActiveSlideIndex(i);
        setError(`Câu hỏi chính #${i + 1} (${getTypeBadgeName(q.type)}) chưa điền đủ thông tin bắt buộc!`);
        return;
      }
    }

    // Validate Tie Break questions
    for (let i = 0; i < tieBreakQuestions.length; i++) {
      const q = tieBreakQuestions[i];
      if (isSlideIncomplete(q)) {
        setActiveCategory('TIE_BREAK');
        setActiveSlideIndex(i);
        setError(`Câu hỏi Tie-Break #${i + 1} (${getTypeBadgeName(q.type)}) chưa điền đủ thông tin bắt buộc!`);
        return;
      }
    }

    setSaving(true);

    try {
      // Normalize each question into options array and correctIndex
      const serializeSlide = (q: SlideQuestion, idx: number, cat: 'MAIN' | 'TIE_BREAK') => {
        let options: string[] = [];
        let correctIndex = 0;

        if (q.type === 'buttons') {
          options = [
            q.correctAnswer,
            q.falseAnswers[0] || 'Lựa chọn B',
            q.falseAnswers[1] || 'Lựa chọn C',
            q.falseAnswers[2] || 'Lựa chọn D',
          ];
          correctIndex = 0;
        } else if (q.type === 'checkboxes') {
          options = q.checkboxOptions.map((o, optIdx) => o.text || `Lựa chọn ${optIdx + 1}`);
          const firstCorrect = q.checkboxOptions.findIndex((o) => o.isCorrect);
          correctIndex = firstCorrect >= 0 ? firstCorrect : 0;
        } else if (q.type === 'type_answer') {
          options = [
            q.primaryAnswer,
            q.acceptedAnswers[0] || 'Đáp án phụ 1',
            q.acceptedAnswers[1] || 'Đáp án phụ 2',
            q.acceptedAnswers[2] || 'Đáp án phụ 3',
          ];
          correctIndex = 0;
        } else if (q.type === 'reorder') {
          options = [
            q.orderItems[0] || 'Bước 1',
            q.orderItems[1] || 'Bước 2',
            q.orderItems[2] || 'Bước 3',
            q.orderItems[3] || 'Bước 4',
          ];
          correctIndex = 0;
        }

        // Store full multi-type metadata inside options object
        const optionsPayload = {
          type: q.type,
          options,
          correctAnswer: q.correctAnswer,
          falseAnswers: q.falseAnswers,
          checkboxOptions: q.checkboxOptions,
          primaryAnswer: q.primaryAnswer,
          acceptedAnswers: q.acceptedAnswers,
          orderItems: q.orderItems,
          funFact: q.funFact,
          media: q.media,
        };

        return {
          category: cat,
          content: q.content,
          options: optionsPayload,
          correctIndex,
          timeLimit: q.timeLimit,
          orderIndex: idx + 1,
        };
      };

      const allQuestions = [
        ...mainQuestions.map((q, idx) => serializeSlide(q, idx, 'MAIN')),
        ...tieBreakQuestions.map((q, idx) => serializeSlide(q, idx, 'TIE_BREAK')),
      ];

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          thumbnail: coverMedia,
          questions: allQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu bộ câu hỏi!');
      }

      setSuccessMessage(
        user?.role === 'ADMIN'
          ? 'Bộ câu hỏi đã được tạo và phê duyệt (APPROVED) ngay lập tức!'
          : 'Bộ câu hỏi đã được gửi đi và đang chờ Admin duyệt (PENDING)!'
      );

      fetchMyQuizzes();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu bộ câu hỏi!');
    } finally {
      setSaving(false);
    }
  };

  const loadExistingQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const qz = data.quiz;
        if (!qz) return;
        setTitle(qz.title);
        setDescription(qz.description || '');
        if (qz.thumbnail) setCoverMedia(qz.thumbnail);

        const parseSlideFromQuestion = (q: any, i: number, cat: 'MAIN' | 'TIE_BREAK'): SlideQuestion => {
          let raw: any = q.options;
          if (typeof raw === 'string') {
            try {
              raw = JSON.parse(raw);
            } catch {
              raw = ['A', 'B', 'C', 'D'];
            }
          }

          if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.type) {
            return {
              id: q.id || `slide_${cat}_${Date.now()}_${i}`,
              type: raw.type as SlideType,
              category: cat,
              content: q.content,
              correctAnswer: raw.correctAnswer || (raw.options ? raw.options[0] : ''),
              falseAnswers: raw.falseAnswers || [
                raw.options?.[1] || '',
                raw.options?.[2] || '',
                raw.options?.[3] || '',
              ],
              checkboxOptions: raw.checkboxOptions || [
                { text: raw.options?.[0] || '', isCorrect: q.correctIndex === 0 },
                { text: raw.options?.[1] || '', isCorrect: q.correctIndex === 1 },
                { text: raw.options?.[2] || '', isCorrect: q.correctIndex === 2 },
                { text: raw.options?.[3] || '', isCorrect: q.correctIndex === 3 },
              ],
              primaryAnswer: raw.primaryAnswer || (raw.options ? raw.options[0] : ''),
              acceptedAnswers: raw.acceptedAnswers || [],
              orderItems: raw.orderItems || [
                raw.options?.[0] || '',
                raw.options?.[1] || '',
                raw.options?.[2] || '',
                raw.options?.[3] || '',
              ],
              funFact: raw.funFact || '',
              timeLimit: q.timeLimit || (cat === 'MAIN' ? 15 : 10),
              media: raw.media || `/cards/card_${i % 12}.jpg`,
            };
          }

          const opts: string[] = Array.isArray(raw) ? raw : (raw?.options || ['A', 'B', 'C', 'D']);
          return {
            id: q.id || `slide_${cat}_${Date.now()}_${i}`,
            type: 'buttons' as SlideType,
            category: cat,
            content: q.content,
            correctAnswer: opts[q.correctIndex] || '',
            falseAnswers: [
              opts.filter((_: any, idx: number) => idx !== q.correctIndex)[0] || '',
              opts.filter((_: any, idx: number) => idx !== q.correctIndex)[1] || '',
              opts.filter((_: any, idx: number) => idx !== q.correctIndex)[2] || '',
            ] as [string, string, string],
            checkboxOptions: [
              { text: opts[0] || '', isCorrect: q.correctIndex === 0 },
              { text: opts[1] || '', isCorrect: q.correctIndex === 1 },
              { text: opts[2] || '', isCorrect: q.correctIndex === 2 },
              { text: opts[3] || '', isCorrect: q.correctIndex === 3 },
            ],
            primaryAnswer: opts[q.correctIndex] || '',
            acceptedAnswers: [],
            orderItems: [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || ''] as [string, string, string, string],
            funFact: '',
            timeLimit: q.timeLimit || (cat === 'MAIN' ? 15 : 10),
            media: `/cards/card_${i % 12}.jpg`,
          };
        };

        const mains = (qz.questions || [])
          .filter((q: any) => q.category === 'MAIN')
          .map((q: any, i: number) => parseSlideFromQuestion(q, i, 'MAIN'));

        const ties = (qz.questions || [])
          .filter((q: any) => q.category === 'TIE_BREAK')
          .map((q: any, i: number) => parseSlideFromQuestion(q, i, 'TIE_BREAK'));

        if (mains.length > 0) setMainQuestions(mains);
        if (ties.length > 0) setTieBreakQuestions(ties);

        setIsMyQuizzesModalOpen(false);
        setActiveSlideIndex(0);
        setSuccessMessage(`Đã tải bộ câu hỏi "${qz.title}" thành công!`);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi nạp dữ liệu bộ câu hỏi!');
    }
  };

  const activeSlide = activeSlideIndex >= 0 ? currentQuestions[activeSlideIndex] : null;

  const getTypeBadgeName = (t: SlideType) => {
    switch (t) {
      case 'buttons':
        return 'Buttons (1 Đáp Án Đúng)';
      case 'checkboxes':
        return 'Checkboxes (Nhiều Đáp Án)';
      case 'type_answer':
        return 'Type Answer (Nhập Đáp Án)';
      case 'reorder':
        return 'Reorder (Sắp Xếp Thứ Tự)';
    }
  };

  const getTypeShortIcon = (t: SlideType) => {
    switch (t) {
      case 'buttons':
        return <Radio className="w-3 h-3 text-accent-deep" />;
      case 'checkboxes':
        return <CheckSquare className="w-3 h-3 text-emerald-600" />;
      case 'type_answer':
        return <Type className="w-3 h-3 text-blue-600" />;
      case 'reorder':
        return <ListOrdered className="w-3 h-3 text-amber-600" />;
    }
  };

  return (
    <div className="quiz-editor-screen fixed inset-0 w-screen h-screen max-h-screen overflow-hidden flex flex-col font-sans select-none z-30">
      {/* ======================================================== */}
      {/* 1. TOP BAR (GOLD - WHITE TEMPLATE)                       */}
      {/* ======================================================== */}
      <div className="quiz-editor-topbar h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20 shadow-sm relative">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            title="Về Trang Chủ"
          >
            <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center font-black text-accent-ink shadow-sm border border-accent-deep">
              Q
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-ink">Quiz Studio</span>
            </div>
          </Link>
        </div>

        {/* Center: Main vs Tie-Break Toggle (Prominent & Centered) */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-paper-2 p-1.5 rounded-2xl border-2 border-rule shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('MAIN');
              setActiveSlideIndex(0);
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'MAIN'
                ? 'bg-accent text-accent-ink shadow-sm border border-accent-deep'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Target className="w-4 h-4 text-accent-deep stroke-[2.5]" />
            <span>Bộ Chính (MAIN)</span>
            <span className="px-2 py-0.5 rounded-full bg-paper text-ink text-xs font-black num shadow-xs">
              {mainQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('TIE_BREAK');
              setActiveSlideIndex(0);
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'TIE_BREAK'
                ? 'bg-rose-500 text-white shadow-sm border border-rose-600'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Flame className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Bộ Tie-Break</span>
            <span className="px-2 py-0.5 rounded-full bg-paper text-ink text-xs font-black num shadow-xs">
              {tieBreakQuestions.length}
            </span>
          </button>
        </div>

        {/* Right: Save Status & Close Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tất cả thay đổi đã được lưu</span>
          </div>

          <button
            type="button"
            onClick={() => router.push('/')}
            title="Đóng Quiz Studio"
            className="w-9 h-9 rounded-full hover:bg-paper-2 flex items-center justify-center text-muted hover:text-ink text-base transition-colors border border-rule cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {error && (
        <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="hover:opacity-75 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="hover:opacity-75 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN STAGE CONTAINER                                  */}
      {/* ======================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 sm:py-3 flex items-center justify-center">
        {/* CASE A: ADD SLIDE SCREEN (4 REQUESTED TYPES) */}
        {activeSlideIndex === SCREEN_ADD_SLIDE ? (
          <div className="w-full max-w-3xl flex flex-col items-center py-4 text-ink">
            <div className="flex items-center justify-between w-full mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                  Thêm Slide Mới (Add Slide)
                </h2>
                <p className="text-xs sm:text-sm font-bold text-muted mt-1">
                  Chọn 1 trong 4 dạng câu hỏi để tiếp tục biên soạn bài thi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlideIndex(previousSlideIndex)}
                className="pill-btn-secondary px-4 py-2 text-xs font-bold text-ink flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* 1. Buttons (Chọn 1 đáp án đúng) */}
              <div
                onClick={() => selectSlideType('buttons')}
                className="quiz-add-slide-card p-5 flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="40" height="40" rx="12" fill="#34D399" stroke="#065F46" strokeWidth="2.5" />
                    <rect x="14" y="14" width="20" height="20" rx="6" fill="#059669" stroke="#065F46" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-base text-ink group-hover:text-accent-deep transition-colors">
                    Buttons (1 Đáp Án Đúng)
                  </div>
                  <div className="text-xs font-bold text-muted mt-0.5">
                    Một lựa chọn chính xác duy nhất trong 4 phương án trắc nghiệm
                  </div>
                </div>
              </div>

              {/* 2. Checkboxes (Chọn nhiều đáp án đúng) */}
              <div
                onClick={() => selectSlideType('checkboxes')}
                className="quiz-add-slide-card p-5 flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="40" height="40" rx="12" fill="#FDE68A" stroke="#B45309" strokeWidth="2.5" />
                    <path
                      d="M14 24L21 31L34 17"
                      stroke="#B45309"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-base text-ink group-hover:text-accent-deep transition-colors">
                    Checkboxes (Nhiều Đáp Án)
                  </div>
                  <div className="text-xs font-bold text-muted mt-0.5">
                    Cho phép thí sinh chọn nhiều đáp án đúng cùng lúc
                  </div>
                </div>
              </div>

              {/* 3. Type answer (Nhập đáp án) */}
              <div
                onClick={() => selectSlideType('type_answer')}
                className="quiz-add-slide-card p-5 flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="4" y="6" width="40" height="36" rx="10" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="2.5" />
                    <text
                      x="24"
                      y="30"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="900"
                      fontSize="20"
                      fill="#1E40AF"
                      textAnchor="middle"
                    >
                      Aa
                    </text>
                  </svg>
                </div>
                <div>
                  <div className="font-black text-base text-ink group-hover:text-accent-deep transition-colors">
                    Type Answer (Nhập Đáp Án)
                  </div>
                  <div className="text-xs font-bold text-muted mt-0.5">
                    Thí sinh gõ trực tiếp từ hoặc câu trả lời từ bàn phím
                  </div>
                </div>
              </div>

              {/* 4. Reorder (Sắp xếp theo thứ tự) */}
              <div
                onClick={() => selectSlideType('reorder')}
                className="quiz-add-slide-card p-5 flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="6" y="9" width="36" height="7.5" rx="3.75" fill="#FB7185" stroke="#9F1239" strokeWidth="2" />
                    <rect x="6" y="20" width="36" height="7.5" rx="3.75" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
                    <rect x="6" y="31" width="36" height="7.5" rx="3.75" fill="#34D399" stroke="#065F46" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-base text-ink group-hover:text-accent-deep transition-colors">
                    Reorder (Sắp Xếp Thứ Tự)
                  </div>
                  <div className="text-xs font-bold text-muted mt-0.5">
                    Sắp xếp các thẻ/mục theo trình tự thời gian hoặc logic đúng
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSlideIndex === SCREEN_SETTINGS ? (
          /* CASE B: QUIZ SETTINGS */
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center justify-center py-2">
            {/* Left Column: Square Media Box */}
            <div className="w-full md:w-5/12 flex justify-center">
              <div className="quiz-studio-media-box w-full max-w-[340px] md:max-w-[360px] aspect-square relative overflow-hidden group flex flex-col items-center justify-center text-center p-3">
                {coverMedia ? (
                  <>
                    <img
                      src={coverMedia}
                      alt="Cover"
                      className="w-full h-full object-cover rounded-2xl shadow-sm"
                    />
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => openMediaPicker('cover')}
                        className="pill-btn-primary px-5 py-2.5 text-xs font-bold text-accent-ink shadow-md cursor-pointer"
                      >
                        Đổi ảnh bìa
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <button
                      type="button"
                      onClick={() => openMediaPicker('cover')}
                      className="pill-btn-primary px-5 py-2.5 text-xs font-bold text-accent-ink shadow-md mb-3 cursor-pointer"
                    >
                      + Thêm ảnh bìa
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Settings Form Container Card */}
            <div className="w-full md:w-7/12 max-w-[480px]">
              <div className="quiz-studio-container flex flex-col gap-4 text-ink shadow-md">
                {/* Quiz Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="quiz-studio-tab-badge quiz-tab-badge-cyan">Tên bộ Quiz (Quiz name)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bắt buộc nhập tiêu đề bộ câu hỏi…"
                    className="quiz-studio-field-input w-full px-4 py-2.5 text-base"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="quiz-studio-tab-badge quiz-tab-badge-dark">Mô tả (Description)</span>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả nội dung của bộ câu hỏi…"
                    className="quiz-studio-field-input w-full px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                {/* Category overview & Rules */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="quiz-studio-tab-badge quiz-tab-badge-dark">Quy tắc cấu trúc Quiz</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-paper-2 border border-rule text-xs font-bold text-ink space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted">
                        <Target className="w-3.5 h-3.5 text-accent-deep" />
                        <span>Bộ Câu Hỏi Chính (MAIN):</span>
                      </span>
                      <span className="font-extrabold text-accent-deep num">
                        {mainQuestions.length} / 3 câu tối thiểu
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted">
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span>Bộ Tie-Break Sinh Tử:</span>
                      </span>
                      <span className="font-extrabold text-rose-600 num">
                        {tieBreakQuestions.length} / 2 câu tối thiểu
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSlide ? (
          /* CASE C: SLIDE QUESTION EDITOR WITH 4 DYNAMIC QUESTION TYPES */
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center justify-center py-2">
            {/* Left Column: Square Media Box */}
            <div className="w-full md:w-5/12 flex justify-center">
              <div className="quiz-studio-media-box w-full max-w-[340px] md:max-w-[360px] aspect-square relative overflow-hidden group flex flex-col items-center justify-center text-center p-3">
                {activeSlide.media ? (
                  <>
                    <img
                      src={activeSlide.media}
                      alt="Slide Media"
                      className="w-full h-full object-cover rounded-2xl shadow-sm"
                    />
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => openMediaPicker('slide')}
                        className="pill-btn-primary px-4 py-2 text-xs font-bold text-accent-ink shadow cursor-pointer"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSlideField('media', '')}
                        className="px-3.5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow cursor-pointer"
                      >
                        Gỡ ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <button
                      type="button"
                      onClick={() => openMediaPicker('slide')}
                      className="pill-btn-primary px-5 py-2.5 text-xs font-bold text-accent-ink shadow-md mb-2 cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>+ Thêm ảnh</span>
                    </button>
                    <span className="text-[11px] font-bold text-muted">Ảnh minh họa cho slide</span>
                  </div>
                )}

                {/* Top Corner Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
                  <div className="px-2.5 py-1 rounded-full bg-ink/75 backdrop-blur-xs text-paper text-xs font-black shadow flex items-center gap-1">
                    {getTypeShortIcon(activeSlide.type)}
                    <span>#{activeSlideIndex + 1}</span>
                  </div>
                </div>

                {/* Bottom Overlay Controls (Slide Navigation Arrows) */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeSlideIndex === 0}
                    onClick={() => moveSlide(activeSlideIndex, 'LEFT')}
                    title="Di chuyển sang trái"
                    className="w-7 h-7 rounded-full bg-card/90 hover:bg-card text-ink flex items-center justify-center border border-rule shadow-sm disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeSlideIndex === currentQuestions.length - 1}
                    onClick={() => moveSlide(activeSlideIndex, 'RIGHT')}
                    title="Di chuyển sang phải"
                    className="w-7 h-7 rounded-full bg-card/90 hover:bg-card text-ink flex items-center justify-center border border-rule shadow-sm disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Form Container Card per Question Type */}
            <div className="w-full md:w-7/12 max-w-[480px]">
              <div className="quiz-studio-container flex flex-col gap-3.5 text-ink shadow-md">
                {/* Type Switcher Segmented Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-rule">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-muted">
                      Dạng câu hỏi:
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-paper-2 p-1 rounded-xl border border-rule">
                    <button
                      type="button"
                      onClick={() => changeActiveSlideType('buttons')}
                      title="1 trong 4 câu đúng"
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        activeSlide.type === 'buttons'
                          ? 'bg-accent text-accent-ink shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      <span className="hidden sm:inline">1 Đúng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeActiveSlideType('checkboxes')}
                      title="Nhiều câu đúng"
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        activeSlide.type === 'checkboxes'
                          ? 'bg-accent text-accent-ink shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span className="hidden sm:inline">Nhiều Đúng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeActiveSlideType('type_answer')}
                      title="Nhập đáp án từ bàn phím"
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        activeSlide.type === 'type_answer'
                          ? 'bg-accent text-accent-ink shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Type className="w-3 h-3" />
                      <span className="hidden sm:inline">Nhập</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeActiveSlideType('reorder')}
                      title="Sắp xếp theo thứ tự"
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        activeSlide.type === 'reorder'
                          ? 'bg-accent text-accent-ink shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <ListOrdered className="w-3 h-3" />
                      <span className="hidden sm:inline">Thứ Tự</span>
                    </button>
                  </div>
                </div>

                {/* 1. Common: Question Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="quiz-studio-tab-badge quiz-tab-badge-cyan">
                      Nội dung câu hỏi (Question)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={activeSlide.content}
                    onChange={(e) => updateSlideField('content', e.target.value)}
                    placeholder="Bắt buộc nhập nội dung câu hỏi…"
                    className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold resize-none"
                  />
                </div>

                {/* 2. DYNAMIC FIELDS ACCORDING TO SLIDE TYPE */}

                {/* TYPE 1: BUTTONS (1 trong 4 câu đúng) */}
                {activeSlide.type === 'buttons' && (
                  <>
                    {/* Correct Answer */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="quiz-studio-tab-badge quiz-tab-badge-green">
                            Đáp án đúng (Correct answer)
                          </span>
                          {!activeSlide.correctAnswer.trim() && (
                            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                              !
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activeSlide.correctAnswer}
                        onChange={(e) => updateSlideField('correctAnswer', e.target.value)}
                        placeholder="Bắt buộc nhập đáp án chính xác…"
                        className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold border-emerald-400 bg-emerald-50/40"
                      />
                    </div>

                    {/* False Answers */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="quiz-studio-tab-badge quiz-tab-badge-rose">
                            3 Đáp án sai (False answers)
                          </span>
                          {!activeSlide.falseAnswers[0].trim() && (
                            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                              !
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={activeSlide.falseAnswers[0]}
                          onChange={(e) => updateFalseAnswer(0, e.target.value)}
                          placeholder="Đáp án sai 1 (Bắt buộc)…"
                          className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold border-rose-200 bg-rose-50/30"
                        />
                        <input
                          type="text"
                          value={activeSlide.falseAnswers[1]}
                          onChange={(e) => updateFalseAnswer(1, e.target.value)}
                          placeholder="Đáp án sai 2 (Tùy chọn)…"
                          className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold border-rose-200 bg-rose-50/30"
                        />
                        <input
                          type="text"
                          value={activeSlide.falseAnswers[2]}
                          onChange={(e) => updateFalseAnswer(2, e.target.value)}
                          placeholder="Đáp án sai 3 (Tùy chọn)…"
                          className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold border-rose-200 bg-rose-50/30"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TYPE 2: CHECKBOXES (Nhiều câu đúng) */}
                {activeSlide.type === 'checkboxes' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="quiz-studio-tab-badge quiz-tab-badge-green">
                          Các lựa chọn & Đánh dấu đáp án đúng
                        </span>
                        {!activeSlide.checkboxOptions.some((o) => o.isCorrect && o.text.trim()) && (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {activeSlide.checkboxOptions.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCheckboxOptionCorrect(optIdx)}
                            className={`quiz-checkbox-toggle ${
                              opt.isCorrect
                                ? 'quiz-checkbox-toggle-correct'
                                : 'quiz-checkbox-toggle-wrong'
                            }`}
                            title={opt.isCorrect ? 'Đáp án đúng (Click để đổi)' : 'Đáp án sai (Click để đổi)'}
                          >
                            {opt.isCorrect ? '✓' : '✕'}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateCheckboxOptionText(optIdx, e.target.value)}
                            placeholder={`Lựa chọn ${optIdx + 1} (${optIdx === 0 ? 'Bắt buộc' : 'Tùy chọn'})…`}
                            className={`quiz-studio-field-input flex-1 px-4 py-2 text-sm font-bold ${
                              opt.isCorrect ? 'border-emerald-400 bg-emerald-50/30' : ''
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-muted mt-1.5 italic">
                      Click vào biểu tượng nút ở đầu dòng để chuyển đổi giữa Đúng [✓] và Sai [✕].
                    </p>
                  </div>
                )}

                {/* TYPE 3: TYPE ANSWER (Nhập đáp án) */}
                {activeSlide.type === 'type_answer' && (
                  <div>
                    {/* Primary Answer */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="quiz-studio-tab-badge quiz-tab-badge-green">
                            Đáp án chính xác (Primary Answer)
                          </span>
                          {!activeSlide.primaryAnswer.trim() && (
                            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                              !
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activeSlide.primaryAnswer}
                        onChange={(e) => updateSlideField('primaryAnswer', e.target.value)}
                        placeholder="Bắt buộc nhập câu trả lời chuẩn xác…"
                        className="quiz-studio-field-input w-full px-4 py-2 text-sm font-bold border-emerald-400 bg-emerald-50/40"
                      />
                    </div>

                    {/* Accepted Alternative Answers */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="quiz-studio-tab-badge quiz-tab-badge-dark">
                          Các đáp án khác được chấp nhận
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {activeSlide.acceptedAnswers.map((alt, altIdx) => (
                          <div key={altIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={alt}
                              onChange={(e) => updateAcceptedAnswer(altIdx, e.target.value)}
                              placeholder={`Cách viết hoặc từ đồng nghĩa khác #${altIdx + 1}…`}
                              className="quiz-studio-field-input flex-1 px-4 py-1.5 text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => removeAcceptedAnswer(altIdx)}
                              className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold flex items-center justify-center text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center mt-2">
                        <button
                          type="button"
                          onClick={addAcceptedAnswer}
                          className="px-3.5 py-1.5 rounded-full border border-dashed border-rule hover:border-ink text-muted hover:text-ink text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Thêm đáp án chấp nhận khác
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TYPE 4: REORDER (Sắp xếp theo thứ tự) */}
                {activeSlide.type === 'reorder' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="quiz-studio-tab-badge quiz-tab-badge-green">
                          Các mục theo thứ tự đúng (1 → 4)
                        </span>
                        {(!activeSlide.orderItems[0].trim() || !activeSlide.orderItems[1].trim()) && (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {activeSlide.orderItems.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <span className="quiz-reorder-badge">{itemIdx + 1}.</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateOrderItem(itemIdx, e.target.value)}
                            placeholder={`Mục thứ ${itemIdx + 1} (${
                              itemIdx < 2 ? 'Bắt buộc' : 'Tùy chọn'
                            })…`}
                            className="quiz-studio-field-input flex-1 px-4 py-2 text-sm font-bold"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-muted mt-1.5 italic">
                      Nhập các sự kiện/thẻ theo thứ tự chuẩn. Khi vào trận, hệ thống sẽ xáo trộn để người chơi sắp xếp lại.
                    </p>
                  </div>
                )}

                {/* 3. Common: Fun Fact / Explanation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="quiz-studio-tab-badge quiz-tab-badge-dark">
                      Giải thích / Ghi chú (Fun fact)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={activeSlide.funFact || ''}
                    onChange={(e) => updateSlideField('funFact', e.target.value)}
                    placeholder="Giải thích câu trả lời sau khi kết thúc giờ làm bài (tùy chọn)…"
                    className="quiz-studio-field-input w-full px-4 py-2 text-xs font-medium resize-none"
                  />
                </div>
              </div>

              {/* Slide Actions Toolbar (Thời gian, Nhân bản, Xóa) situated under Right Form Card */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* 1. Time Limit Selector */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-rule shadow-xs">
                  <Clock className="w-4 h-4 text-accent-deep flex-shrink-0" />
                  <span className="text-xs font-bold text-muted whitespace-nowrap">Thời gian:</span>
                  <select
                    value={activeSlide.timeLimit}
                    onChange={(e) => updateSlideField('timeLimit', Number(e.target.value))}
                    className="bg-transparent text-xs font-black text-ink focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                  </select>
                </div>

                {/* 2. Duplicate Slide Button */}
                <button
                  type="button"
                  onClick={() => duplicateSlide(activeSlideIndex)}
                  title="Nhân bản slide này"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-paper-2 border border-rule text-xs font-bold text-ink shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5 text-muted" />
                  <span>Nhân bản</span>
                </button>

                {/* 3. Delete Slide Button */}
                <button
                  type="button"
                  onClick={() => removeSlide(activeSlideIndex)}
                  title="Xóa slide này"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-rose-50 border border-rule text-xs font-bold text-rose-600 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xóa slide</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM THUMBNAIL STRIP BAR (GOLD - WHITE TEMPLATE)    */}
      {/* ======================================================== */}
      <div className="quiz-editor-bottombar h-20 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm gap-4">
        {/* Left & Center: Slide Navigation & Strip */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 flex-1 min-w-0">
          {/* Settings Tab Button (Slide SCREEN_SETTINGS) */}
          <button
            type="button"
            id="btn-thumb-settings"
            onClick={() => setActiveSlideIndex(SCREEN_SETTINGS)}
            className={`h-11 px-4 rounded-xl border font-black text-xs flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
              activeSlideIndex === SCREEN_SETTINGS
                ? 'bg-accent text-accent-ink border-accent-deep shadow-sm'
                : 'bg-paper-2 text-muted hover:text-ink border-rule'
            }`}
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            <span>Settings</span>
          </button>

          {/* Slide Thumbnails List */}
          <div
            ref={slideStripRef}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (draggedSlideIndex !== null) {
                e.preventDefault();
                handleDropSlide(currentQuestions.length - 1);
              }
            }}
            className="flex items-center gap-2.5"
          >
            {currentQuestions.map((slide, idx) => {
              const isActive = activeSlideIndex === idx;
              const hasError = isSlideIncomplete(slide);
              const isDragging = draggedSlideIndex === idx;
              const isDragOver = dragOverSlideIndex === idx && draggedSlideIndex !== idx;

              return (
                <div
                  key={slide.id || `slide-${idx}`}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedSlideIndex(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSlideIndex !== idx) {
                      setDragOverSlideIndex(idx);
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (dragOverSlideIndex !== idx) {
                      setDragOverSlideIndex(idx);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverSlideIndex === idx) {
                      setDragOverSlideIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropSlide(idx);
                  }}
                  onDragEnd={() => {
                    setDraggedSlideIndex(null);
                    setDragOverSlideIndex(null);
                  }}
                  onClick={() => setActiveSlideIndex(idx)}
                  title={`Slide #${idx + 1} - Kéo thả để đổi thứ tự`}
                  className={`quiz-slide-thumb group select-none ${
                    isActive ? 'active' : ''
                  } ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                >
                  <div className="flex items-center gap-1 pointer-events-none">
                    <span>{idx + 1}</span>
                    <span className="text-[10px] opacity-70">{getTypeShortIcon(slide.type)}</span>
                  </div>

                  {hasError && <span className="quiz-badge-warning-dot pointer-events-none">!</span>}

                  {currentQuestions.length > 1 && (
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlide(idx);
                      }}
                      title="Xóa slide"
                      className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black opacity-0 group-hover:opacity-100 flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Slide (+) Button (Opens Add Slide Picker) */}
          <button
            type="button"
            id="btn-bottom-add"
            onClick={openAddSlideScreen}
            title="Thêm câu hỏi mới (Chọn dạng slide)"
            className={`w-11 h-11 rounded-full text-accent-ink flex items-center justify-center font-black text-2xl flex-shrink-0 cursor-pointer shadow-md transition-transform hover:scale-105 ${
              activeSlideIndex === SCREEN_ADD_SLIDE
                ? 'bg-accent border-2 border-accent-deep shadow-md'
                : 'pill-btn-primary'
            }`}
          >
            +
          </button>
        </div>

        {/* Right Corner: Thư Viện, Preview, Done (Footer Góc Dưới Phải) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMyQuizzesModalOpen(true)}
            className="pill-btn-secondary h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
          >
            <FolderOpen className="w-4 h-4 text-muted" />
            <span className="hidden md:inline">Thư Viện</span>
            <span className="px-1.5 py-0.2 rounded-full bg-paper-3 text-muted text-[10px] font-bold num">
              {myQuizzes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="pill-btn-secondary h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-muted" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveQuiz}
            disabled={saving}
            className="pill-btn-primary h-10 px-4 sm:px-5 text-xs sm:text-sm font-bold text-accent-ink flex items-center gap-1.5 whitespace-nowrap shadow-md cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="whitespace-nowrap">Đang lưu…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="whitespace-nowrap">Done (Lưu & Gửi)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODALS & OVERLAYS                                     */}
      {/* ======================================================== */}

      {/* Media Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card border-2 border-rule rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="text-lg font-black text-ink">
                {mediaTarget === 'cover' ? 'Chọn Ảnh Bìa Quiz' : 'Chọn Ảnh Minh Họa Câu Hỏi'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-paper-2 flex items-center justify-center text-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">
                  Nhập link ảnh trực tiếp (URL):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customMediaUrl}
                    onChange={(e) => setCustomMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="quiz-studio-field-input flex-1 px-4 py-2 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customMediaUrl.trim()) selectMedia(customMediaUrl.trim());
                    }}
                    className="pill-btn-primary px-4 py-2 text-xs font-bold text-accent-ink"
                  >
                    Dùng URL này
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted mb-2 block">
                  Hoặc chọn từ bộ sưu tập có sẵn:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {PRESET_CARDS.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectMedia(imgUrl)}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-rule hover:border-accent-deep transition-colors group cursor-pointer"
                    >
                      <img
                        src={imgUrl}
                        alt={`Card ${i}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border-2 border-rule rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div>
                <h3 className="text-lg font-black text-ink">{title || 'Xem Trước Bộ Quiz'}</h3>
                <p className="text-xs font-bold text-muted">
                  Slide {activeSlideIndex >= 0 ? activeSlideIndex + 1 : 1} / {currentQuestions.length} ({getTypeBadgeName(activeSlide?.type || 'buttons')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-paper-2 flex items-center justify-center text-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            {activeSlide && (
              <div className="space-y-4">
                {activeSlide.media && (
                  <div className="w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden border border-rule shadow-sm">
                    <img
                      src={activeSlide.media}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-paper-2 border border-rule">
                  <h4 className="text-base font-extrabold text-ink mb-1">
                    {activeSlide.content || '(Chưa nhập nội dung câu hỏi)'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted">
                    <Clock className="w-3.5 h-3.5 text-accent-deep" />
                    <span>Thời gian làm bài: {activeSlide.timeLimit} giây</span>
                  </div>
                </div>

                {/* Preview for Buttons */}
                {activeSlide.type === 'buttons' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 font-bold text-emerald-800 text-sm flex items-center justify-between">
                      <span>{activeSlide.correctAnswer || '(Đáp án đúng)'}</span>
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                        ĐÚNG
                      </span>
                    </div>
                    {activeSlide.falseAnswers.map((ans, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-paper-2 border border-rule font-bold text-muted text-sm"
                      >
                        {ans || `(Đáp án sai ${i + 1})`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview for Checkboxes */}
                {activeSlide.type === 'checkboxes' && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-muted">Chọn các đáp án đúng:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeSlide.checkboxOptions.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-2xl border-2 font-bold text-sm flex items-center justify-between ${
                            opt.isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                              : 'bg-paper-2 border-rule text-muted'
                          }`}
                        >
                          <span>{opt.text || `(Lựa chọn ${i + 1})`}</span>
                          {opt.isCorrect && (
                            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                              ĐÚNG
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview for Type Answer */}
                {activeSlide.type === 'type_answer' && (
                  <div className="p-4 rounded-2xl bg-paper-2 border border-rule space-y-2">
                    <label className="text-xs font-black text-muted block">
                      Thí sinh nhập đáp án vào ô:
                    </label>
                    <div className="p-3 rounded-xl bg-paper border border-rule font-bold text-sm text-muted">
                      [ Ô nhập từ bàn phím ]
                    </div>
                    <div className="text-xs font-bold text-ink">
                      <span className="text-emerald-700 font-black">Đáp án chuẩn: </span>
                      <span>{activeSlide.primaryAnswer || '(Chưa điền)'}</span>
                    </div>
                    {activeSlide.acceptedAnswers.length > 0 && (
                      <div className="text-xs font-bold text-muted">
                        <span>Chấp nhận thêm: </span>
                        {activeSlide.acceptedAnswers.filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Preview for Reorder */}
                {activeSlide.type === 'reorder' && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-muted">
                      Thứ tự chuẩn (Hệ thống sẽ xáo trộn cho người chơi):
                    </p>
                    <div className="space-y-1.5">
                      {activeSlide.orderItems.map((item, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-paper-2 border border-rule font-bold text-sm text-ink flex items-center gap-3"
                        >
                          <span className="quiz-reorder-badge">{i + 1}.</span>
                          <span>{item || `(Mục ${i + 1})`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSlide.funFact && (
                  <div className="p-3.5 rounded-2xl bg-paper-2 border border-rule text-xs font-medium text-ink">
                    <span className="font-black text-accent-deep block mb-1">Ghi chú giải thích:</span>
                    {activeSlide.funFact}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Quizzes Modal */}
      {isMyQuizzesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card border-2 border-rule rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="text-lg font-black text-ink">Thư Viện Bài Thi Của Tôi</h3>
              <button
                type="button"
                onClick={() => setIsMyQuizzesModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-paper-2 flex items-center justify-center text-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            {loadingMyQuizzes ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-accent-deep" />
              </div>
            ) : myQuizzes.length === 0 ? (
              <div className="py-8 text-center text-muted font-bold text-sm">
                Bạn chưa có bộ câu hỏi nào được lưu!
              </div>
            ) : (
              <div className="space-y-2.5">
                {myQuizzes.map((qz) => (
                  <div
                    key={qz.id}
                    className="p-3.5 rounded-2xl border border-rule hover:border-accent-deep bg-paper-2 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <h4 className="font-black text-sm text-ink">{qz.title}</h4>
                      <p className="text-xs font-bold text-muted">
                        {qz.mainCount} câu chính • {qz.tieBreakCount} câu Tie-Break •{' '}
                        <span
                          className={`font-black ${
                            qz.status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {qz.status}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadExistingQuiz(qz.id)}
                      className="pill-btn-primary px-3.5 py-1.5 text-xs font-bold text-accent-ink"
                    >
                      Nạp bộ này
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
