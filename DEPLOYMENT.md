# MASTER SPECIFICATION: ĐẤU TRƯỜNG SINH TỒN TRÍ TUỆ (QUIZ BATTLE ROYALE)

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Xây dựng nền tảng web game trắc nghiệm thời gian thực (Real-time Multiplayer Quiz) kết hợp cơ chế sinh tồn (Battle Royale / Rung Chuông Vàng). Người chơi tham gia phòng, trả lời câu hỏi, bị trừ mạng khi sai và cạnh tranh để trở thành người sống sót cuối cùng.

---

## 2. KIẾN TRÚC CÔNG NGHỆ & CẤU TRÚC THƯ MỤC (TECH STACK & ARCHITECTURE)

### 2.1. Tech Stack Bắt Buộc
* **Runtime & Framework:** Next.js 14+ (App Router) chạy thông qua **Custom Node.js Server (`server.ts`)** kết hợp Express & Socket.io trên cùng một port (mặc định `3000`) để giữ trạng thái In-Memory (`Map`) ổn định và không bị lỗi CORS hay Serverless cold-start.
* **Language:** TypeScript (Strict mode).
* **Styling & UI:** TailwindCSS, Shadcn/UI (hoặc Radix UI), Lucide Icons, Framer Motion / Canvas-confetti (cho hiệu ứng mất máu, chuyển cảnh Tie-Break và pháo hoa chiến thắng).
* **State Management (Client):** Zustand.
* **Database & ORM:** SQLite (dùng cho môi trường local/dev để chạy ngay không cần cài DB rời) hoặc PostgreSQL + **Prisma ORM**.
* **Authentication:** JWT lưu trong HTTP-Only Cookie hoặc `localStorage` cho Admin/Editor; Cơ chế `playerToken` (UUID lưu ở `localStorage`) cho Player (hỗ trợ chơi ngay không cần đăng nhập và chống mất kết nối khi F5).

### 2.2. Cấu Trúc Thư Mục Chuẩn
```text
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Dữ liệu mẫu (Admin, Editor, 2 bộ Quiz duyệt sẵn)
├── src/
│   ├── server/
│   │   ├── index.ts           # Custom Node Server tích hợp Next.js + Socket.io
│   │   ├── socketHandler.ts   # Xử lý toàn bộ sự kiện Socket.io
│   │   ├── gameEngine.ts      # State Machine, Timer, Logic Sinh Tồn & Tie-Break
│   │   └── roomStore.ts       # In-Memory Map lưu trạng thái các phòng chơi
│   ├── app/
│   │   ├── page.tsx           # Màn hình chính (Trái: Editor CTA, Phải: Join Room, Dưới: Quiz Grid)
│   │   ├── login/page.tsx     # Đăng nhập / Đăng ký cho Admin & Editor
│   │   ├── editor/page.tsx    # Màn hình Quiz Editor tạo/sửa bộ câu hỏi
│   │   ├── admin/page.tsx     # Màn hình Admin duyệt/xóa bộ câu hỏi
│   │   ├── room/[roomId]/page.tsx # Màn hình Phòng Đợi (Lobby) & Đấu Trường (Arena)
│   │   └── api/               # REST APIs cho Auth, Quiz CRUD, Admin Approval
│   ├── components/            # Các UI Components chia theo tính năng
│   ├── store/                 # Zustand store quản lý state phía Client
│   └── types/
│       └── game.ts            # TypeScript Interfaces dùng chung cho cả Client & Server
└── package.json
```

---

## 3. PHÂN QUYỀN NGƯỜI DÙNG (USER ROLES & FLOWS)

1. **Admin (`ROLE = ADMIN`):**
   * Quản lý toàn bộ các bộ câu hỏi (Quiz Sets) trên hệ thống.
   * Xem chi tiết câu hỏi (cả câu hỏi Chính và câu hỏi Tie-Break).
   * Duyệt (`APPROVED`), Từ chối (`REJECTED`), hoặc Xóa (`DELETE`) bất kỳ bộ câu hỏi nào.
