import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const my = searchParams.get('my');
    const all = searchParams.get('all');
    const status = searchParams.get('status');

    const user = getUserFromRequest(req);

    const where: any = {};

    if (my === 'true') {
      if (!user) {
        return NextResponse.json({ error: 'Chưa đăng nhập!' }, { status: 401 });
      }
      where.authorId = user.userId;
    } else if (all === 'true') {
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ Admin mới có quyền xem toàn bộ!' }, { status: 403 });
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }
    } else {
      // Public homepage view: only APPROVED
      where.status = 'APPROVED';
    }

    const quizzes = await prisma.quizSet.findMany({
      where,
      include: {
        author: {
          select: { id: true, username: true, role: true },
        },
        questions: {
          select: { id: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = quizzes.map((q) => {
      const mainCount = q.questions.filter((item) => item.category === 'MAIN').length;
      const tieBreakCount = q.questions.filter((item) => item.category === 'TIE_BREAK').length;
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        thumbnail: q.thumbnail,
        status: q.status,
        author: q.author,
        mainCount,
        tieBreakCount,
        totalQuestions: q.questions.length,
        createdAt: q.createdAt,
      };
    });

    return NextResponse.json({ quizzes: formatted });
  } catch (error: any) {
    console.error('Fetch quizzes error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách bộ câu hỏi!' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để tạo bộ câu hỏi!' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, questions } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Tiêu đề bộ câu hỏi không được để trống!' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Danh sách câu hỏi không hợp lệ!' },
        { status: 400 }
      );
    }

    const mainQuestions = questions.filter((q: any) => q.category === 'MAIN');
    const tieBreakQuestions = questions.filter((q: any) => q.category === 'TIE_BREAK');

    if (mainQuestions.length < 3) {
      return NextResponse.json(
        { error: 'Cần tối thiểu 3 câu hỏi chính (MAIN)!' },
        { status: 400 }
      );
    }

    if (tieBreakQuestions.length < 2) {
      return NextResponse.json(
        { error: 'Cần tối thiểu 2 câu hỏi sinh tử phụ (TIE_BREAK)!' },
        { status: 400 }
      );
    }

    // Validation for each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content || !q.content.trim()) {
        return NextResponse.json(
          { error: `Nội dung câu hỏi thứ ${i + 1} không được để trống!` },
          { status: 400 }
        );
      }
      const optsArray = Array.isArray(q.options)
        ? q.options
        : (q.options && Array.isArray(q.options.options) ? q.options.options : null);

      if (!optsArray || optsArray.length !== 4) {
        return NextResponse.json(
          { error: `Câu hỏi "${q.content.slice(0, 20)}..." phải có đủ 4 đáp án!` },
          { status: 400 }
        );
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
        return NextResponse.json(
          { error: `Chưa chọn đáp án đúng cho câu hỏi thứ ${i + 1}!` },
          { status: 400 }
        );
      }
    }

    // Admin creates -> APPROVED immediately; Editor creates -> PENDING
    const initialStatus = user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const newQuiz = await prisma.quizSet.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        status: initialStatus,
        authorId: user.userId,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            category: q.category === 'TIE_BREAK' ? 'TIE_BREAK' : 'MAIN',
            content: q.content.trim(),
            options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            timeLimit: Number(q.timeLimit) || 15,
            orderIndex: idx + 1,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
      message:
        initialStatus === 'APPROVED'
          ? 'Bộ câu hỏi đã được tạo và duyệt thành công!'
          : 'Bộ câu hỏi đã được gửi đi và đang chờ Admin duyệt!',
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi tạo bộ câu hỏi!' },
      { status: 500 }
    );
  }
}
