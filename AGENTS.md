# HƯỚNG DẪN DÀNH CHO AGENT / DEVELOPER TRONG DỰ ÁN RUNG CHUÔNG VÀNG 2

## 🎯 QUY TẮC CẬP NHẬT CHECKLIST TIẾN ĐỘ TỰ ĐỘNG (BẮT BUỘC)

Dự án có bảng theo dõi tiến độ chính thức được lưu đồng bộ ở hai file:
1. `Rung Chuông Vàng 2 - Checklist Tiến Độ Dự Án.xlsx` (File Excel gốc)
2. `CHECKLIST.md` (File Markdown đồng bộ hiển thị trên GitHub)

### 📌 QUY TẮC BẮT BUỘC:
**Mỗi lần hoàn thành (hoặc thay đổi trạng thái) bất kỳ hạng mục nào trong 28 công việc của dự án, agent/developer BẮT BUỘC phải tự động cập nhật checkbox hàng tương ứng bằng lệnh:**

```bash
# Đánh dấu đã hoàn thành (☑ Xong -> [x]):
python scripts/update_checklist.py --stt <SỐ_THỨ_TỰ> --status xong

# Đánh dấu đang thực hiện (◐ Đang làm -> [/]):
python scripts/update_checklist.py --stt <SỐ_THỨ_TỰ> --status dang_lam

# Đánh dấu chưa làm (☐ Chưa làm -> [ ]):
python scripts/update_checklist.py --stt <SỐ_THỨ_TỰ> --status chua_lam

# Thêm ghi chú kỹ thuật (tùy chọn):
python scripts/update_checklist.py --stt <SỐ_THỨ_TỰ> --status xong --note "Mô tả nội dung vừa làm"
```

### 📋 DANH SÁCH 28 HẠNG MỤC CÔNG VIỆC THEO STT:
- **Giai đoạn 0: Khởi tạo & Nền tảng**
  - `STT 1`: Khởi tạo mã nguồn dự án & Next.js 14 App Router + TS
  - `STT 2`: Tích hợp Backend realtime Express + Socket.IO + Zustand
  - `STT 3`: Thiết lập cơ sở dữ liệu Prisma ORM & SQLite
  - `STT 4`: Chuẩn hóa Design System Hallmark Playful (Vàng - Trắng)
- **Giai đoạn 1: Quiz Editor & Dữ liệu**
  - `STT 5`: Hỗ trợ 4 định dạng câu hỏi (buttons, checkboxes, type_answer, reorder)
  - `STT 6`: Kéo thả (Drag & Drop) slide ở thanh thumbnail đáy trang
  - `STT 7`: Bố cục cố định (100vh), Header 1 hàng, nút Bộ Chính/Bộ Phụ trung tâm
  - `STT 8`: Khử trùng lặp mã (DRY) qua helper `mutateQuestions`
  - `STT 9`: Cơ chế nạp/lưu toàn vẹn (Lossless serialization) 4 dạng câu hỏi vào DB
  - `STT 10`: Kiểm tra hợp lệ (Validation) đề thi trước khi lưu/mở phòng
  - `STT 11`: Tính năng Nhân bản slide & Import/Export đề thi (JSON/CSV)
- **Giai đoạn 2: Phòng chờ (Lobby) & Bot**
  - `STT 12`: Giao diện Lobby chuẩn Hallmark Playful & âm thanh Web Audio API
  - `STT 13`: Khử Feature Envy: Đóng gói logic Bot & Thí sinh vào RoomStore
  - `STT 14`: Mô phỏng hành vi trả lời của Bot cho đủ 4 dạng câu hỏi
  - `STT 15`: QR Code tự động, copy link phòng & kiểm tra trùng tên thí sinh
  - `STT 16`: Quản trị phòng chờ: Kick thí sinh, khóa phòng, Spectator mode
  - `STT 17`: Cơ chế Reconnect tự động khôi phục phiên khi F5/rớt mạng
- **Giai đoạn 3: Engine Thi đấu Realtime**
  - `STT 18`: Đồng bộ State Machine trận đấu (LOBBY -> STARTING -> QUESTION -> LOCKED -> REVEAL -> RESULT)
  - `STT 19`: Giao diện trả lời của Thí sinh (Player View) cho đủ 4 dạng câu hỏi (Mobile & Desktop)
  - `STT 20`: Bộ chấm điểm Server-side cho 4 định dạng (chuẩn hóa tiếng Việt NFC/lowercase/trim)
  - `STT 21`: Cơ chế Sàn đấu: Loại trực tiếp / Trừ mạng & Phao Cứu Trợ (Rescue)
  - `STT 22`: Logic thi đấu Vòng Phụ (Tie-break) phân định vô địch
  - `STT 23`: Màn hình Công bố đáp án (Reveal) & Thống kê trực quan
  - `STT 24`: Màn hình Vinh danh Chung cuộc (Podium) & Hiệu ứng chiến thắng
- **Giai đoạn 4: QA, Kiểm thử & Deploy**
  - `STT 25`: Kiểm định chất lượng: 0 lỗi `tsc --noEmit` và 0 FAIL, 0 REFLEX `sloplint`
  - `STT 26`: Unit Test cho chấm điểm, Lossless Serialization, RoomStore
  - `STT 27`: Load test 50-100 kết nối đồng thời
  - `STT 28`: Đóng gói Docker & Cấu hình triển khai Production