2. **Quiz Editor (`ROLE = EDITOR`):**
   * Tạo bộ câu hỏi mới, chỉnh sửa hoặc xóa bộ câu hỏi của mình.
   * Mỗi bộ câu hỏi bắt buộc phải cấu hình 2 phần: **Bộ câu hỏi chính (`MAIN`)** và **Bộ câu hỏi phụ (`TIE_BREAK`)**.
   * Khi lưu hoàn tất, trạng thái mặc định là `PENDING` chờ Admin duyệt (Admin tạo thì `APPROVED` luôn).
3. **Player (Không bắt buộc đăng nhập - nhận diện qua `playerToken` & `nickname`):**
   * **Người mở phòng (Host):** Ở màn hình chính, chọn 1 bộ Quiz có sẵn (`APPROVED`) -> Bấm **"Play Now"** -> Nhập Nickname (nếu chưa có) -> Hệ thống tạo phòng với `roomId` (6 ký tự in hoa ngẫu nhiên, VD: `A8F9K2`) -> Chuyển vào Phòng Đợi (`/room/[roomId]`) -> Có nút **Copy Link**, xem danh sách người vào và nút **"Start Game"**. (Mặc định Host cũng là 1 người chơi tham gia trả lời câu hỏi).
   * **Người chơi khác (Participant):** Nhập `roomId` ở khung bên phải màn hình chính hoặc truy cập trực tiếp qua Link do Host chia sẻ (`/room/[roomId]`) -> Nhập Nickname -> Vào Phòng Đợi chờ Host bấm bắt đầu.

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU (PRISMA SCHEMA)

```prisma
datasource db {
  provider = "sqlite" // Dễ dàng đổi sang "postgresql" khi cần
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  EDITOR
  PLAYER
}

enum QuizStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}

enum QuestionCategory {
  MAIN       // Câu hỏi chính
  TIE_BREAK  // Câu hỏi phụ (Tie-break)
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  passwordHash String
  role         Role      @default(EDITOR)
  quizzes      QuizSet[]
  createdAt    DateTime  @default(now())
}

model QuizSet {
  id          String     @id @default(uuid())
  title       String
  description String?
  thumbnail   String?
  status      QuizStatus @default(PENDING)
  authorId    String
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  questions   Question[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Question {
  id            String           @id @default(uuid())
  quizSetId     String
  quizSet       QuizSet          @relation(fields: [quizSetId], references: [id], onDelete: Cascade)
  category      QuestionCategory @default(MAIN)
  content       String
  options       String           // JSON string array 4 phần tử: '["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"]'
  correctIndex  Int              // 0, 1, 2, hoặc 3
  timeLimit     Int              @default(15) // Thời gian trả lời (giây)
  orderIndex    Int              // Thứ tự xuất hiện
}
```

---

## 5. CẤU TRÚC DỮ LIỆU IN-MEMORY & LUẬT SINH TỒN (CORE GAME ENGINE)

### 5.1. TypeScript Interfaces cho Trạng Thái Phòng (`src/types/game.ts`)
AI Agent phải sử dụng chính xác cấu trúc dữ liệu sau cho `roomStore`:

