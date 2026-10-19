import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const quiz = await prisma.quizSet.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, role: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ câu hỏi!' },
        { status: 404 }
      );
    }

    const formattedQuestions = quiz.questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = ['A', 'B', 'C', 'D'];
      }
      return {
        id: q.id,
        category: q.category,
        content: q.content,
        options: parsedOptions,
        correctIndex: q.correctIndex,
        timeLimit: q.timeLimit,
        orderIndex: q.orderIndex,
      };
    });

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: formattedQuestions,
      },
    });
  } catch (error: any) {
    console.error('Fetch quiz detail error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải chi tiết bộ câu hỏi!' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Admin mới có quyền duyệt hoặc từ chối!' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái duyệt không hợp lệ!' },
        { status: 400 }
      );
    }

    const updated = await prisma.quizSet.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      quiz: updated,
      message: status === 'APPROVED' ? 'Đã duyệt bộ câu hỏi thành công!' : 'Đã từ chối bộ câu hỏi!',
    });
  } catch (error: any) {
    console.error('Update quiz status error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật trạng thái!' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập!' },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.quizSet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ câu hỏi!' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && existing.authorId !== user.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa bộ câu hỏi này!' },
        { status: 403 }
      );
    }

    await prisma.quizSet.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bộ câu hỏi thành công!',
    });
  } catch (error: any) {
    console.error('Delete quiz error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa bộ câu hỏi!' },
      { status: 500 }
    );
  }
}
