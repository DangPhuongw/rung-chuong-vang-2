# 🔔 RUNG CHUÔNG VÀNG 2 — BẢNG THEO DÕI TIẾN ĐỘ & CHECKLIST DỰ ÁN
> **Stack: Next.js 14 (App Router), Express.js + Socket.IO, Tailwind CSS, Prisma (SQLite), Zustand, Web Audio API**

## 📊 BẢNG TỔNG HỢP TIẾN ĐỘ THEO GIAI ĐOẠN

| Giai đoạn | Tổng việc | ☑ Xong | ◐ Đang làm | ☐ Chưa làm | % Hoàn thành | Trọng tâm giai đoạn |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| 0. Khởi tạo & Nền tảng | 4 | 4 | 0 | 0 | 100.0% | Setup repo, Next.js 14, Express + Socket.IO, Prisma SQLite, Hallmark Playful UI |
| 1. Quiz Editor & Dữ liệu | 7 | 5 | 1 | 1 | 71.4% | 4 định dạng câu hỏi, Drag & Drop slide, Bộ Chính/Bộ Phụ, mutateQuestions, Lossless DB |
| 2. Phòng chờ (Lobby) & Bot | 6 | 2 | 1 | 3 | 33.3% | Lobby UI, Web Audio API, RoomStore (đóng gói Bot & thí sinh), QR/PIN, Reconnect |
| 3. Engine Thi đấu Realtime | 7 | 0 | 2 | 5 | 0.0% | Socket.IO Game Loop, chấm điểm 4 dạng câu hỏi, Loại/Cứu trợ, Vòng Phụ (Tie-break), Podium |
| 4. QA, Kiểm thử & Deploy | 4 | 1 | 0 | 3 | 25.0% | 0 lỗi tsc & sloplint, Unit Test, Load test 50-100 kết nối, Docker & Deploy Production |
| **TỔNG CỘNG** | **28** | **12** | **4** | **12** | **42.9%** | **Đã hoàn thành 12/28 hạng mục cốt lõi** |

---

## 📋 CHI TIẾT CHECKLIST TỪNG HẠNG MỤC CÔNG VIỆC