```typescript
export type RoomState = 
  | 'LOBBY' 
  | 'STARTING'          // Đếm ngược 3s trước khi vào trận
  | 'QUESTION_ACTIVE'   // Đang hiện câu hỏi và đếm ngược
  | 'ROUND_RESULT'      // Hiện đáp án đúng & hiệu ứng trừ mạng (5s)
  | 'TIE_BREAK_ALERT'   // Màn hình cảnh báo kích hoạt Tie-Break (4s)
  | 'GAME_OVER';        // Kết thúc, vinh danh người chiến thắng

export type QuestionPoolMode = 'MAIN' | 'TIE_BREAK';

export interface Player {
  playerToken: string;  // Định danh duy nhất lưu ở localStorage (chống mất phiên khi F5)
  socketId: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  lives: number;        // Khởi tạo = 3
  status: 'ALIVE' | 'ELIMINATED';
  score: number;        // Điểm phụ tính theo tốc độ trả lời đúng (dùng khi hết sạch câu hỏi)
  currentAnswerIndex: number | null; // Đáp án đã chọn ở câu hiện tại
  answerTimeMs: number | null;       // Thời gian trả lời câu hiện tại
  eliminatedAtRound: number | null;  // Lưu vòng bị loại để xếp hạng chung cuộc
}

export interface Room {
  roomId: string;
  quizSetId: string;
  quizTitle: string;
  state: RoomState;
  poolMode: QuestionPoolMode;
  initialPlayerCount: number; // Số người chơi lúc bấm Start Game
  roundNumber: number;
  mainQuestions: QuestionData[];
  tieBreakQuestions: QuestionData[];
  currentQuestionIndex: number;
  currentQuestion: QuestionData | null;
  questionStartTime: number;
  timerInterval: NodeJS.Timeout | null;
  players: Map<string, Player>; // Key là playerToken
  winner: Player | null;
}
```

### 5.2. Luật Sinh Tồn & Thuật Toán Chấm Điểm Từng Vòng (Chi Tiết Tuyệt Đối)

#### A. Khởi tạo trận đấu (`start_game`)
* Chỉ cho phép bắt đầu khi số lượng người chơi trong phòng `>= 2`.
* Ghi nhận `initialPlayerCount = players.size`.
* Tất cả người chơi được thiết lập: `lives = 3` (❤️❤️❤️), `status = 'ALIVE'`, `score = 0`.
* `poolMode = 'MAIN'`, `currentQuestionIndex = 0`, `roundNumber = 1`.

#### B. Luồng chạy mỗi câu hỏi (`QUESTION_ACTIVE`)
* Server lấy câu hỏi hiện tại theo `poolMode` và `currentQuestionIndex`.
* **Bảo mật (Anti-Cheat):** Khi gửi sự kiện `new_question` xuống Client, Server **TUYỆT ĐỐI KHÔNG** gửi trường `correctIndex` (chỉ gửi `id`, `content`, `options`, `timeLimit`).
* Chỉ những người chơi có `status === 'ALIVE'` mới được gửi đáp án (`submit_answer`). Những người chơi `ELIMINATED` chỉ xem ở chế độ Khán giả (Spectator).
* Server tính thời gian trả lời: `timeSpentMs = Date.now() - room.questionStartTime`.
* Nếu **tất cả người chơi `ALIVE` đã chọn đáp án** trước khi hết giờ $\rightarrow$ Kết thúc đếm ngược ngay lập tức và chuyển sang chấm điểm (`evaluateRound`).

#### C. Thuật toán Chấm điểm & Kích hoạt Tie-Break (`evaluateRound`)
Khi hết giờ hoặc tất cả người còn sống đã trả lời, Server thực hiện tuần tự từ Bước 1 đến Bước 6:

* **Bước 1 (Tính điểm & Trừ mạng tạm thời):**
  Duyệt qua tất cả người chơi đang có `status === 'ALIVE'`:
  * Nếu `currentAnswerIndex === correctIndex`:
    * Giữ nguyên `lives`.
    * Cộng điểm tốc độ: `score += Math.max(100, Math.round(1000 * (1 - answerTimeMs / (timeLimit * 1000))))`.
  * Nếu trả lời SAI hoặc KHÔNG TRẢ LỜI (`currentAnswerIndex === null`):
    * Trừ 1 mạng: `lives = lives - 1`.

