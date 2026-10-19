import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.question.deleteMany();
  await prisma.quizSet.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@quiz.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.create({
    data: {
      username: 'editor',
      email: 'editor@quiz.com',
      passwordHash,
      role: 'EDITOR',
    },
  });

  console.log('Seeding Quiz Set 1: Kiến Thức Tổng Hợp...');
  await prisma.quizSet.create({
    data: {
      title: 'Đấu Trường Kiến Thức Tổng Hợp',
      description: 'Thử thách trí tuệ với các câu hỏi văn hóa, địa lý, lịch sử và đời sống phong phú.',
      status: 'APPROVED',
      authorId: admin.id,
      questions: {
        create: [
          // 6 MAIN questions
          {
            category: 'MAIN',
            content: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là thành phố nào?',
            options: JSON.stringify(['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế']),
            correctIndex: 0,
            timeLimit: 15,
            orderIndex: 1,
          },
          {
            category: 'MAIN',
            content: 'Đỉnh núi nào được mệnh danh là "Nóc nhà Đông Dương"?',
            options: JSON.stringify(['Núi Bà Đen', 'Fansipan', 'Ngọc Linh', 'Pú Luông']),
            correctIndex: 1,
            timeLimit: 15,
            orderIndex: 2,
          },
          {
            category: 'MAIN',
            content: 'Hành tinh nào trong Hệ Mặt Trời được gọi là "Hành tinh Đỏ"?',
            options: JSON.stringify(['Sao Kim', 'Sao Thủy', 'Sao Hỏa', 'Sao Mộc']),
            correctIndex: 2,
            timeLimit: 15,
            orderIndex: 3,
          },
          {
            category: 'MAIN',
            content: 'Tác phẩm văn học "Truyện Kiều" là kiệt tác của đại thi hào nào?',
            options: JSON.stringify(['Nguyễn Khuyến', 'Nguyễn Du', 'Hồ Xuân Hương', 'Cao Bá Quát']),
            correctIndex: 1,
            timeLimit: 15,
            orderIndex: 4,
          },
          {
            category: 'MAIN',
            content: 'Vịnh biển nào của Việt Nam 2 lần được UNESCO công nhận là Di sản Thiên nhiên Thế giới?',
            options: JSON.stringify(['Vịnh Vân Phong', 'Vịnh Nha Trang', 'Vịnh Hạ Long', 'Vịnh Cam Ranh']),
            correctIndex: 2,
            timeLimit: 15,
            orderIndex: 5,
          },
          {
            category: 'MAIN',
            content: 'Đơn vị tiền tệ chính thức của Nhật Bản là gì?',
            options: JSON.stringify(['Yuan (Tệ)', 'Won', 'Dollar', 'Yen (Yên)']),
            correctIndex: 3,
            timeLimit: 15,
            orderIndex: 6,
          },
          // 4 TIE_BREAK questions
          {
            category: 'TIE_BREAK',
            content: 'Ai là người đầu tiên bay vào không gian vũ trụ?',
            options: JSON.stringify(['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'Phạm Tuân']),
            correctIndex: 1,
            timeLimit: 10,
            orderIndex: 1,
          },
          {
            category: 'TIE_BREAK',
            content: 'Kim tự tháp Giza lớn nhất thế giới nằm ở quốc gia nào?',
            options: JSON.stringify(['Ai Cập', 'Hy Lạp', 'Mexico', 'Ấn Độ']),
            correctIndex: 0,
            timeLimit: 10,
            orderIndex: 2,
          },
          {
            category: 'TIE_BREAK',
            content: 'Nguyên tố hóa học nào chiếm tỉ lệ lớn nhất trong không khí Trái Đất?',
            options: JSON.stringify(['Oxy', 'Cacbonic', 'Nitơ', 'Hydro']),
            correctIndex: 2,
            timeLimit: 10,
            orderIndex: 3,
          },
          {
            category: 'TIE_BREAK',
            content: 'Đại dương nào có diện tích lớn nhất trên Trái Đất?',
            options: JSON.stringify(['Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương', 'Thái Bình Dương']),
            correctIndex: 3,
            timeLimit: 10,
            orderIndex: 4,
          },
        ],
      },
    },
  });

  console.log('Seeding Quiz Set 2: Khoa Học & Công Nghệ...');
  await prisma.quizSet.create({
    data: {
      title: 'Đấu Trường Khoa Học & Công Nghệ',
      description: 'Chinh phục đấu trường AI, lập trình, internet và những phát minh làm thay đổi nhân loại.',
      status: 'APPROVED',
      authorId: editor.id,
      questions: {
        create: [
          // 6 MAIN questions
          {
            category: 'MAIN',
            content: 'Ai được xem là cha đẻ của hệ điều hành mã nguồn mở Linux?',
            options: JSON.stringify(['Bill Gates', 'Linus Torvalds', 'Steve Jobs', 'Dennis Ritchie']),
            correctIndex: 1,
            timeLimit: 15,
            orderIndex: 1,
          },
          {
            category: 'MAIN',
            content: 'Từ viết tắt "AI" trong lĩnh vực khoa học máy tính có nghĩa là gì?',
            options: JSON.stringify([
              'Automated Interface',
              'Advanced Internet',
              'Artificial Intelligence',
              'Application Integration',
            ]),
            correctIndex: 2,
            timeLimit: 15,
            orderIndex: 2,
          },
          {
            category: 'MAIN',
            content: 'Giao thức bảo mật phổ biến nhất cho trang web trên trình duyệt hiện nay là gì?',
            options: JSON.stringify(['FTP', 'HTTP', 'HTTPS', 'SSH']),
            correctIndex: 2,
            timeLimit: 15,
            orderIndex: 3,
          },
          {
            category: 'MAIN',
            content: 'Ngôn ngữ lập trình nào thường được sử dụng phổ biến nhất để xây dựng giao diện web động trên trình duyệt?',
            options: JSON.stringify(['JavaScript', 'C++', 'Java', 'Rust']),
            correctIndex: 0,
            timeLimit: 15,
            orderIndex: 4,
          },
          {
            category: 'MAIN',
            content: 'Vận tốc ánh sáng trong chân không xấp xỉ khoảng bao nhiêu km/s?',
            options: JSON.stringify(['30.000 km/s', '300.000 km/s', '3.000.000 km/s', '150.000 km/s']),
            correctIndex: 1,
            timeLimit: 15,
            orderIndex: 5,
          },
          {
            category: 'MAIN',
            content: 'Công ty nào đã phát triển mô hình ngôn ngữ ChatGPT gây sốt toàn cầu?',
            options: JSON.stringify(['Google', 'Meta', 'OpenAI', 'Microsoft']),
            correctIndex: 2,
            timeLimit: 15,
            orderIndex: 6,
          },
          // 4 TIE_BREAK questions
          {
            category: 'TIE_BREAK',
            content: 'Byte là đơn vị thông tin bao gồm bao nhiêu bit?',
            options: JSON.stringify(['4 bit', '8 bit', '16 bit', '32 bit']),
            correctIndex: 1,
            timeLimit: 10,
            orderIndex: 1,
          },
          {
            category: 'TIE_BREAK',
            content: 'Nhà khoa học nào đã phát minh ra thuyết Tương đối hẹp và Thuyết tương đối rộng?',
            options: JSON.stringify(['Isaac Newton', 'Albert Einstein', 'Nikola Tesla', 'Galileo Galilei']),
            correctIndex: 1,
            timeLimit: 10,
            orderIndex: 2,
          },
          {
            category: 'TIE_BREAK',
            content: 'Năm nào mạng toàn cầu World Wide Web (WWW) được Tim Berners-Lee công bố rộng rãi?',
            options: JSON.stringify(['1985', '1989', '1991', '1995']),
            correctIndex: 2,
            timeLimit: 10,
            orderIndex: 3,
          },
          {
            category: 'TIE_BREAK',
            content: 'Trong cấu trúc bộ nhớ máy tính, loại bộ nhớ nào có tốc độ truy xuất nhanh nhất đối với CPU?',
            options: JSON.stringify(['RAM', 'Ổ cứng SSD', 'Thanh ghi (Register / Cache L1)', 'ROM']),
            correctIndex: 2,
            timeLimit: 10,
            orderIndex: 4,
          },
        ],
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