| STT | Checkbox | Hạng mục công việc | Phân hệ | Definition of Done | Trạng thái | Ngày cập nhật | Ghi chú kỹ thuật |
| :---: | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [x] | **Khởi tạo mã nguồn dự án và cấu trúc Next.js 14 (App Router) + TypeScript** | `Core / Setup` | Chạy được dev server, cấu trúc thư mục rõ ràng trên nhánh main | ☑ Xong | 2026-10-26 | Repo: DangPhuongw/rung-chuong-vang-2 |
| 2 | [x] | **Tích hợp Backend realtime với Express.js + Socket.IO và quản lý state bằng Zustand** | `Backend / State` | Kết nối WebSocket hai chiều ổn định giữa Client và Server | ☑ Xong | 2026-10-26 | Express.js + Socket.IO + Zustand |
| 3 | [x] | **Thiết lập cơ sở dữ liệu với Prisma ORM và SQLite** | `Database` | Schema Prisma hoạt động ổn định, kết nối SQLite đọc/ghi thành công | ☑ Xong | 2026-10-26 | Prisma (SQLite) |
| 4 | [x] | **Chuẩn hóa Design System Hallmark Playful (Vàng - Trắng) trên Tailwind CSS** | `UI / UX` | Giao diện độ tương phản cao, thẻ bo góc cartoon đồng bộ toàn hệ thống | ☑ Xong | 2026-10-26 | Hallmark Playful theme |
| 5 | [x] | **Hỗ trợ 4 định dạng câu hỏi: buttons, checkboxes, type_answer, reorder** | `Quiz Editor` | Tạo, hiển thị và chỉnh sửa mượt mà cả 4 dạng câu hỏi trên Editor | ☑ Xong | 2026-10-26 | 1 đáp án, nhiều đáp án, tự luận, sắp xếp |
| 6 | [x] | **Kéo thả (Drag & Drop) slide trực quan ở thanh thumbnail đáy trang** | `Quiz Editor` | Đổi thứ tự câu hỏi mượt mà, cập nhật đúng vị trí index của slide | ☑ Xong | 2026-10-26 | Bottom thumbnail bar Drag & Drop |
| 7 | [x] | **Tối ưu bố cục cố định (100vh overflow-hidden), Header 1 hàng, nút chuyển Bộ Chính / Bộ Phụ trung tâm** | `Quiz Editor` | Không bị cuộn trang ngoài ý muốn, chuyển đổi Bộ Chính / Bộ Phụ rõ ràng, Footer góc phải tinh giản | ☑ Xong | 2026-10-26 | 100vh layout + Main/Sub set toggle |
| 8 | [x] | **Khử trùng lặp mã (DRY) qua cơ chế cập nhật trạng thái slide tập trung (mutateQuestions)** | `Refactor / State` | Mọi thao tác sửa slide đi qua helper tập trung, không lặp logic set state | ☑ Xong | 2026-10-26 | mutateQuestions helper |
| 9 | [x] | **Cơ chế nạp/lưu toàn vẹn (Lossless serialization) cấu trúc 4 dạng câu hỏi vào DB** | `Database / API` | Lưu và tải lại cả 4 dạng câu hỏi từ SQLite mà không mất dữ liệu hay vỡ schema Prisma | ☑ Xong | 2026-10-26 | Lossless JSON/Field serialization |
| 10 | [/] | **Kiểm tra hợp lệ (Validation) đề thi trước khi lưu hoặc mở phòng** | `Quiz Editor` | Báo lỗi rõ khi câu hỏi trống, thiếu đáp án đúng, hoặc Bộ Chính/Bộ Phụ chưa đủ câu | ◐ Đang làm | 2026-10-26 | Cần chặn mở phòng nếu đề chưa hợp lệ |
| 11 | [ ] | **Tính năng Nhân bản (Duplicate) slide câu hỏi & Import/Export đề thi (JSON/CSV)** | `Quiz Editor` | Cho phép sao chép nhanh slide và nhập/xuất file đề thi để tái sử dụng | ☐ Chưa làm |  | Tăng tốc độ soạn đề cho Host |
| 12 | [x] | **Giao diện Phòng chờ (Lobby) chuẩn Hallmark Playful & hiệu ứng âm thanh Web Audio API** | `Lobby / Audio` | Hiển thị mã PIN, danh sách thí sinh, phát âm thanh sống động khi có sự kiện trong Lobby | ☑ Xong | 2026-10-26 | Web Audio API + Hallmark Playful Lobby |
| 13 | [x] | **Khử Feature Envy: Đóng gói toàn bộ logic quản lý Bot và thông tin thí sinh vào RoomStore** | `Store / Architecture` | Component UI không can thiệp trực tiếp vào dữ liệu nội bộ của Bot/Thí sinh, gọi qua RoomStore | ☑ Xong | 2026-10-26 | Encapsulated in RoomStore |
| 14 | [/] | **Mô phỏng hành vi trả lời của Bot cho đủ 4 dạng câu hỏi (buttons, checkboxes, type_answer, reorder)** | `Bot Engine` | Bot tự động nộp đáp án hợp lệ theo tỷ lệ đúng và thời gian phản hồi ngẫu nhiên cho cả 4 loại câu | ◐ Đang làm | 2026-10-26 | Mở rộng logic Bot trong RoomStore |
| 15 | [ ] | **Tiện ích tham gia nhanh: Tạo mã QR tự động, copy link phòng và kiểm tra trùng tên thí sinh** | `Lobby / Join` | Người chơi quét QR vào thẳng phòng; chặn hoặc gợi ý đổi tên nếu trùng tên trong phòng | ☐ Chưa làm |  | Hỗ trợ sự kiện đông người |
| 16 | [ ] | **Quản trị phòng chờ: Kick thí sinh, khóa phòng, xử lý người vào muộn thành Khán giả (Spectator)** | `Lobby / Host` | Host kick được người chơi vi phạm; người vào sau khi game bắt đầu chuyển sang chế độ xem | ☐ Chưa làm |  | Quyền điều phối của Host |
| 17 | [ ] | **Cơ chế Reconnect (tự động khôi phục phiên thi đấu khi thí sinh F5 hoặc rớt mạng tạm thời)** | `Socket.IO / Session` | Lưu session/token để thí sinh tải lại trang vẫn giữ nguyên vị trí và trạng thái trong sàn đấu | ☐ Chưa làm |  | Quan trọng cho trải nghiệm thực tế |
| 18 | [/] | **Đồng bộ vòng đời trận đấu (State Machine): LOBBY -> STARTING -> QUESTION -> LOCKED -> REVEAL -> RESULT** | `Game Engine` | Server làm nguồn chân lý duy nhất (Single Source of Truth) điều phối timer và chuyển pha | ◐ Đang làm | 2026-10-26 | Đồng bộ qua Socket.IO |
| 19 | [/] | **Giao diện trả lời của Thí sinh (Player View) cho đủ 4 định dạng câu hỏi trên Mobile & Desktop** | `Player UI` | Thao tác bấm chọn, nhập phím, kéo thả sắp xếp mượt trên màn hình điện thoại (min 360px) | ◐ Đang làm | 2026-10-26 | Đồng bộ với 4 loại câu hỏi của Editor |
| 20 | [ ] | **Bộ chấm điểm Server-side cho 4 định dạng (bao gồm chuẩn hóa chuỗi tiếng Việt cho type_answer)** | `Game Engine` | Chấm chính xác đáp án đơn, đa lựa chọn, thứ tự mảng và chuỗi tự luận (NFC, trim, lowercase) | ☐ Chưa làm |  | Chống gian lận phía client |
| 21 | [ ] | **Cơ chế Sàn đấu Rung Chuông Vàng: Loại trực tiếp (Elimination) / Trừ mạng & Phao Cứu Trợ (Rescue)** | `Game Rules` | Thí sinh trả lời sai bị loại khỏi sàn; Host có quyền kích hoạt Cứu trợ để hồi sinh thí sinh | ☐ Chưa làm |  | Đặc trưng cốt lõi của Rung Chuông Vàng |
| 22 | [ ] | **Logic kích hoạt và thi đấu Bộ Phụ (Tie-break) khi cần phân định ngôi vô địch** | `Game Rules` | Tự động hoặc cho phép Host chuyển sang Bộ Phụ; xếp hạng theo câu đúng + thời gian nộp nhanh nhất | ☐ Chưa làm |  | Kết nối với nút Bộ Chính / Bộ Phụ đã làm ở Editor |
| 23 | [ ] | **Màn hình Công bố đáp án (Reveal) & Thống kê trực quan sau mỗi câu hỏi** | `Host / Player UI` | Hiển thị đáp án đúng, số lượng người trả lời đúng/sai, danh sách thí sinh trụ lại trên sàn | ☐ Chưa làm |  | Tăng kịch tính sau mỗi câu |
| 24 | [ ] | **Màn hình Vinh danh Chung cuộc (Rung Chuông Vàng Podium) + Hiệu ứng âm thanh chiến thắng** | `UI / Audio` | Hiển thị Quán quân Rung Chuông Vàng, bảng xếp hạng, pháo giấy và âm thanh Web Audio API | ☐ Chưa làm |  | Hoàn tất vòng lặp trải nghiệm game |
| 25 | [x] | **Kiểm định chất lượng mã nguồn: 0 lỗi TypeScript (tsc --noEmit) và 0 FAIL, 0 REFLEX (sloplint)** | `Code Quality` | Chạy tsc --noEmit và sloplint sạch hoàn toàn, không còn code smell hay lỗi kiểu dữ liệu | ☑ Xong | 2026-10-26 | Đã đạt chuẩn 0 lỗi tsc & sloplint |
| 26 | [ ] | **Viết Unit Test cho hàm chấm điểm 4 loại câu hỏi, Lossless Serialization và RoomStore** | `Testing` | Bộ test tự động chạy xanh cho các edge case (câu tự luận có dấu, thứ tự reorder, bot state) | ☐ Chưa làm |  | Đảm bảo không hồi quy (regression) khi thêm tính năng |
| 27 | [ ] | **Kiểm thử chịu tải (Load Test) phòng thi với 50-100 Bot/Client kết nối Socket.IO đồng thời** | `Performance` | Server xử lý mượt khi 100 người nộp bài cùng lúc ở giây cuối, không lệch timer | ☐ Chưa làm |  | Chuẩn bị cho giải đấu thực tế |
| 28 | [ ] | **Đóng gói Docker / Cấu hình triển khai Production (WebSocket + lưu trữ SQLite bền vững)** | `DevOps / Deploy` | Ứng dụng chạy ổn định trên môi trường public, hỗ trợ HTTPS/WSS cho điện thoại truy cập | ☐ Chưa làm |  | Sẵn sàng tổ chức sự kiện |

---

> 💡 *Bảng theo dõi này được đồng bộ tự động với file Excel `Rung Chuông Vàng 2 - Checklist Tiến Độ Dự Án.xlsx` qua script `scripts/update_checklist.py`.*