* **Bước 2 (Kiểm tra Điều kiện Tie-Break 1: TẤT CẢ CÙNG CHẾT TRONG 1 ROUND):**
  * Kiểm tra xem trong nhóm người chơi đang `ALIVE` ở đầu vòng này, có còn ai giữ được `lives > 0` sau Bước 1 hay không.
  * **Nếu KHÔNG CÒN AI (`survivorsAfterStep1.length === 0`):** (Tức là tất cả những người sống sót trước vòng này đều chỉ còn 1 mạng và đều vừa trả lời sai cùng lúc):
    * **Hồi sinh (Revive):** Tất cả những người chơi vừa bị rớt xuống `0 mạng` ở đúng vòng này được khôi phục lại `lives = 1` và giữ nguyên `status = 'ALIVE'`.
    * **Kích hoạt Tie-Break (nếu đang ở `MAIN`):** Nếu `poolMode === 'MAIN'`, chuyển `poolMode = 'TIE_BREAK'`, đặt lại `currentQuestionIndex = 0`, đánh dấu cờ `triggerReason = 'ALL_DIED_REVIVE'`.
  * **Nếu VẪN CÒN ít nhất 1 người có `lives > 0`:**
    * Những ai có `lives === 0` chính thức bị loại: cập nhật `status = 'ELIMINATED'`, `eliminatedAtRound = roundNumber`.

* **Bước 3 (Kiểm tra Điều kiện Chiến Thắng Duy Nhất):**
  * Đếm số lượng người chơi có `status === 'ALIVE'` (`aliveCount`).
  * Nếu `aliveCount === 1`:
    * Người chơi `ALIVE` duy nhất đó là `winner`.
    * Chuyển trạng thái phòng sang `GAME_OVER` và kết thúc trận đấu!

* **Bước 4 (Kiểm tra Điều kiện Tie-Break 2: CÒN 3 NGƯỜI SỐNG SÓT):**
  * Nếu `poolMode === 'MAIN'` VÀ `aliveCount <= 3` VÀ `aliveCount > 1`:
    * *Lưu ý xử lý Edge Case phòng ít người:*
      * Nếu `initialPlayerCount > 3` (phòng bắt đầu từ 4 người trở lên và nay rụng xuống còn $\le 3$ người) $\rightarrow$ **Chuyển ngay sang `poolMode = 'TIE_BREAK'`**, `currentQuestionIndex = 0`, `triggerReason = 'TOP_3_SURVIVORS'`.
      * Nếu `initialPlayerCount <= 3` (phòng test chỉ có 2 hoặc 3 người ngay từ đầu): Chỉ kích hoạt điều kiện này khi có ít nhất 1 người chơi đã bị mất mạng (hoặc chỉ còn $\le 2$ người khi bắt đầu là 3 người), để tránh việc vừa vào Câu 1 đã nhảy thẳng vào Tie-Break!

* **Bước 5 (Kiểm tra Điều kiện Tie-Break 3: HẾT BỘ CÂU HỎI CHÍNH):**
  * Nếu `poolMode === 'MAIN'` VÀ `aliveCount > 1` VÀ `currentQuestionIndex + 1 >= mainQuestions.length`:
    * **Chuyển sang `poolMode = 'TIE_BREAK'`**, `currentQuestionIndex = 0`, `triggerReason = 'MAIN_QUESTIONS_EXHAUSTED'`.

* **Bước 6 (Kiểm tra Edge Case: HẾT SẠCH CẢ CÂU HỎI TIE-BREAK):**
  * Nếu đang ở `poolMode === 'TIE_BREAK'` VÀ `currentQuestionIndex + 1 >= tieBreakQuestions.length` mà vẫn còn `aliveCount > 1`:
    * Phân định `winner` trong số những người đang `ALIVE` theo tiêu chí: Người có `lives` cao nhất $\rightarrow$ Nếu bằng mạng thì xét `score` (tốc độ tích lũy) cao nhất. Chuyển sang `GAME_OVER`.

#### D. Chuyển tiếp tự động (Automated Round Transition)
* Sau khi chấm điểm xong, Server phát sự kiện `round_result` (lúc này mới gửi `correctIndex`), dừng **5 giây** để Client chạy hiệu ứng trừ máu (❤️ $\rightarrow$ 🖤) và báo ai bị loại.
* Sau 5 giây:
  * Nếu có `triggerReason` (vừa kích hoạt Tie-Break): Chuyển sang `state = 'TIE_BREAK_ALERT'`, phát sự kiện `tie_break_activated`, dừng **4 giây** để hiển thị màn hình cảnh báo kịch tính trên UI rồi mới phát câu hỏi Tie-Break đầu tiên.
  * Nếu không: Tự động phát câu hỏi tiếp theo (`new_question`).

---

## 6. THIẾT KẾ GIAO DIỆN CHI TIẾT (UI/UX SPECIFICATIONS)

Phong cách thiết kế: **Dark Gaming / Esports Theme** (Tông màu tối Slate-950, điểm nhấn Neon Purple/Indigo cho vòng chính và Crimson Red/Orange rực lửa khi vào vòng Tie-Break).

### 6.1. Màn hình chính (Home Page - `/`)
* **Top Navigation Bar:**
  * Bên trái: Logo + Tên game **"ĐẤU TRƯỜNG SINH TỒN TRÍ TUỆ"**.
  * Bên phải: Nếu chưa đăng nhập thì hiện nút *"Đăng nhập / Đăng ký (Editor & Admin)"*; nếu đã đăng nhập thì hiện tên User, Role Badge, nút vào *"Admin Dashboard"* (nếu là Admin) và nút Đăng xuất.
* **Khu vực Phía Trên (Hero Section - Grid 2 cột bằng nhau trên Desktop):**
  * **Khối Bên Trái (Quiz Editor Card):**
    * Tiêu đề: *"🛠️ Quiz Editor - Kiến Tạo Đấu Trường"*.
    * Mô tả: Tạo bộ câu hỏi chính và câu hỏi sinh tử Tie-Break của riêng bạn.
    * Nút bấm lớn: **"Tạo Bộ Quiz Mới"** (Nếu chưa đăng nhập sẽ mở Modal đăng nhập/đăng ký nhanh hoặc điều hướng tới `/editor`).
  * **Khối Bên Phải (Join Room Card):**
    * Tiêu đề: *"⚔️ Tham Gia Đấu Trường"*.
    * Input 1: Nhập **Nickname** của bạn (lưu tự động vào `localStorage`).
    * Input 2: Nhập **Room ID** (6 ký tự, tự động viết hoa).
    * Nút bấm lớn: **"Vào Phòng Ngay (Join Room)"**.
* **Khu vực Phía Dưới (Available Quizzes Section):**
  * Tiêu đề: *"📚 Các Bộ Câu Hỏi Có Sẵn"* kèm ô tìm kiếm từ khóa.
  * Hiển thị danh sách dạng Grid (3 cột) các bộ câu hỏi đã có `status === 'APPROVED'`.
  * Trên mỗi Card hiển thị: Tên bộ Quiz, Mô tả ngắn, Tác giả, Badge số lượng câu (`X Câu Chính` | `Y Câu Tie-Break`), và nút **"▶️ Play Now (Mở Phòng)"**.
  * Khi bấm **"Play Now"**: Nếu người dùng chưa có Nickname thì bật Modal nhỏ hỏi Nickname $\rightarrow$ Gọi socket `create_room` $\rightarrow$ Chuyển hướng ngay sang `/room/[roomId]`.

### 6.2. Màn hình Quiz Editor (`/editor`)
* Quản lý danh sách các bộ Quiz của tôi (kèm trạng thái `PENDING`, `APPROVED`, `REJECTED`).
* Giao diện Tạo/Sửa bộ Quiz gồm:
  * Thông tin chung: Tiêu đề bộ câu hỏi, Mô tả.
  * **Tab 1 - Bộ Câu Hỏi Chính (`MAIN`):** Thêm/Sửa/Xóa câu hỏi, 4 đáp án A/B/C/D, chọn đáp án đúng, thời gian suy nghĩ (10s, 15s, 20s, 30s).
  * **Tab 2 - Bộ Câu Hỏi Sinh Tử (`TIE_BREAK`):** Giao diện viền đỏ cảnh báo, dùng riêng cho 3 điều kiện Tie-Break.
  * *Validation bắt buộc:* Phải có tối thiểu **3 câu hỏi `MAIN`** và tối thiểu **2 câu hỏi `TIE_BREAK`** mới cho phép bấm nút **"Lưu & Gửi Duyệt"**.

### 6.3. Màn hình Quản trị Admin (`/admin`)
* Bảng thống kê và danh sách toàn bộ các bộ Quiz trên hệ thống.
* Filter theo trạng thái: `Tất cả`, `Chờ duyệt (PENDING)`, `Đã duyệt (APPROVED)`, `Từ chối (REJECTED)`.
* Nút **"Xem chi tiết (Preview)"**: Mở Modal xem toàn bộ câu hỏi Main & Tie-Break và đáp án đúng.
* Nút **"Duyệt (Approve)"**, **"Từ chối (Reject)"**, và **"Xóa vĩnh viễn (Delete)"**.

### 6.4. Màn hình Phòng Đợi & Đấu Trường (`/room/[roomId]`)
Tự động hiển thị giao diện theo `room.state`:
1. **Khi `state === 'LOBBY'` (Phòng Đợi):**
   * Nếu người chơi truy cập trực tiếp bằng link `/room/[roomId]` mà chưa nhập Nickname $\rightarrow$ Hiển thị Modal yêu cầu nhập Nickname trước khi join.
   * Hiển thị **Mã Phòng (`roomId`)** cực lớn và nút **"Copy Link Mời Bạn Bè"**.
   * Danh sách người chơi đang ở trong phòng (cập nhật real-time), có gắn nhãn `👑 Chủ phòng (Host)` cho người mở room.
   * Nếu là **Host**: Hiển thị nút **"🚀 BẮT ĐẦU TRẬN ĐẤU (START GAME)"** (Disable nếu `< 2` người chơi).
   * Nếu là **Người chơi khác**: Hiển thị trạng thái *"Đang chờ chủ phòng bắt đầu trận đấu..."*.
2. **Khi `state === 'QUESTION_ACTIVE' | 'ROUND_RESULT'` (Đấu Trường Sinh Tồn):**
   * **Thanh Trạng Thái Phía Trên (Arena Header):**
     * Hiển thị Chế độ: Badge xanh **"VÒNG CÂU HỎI CHÍNH"** hoặc Badge đỏ rực hiệu ứng nhịp tim **"🔥 VÒNG TIE-BREAK SINH TỬ"**.
     * Đồng hồ đếm ngược dạng thanh tiến trình (Progress bar) + Số giây.
     * Bộ đếm sinh tồn: **"Sống sót: X / Y người"**.
   * **Khu vực Chính Giữa (Question & Options):**
     * Hiển thị câu hỏi hiện tại.
     * 4 đáp án A, B, C, D. Khi bấm chọn một đáp án, khóa nút và hiện trạng thái *"Đã chốt đáp án - Chờ kết quả..."*.
     * Khi sang `ROUND_RESULT`: Tô màu Xanh lá cho đáp án đúng, Đỏ cho đáp án sai.
     * **Chế độ Khán giả (Spectator Mode):** Nếu người chơi có `status === 'ELIMINATED'`, hiện một thanh thông báo phía trên *"💀 BẠN ĐÃ HẾT MẠNG! Bạn đang theo dõi trận đấu với tư cách Khán giả"* và khóa click vào 4 đáp án.
   * **Bảng Sinh Tồn (Live Survival Sidebar / Bottom Grid):**
     * Hiển thị danh sách tất cả người chơi trong phòng sắp xếp theo: Còn sống lên trên, Đã loại xuống dưới.
     * Mỗi người chơi hiển thị: Avatar, Nickname, Trạng thái đã trả lời câu hiện tại hay chưa (`✅` / `⏳`), và **Số mạng bằng icon trái tim (`❤️❤️❤️`, `❤️❤️🖤`, `❤️🖤🖤`, hoặc `💀 Bị loại`)**.
3. **Khi `state === 'TIE_BREAK_ALERT'` (Chuyển cảnh Tie-Break):**
   * Full-screen overlay kịch tính màu đỏ đen trong 4 giây, hiển thị rõ lý do kích hoạt:
     * Nếu `ALL_DIED_REVIVE`: *"⚡ CỨU SINH ĐẶC BIỆT! Tất cả đều gục ngã cùng lúc! Hồi sinh 1 mạng và bước vào loạt đấu TIE-BREAK!"*
     * Nếu `TOP_3_SURVIVORS`: *"🔥 CẢNH BÁO TOP 3! Chỉ còn những chiến binh cuối cùng! Kích hoạt bộ câu hỏi TIE-BREAK!"*
     * Nếu `MAIN_QUESTIONS_EXHAUSTED`: *"⚔️ BẤT PHÂN THẮNG BẠI! Đã hết câu hỏi chính! Bước vào loạt đấu súng TIE-BREAK!"*
4. **Khi `state === 'GAME_OVER'` (Màn hình Chiến Thắng):**
   * Hiệu ứng pháo hoa chúc mừng.
   * Vinh danh **NGƯỜI SỐNG SÓT CUỐI CÙNG (WINNER)** ở bục cao nhất kèm số mạng còn lại và điểm số.
   * Bảng xếp hạng chung cuộc của tất cả người chơi.
   * Nút **"Chơi Lại (Play Again)"** (cho Host reset phòng về Lobby) và nút **"Về Màn Hình Chính"**.

---

## 7. HỢP ĐỒNG SỰ KIỆN SOCKET.IO (SOCKET EVENTS CONTRACT)

### Client gửi lên Server (Client -> Server)
* `create_room`: `{ quizSetId: string, nickname: string, playerToken: string }` -> Callback trả về `{ success: boolean, roomId?: string, error?: string }`.
* `join_room`: `{ roomId: string, nickname: string, playerToken: string }` -> Callback trả về `{ success: boolean, roomState?: PublicRoomState, error?: string }`.
* `start_game`: `{ roomId: string, playerToken: string }` (Chỉ Host mới có quyền gọi).
* `submit_answer`: `{ roomId: string, playerToken: string, answerIndex: number }`.
* `reset_room`: `{ roomId: string, playerToken: string }` (Host đưa phòng về lại Lobby sau khi Game Over).

### Server bắn về Client (Server -> Client)
* `room_state_sync`: Gửi toàn bộ trạng thái phòng (dùng khi mới vào phòng, khi có người ra/vào, hoặc khi F5 kết nối lại).
* `game_countdown`: `{ seconds: 3 }` (Đếm ngược bắt đầu trận).
* `new_question`: `{ roundNumber: number, poolMode: 'MAIN' | 'TIE_BREAK', question: { id, content, options, timeLimit }, aliveCount: number, totalPlayers: number }`.
* `player_answered`: `{ playerToken: string }` (Để UI hiện dấu tick xanh báo người đó đã chọn xong đáp án, không tiết lộ chọn gì).
* `round_result`: `{ correctIndex: number, eliminatedTokens: string[], revivedTokens: string[], players: PublicPlayer[] }`.
* `tie_break_activated`: `{ reason: 'ALL_DIED_REVIVE' | 'TOP_3_SURVIVORS' | 'MAIN_QUESTIONS_EXHAUSTED', message: string }`.
* `game_over`: `{ winner: PublicPlayer, leaderboard: PublicPlayer[] }`.

---

## 8. LỘ TRÌNH THỰC THI TỪNG BƯỚC CHO AI AGENT (EXECUTION PLAN)

**Hướng dẫn bắt buộc cho AI Agent:** Hãy thực hiện tuần tự từng Phase dưới đây để đảm bảo code chạy hoàn chỉnh, không viết code khung (placeholder/TODO) bỏ trống.

### Phase 1: Khởi tạo Cấu trúc, Database & Seed Data
1. Cài đặt dependencies (`next`, `react`, `react-dom`, `express`, `socket.io`, `socket.io-client`, `@prisma/client`, `prisma`, `zustand`, `lucide-react`, `canvas-confetti`, `tsx`, v.v.).
2. Thiết lập `prisma/schema.prisma` và chạy `npx prisma db push`.
3. Viết `prisma/seed.ts` tạo sẵn:
   * Tài khoản Admin (`admin@quiz.com` / `123456`) và Editor (`editor@quiz.com` / `123456`).
   * **2 Bộ Quiz mẫu (`status: APPROVED`)** về chủ đề "Kiến Thức Tổng Hợp" và "Khoa Học & Công Nghệ", mỗi bộ có sẵn **6 câu hỏi `MAIN`** và **4 câu hỏi `TIE_BREAK`** để người dùng có thể bấm "Play Now" chơi thử ngay lập tức.

### Phase 2: Xây dựng Custom Server & Core Game Engine (Socket.io)
1. Viết `src/types/game.ts` định nghĩa đầy đủ các TypeScript interfaces.
2. Viết `src/server/roomStore.ts` và `src/server/gameEngine.ts` cài đặt chính xác toàn bộ State Machine, bộ đếm thời gian tự động (Server Timer), cơ chế Reconnect qua `playerToken`, Host Migration và **6 bước thuật toán Sinh Tồn + 3 điều kiện Tie-Break** ở Mục 5.2.
3. Viết `src/server/index.ts` khởi chạy Next.js cùng Express + Socket.io và cập nhật script `"dev": "tsx src/server/index.ts"` trong `package.json`.

### Phase 3: Xây dựng REST APIs (Auth, Quiz Editor, Admin)
1. Xây dựng API `/api/auth/login` và `/api/auth/register`.
2. Xây dựng API `/api/quizzes` (`GET` lấy danh sách Quiz đã duyệt cho trang chủ và lấy danh sách theo role; `POST` tạo Quiz mới kèm câu hỏi `MAIN` & `TIE_BREAK`).
3. Xây dựng API `/api/quizzes/[id]` (`GET` chi tiết, `PUT` cập nhật, `DELETE` xóa, `PATCH` cho Admin duyệt `APPROVED` / `REJECTED`).

### Phase 4: Xây dựng Giao diện Màn hình chính, Quiz Editor & Admin
1. Xây dựng `src/app/page.tsx` (Màn hình chính): Chia đúng bố cục Bên trái là lối vào Quiz Editor, Bên phải là ô nhập ID vào phòng, Phía dưới là danh sách các bộ câu hỏi có sẵn kèm nút "Play Now".
2. Xây dựng `src/app/login/page.tsx` (có nút đăng nhập nhanh bằng tài khoản Demo Admin/Editor chỉ với 1 click để tiện test).
3. Xây dựng `src/app/editor/page.tsx` cho phép tạo/sửa bộ câu hỏi với 2 tab tách biệt: Câu hỏi chính (`MAIN`) và Câu hỏi phụ (`TIE_BREAK`).
4. Xây dựng `src/app/admin/page.tsx` cho phép Admin xem trước câu hỏi, Duyệt, Từ chối hoặc Xóa bộ câu hỏi.

### Phase 5: Xây dựng Giao diện Phòng Đợi (Lobby) & Đấu Trường Sinh Tồn (Arena)
1. Xây dựng `src/app/room/[roomId]/page.tsx` kết nối với Socket.io.
2. Hoàn thiện giao diện Phòng Đợi (Lobby): Hiển thị mã phòng, nút Copy Link chia sẻ, danh sách người chơi real-time, và nút "Start Game" cho chủ phòng.
3. Hoàn thiện giao diện Đấu Trường (Arena): Thanh đếm ngược, khu vực trả lời câu hỏi, Bảng sinh tồn hiển thị trái tim (`❤️❤️❤️`), chế độ Khán giả khi hết mạng, màn hình cảnh báo đỏ rực khi kích hoạt Tie-Break, và màn hình vinh danh Người Chiến Thắng cuối cùng.